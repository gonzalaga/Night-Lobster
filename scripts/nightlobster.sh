#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
while [[ -L "$SCRIPT_PATH" ]]; do
  SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_PATH")" && pwd)"
  SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
  [[ "$SCRIPT_PATH" != /* ]] && SCRIPT_PATH="$SCRIPT_DIR/$SCRIPT_PATH"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_PATH")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

STATE_DIR="$ROOT_DIR/.nightlobster"
PID_DIR="$STATE_DIR/pids"
LOG_DIR="$STATE_DIR/logs"
SERVER_ENV_FILE="$ROOT_DIR/apps/server/.env"
WEB_ENV_FILE="$ROOT_DIR/apps/web/.env.local"

log() {
  printf "[nightlobster] %s\n" "$1"
}

warn() {
  printf "[nightlobster:warn] %s\n" "$1"
}

fail() {
  printf "[nightlobster:error] %s\n" "$1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

quote() {
  printf '%q' "$1"
}

resolve_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    printf "docker compose"
    return
  fi

  if command_exists docker-compose; then
    printf "docker-compose"
    return
  fi

  fail "Docker Compose is missing. Run ./scripts/setup-mac.sh first."
}

ensure_docker_ready() {
  if ! command_exists docker; then
    fail "Docker CLI not found. Run ./scripts/setup-mac.sh first."
  fi

  if docker info >/dev/null 2>&1; then
    return
  fi

  if command_exists colima; then
    log "Starting Colima runtime..."
    colima start --cpu 2 --memory 4 --disk 40 >/dev/null 2>&1 || true
  fi

  for _ in $(seq 1 45); do
    if docker info >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done

  fail "Docker daemon is not ready."
}

ensure_project_ready() {
  [[ -f "$SERVER_ENV_FILE" ]] || fail "Missing $SERVER_ENV_FILE. Run ./scripts/setup-mac.sh first."
  [[ -f "$WEB_ENV_FILE" ]] || fail "Missing $WEB_ENV_FILE. Run ./scripts/setup-mac.sh first."
  [[ -d "$ROOT_DIR/node_modules" ]] || fail "Missing node_modules. Run ./scripts/setup-mac.sh first."
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

start_service() {
  local name="$1"
  local cmd="$2"
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  if is_running "$pid_file"; then
    log "$name already running (pid $(cat "$pid_file"))."
    return
  fi

  log "Starting $name..."
  nohup bash -lc "$cmd" >>"$log_file" 2>&1 &
  local pid=$!
  echo "$pid" >"$pid_file"
  sleep 1

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    rm -f "$pid_file"
    fail "Failed to start $name. Check $log_file."
  fi
}

stop_service() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if ! [[ -f "$pid_file" ]]; then
    log "$name not running."
    return
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -z "$pid" ]]; then
    rm -f "$pid_file"
    log "$name pid file was empty; cleaned."
    return
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    log "Stopping $name (pid $pid)..."
    kill "$pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 20); do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 0.5
    done

    if kill -0 "$pid" >/dev/null 2>&1; then
      warn "Force killing $name (pid $pid)..."
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  fi

  rm -f "$pid_file"
}

print_status() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if is_running "$pid_file"; then
    printf "%-10s running (pid %s)\n" "$name" "$(cat "$pid_file")"
  else
    printf "%-10s stopped\n" "$name"
  fi
}

start_all() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
  ensure_project_ready
  ensure_docker_ready

  local compose_cmd
  compose_cmd="$(resolve_compose_cmd)"
  log "Starting Postgres and Redis..."
  (cd "$ROOT_DIR" && $compose_cmd up -d >/dev/null)

  local q_root q_server_env
  q_root="$(quote "$ROOT_DIR")"
  q_server_env="$(quote "$SERVER_ENV_FILE")"

  start_service "server" "cd $q_root && set -a && source $q_server_env && set +a && exec npm run dev -w @nightlobster/server"
  start_service "worker" "cd $q_root && set -a && source $q_server_env && set +a && exec npm run dev:worker -w @nightlobster/server"
  start_service "web" "cd $q_root && exec npm run dev -w @nightlobster/web -- --port 3000"

  log "All services started."
  log "Open http://localhost:3000/missions"
}

stop_all() {
  stop_service "web"
  stop_service "worker"
  stop_service "server"

  if command_exists docker && docker info >/dev/null 2>&1; then
    local compose_cmd
    compose_cmd="$(resolve_compose_cmd)"
    (cd "$ROOT_DIR" && $compose_cmd stop >/dev/null 2>&1 || true)
  fi

  log "All services stopped."
}

status_all() {
  if command_exists docker && docker info >/dev/null 2>&1; then
    local compose_cmd
    compose_cmd="$(resolve_compose_cmd)"
    local infra_up
    infra_up="$(cd "$ROOT_DIR" && $compose_cmd ps --services --status running 2>/dev/null || true)"
    if [[ "$infra_up" == *postgres* || "$infra_up" == *redis* ]]; then
      printf "%-10s running\n" "infra"
    else
      printf "%-10s stopped\n" "infra"
    fi
  else
    printf "%-10s stopped\n" "infra"
  fi

  print_status "server"
  print_status "worker"
  print_status "web"
}

show_logs() {
  mkdir -p "$LOG_DIR"
  touch "$LOG_DIR/server.log" "$LOG_DIR/worker.log" "$LOG_DIR/web.log"
  local target="${1:-all}"

  case "$target" in
    server | worker | web)
      tail -n 80 -f "$LOG_DIR/$target.log"
      ;;
    all)
      tail -n 80 -f "$LOG_DIR/server.log" "$LOG_DIR/worker.log" "$LOG_DIR/web.log"
      ;;
    *)
      fail "Unknown log target: $target"
      ;;
  esac
}

usage() {
  cat <<EOF
Usage: nightlobster <start|stop|restart|status|logs> [service]

Commands:
  start          Start infra + server + worker + web in the background
  stop           Stop server + worker + web
  restart        Restart all app services
  status         Show service status
  logs [name]    Tail logs (name: server|worker|web|all)
EOF
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    start)
      start_all
      ;;
    stop)
      stop_all
      ;;
    restart)
      stop_all
      start_all
      ;;
    status)
      status_all
      ;;
    logs)
      show_logs "${2:-all}"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
