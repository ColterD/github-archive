#!/usr/bin/env bash
set -Eeuo pipefail

repo="${COCO_REPO:-/home/colter/Projects/coco}"
branch="${COCO_SYNC_BRANCH:-main}"
remote="${COCO_UPSTREAM_REMOTE:-upstream}"
upstream_branch="${COCO_UPSTREAM_BRANCH:-main}"
apply="${COCO_SYNC_APPLY:-1}"
state_dir="${COCO_SYNC_STATE_DIR:-/home/colter/.local/state/coco-sync}"
stamp="$(date +%Y%m%d-%H%M%S)"
log_file="${state_dir}/sync-${stamp}.log"
status_file="${repo}/.coco/sync-status.json"

mkdir -p "$state_dir" "$(dirname "$status_file")"
exec > >(tee -a "$log_file") 2>&1

write_status() {
  local state="$1"
  local details="$2"
  local upstream_head="${3:-}"
  local branch_head="${4:-}"
  local candidate_head="${5:-}"

  cat > "$status_file" <<JSON
{
  "state": "$state",
  "details": "$details",
  "timestamp": "$(date --iso-8601=seconds)",
  "repo": "$repo",
  "branch": "$branch",
  "upstream": "$remote/$upstream_branch",
  "branch_head": "$branch_head",
  "upstream_head": "$upstream_head",
  "candidate_head": "$candidate_head",
  "log_file": "$log_file"
}
JSON
}

cleanup_worktree() {
  if [[ -n "${worktree:-}" && -d "$worktree" ]]; then
    git -C "$repo" worktree remove --force "$worktree" >/dev/null 2>&1 || true
  fi
}
trap cleanup_worktree EXIT

echo "== coco upstream sync =="
echo "repo: $repo"
echo "branch: $branch"
echo "upstream: $remote/$upstream_branch"
echo "apply: $apply"

cd "$repo"

upstream_fetch_url="$(git remote get-url "$remote")"
upstream_push_url="$(git remote get-url --push "$remote" 2>/dev/null || true)"
if [[ "$upstream_fetch_url" != "https://github.com/tailcallhq/forgecode.git" ]]; then
  echo "Refusing sync: '$remote' fetch URL is not Tailcall ForgeCode."
  echo "actual fetch URL: $upstream_fetch_url"
  write_status "remote-error" "upstream fetch URL does not match Tailcall ForgeCode" "" ""
  exit 10
fi

if [[ "$upstream_push_url" != "DISABLED" ]]; then
  echo "Refusing sync: '$remote' push URL must be DISABLED."
  echo "actual push URL: $upstream_push_url"
  write_status "remote-error" "upstream push URL is not disabled" "" ""
  exit 11
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean; refusing automated sync."
  git status --short
  branch_head="$(git rev-parse "$branch" 2>/dev/null || true)"
  upstream_head="$(git rev-parse "refs/remotes/$remote/$upstream_branch" 2>/dev/null || true)"
  write_status "dirty" "working tree is not clean; sync skipped" "$upstream_head" "$branch_head"
  exit 20
fi

git fetch --prune "$remote" "$upstream_branch"

upstream_ref="refs/remotes/$remote/$upstream_branch"
branch_head="$(git rev-parse "$branch")"
upstream_head="$(git rev-parse "$upstream_ref")"

echo "branch head: $branch_head"
echo "upstream head: $upstream_head"

worktree="$(mktemp -d --tmpdir coco-sync.XXXXXX)"
rmdir "$worktree"
git worktree add --detach "$worktree" "$branch"

set +e
git -C "$worktree" rebase "$upstream_ref"
rebase_rc=$?
set -e

if [[ "$rebase_rc" -ne 0 ]]; then
  echo "Test rebase conflicted; leaving $branch untouched."
  git -C "$worktree" status --short || true
  git -C "$worktree" diff --name-only --diff-filter=U || true
  git -C "$worktree" rebase --abort >/dev/null 2>&1 || true
  write_status "conflict" "test rebase conflicted; inspect log and resolve manually" "$upstream_head" "$branch_head"
  exit 30
fi

candidate_head="$(git -C "$worktree" rev-parse HEAD)"
git update-ref "refs/heads/coco/upstream-candidate" "$candidate_head"
echo "candidate head: $candidate_head"

if [[ "$apply" != "1" && "$apply" != "true" ]]; then
  write_status "candidate-ready" "test rebase succeeded; candidate branch updated only" "$upstream_head" "$branch_head" "$candidate_head"
  exit 0
fi

current_branch="$(git branch --show-current)"
if [[ -n "$(git status --porcelain)" ]]; then
  write_status "dirty" "working tree became dirty before apply; candidate branch updated only" "$upstream_head" "$branch_head" "$candidate_head"
  exit 21
fi

git switch "$branch"

set +e
git rebase "$upstream_ref"
apply_rc=$?
set -e

if [[ "$apply_rc" -ne 0 ]]; then
  echo "Unexpected conflict while applying real rebase; aborting."
  git status --short || true
  git rebase --abort >/dev/null 2>&1 || true
  write_status "apply-conflict" "candidate succeeded but real rebase failed; branch left at pre-sync head if abort succeeded" "$upstream_head" "$branch_head" "$candidate_head"
  exit 31
fi

new_head="$(git rev-parse "$branch")"
if [[ "$current_branch" != "$branch" && -n "$current_branch" ]]; then
  git switch "$current_branch"
fi

write_status "synced" "branch rebased on upstream successfully" "$upstream_head" "$new_head" "$candidate_head"
echo "Synced $branch on top of $remote/$upstream_branch."
