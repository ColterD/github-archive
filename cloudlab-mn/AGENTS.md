# CloudLab (Utah) – Agent Handoff

This file is the **source-of-truth** for any AI agent or human developer working in this repository.

## 1. Repository Purpose
This repository manages the workflow between a **clean Windows 11 workstation**, **WSL2 Debian** (dev environment), and **Utah CloudLab** (remote compute).

**Core mandates:**
1.  **Stability**: Do not break the local dev environment.
2.  **Safety**: No destructive operations (deletes) without explicit opt-in.
3.  **Portability**: Scripts must run reliably in WSL2.

## 2. Directory Layout
| Directory | Purpose |
| :--- | :--- |
| `docs/` | Decision records and policies. |
| `infra/` | Future Infrastructure-as-Code (IaC). |
| `ops/` | Runbooks and environment configurations. |
| `scripts/` | Shell scripts for all operations. **Only entry point.** |

## 3. Environment & Configuration
### `ops/utah.env`
- **Git-ignored** file containing secrets and path overrides.
- Template: `ops/utah.env.example` (must remain in sync).

**Required Variables:**
- `UTAH_HOST`, `UTAH_USER`

**Optional Variables:**
- `UTAH_PORT` (default: 22)
- `UTAH_REMOTE_BASE` (default: `~/mn-sync/cloudlab`) - *Must use unquoted `~`.*
- `CLOUDLAB_LOCAL_BASE` (default: `/mnt/e/Services/cloudlab`)

### Safety Toggles (Env Vars)
- `UTAH_RSYNC_DRYRUN=1`: Runs rsync with `--dry-run --itemize-changes`. **Default: OFF (live run).**
- `UTAH_RSYNC_DELETE=1`: Enables rsync `--delete` (mirror deletion). **Default: OFF (safer).**

## 4. Key Scripts
Always use these scripts; do not run raw `ssh` or `rsync` commands manually if a script exists.

| Script | Purpose | Key Env Vars |
| :--- | :--- | :--- |
| `utah-preflight.sh` | Validates connectivity and SSH keys. | `UTAH_HOST`, `UTAH_USER` |
| `utah-ssh.sh` | Connects interactively to Utah. | `UTAH_HOST` |
| `utah-push.sh` | Pushes local data -> remote. | `UTAH_RSYNC_DELETE`, `CLOUDLAB_DATASETS_DIR` |
| `utah-pull-backups.sh` | Pulls remote backups -> local. | `UTAH_RSYNC_DRYRUN`, `CLOUDLAB_BACKUPS_DIR` |

## 5. Cross-Platform & Pathing Rules
- **WSL2 Focus**: All scripts assume a bash environment (WSL2 Debian).
- **Line Endings (EOL)**:
    - `*.sh` must be **LF**.
    - `*.ps1` must be **CRLF**.
    - `.gitattributes` enforces this; do not override it.
- **Pathing**:
    - Use variables like `CLOUDLAB_LOCAL_BASE` instead of hardcoding `/mnt/e/...`.
    - Respect the user's split between code (`~/src/...`) and data (`/mnt/e/...`).

## 6. Pre-Commit Checklist
Before declaring a task complete, verify:

1.  ### Security
    - [ ] **NO secrets** in `ops/utah.env.example`.
    - [ ] **NO commits** of `ops/utah.env` (verify `.gitignore`).

2.  ### Validation
    - [ ] `shellcheck -x scripts/*.sh` passes (no critical warnings).
    - [ ] `bash -n scripts/*.sh` passes (no syntax errors).

3.  ### Documentation
    - [ ] `README.md` reflects any new scripts or env vars.
    - [ ] `ops/utah.env.example` includes all used variables.

## 7. Operational Guardrails
- **SSH Keys**: Scripts check for `~/.ssh/id_ed25519_utah` first, then fallback to `ssh-agent`. Do not generate new keys unless explicitly requested.
- **Fail Fast**: Scripts must exit immediately if `ops/utah.env` is missing or variables are unset.
- **No External Dependencies**: Do not introduce new binary dependencies (Python, Node) for basic ops; stick to standard bash/rsync/ssh.
