# 07: Developer Tools

## Overview
Nix, Git, Docker, Python environment setup.

**Time**: 30 minutes

## Nix Shell

Add to configuration.nix:
```nix
{ config, pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    nixFlakes
    git
    docker
    docker-compose
    python311
    python311Packages.pip
    python311Packages.poetry
    nodejs
    yarn
  ];
  
  # Enable flakes (experimental)
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  
  # Nixpkgs configuration
  nixpkgs.config = {
    allowUnfree = true;
    permittedInsecurePackages = [];
  };
}
```

## Docker

```nix
virtualisation.docker = {
  enable = true;
  enableOnBoot = true;
  autoPrune = {
    enable = true;
    dates = "weekly";
  };
};

# Add user to docker group
users.users.admin.extraGroups = [ "docker" ];
```

## Python Environment

Create shell.nix for projects:
```nix
# shell.nix
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    python311
    python311Packages.pip
    python311Packages.poetry
    python311Packages.virtualenv
    python311Packages.ipython
    python311Packages.jupyter
    python311Packages.tensorflow
    python311Packages.pytorch
  ];
  
  shellHook = ''
    export PYTHONPATH=$PWD
  '';
}
```

Use:
```bash
nix-shell
```

## Git Configuration
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global core.editor "nano"
git config --global init.defaultBranch "main"
```

## VS Code Remote
```bash
# Install code-server
nix-shell -p code-server

# Or use SSH remote
code --remote ssh-remote+server-ip
```

## Useful Tools

```nix
environment.systemPackages = with pkgs; [
  # Development tools
  tmux
  htop
  neovim
  ripgrep
  fzf
  
  # Version control
  git-lfs
  gh  # GitHub CLI
  
  # Build tools
  gcc
  gnumake
  cmake
  
  # Monitoring
  iotop
  nethogs
  
  # Network tools
  tcpdump
  wireshark
  nmap
  
  # Utilities
  jq
  yq
  tree
];
```

## Nix Profiles
```bash
# List profiles
nix-env --list-profiles

# Create profile
nix-env --switch-profile /nix/var/nix/profiles/per-user/admin/myproject

# Install package to profile
nix-env -iA nixpkgs.htop -p /nix/var/nix/profiles/per-user/admin/myproject
```

## Verification
```bash
# Check Nix version
nix --version

# Check flakes
nix flake --help

# Check Docker
docker --version
docker ps

# Check Python
python3 --version
pip --version

# Check Git
git --version
```

---
**Version**: 1.0.0
