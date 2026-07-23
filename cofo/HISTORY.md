# cofo — History

> Project history for the archived snapshot in this folder.
> Canonical original: [ColterD/cofo](https://github.com/ColterD/cofo) (archived, read-only).

## Purpose

Hetzner infrastructure CLI for server provisioning, deployment, and operations.
Vault-backed configuration: secret names and paths only (e.g.
`vault_path = "secret/infrastructure/cloudflare"`), no values in the tree.

## Timeline

27 commits, 2026-02-19 → 2026-07-23. No tags.
Branches: `main`, `feat/discord-windows-status-selfheal`,
`feat/woodpecker-ci-coderabbit`, `ops/self-hosted-bridge-hardening`,
`chore/fleet-baseline-sync`.

### Era 1 — Full Rust CLI (2026-02-19 → 2026-03-06)

- `b88ded1` chore: initialize repository
- `706ae54` feat: add editable Discord windows, status command, and telemetry self-healing
- `f7c9ce3` feat: add Woodpecker CI + CodeRabbit config
- `6626845` feat: add GitLab bridge-based CI cutover (#3)
- `7104d36` ci: move gitlab bridge to self-hosted runner and scrub remote token
- `374cc98` ci: run gitlab bridge on self-hosted runner + token cleanup (#6)
- `1298d16` ops: remove woodpecker references and relabel vault service as OpenBao
- `f1c91c9` docs: add OpenBao cutover runbook for vault.colter.dev — **last commit with the complete CLI tree**

Complete tree at `f1c91c9`: `src/commands/` (backup, certs, cloudflare_cmd,
deploy, dns, exec, fail2ban, file, firewall, health, info, log, monitor,
monitor_embed, run, secret, self_test, service, ssh_cmd, status, sync, system,
systemd, validate, vault_cmd), plus `src/vault.rs`, `src/secrets.rs`,
`src/ssh.rs`, `src/telemetry.rs`, `config.default.toml`, and
`docs/openbao-cutover.md`.

### Era 2 — Fleet-baseline takeover (2026-03-11 → 2026-03-14)

- `6251ff1`…`ee92ec1` chore: enforce CI bridge baseline (#9–#12)
- `bccaf8f` chore: merge via ci-pipelines
- `4042bb1`, `f0d87c5` chore: enforce CI bridge baseline

The "chore: enforce CI bridge baseline" commits (driven from ci-pipelines)
stripped the tree to CI scaffolding: `.github/workflows/gitlab-ci-bridge.yml`,
`.gitlab-ci.yml`, `README.md`, `renovate.json`, `sonar-project.properties`.
The full CLI source survives in history at `f1c91c9`.

### Era 3 — Archival (2026-07-23)

- `52901ae` Archive: consolidated into github-archive, mined into workbench

## Mined into workbench

`docs/openbao-cutover.md` (from `f1c91c9`) was mined into
[ColterD/workbench](https://github.com/ColterD/workbench) as
`docs/openbao-cutover.md` — sanitized: the real internal vault hostname was
replaced with a `vault.internal` placeholder.

## Archival

Archived 2026-07-23. Consolidated into
[ColterD/github-archive](https://github.com/ColterD/github-archive);
the archived original remains at [ColterD/cofo](https://github.com/ColterD/cofo).
