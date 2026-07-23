# cx (archived)

> **Archived snapshot.** This project is unmaintained and preserved for reference only.
> Consolidated into [ColterD/github-archive](https://github.com/ColterD/github-archive);
> useful patterns were mined into [ColterD/workbench](https://github.com/ColterD/workbench).

Rust CLI launcher for the Codex coding agent with Proton Pass secret injection.

- `src/launch.rs` — agent launch flow
- `src/env.rs` — environment / secret injection wiring
- `src/doctor.rs`, `src/heal.rs` — environment diagnostics and self-repair
- `src/prelaunch.rs`, `src/script.rs`, `src/cli.rs` — preflight checks, script handling, CLI definition

Status at archival: v0.2.0, tests under `tests/`, CI bridge baseline applied.

History: see [HISTORY.md](./HISTORY.md).
