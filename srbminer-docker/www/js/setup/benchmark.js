// setup/benchmark.js - Benchmarking functionality

import { setupState } from './state.js';
import { renderPerformanceRecommendations } from './performance.js';

// Run benchmark
export function runBenchmark() {
    if (!setupState.selectedAlgorithm) {
        alert('Please select an algorithm before benchmarking');
        return;
    }
    
    // Show benchmark overlay
    const benchmarkOverlay = document.createElement('div');
    benchmarkOverlay.className = 'benchmark-overlay';
    benchmarkOverlay.innerHTML = `
        <div class="benchmark-content">
            <h2><i class="fas fa-tachometer-alt"></i> Running Benchmark</h2>
            <p>Testing mining performance with selected settings for ${setupState.selectedAlgorithm.display_name}...</p>
            <div class="benchmark-progress">
                <div class="benchmark-bar"></div>
            </div>
            <div class="benchmark-status">Initializing...</div>
        </div>
    `;
    document.body.appendChild(benchmarkOverlay);
    
    // Simulate benchmark progress (in a real implementation, this would call the miner API)
    let progress = 0;
    const progressBar = benchmarkOverlay.querySelector('.benchmark-bar');
    const statusText = benchmarkOverlay.querySelector('.benchmark-status');
    
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress <= 20) {
            statusText.textContent = `Initializing ${setupState.selectedAlgorithm.display_name} benchmark...`;
        } else if (progress <= 60) {
            statusText.textContent = `Testing mining performance...`;
        } else if (progress <= 90) {
            statusText.textContent = `Analyzing results...`;
        } else {
            statusText.textContent = `Generating recommendations...`;
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Generate benchmark results
            generateBenchmarkResults();
            
            // Display benchmark results
            displayBenchmarkResults();
            
            // Remove the overlay after displaying results
            setTimeout(() => {
                document.body.removeChild(benchmarkOverlay);
            }, 1000);
        }
    }, 300);
}

