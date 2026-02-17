#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_SCRIPT="$ROOT_DIR/scripts/nightlobster.sh"
STATE_DIR="$ROOT_DIR/.nightlobster"
INSTALL_STATE_FILE="$STATE_DIR/install-state.env"
CURRENT_SETUP_SCRIPT_VERSION="1"
INSTALL_MODE="fresh"
PREVIOUS_SETUP_VERSION="none"
PREVIOUS_INSTALLED_AT=""

log() {
  printf "[setup] %s\n" "$1"
}

warn() {
  printf "[warn] %s\n" "$1"
}

fail() {
  printf "[error] %s\n" "$1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

quote() {
  printf '%q' "$1"
}

detect_install_mode() {
  if [[ -f "$INSTALL_STATE_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$INSTALL_STATE_FILE" || true
    PREVIOUS_SETUP_VERSION="${SETUP_SCRIPT_VERSION:-unknown}"
    PREVIOUS_INSTALLED_AT="${INSTALLED_AT:-}"
    INSTALL_MODE="update"
    log "Detected previous install (state file found, version: $PREVIOUS_SETUP_VERSION). Running update flow."
    return
  fi

  if [[ -f "$ROOT_DIR/apps/server/.env" || -f "$ROOT_DIR/apps/web/.env.local" || -x "$SERVICE_SCRIPT" ]]; then
    INSTALL_MODE="update"
    log "Detected existing install artifacts. Running update flow."
    return
  fi

  INSTALL_MODE="fresh"
  log "No previous install detected. Running fresh install flow."
}

ensure_macos() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    fail "This installer is for macOS only."
  fi
}

ensure_xcode_clt() {
  if xcode-select -p >/dev/null 2>&1; then
    return
  fi

  warn "Xcode Command Line Tools are required. Launching installer..."
  xcode-select --install >/dev/null 2>&1 || true
  fail "Install Xcode Command Line Tools, then re-run this script."
}

load_brew_shellenv() {
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

ensure_homebrew() {
  if command_exists brew; then
    load_brew_shellenv
    return
  fi

  log "Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c \
    "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  load_brew_shellenv

  if ! command_exists brew; then
    fail "Homebrew installation failed."
  fi
}

brew_install_formula() {
  local formula="$1"
  if brew list "$formula" >/dev/null 2>&1; then
    return
  fi

  log "Installing $formula via Homebrew..."
  brew install "$formula"
}

ensure_node() {
  if ! command_exists node || ! command_exists npm; then
    brew_install_formula node
  fi

  local major
  major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ -z "$major" ]]; then
    fail "Unable to determine Node.js version."
  fi

  if (( major < 20 )); then
    log "Upgrading Node.js to >=20..."
    brew upgrade node || brew install node
  fi
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

  fail "Docker Compose is missing even after install."
}

ensure_container_runtime() {
  if ! command_exists docker; then
    brew_install_formula docker
  fi

  if ! command_exists colima; then
    brew_install_formula colima
  fi

  if ! docker compose version >/dev/null 2>&1 && ! command_exists docker-compose; then
    brew_install_formula docker-compose
  fi

  if ! docker info >/dev/null 2>&1; then
    log "Starting Colima runtime..."
    colima start --cpu 2 --memory 4 --disk 40 >/dev/null 2>&1 || true
  fi

  local ready=0
  for _ in $(seq 1 45); do
    if docker info >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done

  if [[ "$ready" -ne 1 ]]; then
    fail "Docker daemon is not available."
  fi

  resolve_compose_cmd >/dev/null
}

prepare_for_update() {
  if [[ "$INSTALL_MODE" != "update" ]]; then
    return
  fi

  if [[ -x "$SERVICE_SCRIPT" ]]; then
    log "Stopping running Night Lobster services before update..."
    "$SERVICE_SCRIPT" stop || true
  fi
}

setup_env_files() {
  if [[ ! -f "$ROOT_DIR/apps/server/.env" ]]; then
    cp "$ROOT_DIR/apps/server/.env.example" "$ROOT_DIR/apps/server/.env"
    log "Created apps/server/.env from example."
  else
    log "Found apps/server/.env (kept existing file)."
  fi

  if [[ ! -f "$ROOT_DIR/apps/web/.env.local" ]]; then
    cp "$ROOT_DIR/apps/web/.env.local.example" "$ROOT_DIR/apps/web/.env.local"
    log "Created apps/web/.env.local from example."
  else
    log "Found apps/web/.env.local (kept existing file)."
  fi
}

install_dependencies() {
  log "Installing npm dependencies..."
  (cd "$ROOT_DIR" && npm install)
}

initialize_database() {
  local compose_cmd
  compose_cmd="$(resolve_compose_cmd)"

  log "Starting Postgres and Redis..."
  (cd "$ROOT_DIR" && $compose_cmd up -d)

  log "Generating Prisma client..."
  (cd "$ROOT_DIR" && npm run db:generate -w @nightlobster/server)

  log "Applying Prisma schema..."
  (cd "$ROOT_DIR" && npm run db:push -w @nightlobster/server)
}

install_cli_command() {
  local target_dir
  target_dir="$(brew --prefix)/bin"
  if [[ ! -w "$target_dir" ]]; then
    target_dir="$HOME/.local/bin"
    mkdir -p "$target_dir"
    warn "Installed CLI to $target_dir. Add it to PATH if needed."
  fi

  local target="$target_dir/nightlobster"
  local q_script
  q_script="$(quote "$SERVICE_SCRIPT")"

  cat >"$target" <<EOF
#!/usr/bin/env bash
exec $q_script "\$@"
EOF
  chmod +x "$target"
  log "Installed CLI command: $target"
}

start_services() {
  chmod +x "$SERVICE_SCRIPT"
  "$SERVICE_SCRIPT" start
}

write_install_state() {
  local now_utc
  now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local installed_at
  installed_at="$PREVIOUS_INSTALLED_AT"
  if [[ -z "$installed_at" ]]; then
    installed_at="$now_utc"
  fi

  mkdir -p "$STATE_DIR"
  cat >"$INSTALL_STATE_FILE" <<EOF
SETUP_SCRIPT_VERSION=$CURRENT_SETUP_SCRIPT_VERSION
INSTALLED_AT=$installed_at
LAST_SETUP_AT=$now_utc
LAST_SETUP_MODE=$INSTALL_MODE
EOF
}

print_summary() {
  local key_line
  key_line="$(grep -E '^OPENAI_API_KEY=' "$ROOT_DIR/apps/server/.env" || true)"
  if [[ "$key_line" == "OPENAI_API_KEY=" ]]; then
    warn "OPENAI_API_KEY is empty in apps/server/.env (provider mode disabled until set)."
  fi

  cat <<EOF

Setup complete and services are running.
Install mode: $INSTALL_MODE

Service commands:
  nightlobster status
  nightlobster stop
  nightlobster restart
  nightlobster logs

Open:
  http://localhost:3000/missions
EOF
}

main() {
  ensure_macos
  detect_install_mode
  ensure_xcode_clt
  ensure_homebrew
  ensure_node
  ensure_container_runtime
  prepare_for_update
  setup_env_files
  install_dependencies
  initialize_database
  install_cli_command
  write_install_state
  start_services
  print_summary
}

main "$@"
