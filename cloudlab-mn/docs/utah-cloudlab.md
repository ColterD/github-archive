# Utah CloudLab - Complete Walkthrough

> **Last Updated:** 2026-01-19
> **Session Notes:** Full deployment including Headscale, Coolify, UniFi, Cloudflare Tunnel, and Samba

---

## Quick Reference

### Server Access

| Item         | Value                               |
| ------------ | ----------------------------------- |
| Hostname     | `emily-core-ut`                     |
| Public IP    | `192.200.108.226`                   |
| Tailscale IP | `100.64.0.1`                        |
| SSH          | `root` / `IWUdyc4WAKbgyFU8ALArtkW2` |

### Service URLs

| Service   | URL                                |
| --------- | ---------------------------------- |
| Coolify   | `http://100.64.0.1:8000`           |
| UniFi     | `https://unifi.colter.dev`         |
| Headscale | `http://192.200.108.226:9080`      |
| Samba     | `\\100.64.0.1\{code,media,models}` |

---

## Storage Architecture

### ZFS Pools

| Pool    | Config                   | Size         | Mount                |
| ------- | ------------------------ | ------------ | -------------------- |
| `rpool` | NVMe mirror              | 1.3TB        | `/`, `/nix`, `/home` |
| `ember` | 2x RAIDZ2 + NVMe special | 101TB usable | `/ember`             |

### Ember Pool Details

- **12x HDDs** in two RAIDZ2 vdevs (6+6)
- **NVMe special vdev** (mirrored) for metadata acceleration
- **Datasets:** `/ember/code`, `/ember/media`, `/ember/models`

> **Note:** Raw capacity is ~152TB, usable is ~101TB after RAIDZ2 parity overhead.

---

## Headscale VPN

### Configuration

| Item         | Value                                              |
| ------------ | -------------------------------------------------- |
| Port         | `9080`                                             |
| URL          | `http://192.200.108.226:9080`                      |
| Pre-auth Key | `8412e30fa34dcb7f0a0e6404f0ab1a183c863673b04bc0ee` |
| MagicDNS     | **Disabled** (use IPs directly)                    |

### NixOS Config

```nix
services.headscale = {
  enable = true;
  address = "0.0.0.0";
  port = 9080;
  settings = {
    server_url = "http://192.200.108.226:9080";
    dns = {
      base_domain = "tail.emily";
      magic_dns = false;
      nameservers.global = [ "1.1.1.1" "8.8.8.8" ];
    };
  };
};
```

### Gotchas

- MagicDNS was disabled because it interfered with local DNS resolution
- Port changed from 8080 to 9080 to avoid conflicts with UniFi

---

## Coolify Container Management

### Access

| Item     | Value                                     |
| -------- | ----------------------------------------- | ------------------------------------------------- |
| URL      | `http://100.64.0.1:8000` (Tailscale only) |
| Email    | `colter@emily.local`                      |
| Password | `Coolify2026!Utah`                        |
| API Key  | `1                                        | 0Vou98z0DWW38ZGKa0jCKxCWZrZsCrKyzjhsq6dke80ee9ce` |

### Installation

Coolify was installed via the official script with Docker as the backend.

### Real-time Service Fix

Initially showed "Cannot connect to real-time service" warning. Fixed by:

1. Opening ports `6001` and `6002` in NixOS firewall
2. Setting `PUSHER_HOST=100.64.0.1` in `/data/coolify/source/.env`
3. Setting `APP_URL=http://100.64.0.1:8000`

### Server Configuration

**Problem:** "This Machine" option failed with SSH key errors on NixOS.

**Solution:** Add server as "Remote Server" instead:

- IP: `host.docker.internal`
- Port: `22`
- User: `root`
- SSH Key: Use the auto-generated key from Coolify

---

## UniFi Network Application

### Access

| Item          | Value                             |
| ------------- | --------------------------------- |
| Public URL    | `https://unifi.colter.dev`        |
| Tailscale URL | `https://100.64.0.1:8443`         |
| Inform URL    | `https://unifi.colter.dev/inform` |

### MongoDB Credentials (Coolify Environment Variables)

| Variable          | Value              |
| ----------------- | ------------------ |
| `MONGO_ROOT_PASS` | `Rk9pXm3YvQw7Jn4L` |
| `MONGO_USER`      | `unifi`            |
| `MONGO_PASS`      | `Uxg7Wqm4KbPz9Fn2` |

