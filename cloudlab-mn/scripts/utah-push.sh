#!/usr/bin/env bash
set -euo pipefail

# Usage: ./utah-push.sh
# Pushes local datasets and artifacts to Utah.
# Env: UTAH_RSYNC_DELETE=1 (optional) to enable mirror deletion.

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

LOCAL_BASE="${CLOUDLAB_LOCAL_BASE:-/mnt/e/Services/cloudlab}"
LOCAL_DATASETS="${CLOUDLAB_DATASETS_DIR:-$LOCAL_BASE/datasets}"
LOCAL_ARTIFACTS="${CLOUDLAB_ARTIFACTS_DIR:-$LOCAL_BASE/artifacts}"

if [[ ! -d "$LOCAL_DATASETS" ]]; then
  echo "ERROR: Missing local datasets dir: $LOCAL_DATASETS" >&2; exit 1
fi
if [[ ! -d "$LOCAL_ARTIFACTS" ]]; then
  echo "ERROR: Missing local artifacts dir: $LOCAL_ARTIFACTS" >&2; exit 1
fi

# Optional env toggles:
#   UTAH_RSYNC_DELETE=1   -> enable mirror deletes (dangerous; explicit opt-in)
#   UTAH_RSYNC_DRYRUN=1   -> dry-run + itemize changes

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

# Ensure remote directories exist
# (Intentional client-side expansion of REMOTE_BASE; remote still expands "~" because it is unquoted.)
# shellcheck disable=SC2029
ssh "${SSH_ARGS[@]}" "${UTAH_USER}@${UTAH_HOST}" \
  "mkdir -p $REMOTE_BASE/datasets $REMOTE_BASE/artifacts $REMOTE_BASE/backups" >/dev/null

rsync "${RSYNC_ARGS[@]}" \
  -e "ssh ${SSH_ARGS[*]}" \
  "$LOCAL_DATASETS/" \
  "${UTAH_USER}@${UTAH_HOST}:$REMOTE_BASE/datasets/"

rsync "${RSYNC_ARGS[@]}" \
  -e "ssh ${SSH_ARGS[*]}" \
  "$LOCAL_ARTIFACTS/" \
  "${UTAH_USER}@${UTAH_HOST}:$REMOTE_BASE/artifacts/"
