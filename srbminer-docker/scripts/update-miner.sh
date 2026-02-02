#!/bin/bash
# update-miner.sh - Script to check for and install SRBMiner-Multi updates
set -e

CURRENT_VERSION_FILE="/srbminer/current_version.txt"
GITHUB_REPO="doktor83/SRBMiner-Multi"
GITHUB_API_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
BACKUP_DIR="/srbminer/backups"
LOG_FILE="/var/log/miner-update.log"

# Ensure backup directory exists
mkdir -p ${BACKUP_DIR}

# Log function with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# Check if we're currently mining
is_mining() {
    pgrep SRBMiner-MULTI > /dev/null
    return $?
}

# Get current version
get_current_version() {
    if [ -f ${CURRENT_VERSION_FILE} ]; then
        cat ${CURRENT_VERSION_FILE}
    else
        echo "unknown"
    fi
}

# Get latest version from GitHub
get_latest_version() {
    local latest_version
    local response
    
    log "Checking for updates from GitHub repository: ${GITHUB_REPO}"
    
    # Try to fetch the latest release info
    response=$(curl -s ${GITHUB_API_URL})
    
    # Extract version from tag_name
    latest_version=$(echo "${response}" | grep -o '"tag_name":"[^"]*' | cut -d'"' -f4)
    
    # Remove the "v" prefix if present
    latest_version=${latest_version#v}
    
    # Further clean up (replace underscores with dots, etc.)
    latest_version=$(echo "${latest_version}" | tr -d 'v' | tr '_' '.' | tr '-' '.')
    
    echo "${latest_version}"
}

# Download the latest version
download_latest_version() {
    local latest_version=$1
    local download_url
    local response
    
    log "Finding download URL for version ${latest_version}"
    
    # Get the download URL for Linux
    response=$(curl -s ${GITHUB_API_URL})
    download_url=$(echo "${response}" | grep -o '"browser_download_url":"[^"]*Linux[^"]*' | cut -d'"' -f4)
    
    if [ -z "${download_url}" ]; then
        log "Error: Failed to get download URL for version ${latest_version}"
        return 1
    fi
    
    log "Downloading from URL: ${download_url}"
    
    # Download to a temporary file
    local temp_file="/tmp/srbminer-${latest_version}.tar.gz"
    curl -s -L -o "${temp_file}" "${download_url}"
    
    if [ ! -f "${temp_file}" ] || [ ! -s "${temp_file}" ]; then
        log "Error: Download failed or empty file"
        return 1
    fi
    
    echo "${temp_file}"
}

# Install the downloaded version
install_version() {
    local file_path=$1
    local new_version=$2
    
    log "Installing version ${new_version}"
    
    # Create a temporary extraction directory
    local extract_dir="/tmp/extract-${new_version}"
    mkdir -p "${extract_dir}"
    
    # Extract the archive
    tar -xf "${file_path}" -C "${extract_dir}"
    
    # Find the extracted directory (the archive might have a folder inside)
    local extracted_folder=$(find "${extract_dir}" -type d -name "SRBMiner-Multi*" | head -1)
    
    if [ -z "${extracted_folder}" ]; then
        log "Error: Failed to find SRBMiner-Multi folder in the extracted archive"
        rm -rf "${extract_dir}"
        return 1
    fi
    
    # Backup the current installation
    local current_version=$(get_current_version)
    local backup_path="${BACKUP_DIR}/SRBMiner-Multi-${current_version}-$(date +%Y%m%d%H%M%S)"
    
    log "Backing up current version ${current_version} to ${backup_path}"
    
    if [ -d "/srbminer/bin/SRBMiner-Multi" ]; then
        cp -r /srbminer/bin/SRBMiner-Multi "${backup_path}"
    fi
    
    # Stop the miner if it's running
    local miner_was_running=false
    if is_mining; then
        log "Stopping miner to perform update"
        miner_was_running=true
        supervisorctl stop srbminer
    fi
    
    # Replace the old installation with the new one
    log "Replacing installation files"
    rm -rf /srbminer/bin/SRBMiner-Multi
    cp -r "${extracted_folder}" /srbminer/bin/SRBMiner-Multi
    
    # Update permissions
    chown -R miner:miner /srbminer/bin/SRBMiner-Multi
    chmod +x /srbminer/bin/SRBMiner-Multi/SRBMiner-MULTI
    
    # Update version file
    echo "${new_version}" > ${CURRENT_VERSION_FILE}
    
    # Clean up
    rm -f "${file_path}"
    rm -rf "${extract_dir}"
    
    # Restart the miner if it was running
    if [ "${miner_was_running}" = true ]; then
        log "Restarting miner after update"
        supervisorctl start srbminer
    fi
    
    log "Update to version ${new_version} completed successfully"
    return 0
}

# Main update function
perform_update() {
    local current_version=$(get_current_version)
    local latest_version=$(get_latest_version)
    
    # Check if we got valid versions
    if [ -z "${latest_version}" ] || [ "${latest_version}" = "null" ]; then
        log "Error: Failed to get latest version information"
        return 1
    fi
    
    log "Current version: ${current_version}, Latest version: ${latest_version}"
    
    # Compare versions (simple string comparison for now)
    if [ "${current_version}" = "${latest_version}" ]; then
        log "Already running the latest version (${current_version})"
        return 0
    fi
    
    log "New version available: ${latest_version}"
    
    # Download the latest version
    local download_path=$(download_latest_version "${latest_version}")
    
    if [ $? -ne 0 ] || [ -z "${download_path}" ]; then
        log "Download failed, aborting update"
        return 1
    fi
    
    # Install the downloaded version
    install_version "${download_path}" "${latest_version}"
    return $?
}

# Check if another update is already in progress
if [ -f "/tmp/update_in_progress" ]; then
    log "Another update is already in progress, exiting"
    exit 0
fi

# Create lock file
touch "/tmp/update_in_progress"

# Perform the update
log "Starting SRBMiner-Multi update check"
perform_update
update_result=$?

# Remove lock file
rm -f "/tmp/update_in_progress"

# Return the result
exit ${update_result}