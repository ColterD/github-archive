# Blue-Green Deployment Guide

**Component**: Phase 3 - Blue-Green Deployment
**Architecture**: Emily Sovereign V4 Triune
**Date**: 2026-01-12
**Status**: Implementation Guide

---

## 1. Overview

### 1.1 What is Blue-Green Deployment?

Blue-green deployment is a release strategy that reduces downtime and risk by:
- Running two identical production environments (Blue and Green)
- Switching traffic between them without downtime
- Instant rollback capability if issues arise

### 1.2 Deployment Process

```
┌─────────────────────────────────────────┐
│         Production Architecture          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐    Nginx (Traffic Switch)  │
│  │  Blue    │◄───────────────────────┤  │
│  │ (v1.0)   │                        │  │
│  │ Active   │                        │  │
│  └──────────┘                        │  │
│       │                               │  │
│       │ Current traffic                │  │
│       ▼                               │  │
│  ┌─────────────────────────────────┐    │  │
│  │   Emily Sovereign Services     │    │  │
│  │   - Cognition                 │    │  │
│  │   - Instinct                  │    │  │
│  │   - Memory                    │    │  │
│  └─────────────────────────────────┘    │  │
│                                         │  │
│  ┌──────────┐                           │  │
│  │  Green   │                           │  │
│  │ (v1.1)   │   Deploy New Version      │  │
│  │ Inactive │   ─────────────────►       │  │
│  └──────────┘                           │  │
│       │                               │  │
│       ▼                               │  │
│  Smoke Tests                          │  │
│       │                               │  │
│       ▼                               │  │
│  Switch Traffic                        │  │
│       │                               │  │
│       ▼                               │  │
│  Monitor for 30 minutes                │  │
│                                         │  │
└─────────────────────────────────────────┘
```

---

## 2. Node Configuration

### 2.1 Blue Node (Production)

```nix
# /etc/nixos/blue-node.nix
{ config, pkgs, ... }:

{
  networking = {
    hostName = "emily-blue";
    interfaces.enp0s25.ipv4.addresses = [{
      address = "10.0.0.10";
      prefixLength = 24;
    }];
  };
  
  # Emily Sovereign services
  services.emily = {
    enable = true;
    environment = "production";
    nodeType = "blue";
  };
}
```

### 2.2 Green Node (Staging)

```nix
# /etc/nixos/green-node.nix
{ config, pkgs, ... }:

{
  networking = {
    hostName = "emily-green";
    interfaces.enp0s25.ipv4.addresses = [{
      address = "10.0.0.11";
      prefixLength = 24;
    }];
  };
  
  # Emily Sovereign services
  services.emily = {
    enable = true;
    environment = "production";
    nodeType = "green";
  };
}
```

---

## 3. Nginx Traffic Switching

### 3.1 Nginx Configuration

```nginx
# /etc/nginx/conf.d/emily-blue-green.conf
upstream emily_blue {
    server 10.0.0.10:8000;
}

upstream emily_green {
    server 10.0.0.11:8000;
}

# Current active node (change this to switch)
upstream emily_active {
    server 10.0.0.10:8000;  # Change to green: 10.0.0.11:8000
}

server {
    listen 80;
    server_name emily.local;
    
    location / {
        proxy_pass http://emily_active;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    location /health {
        proxy_pass http://emily_active/health;
        access_log off;
    }
}
```

### 3.2 Automated Switch Script

