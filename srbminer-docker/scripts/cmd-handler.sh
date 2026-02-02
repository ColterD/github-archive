#!/bin/bash
# cmd-handler.sh - Script to handle command-line arguments passed to the container
set -e

CONFIG_FILE="/srbminer/config/config.json"

# Show help
show_help() {
    echo "SRBMiner-Multi Docker Container"
    echo ""
    echo "Usage:"
    echo "  docker run [docker-options] srbminer-docker [options]"
    echo ""
    echo "Options:"
    echo "  --help                  Show this help message"
    echo "  --version               Show miner version"
    echo "  --config <file>         Use specific configuration file"
    echo "  --algorithm <algo>      Set mining algorithm"
    echo "  --pool <url>            Set mining pool URL"
    echo "  --wallet <address>      Set wallet address"
    echo "  --worker <name>         Set worker name"
    echo "  --cpu-threads <num>     Set number of CPU threads"
    echo "  --gpu-intensity <num>   Set GPU intensity"
    echo "  --api-port <port>       Set API port"
    echo "  --web-ui <true|false>   Enable/disable web UI"
    echo "  --web-ui-port <port>    Set web UI port"
    echo ""
    echo "Example:"
    echo "  docker run -d --name srbminer srbminer-docker --algorithm randomx --pool xmr.pool.com:3333 --wallet YOUR_WALLET_ADDRESS"
    echo ""
}

# Show version
show_version() {
    if [ -f "/srbminer/current_version.txt" ]; then
        echo "SRBMiner-Multi Docker Container"
        echo "Version: $(cat /srbminer/current_version.txt)"
    else
        echo "Version information not available"
    fi
}

