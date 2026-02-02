# Storage policy (MN workstation ↔ Utah CloudLab)

## Source code
- Lives in Debian ext4: /home/colter/src/...
- Shared via Git (preferred)

## Shared artifacts / datasets / backups
- Lives on Windows E: (Services): /mnt/e/Services/cloudlab/...
- Shared via rsync over SSH (scripts in ~/src/cloudlab/scripts)

## Never do this
- Do not keep active source repos under /mnt/c or /mnt/e (DrvFS) for heavy development.
- Do not rsync build outputs into /home/colter/src (keep code tree clean).
