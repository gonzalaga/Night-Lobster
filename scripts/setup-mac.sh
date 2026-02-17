#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

brew_install_cask() {
  local cask="$1"
  if brew list --cask "$cask" >/dev/null 2>&1; then
    return
  fi

  log "Installing $cask via Homebrew Cask..."
  brew install --cask "$cask"
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
    log "Upgrading Node.js to a modern version (>=20)..."
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

  fail "Docker Compose not found. Ensure Docker Desktop is installed and up to date."
}

ensure_docker() {
  if ! command_exists docker; then
    brew_install_cask docker
  fi

  log "Ensuring Docker Desktop is running..."
  open -a Docker >/dev/null 2>&1 || true

  local ready=0
  for _ in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done

  if [[ "$ready" -ne 1 ]]; then
    fail "Docker daemon is not available. Open Docker Desktop and re-run."
  fi

  resolve_compose_cmd >/dev/null
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

install_and_initialize() {
  local compose_cmd
  compose_cmd="$(resolve_compose_cmd)"

  log "Installing npm dependencies..."
  (cd "$ROOT_DIR" && npm install)

  log "Starting local Postgres and Redis..."
  (cd "$ROOT_DIR" && $compose_cmd up -d)

  log "Generating Prisma client..."
  (cd "$ROOT_DIR" && npm run db:generate -w @nightlobster/server)

  log "Applying Prisma schema..."
  (cd "$ROOT_DIR" && npm run db:push -w @nightlobster/server)
}

print_next_steps() {
  local key_line
  key_line="$(grep -E '^OPENAI_API_KEY=' "$ROOT_DIR/apps/server/.env" || true)"
  if [[ "$key_line" == "OPENAI_API_KEY=" ]]; then
    warn "OPENAI_API_KEY is empty in apps/server/.env (provider mode disabled until set)."
  fi

  cat <<EOF

Setup complete.

Next steps:
  1) Start server: npm run dev:server
  2) Start web:    npm run dev:web
  3) Start worker: npm run dev:worker

Then open:
  http://localhost:3000/missions
EOF
}

main() {
  ensure_macos
  ensure_xcode_clt
  ensure_homebrew
  ensure_node
  ensure_docker
  setup_env_files
  install_and_initialize
  print_next_steps
}

main "$@"
