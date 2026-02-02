# CloudLab (Utah) – MN Workstation Workspace

This repo helps manage the workflow between a **Windows 11 workstation**, **WSL2 Debian** (primary dev), and **Utah CloudLab** (remote).

## Docker Stacks (Coolify-Managed)

All Docker services are consolidated in `/stacks/` for Coolify management:

| Stack | Site | Services |
|-------|------|----------|
| `stacks/utah-core` | Utah (P4) | Ollama, Valkey/FalkorDB, Graphiti, Open WebUI |
| `stacks/utah-embodiment` | Utah (P4) | Kokoro TTS, LFM fallback models (INT8) |
| `stacks/minnesota-lfm` | Minnesota (4090) | LFM-Audio, LFM-Vision, LFM-Thinking (bf16) |

See [stacks/README.md](./stacks/README.md) for deployment instructions.

---

## ⚡ Quick Start (WSL)

1.  **Configure Environment**
    ```bash
    cp ops/utah.env.example ops/utah.env
    nano ops/utah.env
    # Set UTAH_HOST, UTAH_USER, and optionally CLOUDLAB_LOCAL_BASE
    ```
2.  **Verify Connectivity**
    ```bash
    ./scripts/utah-preflight.sh
    # Should print "OK from <hostname>"
    ```
3.  **Sync Data**
    ```bash
    ./scripts/utah-push.sh
    # Pushes datasets/artifacts to Utah
    ```

---

## 📜 Script Truth Table

All scripts interact with `ops/utah.env`.

| Script | Purpose | Critical Env Vars |
| :--- | :--- | :--- |
| `utah-preflight.sh` | **Start here.** Verifies SSH keys, connectivity, and env config. | `UTAH_HOST`, `UTAH_USER` |
| `utah-ssh.sh` | Opens an interactive SSH session to the remote host. | `UTAH_HOST` |
| `utah-push.sh` | Pushes **Datasets** & **Artifacts** to Utah. <br> *Default: Safe update.* | `UTAH_RSYNC_DELETE` (opt-in)<br>`CLOUDLAB_LOCAL_BASE` |
| `utah-pull-backups.sh` | Pulls **Backups** from Utah to local. <br> *Safe: Never deletes local files.* | `CLOUDLAB_BACKUPS_DIR` |
| `utah-rsync.sh` | Generic wrapper for ad-hoc file transfers. | `UTAH_RSYNC_DRYRUN` |

## ⚙️ Configuration

### Environment Variables
Managed in `ops/utah.env` (Git-ignored).

| Variable | Default | Description |
| :--- | :--- | :--- |
| `UTAH_HOST` | *(Required)* | Hostname or IP of the Utah instance. |
| `UTAH_USER` | *(Required)* | Remote username (e.g., `ubuntu`). |
| `CLOUDLAB_LOCAL_BASE` | `/mnt/e/Services/cloudlab` | Local root for heavy data (datasets/artifacts). |
| `UTAH_REMOTE_BASE` | `~/mn-sync/cloudlab` | Remote root for synced data. |
| `UTAH_RSYNC_DELETE` | `0` (Off) | Set to `1` to enable mirror deletes (dangerous). |
| `UTAH_RSYNC_DRYRUN` | `0` (Off) | Set to `1` to simulate transfers. |

### Pathing Guidelines
- **Code** stays in WSL (`~/src/cloudlab`).
- **Data** (Datasets, Artifacts, Backups) lives on Windows/NTFS (`/mnt/e/...`) for storage capacity, mapped via `CLOUDLAB_LOCAL_BASE`.

---

## 🤖 For Agents
See [AGENTS.md](./AGENTS.md) for deeper operational details, safety protocols, and maintainer instructions.
