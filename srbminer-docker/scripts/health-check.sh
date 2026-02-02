#!/bin/bash
# health-check.sh - Script to monitor miner health and perform recovery actions
set -e

LOG_FILE="/var/log/health-check.log"
MINER_LOG="/var/log/srbminer.log"
CONFIG_FILE="/srbminer/config/config.json"
SETUP_COMPLETE_FLAG="/srbminer/config/.setup_complete"
MAX_RESTART_ATTEMPTS=3
RESTART_COUNTER_FILE="/tmp/srbminer_restart_counter"

# Ensure restart counter file exists
touch ${RESTART_COUNTER_FILE}

# Try to get API port from config, default to 7000 if not found
API_PORT=7000
if [ -f "${CONFIG_FILE}" ]; then
    PORT_FROM_CONFIG=$(grep -o '"port":[^,}]*' ${CONFIG_FILE} 2>/dev/null | head -1 | cut -d':' -f2 | tr -d ' ')
    if [ ! -z "${PORT_FROM_CONFIG}" ]; then
        API_PORT=${PORT_FROM_CONFIG}
    fi
fi

# Log function with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# Check if we're in setup mode
is_setup_mode() {
    if [ ! -f "${SETUP_COMPLETE_FLAG}" ]; then
        return 0
    fi
    
    if [ -f "${CONFIG_FILE}" ] && grep -q '"setup_mode":[^,}]*true' ${CONFIG_FILE} 2>/dev/null; then
        return 0
    fi
    
    return 1
}

# Check if miner process is running
is_miner_running() {
    pgrep SRBMiner-MULTI > /dev/null
    return $?
}

# Check if the API is responding
is_api_responding() {
    curl -s "http://localhost:${API_PORT}/api/summary" > /dev/null
    return $?
}

# Check GPU health
check_gpu_health() {
    local warnings=0
    
    # If NVIDIA GPU is available, check it
    if command -v nvidia-smi &> /dev/null; then
        log "Checking NVIDIA GPU health"
        nvidia_output=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader 2>/dev/null)
        if [ $? -ne 0 ] || ! echo "${nvidia_output}" | grep -q '[0-9]'; then
            log "WARNING: NVIDIA GPU not responding correctly"
            warnings=$((warnings + 1))
        else
            # Check for overheating GPUs
            while read -r temp; do
                if [ -n "$temp" ] && [ "$temp" -gt 85 ]; then
                    log "WARNING: GPU temperature too high: ${temp}°C"
                    warnings=$((warnings + 1))
                fi
            done <<< "$nvidia_output"
        fi
    fi
    
    # If AMD GPU is available, check it
    if command -v rocm-smi &> /dev/null; then
        log "Checking AMD GPU health"
        if ! rocm-smi --showtemp 2>/dev/null | grep -q '[0-9]'; then
            log "WARNING: AMD GPU not responding correctly"
            warnings=$((warnings + 1))
        fi
    fi
    
    return ${warnings}
}

# Check for error patterns in logs
check_logs_for_errors() {
    local errors=0
    
    # Skip if the log file doesn't exist
    if [ ! -f "${MINER_LOG}" ]; then
        log "WARNING: Miner log file not found: ${MINER_LOG}"
        return 0
    fi
    
    # Check for common error patterns in the last 100 lines
    if tail -n 100 ${MINER_LOG} | grep -q "GPU error"; then
        log "WARNING: GPU errors detected in logs"
        errors=$((errors + 1))
    fi
    
    if tail -n 100 ${MINER_LOG} | grep -q "CUDA error"; then
        log "WARNING: CUDA errors detected in logs"
        errors=$((errors + 1))
    fi
    
    if tail -n 100 ${MINER_LOG} | grep -q "OpenCL error"; then
        log "WARNING: OpenCL errors detected in logs"
        errors=$((errors + 1))
    fi
    
    if tail -n 50 ${MINER_LOG} | grep -q "connection lost"; then
        log "WARNING: Pool connection issues detected"
        errors=$((errors + 1))
    fi
    
    return ${errors}
}