### Docker Compose (Complete Working Version)

```yaml
services:
  unifi-db:
    image: docker.io/mongo:7.0
    container_name: unifi-db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASS:?}
      - MONGO_USER=${MONGO_USER:?}
      - MONGO_PASS=${MONGO_PASS:?}
      - MONGO_DBNAME=unifi
      - MONGO_AUTHSOURCE=admin
    volumes:
      - unifi-db-data:/data/db
      - type: bind
        source: ./init-mongo.sh
        target: /docker-entrypoint-initdb.d/init-mongo.sh
        read_only: true
        content: |
          #!/bin/bash
          if which mongosh > /dev/null 2>&1; then
            mongo_init_bin='mongosh'
          else
            mongo_init_bin='mongo'
          fi
          "${mongo_init_bin}" <<EOF
          use ${MONGO_AUTHSOURCE}
          db.auth("${MONGO_INITDB_ROOT_USERNAME}", "${MONGO_INITDB_ROOT_PASSWORD}")
          db.createUser({
            user: "${MONGO_USER}",
            pwd: "${MONGO_PASS}",
            roles: [
              { db: "${MONGO_DBNAME}", role: "dbOwner" },
              { db: "${MONGO_DBNAME}_stat", role: "dbOwner" },
              { db: "${MONGO_DBNAME}_audit", role: "dbOwner" }
            ]
          })
          EOF
    restart: unless-stopped

  unifi:
    image: lscr.io/linuxserver/unifi-network-application:latest
    container_name: unifi
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/Denver
      - MONGO_HOST=unifi-db
      - MONGO_PORT=27017
      - MONGO_DBNAME=unifi
      - MONGO_USER=${MONGO_USER:?}
      - MONGO_PASS=${MONGO_PASS:?}
      - MONGO_AUTHSOURCE=admin
    volumes:
      - unifi-config:/config
    ports:
      - "8443:8443"
      - "3478:3478/udp"
      - "10001:10001/udp"
      - "8880:8080"
    depends_on:
      - unifi-db
    restart: unless-stopped

volumes:
  unifi-db-data:
  unifi-config:
```

### Critical Lessons Learned

#### 1. Port 8080 Conflict

**Problem:** Port 8080 was already in use (by another service).
**Solution:** Map UniFi inform port to 8880 instead: `"8880:8080"`

#### 2. MongoDB Authentication

**Problem:** UniFi failed with "No username is provided in the connection string"
**Root Cause:** The linuxserver/unifi-network-application requires:

- An **init-mongo.sh** script to create the `unifi` user in MongoDB
- `MONGO_AUTHSOURCE=admin` environment variable in both containers

**What DOESN'T Work:**

- Just setting `MONGO_INITDB_ROOT_USERNAME/PASSWORD` - this only creates the root user
- The unifi user needs to be created separately via init script

#### 3. Volume Persistence Issue

**Problem:** Changed MongoDB config but still got same error.
**Cause:** MongoDB init scripts only run on **first volume creation**.
**Solution:** Delete the `unifi-db-data` volume before redeploying with new config.

#### 4. Environment Variables in Coolify

**Best Practice:** Use `${VAR_NAME:?}` syntax in compose files:

- The `:?` makes the variable required
- Values are set in Coolify's Environment Variables UI (stored encrypted)
- NOT hardcoded in the compose file

---

## Cloudflare Tunnel

### Configuration

| Item         | Value                                 |
| ------------ | ------------------------------------- |
| Tunnel Name  | `cloudlab-tunnel`                     |
| Deployed Via | Coolify one-click cloudflared service |

### Route Configuration (in Cloudflare Zero Trust dashboard)

| Hostname           | Type  | URL              | Options                   |
| ------------------ | ----- | ---------------- | ------------------------- |
| `unifi.colter.dev` | HTTPS | `localhost:8443` | **No TLS Verify** enabled |

### Gotchas

#### 1. Container Networking

**Problem:** 502 Bad Gateway when using container name in URL.
**Cause:** Cloudflared runs on `host` network, can't resolve Docker container names.
**Solution:** Use `localhost:8443` instead of `unifi-container-name:8443`

#### 2. HTTP Inform Route Redirect Loop

