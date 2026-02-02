# NixOS Infrastructure Configuration Examples
# CloudLab c220g5 Hardware: Dual Xeon E5-2620 v4, Tesla P4 8GB, 64GB RAM, 480GB SSD

# =============================================================================
# ZFS CONFIGURATION
# =============================================================================

## Basic ZFS Pool Setup
{ config, pkgs, ... }:
{
  boot.supportedFilesystems = [ "zfs" ];
  boot.kernelParams = [ "zfs.zfs_arc_max=17179869184" ]; # 16GB ARC
  networking.hostId = "8425e349";
  
  boot.zfs.extraPools = [ "tank" ];
  
  # ZFS automatic scrubbing
  services.zfs.autoScrub = {
    enable = true;
    interval = "weekly";
    pools = [ "tank" ];
  };
  
  # ZFS auto snapshot
  services.zfs.autoSnapshot = {
    enable = true;
    frequent = 4;
    hourly = 24;
    daily = 7;
    monthly = 6;
  };
}

## ZFS Dataset Creation Commands (run manually):
# zfs create -o compression=lz4 -o atime=off tank/data
# zfs create -o compression=zstd -o recordsize=4K tank/special
# zfs create -o mountpoint=/var/lib/docker tank/docker
# zfs create -o mountpoint=/var/lib/postgresql tank/postgres

# =============================================================================
# NETWORKING CONFIGURATION WITH BBR
# =============================================================================

## Static Network with BBR and ECN
{ config, pkgs, ... }:
{
  networking = {
    hostName = "sovereign-ml";
    domain = "sovereign.local";
    
    interfaces = {
      eno1 = {
        ipv4.addresses = [{
          address = "10.0.0.100";
          prefixLength = 24;
        }];
      };
    };
    
    defaultGateway = {
      address = "10.0.0.1";
      interface = "eno1";
    };
    
    nameservers = [ "8.8.8.8" "8.8.4.4" ];
    
    firewall = {
      enable = true;
      allowedTCPPorts = [ 22 80 443 8000 8001 8265 9090 ];
      allowedUDPPorts = [ 53 ];
    };
  };
  
  boot.kernelModules = [ "tcp_bbr" ];
  boot.kernel.sysctl = {
    "net.core.default_qdisc" = "fq";
    "net.ipv4.tcp_congestion_control" = "bbr";
    "net.ipv4.tcp_ecn" = 1;
    "net.core.rmem_max" = 134217728;
    "net.core.wmem_max" = 134217728;
    "net.ipv4.tcp_rmem" = "4096 87380 67108864";
    "net.ipv4.tcp_wmem" = "4096 65536 67108864";
  };
}

# =============================================================================
# POSTGRESQL WITH PGVECTOR
# =============================================================================

## PostgreSQL 15 with pgvector
{ config, pkgs, ... }:
{
  services.postgresql = {
    enable = true;
    package = pkgs.postgresql_15;
    ensureDatabases = [ "mlflow" "feast" "vectorstore" ];
    
    settings = {
      max_connections = 200;
      shared_buffers = "8GB";
      effective_cache_size = "24GB";
      maintenance_work_mem = "2GB";
      wal_buffers = "16MB";
      max_parallel_workers_per_gather = 4;
      max_worker_processes = 8;
    };
    
    extensions = {
      pgvector = {
        package = pkgs.postgresql_15.pkgs.pgvector;
        schemas = [ "vectorstore" ];
      };
    };
  };
}

# =============================================================================
# DOCKER ON ZFS
# =============================================================================

{ config, pkgs, ... }:
{
  virtualisation.docker = {
    enable = true;
    storageDriver = "zfs";
    autoPrune = {
      enable = true;
      dates = "weekly";
    };
  };
}

# =============================================================================
# NVIDIA TESLA P4 GPU CONFIGURATION
# =============================================================================

{ config, pkgs, ... }:
{
  hardware.nvidia = {
    modesetting.enable = true;
    powerManagement.enable = false;
    open = false;
    nvidiaSettings = true;
    package = config.boot.kernelPackages.nvidiaPackages.production;
  };
  
  hardware.opengl = {
    enable = true;
    driSupport = true;
  };
}

# =============================================================================
# PROMETHEUS + GRAFANA
# =============================================================================

{ config, pkgs, ... }:
{
  services.prometheus = {
    enable = true;
    port = 9090;
    scrapeConfigs = [
      {
        job_name = "node";
        static_configs = [{
          targets = [ "localhost:9100" ];
        }];
      }
    ];
  };
  
  services.grafana = {
    enable = true;
    settings.server.http_port = 3000;
  };
  
  services.prometheus.exporters.node = {
    enable = true;
    enabledCollectors = [ "systemd" "filesystem" ];
    port = 9100;
  };
}
