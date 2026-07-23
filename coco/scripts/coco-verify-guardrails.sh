#!/usr/bin/env bash
set -Eeuo pipefail

repo="${COCO_REPO:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$repo"

failures=0

check() {
  local label="$1"
  shift

  if "$@"; then
    printf 'ok: %s\n' "$label"
  else
    printf 'FAIL: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

check "upstream fetch URL is Tailcall ForgeCode" \
  test "$(git remote get-url upstream)" = "https://github.com/tailcallhq/forgecode.git"

check "upstream push URL is disabled" \
  test "$(git remote get-url --push upstream)" = "DISABLED"

origin_fetch="$(git remote get-url origin 2>/dev/null || true)"
origin_push="$(git remote get-url --push origin 2>/dev/null || true)"

if [[ -n "$origin_fetch" ]]; then
  check "origin fetch URL is private coco fork" \
    test "$origin_fetch" = "https://github.com/ColterD/coco.git"

  check "origin push URL is private coco fork" \
    test "$origin_push" = "https://github.com/ColterD/coco.git"
else
  printf 'warn: origin remote is not configured yet\n' >&2
fi

check "repo uses tracked hooks path" \
  test "$(git config core.hooksPath)" = ".githooks"

check "pre-push hook exists and is executable" \
  test -x ".githooks/pre-push"

check "sync script is executable" \
  test -x "scripts/coco-sync-upstream.sh"

if [[ -n "$(git status --porcelain)" ]]; then
  printf 'warn: working tree has uncommitted changes\n' >&2
fi

exit "$failures"
