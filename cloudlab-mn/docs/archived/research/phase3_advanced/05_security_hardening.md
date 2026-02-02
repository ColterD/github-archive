# Security Hardening Guide

**Component**: Phase 3 - Security Hardening
**Architecture**: Emily Sovereign V4 Triune
**Date**: 2026-01-12
**Status**: Implementation Guide

---

## 1. Overview

### 1.1 Security Components

| Component | Purpose | Status |
|-----------|---------|--------|
| HashiCorp Vault | Secrets management | Required |
| Audit Logging | Immutable audit trail | Required |
| Certificate Rotation | Automated TLS renewal | Required |
| RBAC | Role-based access control | Required |

### 1.2 Security Layers

```
┌─────────────────────────────────────────┐
│          Application Layer              │
│  ┌───────────────────────────────────┐  │
│  │   Secrets from Vault              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Infrastructure Layer           │
│  ┌───────────────────────────────────┐  │
│  │   RBAC (Grafana, Prefect, Temporal)│ │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   TLS Certificates (Let's Encrypt)│ │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Network Layer                  │
│  ┌───────────────────────────────────┐  │
│  │   WireGuard VPN                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Firewall Rules                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 2. HashiCorp Vault Deployment

### 2.1 Docker Deployment

```yaml
# docker-compose-vault.yml
version: '3.8'
services:
  vault:
    image: hashicorp/vault:latest
    ports:
      - "8200:8200"
    environment:
      - VAULT_ADDR=http://0.0.0.0:8200
      - VAULT_API_ADDR=http://localhost:8200
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data
    command: server -dev
    restart: unless-stopped

volumes:
  vault-data:
```

### 2.2 NixOS Deployment

```nix
# /etc/nixos/vault.nix
{ config, pkgs, ... }:

{
  virtualisation.oci-containers.backend = "docker";
  virtualisation.oci-containers.containers.vault = {
    image = "hashicorp/vault:latest";
    ports = ["8200:8200"];
    environment = {
      VAULT_ADDR = "http://0.0.0.0:8200";
      VAULT_API_ADDR = "http://localhost:8200";
      VAULT_DEV_ROOT_TOKEN_ID = "dev-root-token";
    };
    extraOptions = [
      "--cap-add=IPC_LOCK"
    ];
    volumes = [ "vault-data:/vault/data" ];
  };
}
```

### 2.3 Vault Configuration

```bash
# Initialize Vault
vault login dev-root-token

# Enable secrets engines
vault secrets enable -path=kv kv-v2
vault secrets enable transit

# Create policy for Emily Sovereign
cat > /tmp/emily-policy.hcl << 'EOF'
path "kv/data/emily/*" {
  capabilities = ["create", "read", "update", "delete"]
}
path "transit/encrypt/emily-*" {
  capabilities = ["update"]
}
path "transit/decrypt/emily-*" {
  capabilities = ["update"]
}
