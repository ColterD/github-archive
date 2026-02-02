#!/usr/bin/env bash
set -euo pipefail

# Usage: ./utah-pull-backups.sh
# Pulls backups from Utah to local backup directory.
# Always safe (never deletes local files).

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

# Default remote base (override via UTAH_REMOTE_BASE in ops/utah.env if desired)
# Keep "~" so it expands on the REMOTE side.
# shellcheck disable=SC2088
REMOTE_BASE="${UTAH_REMOTE_BASE:-~/mn-sync/cloudlab}"

# Local pathing (override via env):
LOCAL_BASE="${CLOUDLAB_LOCAL_BASE:-/mnt/e/Services/cloudlab}"
LOCAL_BACKUPS="${CLOUDLAB_BACKUPS_DIR:-$LOCAL_BASE/backups}"
mkdir -p "$LOCAL_BACKUPS"

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
if [[ "${UTAH_RSYNC_DRYRUN:-0}" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
fi

rsync "${RSYNC_ARGS[@]}" \
  -e "ssh ${SSH_ARGS[*]}" \
  "${UTAH_USER}@${UTAH_HOST}:$REMOTE_BASE/backups/" \
  "$LOCAL_BACKUPS/"
