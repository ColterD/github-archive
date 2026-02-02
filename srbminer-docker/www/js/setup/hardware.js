// setup/hardware.js - Hardware detection and recommendations

import { setupState, updateState } from './state.js';
import { renderAlgorithmOptions } from './algorithms.js';
import { api } from '../common/api.js';
import { showLoading, hideLoading } from '../common/utils.js';

// Check if setup is required
export async function checkSetupStatus() {
    try {
        const data = await api.getSetupStatus();
        
        if (!data.setup_required) {
            // If setup is not required, redirect to dashboard
            window.location.href = '/';
        } else {
            // Fetch hardware data
            fetchHardwareData();
        }
    } catch (error) {
        console.error('Error checking setup status:', error);
        // Continue with setup as a fallback
        fetchHardwareData();
    }
}

// Fetch hardware data from the API
export async function fetchHardwareData() {
    try {
        showLoading('Detecting hardware...');
        
        const hardwareData = await api.getHardwareInfo();
        updateState('hardwareData', hardwareData);
        
        // Generate recommendations based on hardware
        const recommendedSettings = getOptimizedSettings(hardwareData);
        updateState('recommendedSettings', recommendedSettings);
        
        // Render hardware options once data is loaded
        document.getElementById('hardware-loading').style.display = 'none';
        document.getElementById('hardware-results').style.display = 'block';
        
        renderHardwareOptions();
        renderHardwareRecommendations();
        renderAlgorithmOptions();
        
        hideLoading();
    } catch (error) {
        console.error('Error fetching hardware data:', error);
        document.getElementById('hardware-loading').style.display = 'none';
        document.getElementById('hardware-error').style.display = 'block';
        hideLoading();
    }
}

// Generate optimized settings based on hardware
export function getOptimizedSettings(hardwareData) {
    const recommendations = {
        algorithm: null,
        intensity: {},
        memoryTweak: {},
        powerLimit: {},
        cpuThreads: 0
    };
    
    // Determine best algorithm based on available hardware
    if (hardwareData.nvidia_gpus.length > 0) {
        // NVIDIA GPUs excel at certain algorithms
        const totalVram = hardwareData.nvidia_gpus.reduce((sum, gpu) => sum + (gpu.memory_mb || 0), 0);
        
        if (totalVram > 6 * 1024) { // More than 6GB VRAM total
            recommendations.algorithm = "autolykos2"; // Good for high VRAM NVIDIA cards
        } else {
            recommendations.algorithm = "kawpow"; // Better for lower VRAM NVIDIA cards
        }
        
        // Set per-GPU recommendations based on model
        hardwareData.nvidia_gpus.forEach((gpu, index) => {
            // Extract GPU series from name (e.g., "RTX 3080" -> "3080")
            const nameMatch = gpu.name.match(/(GTX|RTX)\s*(\d{4})/i);
            const series = nameMatch ? nameMatch[2] : null;
            
            // Set optimized intensity based on GPU model
            if (series) {
                const seriesNum = parseInt(series);
                if (seriesNum >= 3000) {
                    // RTX 30 series
                    recommendations.intensity[index] = 23;
                    recommendations.memoryTweak[index] = 2;
                    recommendations.powerLimit[index] = Math.min(Math.floor((gpu.memory_mb || 8000) / 1024) * 30, 150); // Estimate based on VRAM
                } else if (seriesNum >= 2000) {
                    // RTX 20 series
                    recommendations.intensity[index] = 21;
                    recommendations.memoryTweak[index] = 1;
                    recommendations.powerLimit[index] = Math.min(Math.floor((gpu.memory_mb || 6000) / 1024) * 25, 130);
                } else {
                    // GTX 10 series and older
                    recommendations.intensity[index] = 20;
                    recommendations.memoryTweak[index] = 0;
                    recommendations.powerLimit[index] = Math.min(Math.floor((gpu.memory_mb || 4000) / 1024) * 20, 120);
                }
            } else {
                // Generic fallback if we can't determine the series
                recommendations.intensity[index] = 21;
                recommendations.memoryTweak[index] = 0;
                recommendations.powerLimit[index] = 0; // Let user set manually
            }
        });
    } else if (hardwareData.amd_gpus.length > 0) {
        // AMD GPUs often perform well on these algorithms
        recommendations.algorithm = "ethash";
        
        // Set per-GPU recommendations
        hardwareData.amd_gpus.forEach((gpu, index) => {
            // Try to detect AMD series (RX 5700, RX 6800, etc.)
            const nameMatch = gpu.name.match(/RX\s*(\d{3,4})/i);
            const series = nameMatch ? nameMatch[1] : null;
            
            if (series) {
                const seriesNum = parseInt(series);
                if (seriesNum >= 6000) {
                    // RX 6000 series
                    recommendations.intensity[index] = 22;
                    recommendations.memoryTweak[index] = 2;
                    recommendations.powerLimit[index] = 130;
                } else if (seriesNum >= 5000) {
                    // RX 5000 series
                    recommendations.intensity[index] = 21;
                    recommendations.memoryTweak[index] = 2;
                    recommendations.powerLimit[index] = 120;
                } else {
                    // Older RX series
                    recommendations.intensity[index] = 20;
                    recommendations.memoryTweak[index] = 1;
                    recommendations.powerLimit[index] = 100;
                }
            } else {
                // Fallback
                recommendations.intensity[index] = 20;
                recommendations.memoryTweak[index] = 0;
                recommendations.powerLimit[index] = 0;
            }
        });
    } else if (hardwareData.cpu && hardwareData.cpu.cores > 4) {
        // If only CPU available with decent core count, RandomX is best
        recommendations.algorithm = "randomx";
        
        // Calculate optimal CPU threads (typically n-1 cores for best performance)
        const optimalThreads = Math.max(1, hardwareData.cpu.cores - 1);
        recommendations.cpuThreads = hardwareData.cpu.aes ? optimalThreads : Math.floor(optimalThreads / 2);
    } else {
        // Fallback for any hardware configuration
        recommendations.algorithm = "randomx";
        recommendations.cpuThreads = Math.max(1, Math.floor((hardwareData.cpu?.cores || 2) / 2));
    }
    
    return recommendations;
}