**Problem:** `unifi-inform.colter.dev` caused redirect loop.
**Cause:** Cloudflare SSL mode conflicts with HTTP backend.
**Solution:** Not needed - use HTTPS inform via `unifi.colter.dev/inform` instead.

---

## UXG-Lite Gateway Adoption

### Default Credentials (After Factory Reset)

| Username | Password |
| -------- | -------- |
| `root`   | `ui`     |

> **Note:** NOT `ubnt`/`ubnt` as commonly documented. Changed around Summer 2024.

### Adoption Process

1. Factory reset the gateway (hold reset button 10+ seconds)
2. SSH in: `ssh root@192.168.1.1` (password: `ui`)
3. Set inform: `set-inform https://unifi.colter.dev/inform`
4. Check UniFi dashboard → Devices → Adopt

### What Doesn't Work

- Local setup wizard at 192.168.1.1 won't discover remote controllers (uses mDNS)
- Must use SSH `set-inform` for remote adoption

---

## Samba File Shares

### Shares

| Share    | Path            | Size       |
| -------- | --------------- | ---------- |
| `code`   | `/ember/code`   | 101TB pool |
| `media`  | `/ember/media`  | 101TB pool |
| `models` | `/ember/models` | 101TB pool |

### Credentials

| User     | Password         |
| -------- | ---------------- |
| `colter` | `EmberShare2026` |
| `emily`  | `EmilyShare2026` |

### Connect

**Windows:**

```
\\100.64.0.1\code
\\100.64.0.1\media
\\100.64.0.1\models
```

**macOS/Linux:**

```
smb://100.64.0.1/code
```

### Access Restrictions

Connections only allowed from:

- Tailscale: `100.64.0.0/10`
- Home network: `192.168.1.0/24`
- Localhost: `127.0.0.1`

### NixOS Samba Config

```nix
services.samba = {
  enable = true;
  openFirewall = true;
  settings = {
    global = {
      "workgroup" = "EMILY";
      "server string" = "emily-core-ut";
      "security" = "user";
      "hosts allow" = "100.64.0.0/10 192.168.1.0/24 127.0.0.1 localhost";
      "hosts deny" = "0.0.0.0/0";
    };
    code = {
      path = "/ember/code";
      "read only" = "no";
      "valid users" = "colter emily";
    };
    # ... similar for media and models
  };
};
```

---

## NixOS Firewall Ports

```nix
networking.firewall.allowedTCPPorts = [
  22      # SSH
  80      # HTTP
  139     # Samba NetBIOS
  443     # HTTPS
  445     # Samba SMB
  3000    # Coolify
  6001    # Coolify realtime
  6002    # Coolify realtime
  8000    # Coolify UI
  8443    # UniFi HTTPS
  8880    # UniFi inform (mapped from 8080)
  9080    # Headscale
];
```

---

## Recovery Procedures

### UniFi Complete Redeploy

1. In Coolify, stop and delete the UniFi service
2. Delete volumes: `docker volume rm <project>_unifi-db-data <project>_unifi-config`
3. Create new Docker Compose service with the compose file above
4. Set environment variables: `MONGO_ROOT_PASS`, `MONGO_USER`, `MONGO_PASS`
5. Deploy
6. Re-adopt gateway: `ssh root@192.168.1.1` → `set-inform https://unifi.colter.dev/inform`

### Coolify Reset

```bash
cd /data/coolify/source
docker compose down -v
docker compose up -d
```

Then re-register at http://100.64.0.1:8000

---

## Session Summary - What Worked vs What Didn't

### ✅ What Worked

- Headscale on port 9080 with MagicDNS disabled
- Coolify via Remote Server (not "This Machine")
- UniFi with init-mongo.sh script for user creation
- Cloudflare tunnel with `localhost:8443` and No TLS Verify
- Samba with NixOS declarative config

### ❌ What Didn't Work

- Coolify "This Machine" on NixOS (SSH key issues)
- Port 8080 for UniFi (conflict with another service)
- MongoDB without init script (no unifi user created)
- Cloudflared using container names (network isolation)
- HTTP inform route (redirect loop with Cloudflare SSL)
- `ubnt`/`ubnt` credentials for UXG-Lite (now `root`/`ui`)
- Re-using MongoDB volume after config change (init only runs once)
