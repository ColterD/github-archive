#!/bin/bash

# ========================================================================
# Ubuntu Mainline Kernel Upgrade Checker - Version 1.0.0
# Part of the COLTR Ecosystem
# Using whiptail for TUI (no additional packages required)
# ========================================================================

# Set whiptail colors to a Windows NT inspired theme
export NEWT_COLORS='
root=white,blue
window=black,lightgray
border=blue,lightgray
textbox=black,lightgray
button=black,cyan
actbutton=white,blue
title=white,blue
roottext=white,blue
compactbutton=black,lightgray
actlistbox=black,cyan
listbox=black,lightgray
actsellistbox=white,blue
sellistbox=black,cyan
'

# Configuration
ARCH=$(dpkg --print-architecture 2>/dev/null || echo "amd64")
KERNEL_URL="https://kernel.ubuntu.com/~kernel-ppa/mainline/"
CACHE_DIR="$HOME/.cache/kernel-checker"
CONFIG_DIR="$HOME/.config/kernel-checker"
LOG_FILE="$CONFIG_DIR/install-history.log"
WHIPTAIL_TITLE="Ubuntu Mainline Kernel Upgrade Checker"
WHIPTAIL_BACKTITLE="Part of the COLTR Ecosystem | Version 1.0.0"
TEMP_DIR=$(mktemp -d)
GAUGE_FIFO="$TEMP_DIR/gauge_fifo"

# Global variables for kernel information
CURRENT_KERNEL_FULL=""
CURRENT_KERNEL_BASE=""
CURRENT_KERNEL_MAJOR=""
CURRENT_KERNEL_MINOR=""
IS_CURRENT_RC=false
CURRENT_KERNEL_RC=""

# Global variables for available kernels
LATEST_STABLE=""
LATEST_RC=""
LATEST_STABLE_VER=""
LATEST_RC_VER=""
STABLE_CHANGELOG_URL=""
RC_CHANGELOG_URL=""
CURRENT_KERNEL_URL=""

# Global variables for kernel status
STATUS_ICON=""
STATUS_MESSAGE=""
IS_LATEST=false

# Terminal size
TERM_HEIGHT=24
TERM_WIDTH=80

# Create necessary directories
mkdir -p "$CACHE_DIR" "$CONFIG_DIR"

# Cleanup function to remove temporary files
cleanup() {
    rm -rf "$TEMP_DIR"
}

# Set trap to clean up on exit
trap cleanup EXIT

# Check if running as root
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "Root Required" \
                --msgbox "This script must be run as root or with sudo privileges.\n\nPlease run: sudo $0" 10 60
        exit 1
    fi
}

# Get terminal size
get_term_size() {
    local term_height=$(tput lines)
    local term_width=$(tput cols)
    
    # Adjust for whiptail needs
    TERM_HEIGHT=$((term_height - 4))
    TERM_WIDTH=$((term_width - 4))
    
    # Make sure we have reasonable defaults
    [ $TERM_HEIGHT -lt 10 ] && TERM_HEIGHT=24
    [ $TERM_WIDTH -lt 40 ] && TERM_WIDTH=80
}

# Add navigation help text to a message
add_navigation_help() {
    local message="$1"
    local type="$2"  # "menu", "msgbox", "yesno", etc.
    
    message="$message\n\n------------------------------------------------\n"
    
    case "$type" in
        "menu")
            message="${message}Navigation: Use UP/DOWN arrows to select, TAB to move to buttons, ENTER to confirm."
            ;;
        "msgbox")
            message="${message}Press TAB to move to OK button and ENTER to continue."
            ;;
        "yesno")
            message="${message}Press TAB to switch between YES/NO buttons and ENTER to confirm."
            ;;
        "radiolist")
            message="${message}Navigation: Use UP/DOWN arrows, SPACE to select, TAB to move to buttons, ENTER to confirm."
            ;;
        "inputbox")
            message="${message}Type your input, then press TAB to move to OK button and ENTER to confirm."
            ;;
        *)
            message="${message}Press TAB to navigate and ENTER to confirm selection."
            ;;
    esac
    
    echo "$message"
}

# Show info box
show_info() {
    local message="$1"
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
             --title "Information" \
             --infobox "$message" 8 60
}

# Show error message
show_error() {
    local message="$1"
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
             --title "Error" \
             --msgbox "$(add_navigation_help "ERROR: $message" "msgbox")" 10 60
}

