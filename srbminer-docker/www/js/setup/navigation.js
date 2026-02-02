// setup/navigation.js - Step navigation and validation

import { setupState } from './state.js';
import { buildConfiguration } from './config.js';
import { api } from '../common/api.js';
import { showLoading, hideLoading } from '../common/utils.js';

// Go to previous step
export function goToPreviousStep() {
    if (setupState.currentStep > 1) {
        updateStep(setupState.currentStep - 1);
    }
}

// Go to next step
export function goToNextStep() {
    if (setupState.currentStep < setupState.totalSteps) {
        // Validate current step
        if (validateCurrentStep()) {
            updateStep(setupState.currentStep + 1);
        }
    }
}

// Update current step
export function updateStep(stepNumber) {
    // Hide current step
    document.querySelector(`.setup-step[data-step="${setupState.currentStep}"]`).classList.remove('active');
    document.querySelector(`.step[data-step="${setupState.currentStep}"]`).classList.remove('active');
    
    // Mark previous steps as completed
    if (stepNumber > setupState.currentStep) {
        document.querySelector(`.step[data-step="${setupState.currentStep}"]`).classList.add('completed');
    }
    
    // Update current step
    setupState.currentStep = stepNumber;
    
    // Show new step
    document.querySelector(`.setup-step[data-step="${stepNumber}"]`).classList.add('active');
    document.querySelector(`.step[data-step="${stepNumber}"]`).classList.add('active');
    
    // Update buttons
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const finishButton = document.getElementById('finish-button');
    
    prevButton.disabled = (stepNumber === 1);
    
    if (stepNumber === setupState.totalSteps - 1) {
        // Summary page
        nextButton.style.display = 'none';
        finishButton.style.display = 'block';
        updateSummary();
    } else if (stepNumber === setupState.totalSteps) {
        // Complete page
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        finishButton.style.display = 'none';
        startRedirectCountdown();
    } else {
        nextButton.style.display = 'block';
        finishButton.style.display = 'none';
    }
}

// Validate current step
function validateCurrentStep() {
    switch (setupState.currentStep) {
        case 1: // Welcome
            return true;
            
        case 2: // Hardware
            // Check if at least one hardware type is selected
            const hasHardware = setupState.selectedHardware.cpu || 
                              setupState.selectedHardware.nvidia_gpus.length > 0 || 
                              setupState.selectedHardware.amd_gpus.length > 0 || 
                              setupState.selectedHardware.intel_gpus.length > 0;
            
            if (!hasHardware) {
                alert('Please select at least one hardware device for mining.');
                return false;
            }
            return true;
            
        case 3: // Algorithm
            if (!setupState.selectedAlgorithm) {
                alert('Please select a mining algorithm.');
                return false;
            }
            return true;
            
        case 4: // Pool & Wallet
            // Validate wallet address
            const walletAddress = document.getElementById('wallet-address').value.trim();
            if (!walletAddress) {
                alert('Please enter your wallet address.');
                return false;
            }
            
            // Validate pool
            const pool = setupState.selectedPool || document.getElementById('custom-pool-url').value.trim();
            if (!pool) {
                alert('Please select a mining pool or enter a custom pool URL.');
                return false;
            }
            
            // Update state
            setupState.walletAddress = walletAddress;
            setupState.workerName = document.getElementById('worker-name').value.trim() || 'srbminer-docker';
            
            if (!setupState.selectedPool) {
                setupState.customPool = document.getElementById('custom-pool-url').value.trim();
            }
            
            return true;
            
        case 5: // Performance
            // Update performance settings
            setupState.intensity = parseInt(document.getElementById('intensity-slider').value);
            setupState.memoryTweak = parseInt(document.getElementById('memory-tweak').value);
            setupState.powerLimit = parseInt(document.getElementById('power-limit').value);
            setupState.autoTune = document.getElementById('auto-tune').checked;
            
            return true;
            
        case 6: // Summary
            return true;
            
        default:
            return true;
    }
}

// Update summary page
function updateSummary() {
    // Hardware summary
    let hardwareSummary = [];
    if (setupState.selectedHardware.cpu) {
        hardwareSummary.push('CPU');
    }
    if (setupState.selectedHardware.nvidia_gpus.length > 0) {
        hardwareSummary.push(`${setupState.selectedHardware.nvidia_gpus.length} NVIDIA GPU(s)`);
    }
    if (setupState.selectedHardware.amd_gpus.length > 0) {
        hardwareSummary.push(`${setupState.selectedHardware.amd_gpus.length} AMD GPU(s)`);
    }
    if (setupState.selectedHardware.intel_gpus.length > 0) {
        hardwareSummary.push(`${setupState.selectedHardware.intel_gpus.length} Intel GPU(s)`);
    }
    document.getElementById('summary-hardware').textContent = hardwareSummary.join(', ');
    
    // Algorithm summary
    document.getElementById('summary-algorithm').textContent = setupState.selectedAlgorithm ? setupState.selectedAlgorithm.display_name : '-';
    
    // Pool summary
    const poolUrl = setupState.selectedPool || setupState.customPool;
    document.getElementById('summary-pool').textContent = poolUrl || '-';
    
    // Wallet summary
    document.getElementById('summary-wallet').textContent = setupState.walletAddress || '-';
    
    // Worker summary
    document.getElementById('summary-worker').textContent = setupState.workerName || 'srbminer-docker';
    
    // Performance summary
    document.getElementById('summary-intensity').textContent = setupState.intensity;
    document.getElementById('summary-memory-tweak').textContent = setupState.memoryTweak;
    document.getElementById('summary-power-limit').textContent = setupState.powerLimit > 0 ? `${setupState.powerLimit}W` : 'No Limit';
    document.getElementById('summary-auto-tune').textContent = setupState.autoTune ? 'Enabled' : 'Disabled';
    
    // Add estimated performance from benchmark if available
    if (setupState.benchmarkResults) {
        const hashrateUnit = setupState.selectedAlgorithm.name === 'randomx' ? 'H/s' : 'MH/s';
        document.getElementById('summary-performance').textContent = 
            `${setupState.benchmarkResults.totalHashrate.toFixed(2)} ${hashrateUnit} @ ${setupState.benchmarkResults.totalPower.toFixed(0)}W`;
    } else {
        document.getElementById('summary-performance').textContent = 'Not benchmarked';
    }
}

// Complete setup and save configuration
export async function completeSetup() {
    // Show loading overlay
    showLoading('Saving configuration and restarting miner...');
    
    // Build configuration object
    const config = buildConfiguration();
    
    try {
        // Save configuration
        const saveResult = await api.saveConfig(config);
        
        if (saveResult.success) {
            // Complete setup
            const completeResult = await api.completeSetup();
            
            if (completeResult.success) {
                // Hide loading overlay
                hideLoading();
                
                // Go to complete step
                updateStep(setupState.totalSteps);
            } else {
                throw new Error(completeResult.error || 'Failed to complete setup');
            }
        } else {
            throw new Error(saveResult.error || 'Failed to save configuration');
        }
    } catch (error) {
        console.error('Error completing setup:', error);
        hideLoading();
        alert(`Error: ${error.message || 'Failed to complete setup'}`);
    }
}

// Start redirect countdown
function startRedirectCountdown() {
    let countdown = 10;
    const countdownElement = document.getElementById('redirect-countdown');
    
    const interval = setInterval(() => {
        countdown--;
        countdownElement.textContent = `Redirecting in ${countdown} seconds...`;
        
        if (countdown <= 0) {
            clearInterval(interval);
            window.location.href = '/';
        }
    }, 1000);
}