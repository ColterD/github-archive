#!/bin/bash
# check-gpu.sh - Script to check and configure GPU environment at startup
set -e

LOG_FILE="/var/log/gpu-check.log"

# Log function with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# Check NVIDIA GPUs
check_nvidia() {
    log "Checking for NVIDIA GPUs..."
    
    if ! command -v nvidia-smi &> /dev/null; then
        log "nvidia-smi not found. NVIDIA driver or NVIDIA Container Toolkit may not be installed."
        return 1
    fi
    
    # Get NVIDIA GPU information
    nvidia_info=$(nvidia-smi --query-gpu=index,name,driver_version,memory.total --format=csv,noheader 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "${nvidia_info}" ]; then
        log "Failed to get NVIDIA GPU information."
        return 1
    fi
    
    # Count GPUs
    gpu_count=$(echo "${nvidia_info}" | wc -l)
    log "Detected ${gpu_count} NVIDIA GPU(s):"
    
    # Display GPU information
    echo "${nvidia_info}" | while IFS="," read -r idx name driver memory; do
        log "  GPU ${idx}: ${name} (Driver: ${driver}, Memory: ${memory})"
    done
    
    # Check for CUDA support
    if [ -z "${CUDA_VERSION}" ]; then
        log "Warning: CUDA_VERSION environment variable not set."
    else
        log "CUDA Version: ${CUDA_VERSION}"
    fi
    
    # Set environment variables for optimal mining
    export GPU_FORCE_64BIT_PTR=1
    export GPU_MAX_HEAP_SIZE=100
    export GPU_USE_SYNC_OBJECTS=1
    export GPU_MAX_ALLOC_PERCENT=100
    export GPU_SINGLE_ALLOC_PERCENT=100
    
    log "NVIDIA GPU environment variables set for optimal mining"
    return 0
}

# Check AMD GPUs
check_amd() {
    log "Checking for AMD GPUs..."
    
    # Check for rocm-smi
    if command -v rocm-smi &> /dev/null; then
        # Get AMD GPU information using rocm-smi
        amd_info=$(rocm-smi --showproductname 2>/dev/null)
        
        if [ $? -eq 0 ] && [ ! -z "${amd_info}" ]; then
            log "AMD GPU(s) detected via ROCm:"
            echo "${amd_info}" | grep -v "===" | grep -v "^$" | while read -r line; do
                log "  ${line}"
            done
        fi
    else
        log "rocm-smi not found. Checking device files..."
        
        # Try to detect AMD GPUs through device files
        if [ -d "/sys/class/drm" ]; then
            amd_cards=$(ls -l /sys/class/drm/card*/device/vendor | grep -i "0x1002" 2>/dev/null | wc -l)
            
            if [ ${amd_cards} -gt 0 ]; then
                log "Detected ${amd_cards} AMD GPU(s) through device files:"
                
                for card in $(ls -d /sys/class/drm/card*/device/ 2>/dev/null | grep -l "0x1002" -); do
                    if [ -f "${card}/product_name" ]; then
                        name=$(cat "${card}/product_name" 2>/dev/null || echo "Unknown AMD GPU")
                        log "  ${name}"
                    fi
                done
            else
                log "No AMD GPUs detected through device files."
                return 1
            fi
        else
            log "No /sys/class/drm directory found. Cannot detect AMD GPUs."
            return 1
        fi
    fi
    
    # Set environment variables for optimal AMD mining
    export GPU_FORCE_64BIT_PTR=1
    export GPU_MAX_HEAP_SIZE=100
    export GPU_USE_SYNC_OBJECTS=1
    export GPU_MAX_ALLOC_PERCENT=100
    export GPU_SINGLE_ALLOC_PERCENT=100
    export HSA_ENABLE_SDMA=0
    
    log "AMD GPU environment variables set for optimal mining"
    return 0
}

# Check Intel GPUs
check_intel() {
    log "Checking for Intel GPUs..."
    
    # Check for Intel GPUs through device files
    if [ -d "/sys/class/drm" ]; then
        intel_cards=$(ls -l /sys/class/drm/card*/device/vendor | grep -i "0x8086" 2>/dev/null | wc -l)
        
        if [ ${intel_cards} -gt 0 ]; then
            log "Detected ${intel_cards} Intel GPU(s):"
            
            for card in $(ls -d /sys/class/drm/card*/device/ 2>/dev/null | grep -l "0x8086" -); do
                if [ -f "${card}/product_name" ]; then
                    name=$(cat "${card}/product_name" 2>/dev/null || echo "Unknown Intel GPU")
                    log "  ${name}"
                fi
            done
        else
            log "No Intel GPUs detected."
            return 1
        fi
    else
        log "No /sys/class/drm directory found. Cannot detect Intel GPUs."
        return 1
    fi
    
    # Set environment variables for optimal Intel mining
    export GPU_FORCE_64BIT_PTR=1
    export GPU_MAX_HEAP_SIZE=100
    export GPU_USE_SYNC_OBJECTS=1
    export GPU_MAX_ALLOC_PERCENT=100
    export GPU_SINGLE_ALLOC_PERCENT=100
    
    log "Intel GPU environment variables set for optimal mining"
    return 0
}

# Check OpenCL support
check_opencl() {
    log "Checking OpenCL support..."
    
    if command -v clinfo &> /dev/null; then
        opencl_devices=$(clinfo -l 2>/dev/null | grep -c "Device #")
        
        if [ ${opencl_devices} -gt 0 ]; then
            log "Detected ${opencl_devices} OpenCL device(s)"
            return 0
        else
            log "No OpenCL devices detected."
            return 1
        fi
    else
        log "clinfo not found. Cannot check OpenCL support."
        return 1
    fi
}

# Main function
main() {
    log "Starting GPU check..."
    
    # Check based on environment variables or try to detect automatically
    if [ "${USE_NVIDIA_GPU}" = "true" ]; then
        check_nvidia
        nvidia_result=$?
    elif [ "${USE_AMD_GPU}" = "true" ]; then
        check_amd
        amd_result=$?
    elif [ "${USE_INTEL_GPU}" = "true" ]; then
        check_intel
        intel_result=$?
    elif [ "${CPU_ONLY}" = "true" ]; then
        log "CPU-only mode selected. Skipping GPU detection."
        cpu_only=1
    else
        # Auto-detect GPUs
        log "Auto-detecting available GPUs..."
        check_nvidia
        nvidia_result=$?
        
        check_amd
        amd_result=$?
        
        check_intel
        intel_result=$?
    fi
    
    # Check OpenCL support if any GPU was detected
    if [ "${nvidia_result}" = "0" ] || [ "${amd_result}" = "0" ] || [ "${intel_result}" = "0" ]; then
        check_opencl
    fi
    
    # Check CPU information
    log "CPU Information:"
    cpu_info=$(grep "model name" /proc/cpuinfo | head -1)
    cpu_cores=$(grep -c ^processor /proc/cpuinfo)
    log "  ${cpu_info}"
    log "  Cores/Threads: ${cpu_cores}"
    
    log "GPU check completed"
}

# Execute main function
main
exit 0