# Check hashrate against expected values
check_hashrate() {
    local api_response
    local current_hashrate
    local algorithm
    
    # Get current hashrate from API
    api_response=$(curl -s "http://localhost:${API_PORT}/api/summary" 2>/dev/null)
    
    if [ -z "${api_response}" ]; then
        log "WARNING: Failed to get hashrate from API"
        return 1
    fi
    
    current_hashrate=$(echo "${api_response}" | grep -o '"hashrate_total":[^,}]*' | cut -d':' -f2)
    algorithm=$(echo "${api_response}" | grep -o '"algorithm":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "${current_hashrate}" ] || [ "${current_hashrate}" = "null" ]; then
        log "WARNING: Hashrate information unavailable"
        return 1
    fi
    
    # Convert to number and check if close to zero
    # Use a safe numeric comparison method that works without bc
    current_hashrate=$(echo "${current_hashrate}" | tr -d ' ')
    if [ -z "${current_hashrate}" ] || [ "${current_hashrate}" = "0" ] || [ "${current_hashrate}" = "0.0" ]; then
        log "WARNING: Zero hashrate detected for algorithm ${algorithm}"
        return 1
    fi
    
    # Basic comparison for very low hashrate (less than 1)
    # Extract the integer part before the decimal point
    integer_part=$(echo "${current_hashrate}" | cut -d'.' -f1)
    if [ "${integer_part}" = "0" ]; then
        # If integer part is 0, check if decimal part is very small
        decimal_part=$(echo "${current_hashrate}" | cut -d'.' -f2 | cut -c1-2)
        if [ -z "${decimal_part}" ] || [ "${decimal_part}" -lt 10 ]; then
            log "WARNING: Extremely low hashrate detected (${current_hashrate} H/s) for algorithm ${algorithm}"
            return 1
        fi
    fi
    
    log "Current hashrate: ${current_hashrate} H/s for algorithm ${algorithm} - OK"
    return 0
}

# Restart miner
restart_miner() {
    local restart_counter=$(cat ${RESTART_COUNTER_FILE})
    
    # Increment restart counter
    restart_counter=$((restart_counter + 1))
    echo ${restart_counter} > ${RESTART_COUNTER_FILE}
    
    log "Attempting to restart miner (attempt ${restart_counter} of ${MAX_RESTART_ATTEMPTS})"
    
    # Check if we've exceeded the maximum number of restart attempts
    if [ ${restart_counter} -gt ${MAX_RESTART_ATTEMPTS} ]; then
        log "ERROR: Exceeded maximum restart attempts. Manual intervention required."
        return 1
    fi
    
    supervisorctl restart srbminer
    
    # Wait for miner to start
    sleep 30
    
    # Check if miner is now running
    if is_miner_running; then
        log "Miner successfully restarted"
        return 0
    else
        log "ERROR: Failed to restart miner"
        return 1
    fi
}

# Reset restart counter if miner has been running for a while
reset_restart_counter() {
    # Check if miner is running first
    if ! is_miner_running; then
        return 1
    fi
    
    # Get the PIDs of SRBMiner-MULTI processes
    local miner_pid=$(pgrep SRBMiner-MULTI | head -1)
    
    if [ -z "${miner_pid}" ]; then
        log "WARNING: Unable to get miner process ID for uptime check"
        return 1
    fi
    
    # Get process uptime in seconds
    local uptime=$(ps -o etimes= -p ${miner_pid})
    
    if [ -z "${uptime}" ]; then
        log "WARNING: Unable to get miner uptime"
        return 1
    fi
    
    # If uptime is greater than 1 hour (3600 seconds), reset counter
    if [ ${uptime} -gt 3600 ]; then
        log "Miner has been stable for over an hour, resetting restart counter"
        echo 0 > ${RESTART_COUNTER_FILE}
    fi
    
    return 0
}

# Main health check function
perform_health_check() {
    log "Starting health check"
    
    # Skip if we're in setup mode
    if is_setup_mode; then
        log "Setup mode detected, skipping health check"
        return 0
    fi
    
    # Check if miner process is running
    if ! is_miner_running; then
        log "ERROR: Miner process is not running"
        restart_miner
        return $?
    fi
    
    # If miner is running, reset counter if it's been stable
    reset_restart_counter
    
    # Check if API is responding
    if ! is_api_responding; then
        log "WARNING: Miner API is not responding"
        restart_miner
        return $?
    fi
    
    # Check GPU health
    check_gpu_health
    gpu_warnings=$?
    
    # Check logs for errors
    check_logs_for_errors
    log_errors=$?
    
    # Check hashrate
    check_hashrate
    hashrate_warning=$?
    
    # Combine warnings and errors
    total_issues=$((gpu_warnings + log_errors + hashrate_warning))
    
    # If there are issues, consider restarting
    if [ ${total_issues} -gt 1 ]; then
        log "Multiple issues detected (${total_issues}), restarting miner"
        restart_miner
        return $?
    fi
    
    log "Health check completed successfully"
    return 0
}

# Execute health check
perform_health_check
exit $?