# Storage & Sync Policy (MN ↔ Utah CloudLab)

> **MN** = Minnesota workstation (Windows 11 + WSL2 Debian)
> **Utah** = CloudLab server (`emily-core-ut`)

---

## Storage Locations

### MN Workstation

| Type            | Location                              | Notes                  |
| --------------- | ------------------------------------- | ---------------------- |
| **Source Code** | `/home/colter/src/...` (ext4)         | Active development     |
| **Datasets**    | `/mnt/e/Services/cloudlab/datasets/`  | Windows E: drive       |
| **Artifacts**   | `/mnt/e/Services/cloudlab/artifacts/` | Build outputs, exports |
| **Backups**     | `/mnt/e/Services/cloudlab/backups/`   | Pulled from Utah       |

### Utah CloudLab

| Type                   | Location                        | Notes             |
| ---------------------- | ------------------------------- | ----------------- |
| **Sync Target**        | `~/mn-sync/cloudlab/`           | rsync destination |
| **Datasets**           | `~/mn-sync/cloudlab/datasets/`  | Synced from MN    |
| **Artifacts**          | `~/mn-sync/cloudlab/artifacts/` | Synced from MN    |
| **Backups**            | `~/mn-sync/cloudlab/backups/`   | Created on Utah   |
| **Persistent Storage** | `/ember/...`                    | ZFS pool (101TB)  |

---

## Sync Method

**Primary:** rsync over SSH via scripts in `~/src/cloudlab/scripts/`

| Script                 | Purpose                         |
| ---------------------- | ------------------------------- |
| `utah-preflight.sh`    | Test connectivity               |
| `utah-push.sh`         | Push datasets/artifacts to Utah |
| `utah-pull-backups.sh` | Pull backups from Utah          |

---

## Rules

### ✅ DO

- Keep source code in `/home/colter/src/` (native ext4)
- Share code via Git
- Use rsync for large datasets/artifacts
- Use Samba shares for interactive access to `/ember/`

### ❌ DON'T

- Keep active source repos under `/mnt/c` or `/mnt/e` (DrvFS) for heavy development
- rsync build outputs into `/home/colter/src/` (keep code tree clean)
- Store secrets in sync directories (use environment files)
