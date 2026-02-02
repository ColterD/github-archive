# WasmEdge Configuration for NixOS
# Phase 2: Edge & Performance

{ config, pkgs, ... }:
let
  wasmedge = pkgs.callPackage (builtins.fetchTarball {
    url = "https://github.com/WasmEdge/wasmedge/archive/refs/tags/0.13.5.tar.gz";
    sha256 = "sha256-0000000000000000000000000000000000000000000000000000=";
  }) {};
in
{
  environment.systemPackages = with pkgs; [
    wasmedge
    python311
    # Python packages for WasmEdge compilation
    (python311.withPackages (ps: with ps; [
      numpy
      pydantic
      aiohttp
    ]))
  ];

  # BBR congestion control for low latency
  boot.kernel.sysctl = {
    "net.core.default_qdisc" = "fq";
    "net.ipv4.tcp_congestion_control" = "bbr";
  };

  # CPU performance mode
  powerManagement.cpuFreqGovernor = "performance";

  # Increase file handles
  boot.kernel.sysctl."fs.file-max" = 2097152;
}