```bash
# /usr/local/bin/switch_blue_green.sh
#!/bin/bash
# Switch blue-green deployment

CURRENT_NODE=$(grep -A 2 "upstream emily_active" /etc/nginx/conf.d/emily-blue-green.conf | grep server | awk '{print $2}')

if [[ $CURRENT_NODE == "10.0.0.10:8000;" ]]; then
    NEW_NODE="10.0.0.11:8000;"
    NEW_COLOR="green"
else
    NEW_NODE="10.0.0.10:8000;"
    NEW_COLOR="blue"
fi

echo "Switching from $CURRENT_NODE to $NEW_COLOR ($NEW_NODE)"

# Update nginx config
sed -i "s|server $CURRENT_NODE|server $NEW_NODE|" /etc/nginx/conf.d/emily-blue-green.conf

# Test nginx config
nginx -t

if [ $? -eq 0 ]; then
    # Reload nginx
    nginx -s reload
    echo "Switched to $NEW_COLOR"
else
    echo "Error: nginx config test failed"
    exit 1
fi
```

---

## 4. Deployment Automation

### 4.1 Deploy to Green

```bash
# /usr/local/bin/deploy_green.sh
#!/bin/bash
# Deploy new version to green node

echo "Deploying to green node..."

# 1. SSH to green node
ssh emily-green << 'ENDSSH'
    cd /opt/emily-sovereign
    
    # 2. Pull latest code
    git pull origin main
    
    # 3. Build containers
    docker-compose build
    
    # 4. Stop old containers
    docker-compose down
    
    # 5. Start new containers
    docker-compose up -d
    
    # 6. Wait for services to be ready
    sleep 30
ENDSSH

# 7. Run smoke tests
./run_smoke_tests.sh

if [ $? -eq 0 ]; then
    echo "Smoke tests passed, switching traffic..."
    
    # 8. Switch traffic
    ./switch_blue_green.sh
    
    # 9. Monitor
    ./monitor_rollout.sh
else
    echo "Smoke tests failed, keeping current traffic on blue"
    exit 1
fi
```

### 4.2 Smoke Tests

```python
# tests/smoke_tests.py
import requests
import sys

def test_health_endpoint():
    """Test health endpoint."""
    response = requests.get("http://10.0.0.11:8000/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✓ Health endpoint passed")

def test_api_endpoint():
    """Test API endpoint."""
    response = requests.post(
        "http://10.0.0.11:8000/api/v1/inference",
        json={"prompt": "test"}
    )
    assert response.status_code == 200
    print("✓ API endpoint passed")

def test_memory_endpoint():
    """Test memory endpoint."""
    response = requests.get("http://10.0.0.11:8000/api/v1/memory")
    assert response.status_code == 200
    print("✓ Memory endpoint passed")

if __name__ == "__main__":
    try:
        test_health_endpoint()
        test_api_endpoint()
        test_memory_endpoint()
        print("\nAll smoke tests passed!")
        sys.exit(0)
    except Exception as e:
        print(f"\nSmoke test failed: {e}")
        sys.exit(1)
```

### 4.3 Rollout Monitoring

```bash
# /usr/local/bin/monitor_rollout.sh
#!/bin/bash
# Monitor rollout for 30 minutes

DURATION=1800  # 30 minutes
CHECK_INTERVAL=60  # 1 minute

echo "Monitoring rollout for $((DURATION / 60)) minutes..."

END_TIME=$(($(date +%s) + DURATION))

while [ $(date +%s) -lt $END_TIME ]; do
    # Check error rate
    ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query \
        -d 'query=rate(http_requests_total{status=~"5.."}[5m])' | \
        jq '.data.result[0].value[1]')
    
    if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
        echo "ERROR: Error rate too high: $ERROR_RATE"
        echo "Rolling back..."
        ./switch_blue_green.sh
        exit 1
    fi
    
    # Check response time
    RESPONSE_TIME=$(curl -s http://localhost:9090/api/v1/query \
        -d 'query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))' | \
        jq '.data.result[0].value[1]')
    
    if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l) )); then
        echo "WARNING: Response time high: $RESPONSE_TIME"
    fi
    
    echo "$(date +%H:%M:%S) - Error rate: $ERROR_RATE, Response time: $RESPONSE_TIME"
    
    sleep $CHECK_INTERVAL
done

echo "Rollout monitoring completed successfully
