#!/bin/bash
set -e

echo "Starting SRBMiner-Multi container..."

# Define configuration file path
CONFIG_FILE="/srbminer/config/config.json"
SETUP_COMPLETE_FLAG="/srbminer/config/.setup_complete"

# Create config directory if it doesn't exist
mkdir -p /srbminer/config
mkdir -p /var/log/supervisor

# Check if first run (no configuration exists)
FIRST_RUN=false
if [ ! -f "$CONFIG_FILE" ] || [ ! -f "$SETUP_COMPLETE_FLAG" ]; then
    echo "No configuration detected - starting in setup mode"
    FIRST_RUN=true
    
    # Create a minimal default config to allow the API to function
    cat > "$CONFIG_FILE" << EOL
{
    "api": {
        "enabled": true,
        "port": ${API_PORT:-7000},
        "ipv4_only": true,
        "ipv6_disabled": true,
        "password": ""
    },
    "log_file": "/var/log/srbminer.log",
    "log_level": 2,
    "gpu_threads": [],
    "cpu_threads": 0,
    "setup_mode": true,
    "watchdog": {
        "disabled": true
    }
}
EOL
fi

echo "Web UI will be started by supervisor only..."

# In first run mode, just start web server and wait for config
if [ "$FIRST_RUN" = "true" ]; then
    echo "Entering setup mode - please access the web UI at http://localhost:${WEB_UI_PORT:-8080} to configure the miner"
    echo "Waiting for configuration to be completed..."
    
    # Run a minimal supervisord config that just manages the web UI
    exec /usr/bin/supervisord -n -c /etc/supervisor/minimal.conf
    exit 0
fi

# Normal startup flow (configuration exists)
echo "Configuration detected - starting mining operations"

# Run hardware detection
/srbminer/scripts/check-gpu.sh

# Check if command-line arguments were provided
if [ $# -gt 0 ]; then
    # Handle command line arguments
    /srbminer/scripts/cmd-handler.sh "$@"
fi

# Start automatic update check service
echo "Starting update check service..."
echo "*/${UPDATE_CHECK_INTERVAL:-4} * * * * /srbminer/scripts/update-miner.sh >> /var/log/miner-update.log 2>&1" > /etc/cron.d/miner-update
chmod 0644 /etc/cron.d/miner-update
service cron start

# Check for updates on startup
echo "Checking for miner updates..."
/srbminer/scripts/update-miner.sh

# Start supervisord which will manage the miner process
echo "Starting mining process..."
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf