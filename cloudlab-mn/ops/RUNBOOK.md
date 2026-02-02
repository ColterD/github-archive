# CloudLab Runbook (MN workstation)

## First time when Utah is online
1) Edit endpoint:
   nano ~/src/cloudlab/ops/utah.env

2) Preflight (auth + connectivity):
   ~/src/cloudlab/scripts/utah-preflight.sh

3) Create remote layout + push datasets/artifacts:
   ~/src/cloudlab/scripts/utah-push.sh

4) Pull backups:
   ~/src/cloudlab/scripts/utah-pull-backups.sh

## Common
- SSH:
  ~/src/cloudlab/scripts/utah-ssh.sh

- Push (MN -> Utah):
  ~/src/cloudlab/scripts/utah-push.sh

- Pull backups (Utah -> MN):
  ~/src/cloudlab/scripts/utah-pull-backups.sh
