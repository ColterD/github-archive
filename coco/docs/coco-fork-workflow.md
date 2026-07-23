# coco Fork Workflow

coco is Colter's private ForgeCode fork. The local checkout keeps Tailcall's
ForgeCode repository as `upstream` and keeps coco changes on top of
`upstream/main`.

## Remotes

- `upstream`: `https://github.com/tailcallhq/forgecode.git`
- `origin`: `https://github.com/ColterD/coco.git`

`upstream` is read-only for this fork. Do not push branches, tags, issues,
comments, reviews, pull requests, releases, discussions, or any other writes to
`tailcallhq/forgecode`. Only fetch from upstream and port upstream changes into
this fork.

The local `upstream` remote must keep its push URL set to `DISABLED`. The sync
script refuses to run if that guardrail is removed.

After cloning this fork on a new machine, run:

```bash
scripts/coco-local-setup.sh
```

To verify the local guardrails:

```bash
scripts/coco-verify-guardrails.sh
```

## Branches

- `main`: coco's integration branch. Our changes live here, rebased on top of
  `upstream/main`.
- `coco/upstream-candidate`: last successful test rebase produced by the sync
  script. This is useful for inspection before or after an automated sync.

## Upstream Sync

The sync script is:

```bash
scripts/coco-sync-upstream.sh
```

It performs these steps:

1. Refuses to run if the working tree is dirty.
2. Fetches `upstream/main`.
3. Tests `main` rebased onto `upstream/main` in a disposable worktree.
4. Updates `coco/upstream-candidate` if the test rebase succeeds.
5. Rebases the real `main` only after the test rebase succeeds.
6. Leaves `main` untouched if conflicts are found during the test rebase.

Status is written to:

```bash
.coco/sync-status.json
```

Logs are written under:

```bash
~/.local/state/coco-sync/
```

## Conflict Policy

If upstream conflicts with coco changes, the automated sync stops. We then
inspect the conflict and choose one of three outcomes:

1. Keep coco's implementation when it is better.
2. Replace coco's implementation when upstream's version is better.
3. Merge both approaches when each side contains useful behavior.

Do not blindly resolve conflicts in favor of either side. The point of this fork
is to keep the better agentic harness behavior even when upstream makes a
different tradeoff.
