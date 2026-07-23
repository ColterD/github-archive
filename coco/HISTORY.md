# coco — History

> Project history for the archived snapshot in this folder.
> Canonical original: [ColterD/coco](https://github.com/ColterD/coco) (archived, read-only).

## Purpose

Personal fork of [tailcallhq/forgecode](https://github.com/tailcallhq/forgecode)
(Forge AI terminal development environment) with a custom profile launcher and
upstream-sync guardrails.

## Timeline

2561 commits (overwhelmingly upstream forgecode history), 2024-12-08 →
2026-07-23. No tags.
Branches: `main`, `coco/upstream-candidate`, `chore/fleet-baseline-sync`.

Personal commits (all 2026-04-18 unless noted):

- `c6bbc741` Add CoCo upstream sync workflow
- `a15721d8` Document CoCo GitHub setup
- `69423ff2` Add coco upstream guardrails
- `14f76807` Record coco GitHub origin
- `90e94317` Add coco field notes
- `1dec91e9` Document coco profile launcher
- `9d0eb6f2` chore: enforce CI bridge baseline (2026-04-19)
- `14356c3f` Archive: consolidated into github-archive, mined into workbench (2026-07-23)

Personal additions live in `scripts/coco-sync-upstream.sh`,
`scripts/coco-local-setup.sh`, `scripts/coco-verify-guardrails.sh`,
`.githooks/pre-push`, `docs/coco-*.md`, and `AGENTS.md`.

## Notable events

### API key exposure and scrub (2026-07-23)

Two OpenRouter API keys were exposed in git history. History was rewritten
with git filter-repo on 2026-07-23: the key values were replaced with
`sk-or-v1-REMOVED-EXPOSED-KEY`, then force-pushed after temporarily relaxing
branch protection. Tree and history have been clean since — no live key
material remains anywhere in history.

## Mined into workbench

No standalone material was extracted; the snapshot is retained for reference.

## Archival

Archived 2026-07-23. Consolidated into
[ColterD/github-archive](https://github.com/ColterD/github-archive);
the archived original remains at [ColterD/coco](https://github.com/ColterD/coco).
Upstream: [tailcallhq/forgecode](https://github.com/tailcallhq/forgecode).