# Check network connectivity using wget instead of ping
check_network() {
    show_info "Checking network connectivity..."
    if ! wget -q --spider "https://kernel.ubuntu.com" &>/dev/null; then
        show_error "Cannot connect to kernel.ubuntu.com. Please check your internet connection."
        
        # Add option to continue anyway
        if whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                   --title "Connection Error" \
                   --yesno "Do you want to continue anyway?" 8 60; then
            return 0
        fi
        return 1
    fi
    return 0
}

# Get kernel information
get_kernel_info() {
    CURRENT_KERNEL_FULL=$(uname -r)
    CURRENT_KERNEL_BASE=$(echo "$CURRENT_KERNEL_FULL" | sed -E 's/-.*//') # e.g., 6.15.0
    CURRENT_KERNEL_MAJOR=$(echo "$CURRENT_KERNEL_BASE" | cut -d. -f1)
    CURRENT_KERNEL_MINOR=$(echo "$CURRENT_KERNEL_BASE" | cut -d. -f2)
    
    # Check if RC kernel
    IS_CURRENT_RC=false
    if [[ "$CURRENT_KERNEL_FULL" =~ rc[0-9]+ ]]; then
        IS_CURRENT_RC=true
        CURRENT_KERNEL_RC=$(echo "$CURRENT_KERNEL_FULL" | grep -oE 'rc[0-9]+' | grep -oE '[0-9]+')
    fi
}

