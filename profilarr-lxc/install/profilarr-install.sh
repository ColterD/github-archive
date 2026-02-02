#!/usr/bin/env bash

# Copyright (c) 2021-2025 community-scripts ORG
# Author: ColterD
# License: MIT | https://github.com/community-scripts/ProxmoxVE/raw/main/LICENSE
# Source: https://dictionarry.dev/

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

msg_info "Installing Dependencies"
$STD apt-get install -y git
msg_ok "Installed Dependencies"

msg_info "Installing Profilarr"
curl -fsSL "$(curl -fsSL https://api.github.com/repos/Dictionarry-Hub/profilarr/releases/latest | grep download | grep linux-x64 | cut -d\" -f4)" -o $(basename "$(curl -fsSL https://api.github.com/repos/Dictionarry-Hub/profilarr/releases/latest | grep download | grep linux-x64 | cut -d\" -f4)")
tar -C /usr/local/bin -xJf profilarr*.tar.xz
mkdir -p /root/.config/profilarr
profilarr config create
msg_ok "Installed Profilarr"

motd_ssh
customize

msg_info "Cleaning up"
rm -rf profilarr*.tar.xz
$STD apt-get -y autoremove
$STD apt-get -y autoclean
msg_ok "Cleaned"