// Render hardware options
export function renderHardwareOptions() {
    const hardwareGrid = document.getElementById('hardware-grid');
    hardwareGrid.innerHTML = '';
    
    // CPU Card
    if (setupState.hardwareData.cpu) {
        const cpuCard = document.createElement('div');
        cpuCard.className = 'hardware-card';
        cpuCard.dataset.type = 'cpu';
        
        // Is CPU optimal for mining?
        const isCpuOptimal = setupState.recommendedSettings.algorithm === 'randomx';
        
        cpuCard.innerHTML = `
            <input type="checkbox" class="selection-checkbox" id="select-cpu">
            <div class="hardware-type">CPU</div>
            <div class="hardware-name">${setupState.hardwareData.cpu.model}</div>
            <div class="hardware-details">
                <div>${setupState.hardwareData.cpu.cores} Cores</div>
                <div>${setupState.hardwareData.cpu.memory_gb}GB RAM</div>
                <div>AES-NI: ${setupState.hardwareData.cpu.aes ? 'Yes' : 'No'}</div>
            </div>
            <div class="hardware-compatibility">
                <div class="compatibility-item ${isCpuOptimal ? 'optimal' : ''}">
                    ${isCpuOptimal ? 'Optimal for RandomX' : 'Suitable for CPU mining'}
                </div>
            </div>
        `;
        
        hardwareGrid.appendChild(cpuCard);
        
        // Add event listener
        const checkbox = cpuCard.querySelector('.selection-checkbox');
        checkbox.addEventListener('change', () => {
            setupState.selectedHardware.cpu = checkbox.checked;
            cpuCard.classList.toggle('selected', checkbox.checked);
            
            // Update algorithm recommendations when hardware selection changes
            renderAlgorithmOptions();
        });
        
        // Set default for CPU based on algorithm compatibility
        if (setupState.hardwareData.cpu.aes) {
            checkbox.checked = true;
            setupState.selectedHardware.cpu = true;
            cpuCard.classList.add('selected');
        }
    }
    
    // NVIDIA GPUs
    setupState.hardwareData.nvidia_gpus.forEach((gpu, index) => {
        const gpuCard = document.createElement('div');
        gpuCard.className = 'hardware-card';
        gpuCard.dataset.type = 'nvidia';
        gpuCard.dataset.index = index;
        
        // Determine optimal algorithms for this GPU
        let optimalAlgo = '';
        let compatibilityClass = '';
        
        // Check VRAM size for algorithm compatibility
        const vramGB = (gpu.memory_mb || 0) / 1024;
        
        if (vramGB >= 8) {
            optimalAlgo = 'Optimal for Autolykos2';
            compatibilityClass = 'optimal';
        } else if (vramGB >= 4) {
            optimalAlgo = 'Good for KawPoW';
            compatibilityClass = 'good';
        } else {
            optimalAlgo = 'Limited by VRAM size';
            compatibilityClass = '';
        }
        
        gpuCard.innerHTML = `
            <input type="checkbox" class="selection-checkbox" id="select-nvidia-${index}">
            <div class="hardware-type">NVIDIA GPU</div>
            <div class="hardware-name">${gpu.name}</div>
            <div class="hardware-details">
                <div>${gpu.memory_mb ? (gpu.memory_mb / 1024).toFixed(1) + 'GB VRAM' : ''}</div>
                <div>Driver: ${gpu.driver || 'Unknown'}</div>
            </div>
            <div class="hardware-compatibility">
                <div class="compatibility-item ${compatibilityClass}">
                    ${optimalAlgo}
                </div>
            </div>
        `;
        
        hardwareGrid.appendChild(gpuCard);
        
        // Add event listener
        const checkbox = gpuCard.querySelector('.selection-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                setupState.selectedHardware.nvidia_gpus.push(index);
            } else {
                setupState.selectedHardware.nvidia_gpus = setupState.selectedHardware.nvidia_gpus.filter(i => i !== index);
            }
            gpuCard.classList.toggle('selected', checkbox.checked);
            
            // Update algorithm recommendations when hardware selection changes
            renderAlgorithmOptions();
        });
        
        // Set default for NVIDIA GPUs (select by default)
        checkbox.checked = true;
        setupState.selectedHardware.nvidia_gpus.push(index);
        gpuCard.classList.add('selected');
    });
    
    // AMD GPUs
    setupState.hardwareData.amd_gpus.forEach((gpu, index) => {
        const gpuCard = document.createElement('div');
        gpuCard.className = 'hardware-card';
        gpuCard.dataset.type = 'amd';
        gpuCard.dataset.index = index;
        
        // Determine AMD GPU compatibility
        const gpuName = gpu.name.toLowerCase();
        let compatibilityInfo = '';
        let compatibilityClass = '';
        
        if (gpuName.includes('rx 6') || gpuName.includes('rx6')) {
            compatibilityInfo = 'Optimal for Ethash';
            compatibilityClass = 'optimal';
        } else if (gpuName.includes('rx 5') || gpuName.includes('rx5')) {
            compatibilityInfo = 'Good for Ethash';
            compatibilityClass = 'good';
        } else {
            compatibilityInfo = 'Compatible with multiple algorithms';
            compatibilityClass = '';
        }
        
        gpuCard.innerHTML = `
            <input type="checkbox" class="selection-checkbox" id="select-amd-${index}">
            <div class="hardware-type">AMD GPU</div>
            <div class="hardware-name">${gpu.name}</div>
            <div class="hardware-details">
                <div>${gpu.memory_mb ? (gpu.memory_mb / 1024).toFixed(1) + 'GB VRAM' : ''}</div>
                <div>Device ID: ${gpu.device_id || 'Unknown'}</div>
            </div>
            <div class="hardware-compatibility">
                <div class="compatibility-item ${compatibilityClass}">
                    ${compatibilityInfo}
                </div>
            </div>
        `;
        
        hardwareGrid.appendChild(gpuCard);
        
        // Add event listener
        const checkbox = gpuCard.querySelector('.selection-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                setupState.selectedHardware.amd_gpus.push(index);
            } else {
                setupState.selectedHardware.amd_gpus = setupState.selectedHardware.amd_gpus.filter(i => i !== index);
            }
            gpuCard.classList.toggle('selected', checkbox.checked);
            
            // Update algorithm recommendations when hardware selection changes
            renderAlgorithmOptions();
        });
        
        // Set default for AMD GPUs (select by default)
        checkbox.checked = true;
        setupState.selectedHardware.amd_gpus.push(index);
        gpuCard.classList.add('selected');
    });
    
    // Intel GPUs
    setupState.hardwareData.intel_gpus.forEach((gpu, index) => {
        const gpuCard = document.createElement('div');
        gpuCard.className = 'hardware-card';
        gpuCard.dataset.type = 'intel';
        gpuCard.dataset.index = index;
        
        gpuCard.innerHTML = `
            <input type="checkbox" class="selection-checkbox" id="select-intel-${index}">
            <div class="hardware-type">Intel GPU</div>
            <div class="hardware-name">${gpu.name}</div>
            <div class="hardware-details">
                <div>Device ID: ${gpu.device_id || 'Unknown'}</div>
            </div>
            <div class="hardware-compatibility">
                <div class="compatibility-item">
                    Limited mining performance
                </div>
            </div>
        `;
        
        hardwareGrid.appendChild(gpuCard);
        
        // Add event listener
        const checkbox = gpuCard.querySelector('.selection-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                setupState.selectedHardware.intel_gpus.push(index);
            } else {
                setupState.selectedHardware.intel_gpus = setupState.selectedHardware.intel_gpus.filter(i => i !== index);
            }
            gpuCard.classList.toggle('selected', checkbox.checked);
            
            // Update algorithm recommendations when hardware selection changes
            renderAlgorithmOptions();
        });
        
        // Set default for Intel GPUs (select by default)
        checkbox.checked = true;
        setupState.selectedHardware.intel_gpus.push(index);
        gpuCard.classList.add('selected');
    });
}

