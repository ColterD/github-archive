#!/usr/bin/env bash
set -euo pipefail

# Usage: ./utah-ssh.sh [optional_ssh_args] [command]
# Wraps ssh to connect to the Utah endpoint defined in ops/utah.env.

# Resolve repo root (portable)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ENV_FILE:-$REPO_ROOT/ops/utah.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${UTAH_HOST:?Set UTAH_HOST in $ENV_FILE (copy ops/utah.env.example -> ops/utah.env)}"
: "${UTAH_USER:?Set UTAH_USER in $ENV_FILE (copy ops/utah.env.example -> ops/utah.env)}"
PORT="${UTAH_PORT:-22}"

SSH_ARGS=(
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o ConnectTimeout=5
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=3
  -p "$PORT"
)

if [[ -r "$HOME/.ssh/id_ed25519_utah" ]]; then
  SSH_ARGS+=( -i "$HOME/.ssh/id_ed25519_utah" )
else
  ssh-add -L >/dev/null 2>&1 || {
    echo "ERROR: No Utah SSH key (~/.ssh/id_ed25519_utah) and no SSH agent identities." >&2
    exit 1
  }
fi

exec ssh "${SSH_ARGS[@]}" "${UTAH_USER}@${UTAH_HOST}" "$@"
