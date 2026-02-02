# 06: Monitoring Setup

## Overview
Prometheus, Grafana, Alertmanager installation.

**Time**: 45 minutes

## Prometheus Configuration

Add to configuration.nix:
```nix
{ config, pkgs, ... }:
{
  services.prometheus = {
    enable = true;
    port = 9090;
    globalConfig = {
      scrape_interval = "15s";
      evaluation_interval = "15s";
    };
    scrapeConfigs = [
      {
        job_name = "node";
        static_configs = [{
          targets = ["localhost:9100"];
        }];
      }
    ];
    alertmanagers = [{
      static_configs = [{
        targets = ["localhost:9093"];
      }];
    }];
  };
  
  services.prometheus exporters = {
    node = {
      enable = true;
      enabledCollectors = ["systemd" "processes" "filesystem"];
      port = 9100;
    };
  };
}
```

## Grafana Configuration
```nix
services.grafana = {
  enable = true;
  settings = {
    server = {
      http_addr = "0.0.0.0";
      http_port = 3000;
      domain = "grafana.example.com";
    };
    security = {
      admin_user = "admin";
      admin_password = "changeme";
    };
  };
  
  provision = {
    datasources.settings.datasources = [{
      name = "Prometheus";
      type = "prometheus";
      url = "http://localhost:9090";
      isDefault = true;
    }];
  };
};
```

## Alertmanager Configuration
```nix
services.prometheus.alertmanager = {
  enable = true;
  port = 9093;
  configuration = {
    global = {
      resolve_timeout = "5m";
    };
    route = {
      receiver = "default";
      group_wait = "10s";
      group_interval = "10s";
      repeat_interval = "1h";
    };
    receivers = [{
      name = "default";
      webhook_configs = [{
        url = "http://localhost:8000/alerts";
      }];
    }];
  };
};
```

## Alerting Rules
Create /etc/prometheus/alerts.yml:
```yaml
groups:
  - name: system
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
      
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }} {{ $labels.mountpoint }}"
```

Add to configuration:
```nix
services.prometheus.extraFlags = [
  "--storage.tsdb.path=/var/lib/prometheus"
];
```

## Access
```bash
# Prometheus
http://localhost:9090

# Grafana
http://localhost:3000
# Default: admin / changeme

# Alertmanager
http://localhost:9093
```

## Verification
```bash
# Check Prometheus metrics
curl http://localhost:9090/metrics

# Check targets
curl http://localhost:9090/api/v1/targets

# Check Grafana
curl -I http://localhost:3000

# Check alerts
curl http://localhost:9093/api/v1/alerts
```

## AI Agent Integration
AI can:
- Monitor metrics
- Create alerts
- Auto-respond to alerts
- Generate reports

---
**Version**: 1.0.0
