# 03: Network Configuration

## Overview
Network setup including VLANs, WireGuard VPN, BBR.

**Time**: 45 minutes

## Network Architecture

| VLAN | Name | Purpose | IP Range |
|------|------|---------|----------|
| 100 | management | OOB management | 192.168.100.0/24 |
| 200 | data | Application data | 192.168.200.0/24 |
| 300 | ai | AI/ML workloads | 192.168.300.0/24 |

## Basic Configuration

Add to configuration.nix:
```nix
networking = {
  hostName = "nixos-server-01";
  defaultGateway = "192.168.1.1";
  nameservers = [ "8.8.8.8" "8.8.4.4" ];
  
  bonds.bond0 = {
    interfaces = [ "enP2p1s0f0" "enP4p2s0f0" ];
    driverOptions = {
      mode = "802.3ad";
      miimon = "100";
    };
  };
};
```

## VLAN Configuration
```nix
networking.vlans = {
  management = { id = 100; interface = "bond0"; };
  data = { id = 200; interface = "bond0"; };
  ai = { id = 300; interface = "bond0"; };
};
```

## WireGuard VPN
```nix
networking.wireguard.interfaces.wg0 = {
  ips = [ "10.100.0.1/24" ];
  listenPort = 51820;
  privateKeyFile = "/etc/wireguard/privatekey";
};
```

## BBR TCP
```nix
boot.kernel.sysctl = {
  "net.core.default_qdisc" = "fq";
  "net.ipv4.tcp_congestion_control" = "bbr";
};
```

## Verification
```bash
ip addr show
ping google.com
wg show
sysctl net.ipv4.tcp_congestion_control
```

---
**Version**: 1.0.0