// Render hardware recommendations
export function renderHardwareRecommendations() {
    const recommendationsContainer = document.getElementById('hardware-recommendations');
    recommendationsContainer.innerHTML = '';
    
    // Create recommendation items based on detected hardware
    if (setupState.hardwareData.nvidia_gpus.length > 0) {
        const recommendationItem = document.createElement('div');
        recommendationItem.className = 'optimization-item';
        recommendationItem.innerHTML = `
            <div class="optimization-item-title">NVIDIA GPUs</div>
            <div class="optimization-value">${setupState.hardwareData.nvidia_gpus.length} Detected</div>
            <div class="optimization-description">
                Best algorithms: Autolykos2, KawPoW<br>
                Recommended intensity: 21-23
            </div>
        `;
        recommendationsContainer.appendChild(recommendationItem);
    }
    
    if (setupState.hardwareData.amd_gpus.length > 0) {
        const recommendationItem = document.createElement('div');
        recommendationItem.className = 'optimization-item';
        recommendationItem.innerHTML = `
            <div class="optimization-item-title">AMD GPUs</div>
            <div class="optimization-value">${setupState.hardwareData.amd_gpus.length} Detected</div>
            <div class="optimization-description">
                Best algorithms: Ethash, KawPoW<br>
                Recommended intensity: 20-22
            </div>
        `;
        recommendationsContainer.appendChild(recommendationItem);
    }
    
    if (setupState.hardwareData.intel_gpus.length > 0) {
        const recommendationItem = document.createElement('div');
        recommendationItem.className = 'optimization-item';
        recommendationItem.innerHTML = `
            <div class="optimization-item-title">Intel GPUs</div>
            <div class="optimization-value">${setupState.hardwareData.intel_gpus.length} Detected</div>
            <div class="optimization-description">
                Limited mining capabilities<br>
                Recommended intensity: 18-20
            </div>
        `;
        recommendationsContainer.appendChild(recommendationItem);
    }
    
    if (setupState.hardwareData.cpu) {
        const cpuItem = document.createElement('div');
        cpuItem.className = 'optimization-item';
        const aesSupport = setupState.hardwareData.cpu.aes ? 'Supported (optimal)' : 'Not supported';
        
        cpuItem.innerHTML = `
            <div class="optimization-item-title">CPU Mining</div>
            <div class="optimization-value">${setupState.hardwareData.cpu.cores} Cores</div>
            <div class="optimization-description">
                Best algorithm: RandomX<br>
                AES-NI: ${aesSupport}<br>
                Optimal threads: ${setupState.recommendedSettings.cpuThreads}
            </div>
        `;
        recommendationsContainer.appendChild(cpuItem);
    }
    
    // Add general optimization tips
    const tipsItem = document.createElement('div');
    tipsItem.className = 'optimization-item';
    tipsItem.innerHTML = `
        <div class="optimization-item-title">Optimization Tips</div>
        <div class="optimization-description">
            • Use GPUs for better performance than CPU<br>
            • Enable memory tweaking for 5-15% more hashrate<br>
            • Monitor temperatures and adjust intensity accordingly
        </div>
    `;
    recommendationsContainer.appendChild(tipsItem);
}