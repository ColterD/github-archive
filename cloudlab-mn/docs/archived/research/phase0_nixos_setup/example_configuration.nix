# Example NixOS Configuration for CloudLab c220g5
{ config, pkgs, ... }:

{
  imports = [ ./hardware-configuration.nix ];

  # Boot Configuration
  boot = {
    loader = {
      systemd-boot.enable = true;
      efi.canTouchEfiVariables = true;
    };
    supportedFilesystems = [ "zfs" ];
    kernelParams = [ "zfs.zfs_arc_max=34359738368" ];
  };

  # Network Configuration
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
    
    firewall = {
      enable = true;
      allowedTCPPorts = [ 22 80 443 ];
    };
  };

  # User Accounts
  users.users.admin = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
  };

  # SSH Configuration
  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "no";
    };
  };

  # ZFS Configuration
  services.zfs.autoScrub.enable = true;
  services.zfs.autoSnapshot.enable = true;

  # Docker
  virtualisation.docker.enable = true;

  # Monitoring
  services.prometheus = {
    enable = true;
    port = 9090;
  };
  services.prometheus.exporters.node.enable = true;

  # System Packages
  environment.systemPackages = with pkgs; [
    vim nano git htop tmux curl wget python311
  ];

  # Nix Flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # Version
  system.stateVersion = "24.11";
}
