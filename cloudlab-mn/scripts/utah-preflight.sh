#!/usr/bin/env bash
set -euo pipefail

# Usage: ./utah-preflight.sh
# Verifies environment config, SSH keys, and connectivity to Utah.

# Resolve repo root (portable; avoids hard-coded ~/src paths)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

# Ensure endpoint vars exist
ENV_FILE="${ENV_FILE:-$REPO_ROOT/ops/utah.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${UTAH_HOST:?Set UTAH_HOST in $ENV_FILE}"
: "${UTAH_USER:?Set UTAH_USER in $ENV_FILE}"
PORT="${UTAH_PORT:-22}"

# Auth: prefer WSL-native Utah key; otherwise require an agent
SSH_ARGS=(
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o ConnectTimeout=5
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=3
  -p "$PORT"
)

if [[ -r "$HOME/.ssh/id_ed25519_utah" ]]; then
  # -i expects a PRIVATE key file (no .pub)
  SSH_ARGS+=( -i "$HOME/.ssh/id_ed25519_utah" )
else
  ssh-add -L >/dev/null 2>&1 || {
    echo "ERROR: No Utah SSH key (~/.ssh/id_ed25519_utah) and no SSH agent identities." >&2
    exit 1
  }
fi

exec ssh "${SSH_ARGS[@]}" "${UTAH_USER}@${UTAH_HOST}" 'echo OK from $(hostname); id; uptime'