// Generate benchmark results
function generateBenchmarkResults() {
    setupState.benchmarkResults = {
        algorithm: setupState.selectedAlgorithm,
        devices: [],
        totalHashrate: 0,
        totalPower: 0,
        efficiency: 0,
        recommendedSettings: {}
    };
    
    // Generate results for selected GPUs
    if (setupState.selectedHardware.nvidia_gpus.length > 0) {
        setupState.selectedHardware.nvidia_gpus.forEach(index => {
            const gpu = setupState.hardwareData.nvidia_gpus[index];
            
            // Generate simulated hashrate based on GPU model and algorithm
            let hashrate = 0;
            let power = 0;
            
            // Extract GPU series (e.g., RTX 3080, GTX 1660, etc.)
            const nameMatch = gpu.name.match(/((RTX|GTX)\s*\d{3,4})/i);
            const gpuModel = nameMatch ? nameMatch[1] : gpu.name;
            
            // Calculate hashrate based on algorithm and GPU model
            if (setupState.selectedAlgorithm.name === 'ethash') {
                // Different hashrates for different models
                if (gpuModel.match(/3080/i)) hashrate = 95 + (Math.random() * 10 - 5);
                else if (gpuModel.match(/3070/i)) hashrate = 60 + (Math.random() * 6 - 3);
                else if (gpuModel.match(/3060/i)) hashrate = 45 + (Math.random() * 5 - 2.5);
                else if (gpuModel.match(/2080/i)) hashrate = 55 + (Math.random() * 5 - 2.5);
                else if (gpuModel.match(/2070/i)) hashrate = 40 + (Math.random() * 4 - 2);
                else if (gpuModel.match(/1660/i)) hashrate = 25 + (Math.random() * 3 - 1.5);
                else hashrate = 35 + (Math.random() * 10 - 5); // Generic fallback
                
                // Estimate power consumption
                power = hashrate * 2.2 + (Math.random() * 20 - 10);
            } else if (setupState.selectedAlgorithm.name === 'kawpow') {
                if (gpuModel.match(/3080/i)) hashrate = 36 + (Math.random() * 4 - 2);
                else if (gpuModel.match(/3070/i)) hashrate = 28 + (Math.random() * 3 - 1.5);
                else if (gpuModel.match(/3060/i)) hashrate = 20 + (Math.random() * 2 - 1);
                else if (gpuModel.match(/2080/i)) hashrate = 24 + (Math.random() * 2 - 1);
                else if (gpuModel.match(/2070/i)) hashrate = 18 + (Math.random() * 2 - 1);
                else if (gpuModel.match(/1660/i)) hashrate = 12 + (Math.random() * 1.5 - 0.75);
                else hashrate = 15 + (Math.random() * 5 - 2.5);
                
                power = hashrate * 5 + (Math.random() * 20 - 10);
            } else if (setupState.selectedAlgorithm.name === 'autolykos2') {
                if (gpuModel.match(/3080/i)) hashrate = 220 + (Math.random() * 20 - 10);
                else if (gpuModel.match(/3070/i)) hashrate = 160 + (Math.random() * 15 - 7.5);
                else if (gpuModel.match(/3060/i)) hashrate = 120 + (Math.random() * 10 - 5);
                else if (gpuModel.match(/2080/i)) hashrate = 140 + (Math.random() * 12 - 6);
                else if (gpuModel.match(/2070/i)) hashrate = 105 + (Math.random() * 10 - 5);
                else if (gpuModel.match(/1660/i)) hashrate = 65 + (Math.random() * 6 - 3);
                else hashrate = 100 + (Math.random() * 20 - 10);
                
                power = hashrate * 1.2 + (Math.random() * 20 - 10);
            } else {
                // Generic fallback
                hashrate = 100 + (Math.random() * 20 - 10);
                power = 150 + (Math.random() * 30 - 15);
            }
            
            // Calculate efficiency
            const efficiency = hashrate / power;
            
            setupState.benchmarkResults.devices.push({
                name: gpu.name,
                type: 'NVIDIA GPU',
                hashrate: hashrate.toFixed(2),
                power: power.toFixed(1),
                efficiency: efficiency.toFixed(4)
            });
            
            setupState.benchmarkResults.totalHashrate += hashrate;
            setupState.benchmarkResults.totalPower += power;
        });
    }
    
    // Generate results for selected AMD GPUs
    if (setupState.selectedHardware.amd_gpus.length > 0) {
        setupState.selectedHardware.amd_gpus.forEach(index => {
            const gpu = setupState.hardwareData.amd_gpus[index];
            
            // Similar hashrate generation logic for AMD GPUs
            let hashrate = 0;
            let power = 0;
            
            // Extract GPU series (e.g., RX 6800, RX 5700, etc.)
            const nameMatch = gpu.name.match(/(RX\s*\d{3,4})/i);
            const gpuModel = nameMatch ? nameMatch[1] : gpu.name;
            
            if (setupState.selectedAlgorithm.name === 'ethash') {
                if (gpuModel.match(/6800/i)) hashrate = 62 + (Math.random() * 6 - 3);
                else if (gpuModel.match(/6700/i)) hashrate = 47 + (Math.random() * 5 - 2.5);
                else if (gpuModel.match(/5700/i)) hashrate = 54 + (Math.random() * 5 - 2.5);
                else if (gpuModel.match(/5600/i)) hashrate = 40 + (Math.random() * 4 - 2);
                else if (gpuModel.match(/580/i)) hashrate = 30 + (Math.random() * 3 - 1.5);
                else hashrate = 40 + (Math.random() * 8 - 4);
                
                power = hashrate * 2 + (Math.random() * 15 - 7.5);
            } else if (setupState.selectedAlgorithm.name === 'kawpow') {
                if (gpuModel.match(/6800/i)) hashrate = 30 + (Math.random() * 3 - 1.5);
                else if (gpuModel.match(/6700/i)) hashrate = 24 + (Math.random() * 2.5 - 1.25);
                else if (gpuModel.match(/5700/i)) hashrate = 22 + (Math.random() * 2 - 1);
                else if (gpuModel.match(/5600/i)) hashrate = 16 + (Math.random() * 1.5 - 0.75);
                else if (gpuModel.match(/580/i)) hashrate = 12 + (Math.random() * 1 - 0.5);
                else hashrate = 18 + (Math.random() * 4 - 2);
                
                power = hashrate * 4 + (Math.random() * 15 - 7.5);
            } else {
                // Generic fallback
                hashrate = 80 + (Math.random() * 15 - 7.5);
                power = 130 + (Math.random() * 20 - 10);
            }
            
            // Calculate efficiency
            const efficiency = hashrate / power;
            
            setupState.benchmarkResults.devices.push({
                name: gpu.name,
                type: 'AMD GPU',
                hashrate: hashrate.toFixed(2),
                power: power.toFixed(1),
                efficiency: efficiency.toFixed(4)
            });
            
            setupState.benchmarkResults.totalHashrate += hashrate;
            setupState.benchmarkResults.totalPower += power;
        });
    }
    
    // Add CPU results if applicable
    if (setupState.selectedHardware.cpu && setupState.selectedAlgorithm.cpu_supported) {
        const cpu = setupState.hardwareData.cpu;
        
        // RandomX is primarily for CPUs
        let hashrate = 0;
        let power = 0;
        
        if (setupState.selectedAlgorithm.name === 'randomx') {
            // Calculate based on cores and AES support
            const baseHashrate = cpu.aes ? 550 : 350; // H/s per core
            hashrate = cpu.cores * baseHashrate * 0.8; // Assuming ~80% utilization
            power = cpu.cores * 15 + 40; // Base system power + per-core power
        } else {
            // CPUs are less efficient for other algorithms
            hashrate = cpu.cores * 100; // Very low hashrate for non-CPU algorithms
            power = cpu.cores * 20 + 40;
        }
        
        // Calculate efficiency
        const efficiency = hashrate / power;
        
        setupState.benchmarkResults.devices.push({
            name: cpu.model,
            type: 'CPU',
            hashrate: hashrate.toFixed(2),
            power: power.toFixed(1),
            efficiency: efficiency.toFixed(4)
        });
        
        setupState.benchmarkResults.totalHashrate += hashrate;
        setupState.benchmarkResults.totalPower += power;
    }
    
    // Calculate overall efficiency
    if (setupState.benchmarkResults.totalPower > 0) {
        setupState.benchmarkResults.efficiency = (setupState.benchmarkResults.totalHashrate / setupState.benchmarkResults.totalPower).toFixed(4);
    }
    
    // Generate recommended settings based on benchmark results
    setupState.benchmarkResults.recommendedSettings = {
        intensity: setupState.intensity,
        memoryTweak: setupState.memoryTweak,
        powerLimit: setupState.powerLimit
    };
    
    // Adjust intensity if temperatures would be too high
    if (setupState.benchmarkResults.totalPower > 600) {
        setupState.benchmarkResults.recommendedSettings.intensity = Math.max(setupState.intensity - 2, 16);
        setupState.benchmarkResults.recommendedSettings.powerLimit = 
            Math.max(setupState.benchmarkResults.totalPower * 0.8, setupState.powerLimit);
    }
    
    // Adjust memory tweak based on algorithm
    if (setupState.selectedAlgorithm.name === 'ethash') {
        // Ethash benefits more from memory tweaks
        setupState.benchmarkResults.recommendedSettings.memoryTweak = Math.min(setupState.memoryTweak + 1, 3);
    }
}

