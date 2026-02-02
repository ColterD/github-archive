// setup/config.js - Configuration generation and saving

import { setupState } from './state.js';

// Build configuration object
export function buildConfiguration() {
    // Determine which GPUs to use
    let gpuThreads = [];
    
    // Helper function to create GPU thread config
    const createGpuThread = (index, gpuType) => {
        return {
            disabled: false,
            intensity: setupState.intensity,
            worksize: 0,
            gpu_id: index,
            algorithm: setupState.selectedAlgorithm.name,
            pool: setupState.selectedPool || setupState.customPool,
            wallet: setupState.walletAddress,
            password: "x",
            rig_id: `${setupState.workerName}-${gpuType}${index}`,
            pool_use_tls: false,
            nicehash: false,
            mem_tweak: setupState.memoryTweak,
            power_limit: setupState.powerLimit
        };
    };
    
    // Add NVIDIA GPUs
    setupState.selectedHardware.nvidia_gpus.forEach(index => {
        gpuThreads.push(createGpuThread(index, 'nvidia'));
    });
    
    // Add AMD GPUs
    setupState.selectedHardware.amd_gpus.forEach(index => {
        gpuThreads.push(createGpuThread(index, 'amd'));
    });
    
    // Add Intel GPUs
    setupState.selectedHardware.intel_gpus.forEach(index => {
        gpuThreads.push(createGpuThread(index, 'intel'));
    });
    
    // Build the complete configuration
    const config = {
        api: {
            enabled: true,
            port: 7000,
            ipv4_only: true,
            ipv6_disabled: true,
            password: ""
        },
        autoupdate: true,
        gpu_threads: gpuThreads,
        log_file: "/var/log/srbminer.log",
        log_level: 2,
        retry_time: 15,
        temperature_color: "normal",
        auto_tune: setupState.autoTune
    };
    
    // Add CPU configuration if selected
    if (setupState.selectedHardware.cpu) {
        // Use recommended thread count from benchmark if available
        let cpuThreads = setupState.hardwareData.cpu.recommended_threads || 2;
        
        if (setupState.benchmarkResults && setupState.recommendedSettings.cpuThreads) {
            cpuThreads = setupState.recommendedSettings.cpuThreads;
        }
        
        config.cpu_threads = cpuThreads;
    }
    
    // Add watchdog configuration
    config.watchdog = {
        disabled: false,
        max_usage_mb: 4096,
        reboot_script: "",
        restart_delay_sec: 20,
        restart_gpus_interval_sec: 60
    };
    
    return config;
}