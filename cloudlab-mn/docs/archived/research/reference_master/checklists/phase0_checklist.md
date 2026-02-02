# Phase 0 Checklist

Verification checklist for Phase 0: NixOS Server Setup completion.

## Prerequisites
- [ ] CloudLab c220g5 access granted
- [ ] Hardware specifications verified (2x Xeon E5-2690v4, 128GB RAM, Tesla P4 8GB, 14x 12TB HDD)
- [ ] Local machine with SSH access configured
- [ ] NixOS ISO downloaded (unstable channel)
- [ ] 8GB+ USB drive for installation
- [ ] Backup plan for existing data (if any)
- [ ] Network configuration details (VLANs, WireGuard keys prepared)

## NixOS Installation
- [ ] NixOS installed on c220g5
- [ ] Boot configuration verified (UEFI/Legacy)
- [ ] Root user password set
- [ ] Initial user account created with sudo privileges
- [ ] SSH access configured and tested
- [ ] NixOS channel set to unstable
- [ ] flake.nix created and initialized
- [ ] Git installed and configured (user.name, user.email)

## Network Configuration
- [ ] WireGuard installed and configured
- [ ] WireGuard keys generated (private/public)
- [ ] WireGuard peer configuration completed
- [ ] WireGuard connection tested from local machine
- [ ] Firewall rules configured (allowed ports: 22, 443, 51820, etc.)
- [ ] BBR congestion control enabled in kernel params
- [ ] Network interfaces configured (enp2s0f0, etc.)
- [ ] MTU set to 9000 (if jumbo frames supported)
- [ ] DNS resolution verified (8.8.8.8 fallback)
- [ ] Network connectivity tested (ping, traceroute)

## Storage Setup (ZFS)
- [ ] ZFS package installed (zfs-utils)
- [ ] Disk drives identified (by-id for persistent naming)
- [ ] RAIDZ2 pool created with 12 disks
- [ ] Special VDEV configured (SSD for metadata)
- [ ] Datasets created (data, metadata)
- [ ] Dataset properties configured (compression=lz4, atime=off, xattr=sa)
- [ ] ZFS mount points verified (/tank/data, /tank/metadata)
- [ ] ZFS permissions set (ownership, groups)
- [ ] ZFS pool health verified (zpool status)
- [ ] SPECIAL: special_small_blocks set to 128K (NOT 0)

## SMB/NFS Sharing
- [ ] SMB server installed and configured
- [ ] SMB user created with strong password
- [ ] SMB share created (/tank/data)
- [ ] SMB permissions verified (read/write access)
- [ ] SMB connection tested from local machine
- [ ] SMB over WireGuard tested (specific IP, no multichannel)
- [ ] NFS server installed (if required)
- [ ] NFS exports configured
- [ ] NFS mount tested from client machine

## Security Hardening
- [ ] Firewall configured (nftables/firewalld)
- [ ] SSH hardening (no root login, key-based auth only)
- [ ] Fail2ban installed and configured
- [ ] SELinux/AppArmor configured (appropriate mode)
- [ ] sops-nix installed and configured
- [ ] Age keys generated for sops-nix
- [ ] Secrets encrypted with sops (WireGuard keys, passwords)
- [ ] Git repository initialized for secrets (encrypted)
- [ ] Audit logging enabled (system logs, auth logs)
- [ ] Security updates tested (nix-channel update)

## Monitoring Setup
- [ ] Prometheus installed and configured
- [ ] Prometheus systemd service enabled and started
- [ ] Node exporter installed and scraping
- [ ] Prometheus scrape targets verified
- [ ] Grafana installed and configured
- [ ] Grafana systemd service enabled and started
- [ ] Prometheus datasource added to Grafana
- [ ] Grafana dashboards created (system, network, storage)
- [ ] Alertmanager installed and configured
- [ ] Email/Slack alert routing configured
- [ ] Alert rules created (disk usage, CPU, memory, etc.)
- [ ] Test alert sent and received

## Backup Setup
- [ ] Restic installed
- [ ] Restic repository initialized (local + S3-compatible)
- [ ] Restic password generated and stored securely
- [ ] Initial backup created
- [ ] Backup schedule configured (cron/systemd timer)
- [ ] Offsite backup tested (restore verification)
- [ ] ZFS snapshot schedule configured (hourly/daily/monthly)
- [ ] Snapshot retention policy configured (24 hourly, 30 daily, 12 monthly)
- [ ] Snapshot pruning script created and scheduled
- [ ] ZFS scrub schedule configured (monthly)
- [ ] Scrub notification configured

## Developer Tools
- [ ] Git installed and configured
- [ ] Git aliases configured (user-friendly commands)
- [ ] Docker installed and enabled
- [ ] Docker Compose installed
- [ ] Python 3.12 installed (via nix)
- [ ] pip configured with mirror (if needed)
- [ ] Virtualenv/venv setup documented
- [ ] Direnv installed and configured (if needed)
- [ ] NixOS options search bookmarked
- [ ] Vim/Emacs/Nano editor configured with plugins

## Configuration Files
- [ ] example_configuration.nix created with all components
- [ ] NixOS configuration tested (nixos-rebuild test)
- [ ] NixOS rebuild successful (nixos-rebuild switch)
- [ ] flake.lock committed to Git
- [ ] NixOS configuration added to Git
- [ ] README.md created with setup instructions
- [ ] runbook_quickstart.md created
- [ ] troubleshooting_guide.md created
- [ ] All configuration files documented

## Testing & Verification
- [ ] System reboot successful after full rebuild
- [ ] All services started correctly (systemctl status)
- [ ] Network connectivity verified (ping, curl)
- [ ] WireGuard VPN connection stable
- [ ] SMB share accessible from local machine
- [ ] ZFS pool healthy (zpool status, no errors)
- [ ] Prometheus metrics scraping correctly
- [ ] Grafana dashboards displaying data
- [ ] Alertmanager receiving metrics
- [ ] Backup completed successfully
- [ ] Restore test successful (from backup)
- [ ] ZFS snapshot created successfully
- [ ] Security audit passed (no unauthorized access attempts)

## Documentation
- [ ] Phase 0 documentation complete
- [ ] Hardware specifications documented
- [ ] Network topology documented (VLANs, subnets)
- [ ] Storage layout documented (disk IDs, pool layout)
- [ ] Service configuration documented (Prometheus, Grafana, etc.)
- [ ] Password/keys management documented (location, rotation)
- [ ] Recovery procedures documented (disaster recovery)
- [ ] Troubleshooting guide created and tested
- [ ] Contact information documented (support channels)

## Final Verification
- [ ] All checklist items completed
- [ ] System stable for 24 hours post-setup
- [ ] No critical errors in system logs
- [ ] Performance metrics within expected range
- [ ] Backup verification passed
- [ ] Documentation reviewed by peer (if applicable)
- [ ] Phase 0 sign-off approved

---

**Total Items**: 93

**Completion Threshold**: 80% (74 items) to proceed to Phase 1

**Critical Items**: All items marked with [CRITICAL] must be completed

**Phase 0 Notes**:
- ZFS special_small_blocks must be set to "128K", NOT "0"
- SMB multichannel doesn't work over WireGuard, use specific IP
- Verify BBR congestion control is active (net.ipv4.tcp_congestion_control = "bbr")

---

**Last Updated**: 2026-01-12

**For AI Agents**: When completing Phase 0 checklist:
1. Each item must have concrete evidence (log entry, test output, etc.)
2. Document all configurations for reproducibility
3. Create runbooks for common procedures
4. Test disaster recovery procedures
5. Verify all services are monitoring-ready before proceeding
