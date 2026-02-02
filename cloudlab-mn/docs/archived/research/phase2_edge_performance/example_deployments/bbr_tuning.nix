# BBR Congestion Control Tuning for NixOS
# Optimized for CloudLab c220g5 (40Gbps, Mellanox CX4)

{ config, pkgs, ... }:
{
  # BBR congestion control
  boot.kernel.sysctl = {
    # Use BBR as default congestion control
    "net.ipv4.tcp_congestion_control" = "bbr";
    
    # Use FQ qdisc (required for BBR)
    "net.core.default_qdisc" = "fq";
    
    # Enable BBR module
    "net.ipv4.tcp_allowed_congestion_control" = "bbr cubic reno";
    
    # TCP buffer sizes (for 40Gbps network)
    "net.core.rmem_max" = 134217728;        # 128MB
    "net.core.wmem_max" = 134217728;        # 128MB
    "net.ipv4.tcp_rmem" = "4096 65536 134217728";
    "net.ipv4.tcp_wmem" = "4096 65536 134217728";
    
    # TCP settings for low latency
    "net.ipv4.tcp_fastopen" = 3;
    "net.ipv4.tcp_slow_start_after_idle" = 0;
    "net.ipv4.tcp_no_metrics_save" = 1;
    "net.ipv4.tcp_mtu_probing" = 1;
    
    # Connection tracking
    "net.netfilter.nf_conntrack_max" = 1000000;
    "net.netfilter.nf_conntrack_tcp_timeout_established" = 600;
    
    # Reduce TIME_WAIT
    "net.ipv4.tcp_fin_timeout" = 30;
    "net.ipv4.tcp_tw_reuse" = 1;
    
    # SYN cache
    "net.ipv4.tcp_max_syn_backlog" = 8192;
    "net.ipv4.tcp_syncookies" = 1;
    
    # Socket limits
    "net.core.somaxconn" = 1024;
    "net.core.netdev_max_backlog" = 5000;
    
    # Memory
    "vm.swappiness" = 10;
    "vm.dirty_ratio" = 15;
    "vm.dirty_background_ratio" = 5;
    
    # File handles
    "fs.file-max" = 2097152;
  };

  # Boot parameters
  boot.kernelParams = [
    "transparent_hugepage=never"  # Disable THP for better latency
    "intel_iommu=on"               # Enable IOMMU for GPU passthrough
  ];

  # Disable transparent hugepages
  boot.kernelPatches = [{
    name = "disable-thp";
    patch = null;
    extraConfig = ''
      DISABLE_TRANSPARENT_HUGEPAGE
    '';
  }];

  # CPU performance mode
  powerManagement.cpuFreqGovernor = "performance";

  # Network interface configuration
  networking.interfaces.enp3s0f0 = {
    useDHCP = false;
    ipv4.addresses = [
      {
        address = "192.168.1.100";
        prefixLength = 24;
      }
    ];
  };

  # Enable BBR kernel module
  boot.kernelModules = [ "tcp_bbr" ];
}
