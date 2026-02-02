# 05: Security Hardening

## Overview
Firewall, SSH hardening, security best practices.

**Time**: 30 minutes

## SSH Hardening

Add to configuration.nix:
```nix
{ config, pkgs, ... }:
{
  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "no";
      X11Forwarding = false;
      MaxAuthTries = 3;
      ClientAliveInterval = 300;
      ClientAliveCountMax = 2;
    };
    extraConfig = ''
      AllowUsers admin
      AllowGroups wheel
    '';
  };
  
  # Fail2ban
  services.fail2ban.enable = true;
  services.fail2ban.jails = {
    sshd = {
      enabled = true;
      maxretry = 3;
      bantime = "1h";
    };
  };
}
```

## Firewall Configuration
```nix
networking.firewall = {
  enable = true;
  allowedTCPPorts = [ 22 80 443 ];
  allowedUDPPorts = [ 51820 ];
  
  # Restrict SSH by IP
  extraCommands = ''
    iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -j DROP
  '';
};
```

## System Hardening
```nix
# Kernel hardening
boot.kernel.sysctl = {
  "kernel.kptr_restrict" = 2;
  "net.ipv4.conf.all.rp_filter" = 1;
  "net.ipv4.conf.default.rp_filter" = 1;
  "net.ipv4.icmp_echo_ignore_broadcasts" = 1;
  "net.ipv4.conf.all.accept_source_route" = 0;
  "net.ipv4.conf.all.send_redirects" = 0;
  "net.ipv4.conf.default.send_redirects" = 0;
};

# Automatic updates
system.autoUpgrade = {
  enable = true;
  allowReboot = false;
  dates = "weekly";
};

# Security packages
environment.systemPackages = with pkgs; [
  clamav
  rkhunter
  chkrootkit
];

services.clamav.daemon.enable = true;
services.clamav.updater.enable = true;
```

## User Management
```nix
users.users.admin = {
  isNormalUser = true;
  extraGroups = [ "wheel" "docker" ];
  openssh.authorizedKeys.keys = [
    "ssh-ed25519 AAAAC3Nza... your-key-here"
  ];
};
```

## Verification
```bash
# Check firewall status
sudo nft list ruleset

# Check SSH config
sudo sshd -T | grep -i password

# Test SSH from allowed IP
ssh admin@server-ip

# Check fail2ban status
sudo fail2ban-client status sshd
```

---
**Version**: 1.0.0