// Display benchmark results
function displayBenchmarkResults() {
    // Create modal for benchmark results
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'benchmark-results-modal';
    modal.style.display = 'block';
    
    // Generate HTML for results table
    let resultsHtml = '';
    setupState.benchmarkResults.devices.forEach(device => {
        resultsHtml += `
            <tr>
                <td>${device.name}</td>
                <td>${device.type}</td>
                <td>${device.hashrate} ${setupState.selectedAlgorithm.name === 'randomx' ? 'H/s' : 'MH/s'}</td>
                <td>${device.power} W</td>
                <td>${device.efficiency}</td>
            </tr>
        `;
    });
    
    // Add total row
    resultsHtml += `
        <tr style="font-weight: bold; border-top: 2px solid var(--primary-color);">
            <td colspan="2">Total</td>
            <td>${setupState.benchmarkResults.totalHashrate.toFixed(2)} ${setupState.selectedAlgorithm.name === 'randomx' ? 'H/s' : 'MH/s'}</td>
            <td>${setupState.benchmarkResults.totalPower.toFixed(1)} W</td>
            <td>${setupState.benchmarkResults.efficiency}</td>
        </tr>
    `;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-chart-bar"></i> Benchmark Results</h2>
                <span class="modal-close" id="close-benchmark-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>Algorithm: <strong>${setupState.selectedAlgorithm.display_name}</strong></p>
                <p>These are estimated performance metrics based on your hardware. Actual mining results may vary.</p>
                
                <table class="benchmark-table">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>Type</th>
                            <th>Hashrate</th>
                            <th>Power</th>
                            <th>Efficiency</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultsHtml}
                    </tbody>
                </table>
                
                <div class="benchmark-recommendations">
                    <h3>Recommendations</h3>
                    <p>Based on the benchmark results, we recommend the following optimizations:</p>
                    <ul>
                        <li>Intensity: <strong>${setupState.benchmarkResults.recommendedSettings.intensity}</strong> (balances performance and heat)</li>
                        <li>Memory Tweak: <strong>${setupState.benchmarkResults.recommendedSettings.memoryTweak}</strong> (optimizes memory timing)</li>
                        <li>Power Limit: <strong>${setupState.benchmarkResults.recommendedSettings.powerLimit > 0 ? setupState.benchmarkResults.recommendedSettings.powerLimit.toFixed(0) + 'W' : 'No limit'}</strong></li>
                    </ul>
                </div>
                
                <div style="margin-top: 20px; font-size: 14px; opacity: 0.7;">
                    <p>Note: These estimations are based on typical performance for your hardware. Actual results will vary based on silicon quality, cooling solutions, and other factors.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button id="apply-benchmark" class="button">
                    <i class="fas fa-check"></i> Apply Recommended Settings
                </button>
                <button id="cancel-benchmark" class="button button-secondary">
                    <i class="fas fa-times"></i> Keep Current Settings
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('close-benchmark-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('apply-benchmark').addEventListener('click', () => {
        // Apply recommended settings
        setupState.intensity = setupState.benchmarkResults.recommendedSettings.intensity;
        setupState.memoryTweak = setupState.benchmarkResults.recommendedSettings.memoryTweak;
        setupState.powerLimit = setupState.benchmarkResults.recommendedSettings.powerLimit;
        
        // Update form values
        document.getElementById('intensity-slider').value = setupState.intensity;
        document.getElementById('intensity-value').textContent = setupState.intensity;
        document.getElementById('memory-tweak').value = setupState.memoryTweak;
        document.getElementById('power-limit').value = setupState.powerLimit;
        
        // Update performance recommendations
        renderPerformanceRecommendations();
        
        // Close modal
        document.body.removeChild(modal);
        
        // Show confirmation
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `<i class="fas fa-check-circle"></i> Recommended settings applied successfully!`;
        
        // Insert at the top of the performance step
        const performanceStep = document.querySelector('.setup-step[data-step="5"]');
        performanceStep.insertBefore(alert, performanceStep.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            performanceStep.removeChild(alert);
        }, 5000);
    });
    
    document.getElementById('cancel-benchmark').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}