// setup/pools.js - Pool recommendations and selection

import { setupState } from './state.js';

// Render pool recommendations
export function renderPoolRecommendations() {
    const poolContainer = document.getElementById('pool-recommendations');
    poolContainer.innerHTML = '';
    
    if (!setupState.selectedAlgorithm) return;
    
    // Find pools for the selected algorithm
    const recommendedPools = setupState.hardwareData.recommended_pools.find(p => 
        p.algorithm === setupState.selectedAlgorithm.name
    );
    
    if (recommendedPools && recommendedPools.pools.length > 0) {
        const poolSelect = document.createElement('div');
        poolSelect.className = 'pool-select';
        
        recommendedPools.pools.forEach((pool, index) => {
            const poolOption = document.createElement('div');
            poolOption.className = 'pool-option';
            poolOption.dataset.url = pool.url;
            
            poolOption.innerHTML = `
                <input type="radio" name="pool" class="pool-radio" id="pool-${index}" ${index === 0 ? 'checked' : ''}>
                <div class="pool-info">
                    <div class="pool-name">${pool.name}</div>
                    <div class="pool-url">${pool.url}</div>
                    <div class="pool-notes">${pool.notes}</div>
                </div>
            `;
            
            poolSelect.appendChild(poolOption);
            
            // Add event listener
            poolOption.addEventListener('click', () => {
                // Check the radio button
                const radio = poolOption.querySelector('.pool-radio');
                radio.checked = true;
                
                // Update selected pool
                document.querySelectorAll('.pool-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                poolOption.classList.add('selected');
                
                setupState.selectedPool = pool.url;
                document.getElementById('custom-pool-url').value = '';
            });
            
            // Select first pool by default
            if (index === 0) {
                poolOption.classList.add('selected');
                setupState.selectedPool = pool.url;
            }
        });
        
        poolContainer.appendChild(poolSelect);
    } else {
        poolContainer.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> No recommended pools found for this algorithm. Please enter a custom pool URL.</div>';
    }
    
    // Set up custom pool input
    const customPoolInput = document.getElementById('custom-pool-url');
    customPoolInput.addEventListener('input', () => {
        setupState.customPool = customPoolInput.value;
        if (customPoolInput.value) {
            // Deselect all pool options
            document.querySelectorAll('.pool-option').forEach(opt => {
                opt.classList.remove('selected');
                const radio = opt.querySelector('.pool-radio');
                if (radio) radio.checked = false;
            });
            setupState.selectedPool = null;
        }
    });
}