# Utah CloudLab bring-up checklist

This checklist assumes MN workstation is already prepared (WSL Debian + repo + scripts).
Goal: establish a stable SSH target alias and verified rsync paths between MN and Utah.

## Inputs required (from CloudLab build)
- UTAH_HOST: public IP or DNS name
- UTAH_USER: SSH username
- (optional) UTAH_PORT: SSH port (default 22)

## 1) Fill endpoint file (MN)
Edit:
- `~/src/cloudlab/ops/utah.env` (copy from example)

Verify file is *not* tracked:
- `git status --ignored -sb` should show `!! ops/utah.env`

## 2) Preflight connectivity/auth
Run:
- `~/src/cloudlab/scripts/utah-preflight.sh`

Success criteria:
- SSH connects using alias `utah-cloudlab`
- Remote reports basic system info (script output)
- No password prompts (SSH key auth)

## 3) Create remote sync layout + push
Run:
- `~/src/cloudlab/scripts/utah-push.sh`

Success criteria:
- Remote directories exist: `~/mn-sync/cloudlab/{datasets,artifacts,backups}`
- rsync completes without errors

## 4) Pull backups (optional)
Run:
- `~/src/cloudlab/scripts/utah-pull-backups.sh`

## 5) Hardening / quality gates (post-connect)
- Confirm keepalive behavior by simulating a disconnect.
- If rsync performance is poor, validate MTU and consider compression selectively.
- Default remains SSH+rsync only (avoid SMB/NFS until needed).

## 6) Future automation (agent-friendly)
- Once Utah exists, add a smoke-test script that runs:
  - preflight
  - push dry-run
  - pull dry-run
