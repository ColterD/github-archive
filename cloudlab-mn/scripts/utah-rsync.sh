#!/usr/bin/env bash
set -euo pipefail

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

: "${UTAH_HOST:?Set UTAH_HOST in $ENV_FILE}"
: "${UTAH_USER:?Set UTAH_USER in $ENV_FILE}"
PORT="${UTAH_PORT:-22}"

# Usage:
#   utah-rsync.sh <local_path> <remote_path>
# Example:
#   utah-rsync.sh ./data/ :~/data/
#
# Optional env toggles:
#   UTAH_RSYNC_DELETE=1   -> enable mirror deletes (dangerous; explicit opt-in)
#   UTAH_RSYNC_DRYRUN=1   -> dry-run + itemize changes
LOCAL="${1:-}"
REMOTE="${2:-}"

if [[ -z "$LOCAL" || -z "$REMOTE" ]]; then
  echo "Usage: utah-rsync.sh <local_path> <remote_path>" >&2
  exit 1
fi

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

RSYNC_ARGS=(-avhP)
if [[ "${UTAH_RSYNC_DELETE:-0}" == "1" ]]; then
  RSYNC_ARGS+=(--delete --delete-delay)
fi
if [[ "${UTAH_RSYNC_DRYRUN:-0}" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
fi

exec rsync "${RSYNC_ARGS[@]}" \
  -e "ssh ${SSH_ARGS[*]}" \
  "$LOCAL" "${UTAH_USER}@${UTAH_HOST}:$REMOTE"
