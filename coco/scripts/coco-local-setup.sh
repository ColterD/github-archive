#!/usr/bin/env bash
set -Eeuo pipefail

repo="${COCO_REPO:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

cd "$repo"

git remote set-url --push upstream DISABLED
git config core.hooksPath .githooks

chmod +x .githooks/pre-push
chmod +x scripts/coco-sync-upstream.sh
chmod +x scripts/coco-local-setup.sh
chmod +x scripts/coco-verify-guardrails.sh

echo "coco local setup complete."
echo "upstream fetch URL: $(git remote get-url upstream)"
echo "upstream push URL: $(git remote get-url --push upstream)"
echo "hooks path: $(git config core.hooksPath)"
