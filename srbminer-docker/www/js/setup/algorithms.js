// setup/algorithms.js - Algorithm selection and compatibility

import { setupState } from './state.js';
import { renderPoolRecommendations } from './pools.js';
import { updatePerformanceSettings } from './performance.js';

// Render algorithm options
export function renderAlgorithmOptions() {
    const algorithmGrid = document.getElementById('algorithm-grid');
    algorithmGrid.innerHTML = '';
    
    // Filter algorithms based on selected hardware
    const suitableAlgorithms = setupState.hardwareData.algorithms.filter(algo => {
        const hasCpu = setupState.selectedHardware.cpu && algo.cpu_supported;
        const hasNvidia = setupState.selectedHardware.nvidia_gpus.length > 0 && algo.nvidia_supported;
        const hasAmd = setupState.selectedHardware.amd_gpus.length > 0 && algo.amd_supported;
        const hasIntel = setupState.selectedHardware.intel_gpus.length > 0 && algo.intel_supported;
        
        return hasCpu || hasNvidia || hasAmd || hasIntel;
    });
    
    // Render algorithm cards
    suitableAlgorithms.forEach(algo => {
        const algoCard = document.createElement('div');
        algoCard.className = 'algorithm-card';
        algoCard.dataset.algorithm = algo.name;
        
        const cpuSupport = setupState.selectedHardware.cpu && algo.cpu_supported;
        const nvidiaSupport = setupState.selectedHardware.nvidia_gpus.length > 0 && algo.nvidia_supported;
        const amdSupport = setupState.selectedHardware.amd_gpus.length > 0 && algo.amd_supported;
        const intelSupport = setupState.selectedHardware.intel_gpus.length > 0 && algo.intel_supported;
        
        // Check if this is the recommended algorithm
        const isRecommended = algo.name === setupState.recommendedSettings.algorithm;
        
        // Generate performance estimate for this algorithm
        let hashrate = '';
        let heatLevel = '';
        let profitability = '';
        
        if (algo.name === 'ethash') {
            hashrate = setupState.selectedHardware.nvidia_gpus.length * 40 + setupState.selectedHardware.amd_gpus.length * 45 + 'MH/s';
            heatLevel = 'Medium';
            profitability = 'High';
        } else if (algo.name === 'randomx') {
            hashrate = setupState.selectedHardware.cpu ? setupState.hardwareData.cpu.cores * 500 + 'H/s' : 'Low';
            heatLevel = 'Low';
            profitability = 'Medium';
        } else if (algo.name === 'kawpow') {
            hashrate = setupState.selectedHardware.nvidia_gpus.length * 15 + setupState.selectedHardware.amd_gpus.length * 18 + 'MH/s';
            heatLevel = 'High';
            profitability = 'Medium';
        } else if (algo.name === 'autolykos2') {
            hashrate = setupState.selectedHardware.nvidia_gpus.length * 120 + setupState.selectedHardware.amd_gpus.length * 110 + 'MH/s';
            heatLevel = 'Medium';
            profitability = 'High';
        }
        
        algoCard.innerHTML = `
            ${isRecommended ? '<div class="recommended-badge">Recommended</div>' : ''}
            <div class="algorithm-name">
                ${algo.display_name}
                <span class="algorithm-badge">${algo.dev_fee}% Fee</span>
            </div>
            <div class="algorithm-description">${algo.description}</div>
            <div class="algorithm-compatibility">
                <span class="compatibility-badge ${cpuSupport ? 'supported' : ''}">CPU</span>
                <span class="compatibility-badge ${nvidiaSupport ? 'supported' : ''}">NVIDIA</span>
                <span class="compatibility-badge ${amdSupport ? 'supported' : ''}">AMD</span>
                <span class="compatibility-badge ${intelSupport ? 'supported' : ''}">Intel</span>
            </div>
            <div>Difficulty: ${algo.difficulty}</div>
            <div class="algorithm-performance">
                <div class="algorithm-performance-item">
                    <div class="performance-label">Est. Hashrate</div>
                    <div class="performance-value">${hashrate}</div>
                </div>
                <div class="algorithm-performance-item">
                    <div class="performance-label">Heat Level</div>
                    <div class="performance-value">${heatLevel}</div>
                </div>
                <div class="algorithm-performance-item">
                    <div class="performance-label">Profitability</div>
                    <div class="performance-value">${profitability}</div>
                </div>
            </div>
        `;
        
        algorithmGrid.appendChild(algoCard);
        
        // Add event listener
        algoCard.addEventListener('click', () => {
            // Deselect all algorithm cards
            document.querySelectorAll('.algorithm-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Select this algorithm
            algoCard.classList.add('selected');
            setupState.selectedAlgorithm = algo;
            
            // Update pool recommendations based on selected algorithm
            renderPoolRecommendations();
            
            // Update performance settings based on selected algorithm
            updatePerformanceSettings(algo);
        });
        
        // Set recommended algorithm by default
        if (isRecommended && !setupState.selectedAlgorithm) {
            algoCard.classList.add('selected');
            setupState.selectedAlgorithm = algo;
        }
    });
    
    // If no algorithm is selected yet, select the first one
    if (!setupState.selectedAlgorithm && suitableAlgorithms.length > 0) {
        const firstCard = algorithmGrid.querySelector('.algorithm-card');
        if (firstCard) {
            firstCard.classList.add('selected');
            setupState.selectedAlgorithm = suitableAlgorithms[0];
            
            // Update performance settings for this algorithm
            updatePerformanceSettings(suitableAlgorithms[0]);
        }
    }
}