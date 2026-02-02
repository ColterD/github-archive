# SRBMiner-Docker

A comprehensive Docker container for SRBMiner-Multi with automatic GitHub updates, web interface, and multi-GPU support.

## Features

- 🔄 **Automatic Updates**: Regularly checks for new releases on GitHub
- 🖥️ **Web UI Dashboard**: Monitor and configure your mining operation via browser
- 🎮 **Multi-GPU Support**: Works with NVIDIA, AMD, and Intel GPUs
- 🧙 **Setup Wizard**: Easy initial configuration for beginners
- 📊 **Performance Monitoring**: Real-time hashrate, temperature, and power tracking
- 🔧 **Customizable**: Advanced configuration options for experts
- 🔒 **Secure**: Runs with minimal permissions and proper isolation

## Prerequisites

### For Windows with WSL2

- Windows 10 (build 19041+) or Windows 11
- WSL2 enabled
- Docker Desktop with WSL2 backend
- For NVIDIA GPUs:
  - [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
  - NVIDIA drivers supporting WSL2 GPU Paravirtualization (driver version 470.00+)

#### WSL2 Setup Instructions

1. Enable WSL2 in Windows:
   ```powershell
   wsl --install