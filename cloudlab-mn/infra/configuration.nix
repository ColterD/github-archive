{ config, pkgs, lib, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
    ];

  # Bootloader
  boot.loader.systemd-boot.enable = lib.mkForce false;
  boot.loader.efi.canTouchEfiVariables = true;
  
  # Lanzaboote / Secure Boot would go here, keeping simple for bootstrap
  boot.lanzaboote = {
    enable = true;
    pkiBundle = "/etc/secureboot";
  };

  # ZFS Support
  boot.supportedFilesystems = [ "zfs" ];
  boot.zfs.package = pkgs.zfs_unstable; # OpenZFS 2.4+ for Special VDEV ZIL support
  boot.zfs.forceImportRoot = false;
  networking.hostId = "8425e349"; # Required for ZFS (generated random 8 chars)

  networking.hostName = "emily-core-ut";

  # Networking
  networking.useDHCP = false;
  systemd.network.enable = true;
  # CloudLab usually provides a specific interface config, which hardware-configuration.nix 
  # or the bootstrap script should capture.

  # WireGuard
  networking.wireguard.interfaces = {
    wg0 = {
      ips = [ "10.100.0.1/24" ];
      listenPort = 51820;
      # privateKeyFile = "/persist/secrets/wg_private";
    };
  };

  # Users
  users.users.colter = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" "podman" ];
    openssh.authorizedKeys.keys = [
      # Setup key - replace with actual key
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..." 
    ];
  };

  # System Packages
  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    tmux
    zfs
    parted
    wget
  ];

  # Services
  services.openssh.enable = true;
  services.zfs.autoScrub.enable = true;
  
  virtualisation.podman.enable = true;

  system.stateVersion = "26.05"; 
}
