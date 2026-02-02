#!/usr/bin/env bash
set -euo pipefail

# Local base (WSL) — override via env
LOCAL_BASE="${CLOUDLAB_LOCAL_BASE:-/mnt/e/Services/cloudlab}"
LOCAL_ARTIFACTS="${CLOUDLAB_ARTIFACTS_DIR:-$LOCAL_BASE/artifacts}"

SRC_ARTIFACTS="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/artifacts"
DST_ARTIFACTS="$LOCAL_ARTIFACTS/_dryrun"

mkdir -p "$DST_ARTIFACTS"

# Dry-run copy artifacts to local _dryrun directory
rsync -avhP --dry-run --itemize-changes \
  "$SRC_ARTIFACTS/" \
  "$DST_ARTIFACTS/"