# Parse configuration from command line arguments
parse_config() {
    local args=("$@")
    local i=0
    local config_modified=false
    
    # Load existing configuration or create empty one
    if [ -f "${CONFIG_FILE}" ]; then
        config=$(cat "${CONFIG_FILE}")
    else
        config="{}"
    fi
    
    while [ $i -lt ${#args[@]} ]; do
        case "${args[$i]}" in
            --help)
                show_help
                exit 0
                ;;
            --version)
                show_version
                exit 0
                ;;
            --config)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    cp "${args[$i]}" "${CONFIG_FILE}"
                    echo "Using configuration file: ${args[$i]}"
                    exit 0
                else
                    echo "Error: Missing argument for --config"
                    exit 1
                fi
                ;;
            --algorithm)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update all GPU threads to use this algorithm
                    if [ $(echo "${config}" | grep -c "\"gpu_threads\"") -gt 0 ]; then
                        # Config has GPU threads
                        for j in $(seq 0 50); do
                            if [ $(echo "${config}" | grep -c "\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*}") -gt 0 ]; then
                                config=$(echo "${config}" | sed -E "s/(\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*\"algorithm\"\\s*:\\s*)\"[^\"]*\"/\\1\"${args[$i]}\"/g")
                            fi
                        done
                    else
                        # No GPU threads, add a basic one
                        config=$(echo "${config}" | sed -E "s/{/{\n  \"gpu_threads\": [{\"index\": 0, \"intensity\": 21, \"algorithm\": \"${args[$i]}\"}],/")
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --algorithm"
                    exit 1
                fi
                ;;
            --pool)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update all GPU threads to use this pool
                    if [ $(echo "${config}" | grep -c "\"gpu_threads\"") -gt 0 ]; then
                        # Config has GPU threads
                        for j in $(seq 0 50); do
                            if [ $(echo "${config}" | grep -c "\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*}") -gt 0 ]; then
                                config=$(echo "${config}" | sed -E "s/(\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*\"pool\"\\s*:\\s*)\"[^\"]*\"/\\1\"${args[$i]}\"/g")
                            fi
                        done
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --pool"
                    exit 1
                fi
                ;;
            --wallet)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update all GPU threads to use this wallet
                    if [ $(echo "${config}" | grep -c "\"gpu_threads\"") -gt 0 ]; then
                        # Config has GPU threads
                        for j in $(seq 0 50); do
                            if [ $(echo "${config}" | grep -c "\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*}") -gt 0 ]; then
                                config=$(echo "${config}" | sed -E "s/(\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*\"wallet\"\\s*:\\s*)\"[^\"]*\"/\\1\"${args[$i]}\"/g")
                            fi
                        done
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --wallet"
                    exit 1
                fi
                ;;
            --worker)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update all GPU threads to use this worker name
                    if [ $(echo "${config}" | grep -c "\"gpu_threads\"") -gt 0 ]; then
                        # Config has GPU threads
                        for j in $(seq 0 50); do
                            if [ $(echo "${config}" | grep -c "\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*}") -gt 0 ]; then
                                config=$(echo "${config}" | sed -E "s/(\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*\"rig_id\"\\s*:\\s*)\"[^\"]*\"/\\1\"${args[$i]}\"/g")
                            fi
                        done
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --worker"
                    exit 1
                fi
                ;;
            --cpu-threads)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update CPU threads configuration
                    if [ $(echo "${config}" | grep -c "\"cpu_threads\"") -gt 0 ]; then
                        config=$(echo "${config}" | sed -E "s/(\"cpu_threads\"\\s*:\\s*)[0-9]+/\\1${args[$i]}/g")
                    else
                        config=$(echo "${config}" | sed -E "s/{/{\n  \"cpu_threads\": ${args[$i]},/")
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --cpu-threads"
                    exit 1
                fi
                ;;
            --gpu-intensity)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update all GPU threads to use this intensity
                    if [ $(echo "${config}" | grep -c "\"gpu_threads\"") -gt 0 ]; then
                        # Config has GPU threads
                        for j in $(seq 0 50); do
                            if [ $(echo "${config}" | grep -c "\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*}") -gt 0 ]; then
                                config=$(echo "${config}" | sed -E "s/(\"gpu_threads\"\\s*:\\s*\\[[^]]*{[^}]*\"index\"\\s*:\\s*${j}[^}]*\"intensity\"\\s*:\\s*)[0-9]+/\\1${args[$i]}/g")
                            fi
                        done
                    fi
                    config_modified=true
                else
                    echo "Error: Missing argument for --gpu-intensity"
                    exit 1
                fi
                ;;
            --api-port)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update API port
                    if [ $(echo "${config}" | grep -c "\"api\"") -gt 0 ]; then
                        config=$(echo "${config}" | sed -E "s/(\"api\"\\s*:\\s*{[^}]*\"port\"\\s*:\\s*)[0-9]+/\\1${args[$i]}/g")
                    else
                        config=$(echo "${config}" | sed -E "s/{/{\n  \"api\": {\n    \"enabled\": true,\n    \"port\": ${args[$i]},\n    \"ipv4_only\": true,\n    \"ipv6_disabled\": true,\n    \"password\": \"\"\n  },/")
                    fi
                    config_modified=true
                    # Also update environment variable for other services
                    export API_PORT="${args[$i]}"
                else
                    echo "Error: Missing argument for --api-port"
                    exit 1
                fi
                ;;
            --web-ui)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update Web UI settings via environment variable
                    export WEB_UI="${args[$i]}"
                    echo "Setting WEB_UI=${args[$i]}"
                else
                    echo "Error: Missing argument for --web-ui"
                    exit 1
                fi
                ;;
            --web-ui-port)
                i=$((i + 1))
                if [ $i -lt ${#args[@]} ]; then
                    # Update Web UI port via environment variable
                    export WEB_UI_PORT="${args[$i]}"
                    echo "Setting WEB_UI_PORT=${args[$i]}"
                else
                    echo "Error: Missing argument for --web-ui-port"
                    exit 1
                fi
                ;;
            *)
                echo "Error: Unknown option ${args[$i]}"
                show_help
                exit 1
                ;;
        esac
        i=$((i + 1))
    done
    
    # Write modified configuration back to file
    if [ "$config_modified" = true ]; then
        echo "Updating configuration based on command line arguments..."
        echo "${config}" > "${CONFIG_FILE}"
    fi
}

# Execute the command parsing
parse_config "$@"

# Exit successfully
exit 0