# Get available kernels - simplified without subshells
get_available_kernels() {
    show_info "Connecting to kernel repository..."
    
    ALL_VERSIONS=$(wget -qO- $KERNEL_URL | grep -o 'v[0-9]\+\.[0-9]\+\(-rc[0-9]\+\)\?/' | sed 's|/||' | sort -V)
    
    show_info "Processing kernel versions..."
    
    # Latest stable (no -rc in name)
    LATEST_STABLE=$(echo "$ALL_VERSIONS" | grep -E '^v[0-9]+\.[0-9]+$' | tail -1)
    # Latest RC (if any)
    LATEST_RC=$(echo "$ALL_VERSIONS" | grep -E '^v[0-9]+\.[0-9]+-rc[0-9]+$' | tail -1)
    
    # Remove leading 'v'
    LATEST_STABLE_VER=${LATEST_STABLE#v}
    LATEST_RC_VER=${LATEST_RC#v}
    
    # Generate URLs
    CURRENT_KERNEL_URL="${KERNEL_URL}v${CURRENT_KERNEL_MAJOR}.${CURRENT_KERNEL_MINOR}/"
    [ -n "$LATEST_STABLE" ] && STABLE_CHANGELOG_URL="${KERNEL_URL}${LATEST_STABLE}/"
    [ -n "$LATEST_RC" ] && RC_CHANGELOG_URL="${KERNEL_URL}${LATEST_RC}/"
    
    show_info "Done fetching kernel information!"
    sleep 1
}

# Compare kernel versions
compare_versions() {
    local v1=$1
    local v2=$2
    
    local v1_base=$(echo "$v1" | sed -E 's/-rc[0-9]+//')
    local v2_base=$(echo "$v2" | sed -E 's/-rc[0-9]+//')
    
    local v1_rc=0
    local v2_rc=0
    if [[ "$v1" =~ -rc([0-9]+) ]]; then v1_rc=${BASH_REMATCH[1]}; fi
    if [[ "$v2" =~ -rc([0-9]+) ]]; then v2_rc=${BASH_REMATCH[1]}; fi
    
    IFS='.' read -r v1_major v1_minor v1_patch <<< "$v1_base"
    IFS='.' read -r v2_major v2_minor v2_patch <<< "$v2_base"
    
    v1_patch=${v1_patch:-0}
    v2_patch=${v2_patch:-0}
    
    # Compare major versions
    if [ "$v1_major" -gt "$v2_major" ]; then return 1; fi
    if [ "$v1_major" -lt "$v2_major" ]; then return 2; fi
    
    # Compare minor versions
    if [ "$v1_minor" -gt "$v2_minor" ]; then return 1; fi
    if [ "$v1_minor" -lt "$v2_minor" ]; then return 2; fi
    
    # Compare patch versions
    if [ "$v1_patch" -gt "$v2_patch" ]; then return 1; fi
    if [ "$v1_patch" -lt "$v2_patch" ]; then return 2; fi
    
    # Base versions are equal, now compare RC status
    # Non-RC is greater than any RC
    if [ "$v1_rc" -eq 0 ] && [ "$v2_rc" -gt 0 ]; then return 1; fi
    if [ "$v1_rc" -gt 0 ] && [ "$v2_rc" -eq 0 ]; then return 2; fi
    
    # Both are RC or both are non-RC, compare RC numbers
    if [ "$v1_rc" -gt "$v2_rc" ]; then return 1; fi
    if [ "$v1_rc" -lt "$v2_rc" ]; then return 2; fi
    
    # Versions are equal
    return 0
}

# Determine kernel status
determine_kernel_status() {
    IS_LATEST=false
    
    if [ "$IS_CURRENT_RC" = true ]; then
        # RC kernel comparison
        RC_FORMATTED="${CURRENT_KERNEL_MAJOR}.${CURRENT_KERNEL_MINOR}-rc${CURRENT_KERNEL_RC}"
        
        if [ -n "$LATEST_RC_VER" ]; then
            compare_versions "$RC_FORMATTED" "$LATEST_RC_VER"
            local result=$?
            
            if [ $result -eq 0 ]; then
                STATUS_ICON="✓"
                STATUS_MESSAGE="You are running the latest Release Candidate (RC) kernel."
                IS_LATEST=true
            elif [ $result -eq 1 ]; then
                STATUS_ICON="+"
                STATUS_MESSAGE="You are running a newer RC kernel than in the repository."
                IS_LATEST=true
            else
                STATUS_ICON="↑"
                STATUS_MESSAGE="A newer RC kernel is available."
            fi
        else
            STATUS_ICON="↻"
            STATUS_MESSAGE="You are running an RC kernel, but no newer RC is found."
            IS_LATEST=true
        fi
    else
        # Stable kernel comparison
        if [ "$CURRENT_KERNEL_BASE" = "$LATEST_STABLE_VER" ]; then
            STATUS_ICON="✓"
            STATUS_MESSAGE="You are running the latest stable kernel."
            IS_LATEST=true
        else
            compare_versions "$CURRENT_KERNEL_BASE" "$LATEST_STABLE_VER"
            local result=$?
            
            if [ $result -eq 1 ]; then
                STATUS_ICON="+"
                STATUS_MESSAGE="You are running a newer kernel than the latest stable."
                IS_LATEST=true
            else
                STATUS_ICON="↑"
                STATUS_MESSAGE="A newer stable kernel is available."
            fi
        fi
    fi
}

# Display kernel info using whiptail
display_kernel_info() {
    # Create info message
    local MSG="Kernel Information:
------------------------------------------------
Current kernel: $CURRENT_KERNEL_FULL
Latest stable: $LATEST_STABLE_VER
Latest RC: $LATEST_RC_VER
------------------------------------------------
Status: $STATUS_ICON $STATUS_MESSAGE
------------------------------------------------
Details:
  • Architecture: $ARCH
  • Base Version: $CURRENT_KERNEL_BASE"
    
    if [ "$IS_CURRENT_RC" = true ]; then
        MSG="$MSG
  • Type: Release Candidate (RC$CURRENT_KERNEL_RC)"
    else
        MSG="$MSG
  • Type: Stable"
    fi
    
    MSG="$MSG
------------------------------------------------
Links:
  • Current Kernel: $CURRENT_KERNEL_URL"
    
    if [ -n "$LATEST_STABLE_VER" ]; then
        MSG="$MSG
  • Latest Stable: $STABLE_CHANGELOG_URL"
    fi
    
    if [ -n "$LATEST_RC_VER" ]; then
        MSG="$MSG
  • Latest RC: $RC_CHANGELOG_URL"
    fi
    
    # Add navigation help
    MSG=$(add_navigation_help "$MSG" "msgbox")
    
    # Display info in a scrollable box
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
            --title "$WHIPTAIL_TITLE" \
            --scrolltext --msgbox "$MSG" $TERM_HEIGHT $TERM_WIDTH
}

# Show installation history
show_history() {
    if [ ! -f "$LOG_FILE" ]; then
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "Installation History" \
                --msgbox "$(add_navigation_help "No installation history found." "msgbox")" 8 40
        return
    fi
    
    # Display history in a scrollable text box
    LOG_CONTENT=$(cat "$LOG_FILE")
    LOG_CONTENT=$(add_navigation_help "$LOG_CONTENT" "msgbox")
    
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
            --title "Installation History" \
            --scrolltext --msgbox "$LOG_CONTENT" $TERM_HEIGHT $TERM_WIDTH
}

# Get custom kernel version
get_custom_kernel() {
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
             --title "Custom Kernel" \
             --inputbox "$(add_navigation_help "Enter kernel version (e.g., v6.14):" "inputbox")" \
             10 60 "v" 3>&1 1>&2 2>&3
}

# Download and install kernel - simplified without subshells
download_install_kernel() {
    local selected="$1"
    local selected_ver="$2"
    
    KERNEL_PAGE="${KERNEL_URL}${selected}/"
    INSTALL_DIR=$(mktemp -d)
    
    # Get list of files to download
    show_info "Fetching file list from $KERNEL_PAGE..."
    
    FILES=$(wget -qO- "$KERNEL_PAGE" | grep -oP 'href="[^"]+\.deb"' | grep -E "$ARCH|all" | cut -d'"' -f2)
    
    # If empty, try with _all suffix
    if [ -z "$FILES" ]; then
        FILES=$(wget -qO- "$KERNEL_PAGE" | grep -oP 'href="[^"]+_all\.deb"' | cut -d'"' -f2)
        ARCH_FILES=$(wget -qO- "$KERNEL_PAGE" | grep -oP "href=\"[^\"]+_${ARCH}\.deb\"" | cut -d'"' -f2)
        FILES=$(echo -e "$FILES\n$ARCH_FILES" | sort -u)
    fi
    
    COUNT=$(echo "$FILES" | wc -l)
    
    if [ $COUNT -eq 0 ]; then
        show_error "No packages found for $ARCH architecture!\n\nPlease check the kernel page manually:\n$KERNEL_PAGE"
        rm -rf "$INSTALL_DIR"
        return 1
    fi
    
    # Download files with progress display
    show_info "Downloading $COUNT packages..."
    i=0
    for f in $FILES; do
        i=$((i+1))
        show_info "Downloading ($i/$COUNT): $f"
        wget -q -P "$INSTALL_DIR" "${KERNEL_PAGE}${f}" 2>/dev/null
    done
    
    show_info "Download complete!"
    sleep 1
    
    # List files to be installed
    FILE_LIST=$(ls -1 "$INSTALL_DIR"/*.deb | sed 's|.*/||' | sort)
    CONFIRM_MSG="The following packages will be installed:\n\n$FILE_LIST\n\nProceed with installation?"
    CONFIRM_MSG=$(add_navigation_help "$CONFIRM_MSG" "yesno")
    
    if whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
              --title "Kernel Packages" \
              --yesno "$CONFIRM_MSG" $TERM_HEIGHT $TERM_WIDTH; then
        
        # Log installation
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Installing kernel $selected_ver" >> "$LOG_FILE"
        
        # Create log file for display
        INSTALL_LOG="$TEMP_DIR/install.log"
        echo "Starting installation at $(date)" > "$INSTALL_LOG"
        echo "Installing kernel packages for $selected_ver" >> "$INSTALL_LOG"
        echo "" >> "$INSTALL_LOG"
        
        # First install headers
        for deb in "$INSTALL_DIR"/*headers*.deb; do
            if [ -f "$deb" ]; then
                PKG_NAME=$(basename "$deb")
                echo "$(date '+%H:%M:%S') - Installing $PKG_NAME" >> "$INSTALL_LOG"
                show_info "Installing $PKG_NAME"
                
                if sudo dpkg -i "$deb" >/dev/null 2>&1; then
                    echo "$(date '+%H:%M:%S') - Successfully installed $PKG_NAME" >> "$INSTALL_LOG"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - Installed $PKG_NAME" >> "$LOG_FILE"
                else
                    echo "$(date '+%H:%M:%S') - Failed to install $PKG_NAME" >> "$INSTALL_LOG"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - Failed to install $PKG_NAME" >> "$LOG_FILE"
                fi
                echo "" >> "$INSTALL_LOG"
            fi
        done
        
        # Then install other packages
        for deb in "$INSTALL_DIR"/*.deb; do
            if [[ ! "$deb" == *headers* ]]; then
                PKG_NAME=$(basename "$deb")
                echo "$(date '+%H:%M:%S') - Installing $PKG_NAME" >> "$INSTALL_LOG"
                show_info "Installing $PKG_NAME"
                
                if sudo dpkg -i "$deb" >/dev/null 2>&1; then
                    echo "$(date '+%H:%M:%S') - Successfully installed $PKG_NAME" >> "$INSTALL_LOG"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - Installed $PKG_NAME" >> "$LOG_FILE"
                else
                    echo "$(date '+%H:%M:%S') - Failed to install $PKG_NAME" >> "$INSTALL_LOG"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - Failed to install $PKG_NAME" >> "$LOG_FILE"
                fi
                echo "" >> "$INSTALL_LOG"
            fi
        done
        
        echo "Installation completed at $(date)" >> "$INSTALL_LOG"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Successfully installed kernel $selected_ver" >> "$LOG_FILE"
        
        # Display installation log
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "Installation Complete" \
                --scrolltext --textbox "$INSTALL_LOG" $TERM_HEIGHT $TERM_WIDTH
        
        # Cleanup
        rm -rf "$INSTALL_DIR"
        
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "Installation Complete" \
                --msgbox "$(add_navigation_help "Kernel $selected_ver has been installed.\n\nPlease reboot your system to use the new kernel." "msgbox")" 8 60
    else
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "Aborted" \
                --msgbox "$(add_navigation_help "Installation aborted by user." "msgbox")" 6 40
        rm -rf "$INSTALL_DIR"
    fi
}

# Select kernel using radiolist
select_kernel() {
    local options=("$@")
    local num_options=$((${#options[@]} / 3))
    
    whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
            --title "Available Actions" \
            --radiolist "$(add_navigation_help "Select an option:" "radiolist")" \
            15 70 $num_options \
            "${options[@]}" 3>&1 1>&2 2>&3
}

# Main function
main() {
    # Check if running as root
    check_root
    
    # Get terminal size once at the beginning
    get_term_size
    
    # Check network connectivity
    check_network || return 1
    
    # Get current kernel info
    get_kernel_info
    
    # Get available kernels
    get_available_kernels
    
    # Determine kernel status
    determine_kernel_status
    
    # Display kernel info
    display_kernel_info
    
    # Check if already on latest
    if [ "$IS_LATEST" = "true" ]; then
        whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                --title "No Action Needed" \
                --msgbox "$(add_navigation_help "✓ You are already running the latest available kernel. No action needed." "msgbox")" 7 55
        
        # Still give an option to force an update or see history
        if whiptail --backtitle "$WHIPTAIL_BACKTITLE" \
                   --title "Additional Options" \
                   --yesno "$(add_navigation_help "Would you like to see additional options?" "yesno")" 8 60; then
            # Continue to menu
            :
        else
            return 0
        fi
    fi
    
    # Prepare radiolist options
    RADIOLIST_ITEMS=()
    
    if [ -n "$LATEST_STABLE_VER" ]; then
        RADIOLIST_ITEMS+=("stable" "Install latest stable kernel ($LATEST_STABLE_VER)" "on")
    fi
    
    if [ -n "$LATEST_RC_VER" ]; then
        RADIOLIST_ITEMS+=("rc" "Install latest RC kernel ($LATEST_RC_VER)" "off")
    fi
    
    RADIOLIST_ITEMS+=("custom" "Specify a custom kernel version" "off")
    RADIOLIST_ITEMS+=("history" "Show installation history" "off")
    RADIOLIST_ITEMS+=("exit" "Exit" "off")
    
    # Show radiolist for selection
    SELECTION=$(select_kernel "${RADIOLIST_ITEMS[@]}")
    
    case $SELECTION in
        "stable")
            download_install_kernel "$LATEST_STABLE" "$LATEST_STABLE_VER"
            ;;
        "rc")
            download_install_kernel "$LATEST_RC" "$LATEST_RC_VER"
            ;;
        "custom")
            CUSTOM_VER=$(get_custom_kernel)
            if [ -n "$CUSTOM_VER" ]; then
                # Ensure it has a 'v' prefix
                [[ "$CUSTOM_VER" != v* ]] && CUSTOM_VER="v$CUSTOM_VER"
                download_install_kernel "$CUSTOM_VER" "${CUSTOM_VER#v}"
            fi
            ;;
        "history")
            show_history
            main
            ;;
        *)
            return 0
            ;;
    esac
}

# Run the main function
main