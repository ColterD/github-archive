// dashboard/hardware.js - Hardware monitoring displays

import { getTempColorClass } from '../common/utils.js';

// Update hardware display
export function updateHardwareDisplay(data) {
    // Update GPU display
    updateGpuDisplay(data);
    
    // Update CPU display
    updateCpuDisplay(data);
}

// Update GPU display
function updateGpuDisplay(data) {
    const gpuContainer = document.getElementById('gpu-container');
    const noGpuMessage = document.getElementById('no-gpu-message');
    
    if (!gpuContainer || !noGpuMessage) return;
    
    // Clear existing GPU cards
    gpuContainer.innerHTML = '';
    
    if (data.gpus && data.gpus.length > 0) {
        // Hide no GPU message
        noGpuMessage.style.display = 'none';
        
        // Calculate total power and average temp
        let totalPower = 0;
        let totalTemp = 0;
        let gpuCount = 0;
        
        data.gpus.forEach((gpu, index) => {
            if (gpu.temperature !== undefined) {
                totalTemp += gpu.temperature;
                gpuCount++;
            }
            
            if (gpu.power !== undefined) {
                totalPower += gpu.power;
            }
            
            const gpuCard = document.createElement('div');
            gpuCard.className = 'gpu-card';
            
            gpuCard.innerHTML = `
                <div class="gpu-header">
                    <div class="gpu-name"><i class="fas fa-microchip"></i> GPU ${index}: ${gpu.name || 'Unknown'}</div>
                </div>
                
                <div class="gpu-stats">
                    <div class="gpu-stat">
                        <div class="gpu-stat-title">Hashrate</div>
                        <div class="gpu-stat-value">${formatHashrate(gpu.hashrate)}</div>
                    </div>
                    
                    <div class="gpu-stat">
                        <div class="gpu-stat-title">Temperature</div>
                        <div class="gpu-stat-value">${gpu.temperature !== undefined ? gpu.temperature + '°C' : 'N/A'}</div>
                        ${gpu.temperature !== undefined ? `
                            <div class="progress-bar">
                                <div class="progress-fill ${getTempColorClass(gpu.temperature)}" 
                                    style="width: ${Math.min(gpu.temperature, 100)}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="gpu-stat">
                        <div class="gpu-stat-title">Power</div>
                        <div class="gpu-stat-value">${gpu.power !== undefined ? gpu.power + 'W' : 'N/A'}</div>
                        ${gpu.power !== undefined ? `
                            <div class="progress-bar">
                                <div class="progress-fill gpu-power" 
                                    style="width: ${Math.min((gpu.power / 300) * 100, 100)}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="gpu-stat">
                        <div class="gpu-stat-title">Fan</div>
                        <div class="gpu-stat-value">${gpu.fan !== undefined ? gpu.fan + '%' : 'N/A'}</div>
                        ${gpu.fan !== undefined ? `
                            <div class="progress-bar">
                                <div class="progress-fill gpu-fan" 
                                    style="width: ${gpu.fan}%"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            gpuContainer.appendChild(gpuCard);
        });
        
        // Update average temperature
        const avgTempElement = document.getElementById('avg-temp');
        if (avgTempElement) {
            avgTempElement.textContent = gpuCount > 0 ? 
                Math.round(totalTemp / gpuCount) + '°C' : 'N/A';
        }
        
        // Update total power consumption
        const powerConsumptionElement = document.getElementById('power-consumption');
        if (powerConsumptionElement) {
            powerConsumptionElement.textContent = 
                totalPower > 0 ? totalPower + 'W' : 'N/A';
        }
    } else {
        // Show no GPU message
        noGpuMessage.style.display = 'block';
        
        // Clear temperature and power stats
        const avgTempElement = document.getElementById('avg-temp');
        if (avgTempElement) {
            avgTempElement.textContent = 'N/A';
        }
        
        const powerConsumptionElement = document.getElementById('power-consumption');
        if (powerConsumptionElement) {
            powerConsumptionElement.textContent = 'N/A';
        }
    }
}

// Update CPU display
function updateCpuDisplay(data) {
    const cpuContainer = document.getElementById('cpu-container');
    const noCpuMessage = document.getElementById('no-cpu-message');
    
    if (!cpuContainer || !noCpuMessage) return;
    
    if (data.cpu_mining) {
        // Hide no CPU message
        noCpuMessage.style.display = 'none';
        cpuContainer.style.display = 'block';
        
        // Update CPU stats
        const cpuEnabledElement = document.getElementById('cpu-enabled');
        if (cpuEnabledElement) {
            cpuEnabledElement.className = 'badge badge-success';
            cpuEnabledElement.textContent = 'Enabled';
        }
        
        // Hashrate
        const cpuHashrateElement = document.getElementById('cpu-hashrate');
        if (cpuHashrateElement) {
            cpuHashrateElement.textContent = formatHashrate(data.cpu_hashrate || 0);
        }
        
        // Threads
        const cpuThreadsElement = document.getElementById('cpu-threads');
        if (cpuThreadsElement) {
            cpuThreadsElement.textContent = data.cpu_threads || 0;
        }
        
        // CPU usage (if available)
        let cpuUsage = data.cpu_usage || 0;
        const cpuUsageElement = document.getElementById('cpu-usage');
        if (cpuUsageElement) {
            cpuUsageElement.textContent = cpuUsage + '%';
        }
        
        const cpuUsageBarElement = document.getElementById('cpu-usage-bar');
        if (cpuUsageBarElement) {
            cpuUsageBarElement.style.width = cpuUsage + '%';
        }
    } else {
        // Show no CPU message
        cpuContainer.style.display = 'none';
        noCpuMessage.style.display = 'block';
    }
}

// Format hashrate with appropriate units
function formatHashrate(hashrate) {
    if (hashrate === null || hashrate === undefined) return 'N/A';
    
    if (hashrate >= 1000000000) {
        return (hashrate / 1000000000).toFixed(2) + ' GH/s';
    } else if (hashrate >= 1000000) {
        return (hashrate / 1000000).toFixed(2) + ' MH/s';
    } else if (hashrate >= 1000) {
        return (hashrate / 1000).toFixed(2) + ' kH/s';
    } else {
        return hashrate.toFixed(2) + ' H/s';
    }
}