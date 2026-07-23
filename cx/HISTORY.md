# cx — History

> Project history for the archived snapshot in this folder.
> Canonical original: [ColterD/cx](https://github.com/ColterD/cx) (archived, read-only).

## Purpose

Rust CLI launcher for the Codex coding agent with Proton Pass secret injection.

- `src/launch.rs` — agent launch flow
- `src/env.rs` — environment / secret injection wiring
- `src/doctor.rs`, `src/heal.rs` — environment diagnostics and self-repair
- `src/prelaunch.rs`, `src/script.rs`, `src/cli.rs` — preflight checks, script handling, CLI definition

## Timeline

14 commits, 2026-03-05 → 2026-07-23. No tags.
Branches: `main`, `feat/initial-cli`, `chore/fleet-baseline-sync`.

### Era 1 — Initial CLI (2026-03-05)

- `f946e7f` Initial commit: .gitignore
- `dac4ea5` feat: cx CLI — Codex launcher with Proton Pass secret injection (`feat/initial-cli`)
- `d894c2f` feat: cx CLI — Codex launcher with Proton Pass injection
- `47f4cb9` chore: format and ignore local push logs

### Era 2 — CI bridge adoption (2026-03-10 → 2026-03-14)

- `b22394b` ci: add GitLab bridge baseline on Hetzner self-hosted (#2)
- `874fdb0`…`c5436f8` chore: enforce CI bridge baseline (#4–#8)
- `0063423` chore: merge via ci-pipelines
- `a547ff7`, `29ad960` chore: enforce CI bridge baseline (fleet baseline sync)

### Era 3 — Archival (2026-07-23)

- `90c571e` Archive: consolidated into github-archive, mined into workbench

## Status at archival

v0.2.0 (`Cargo.toml`), integration tests under `tests/`, CI bridge baseline
applied. The project never had a README before archival; the `README.md` in
this folder was written for the archive.

## Mined into workbench

No standalone material was extracted; the snapshot is retained for reference.

## Archival

Archived 2026-07-23. Consolidated into
[ColterD/github-archive](https://github.com/ColterD/github-archive);
the archived original remains at [ColterD/cx](https://github.com/ColterD/cx).
