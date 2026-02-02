// setup/main.js - Entry point for the setup wizard

// Import modules
import { setupState } from './state.js';
import { checkSetupStatus, fetchHardwareData } from './hardware.js';
import { renderAlgorithmOptions } from './algorithms.js';
import { runBenchmark } from './benchmark.js';
import { renderPerformanceRecommendations, updatePerformanceSettings } from './performance.js';
import { goToPreviousStep, goToNextStep, completeSetup } from './navigation.js';
import { renderPoolRecommendations } from './pools.js';
import { showLoading, hideLoading } from '../common/utils.js';

// Initialize setup wizard
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const finishButton = document.getElementById('finish-button');
    
    prevButton.addEventListener('click', goToPreviousStep);
    nextButton.addEventListener('click', goToNextStep);
    finishButton.addEventListener('click', completeSetup);
    
    // Set up intensity slider
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityValue = document.getElementById('intensity-value');
    
    intensitySlider.addEventListener('input', () => {
        intensityValue.textContent = intensitySlider.value;
        setupState.intensity = parseInt(intensitySlider.value);
    });
    
    // Set up worker name default
    document.getElementById('worker-name').value = setupState.workerName;
    
    // Set up dashboard redirect
    document.getElementById('go-to-dashboard').addEventListener('click', () => {
        window.location.href = '/';
    });

    // Set up optimization toggle buttons
    document.querySelectorAll('.optimization-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const contentId = this.closest('.optimization-container').querySelector('div[id$="-content"], div[id^="performance-"]').id;
            const content = document.getElementById(contentId);
            const toggleText = this.querySelector('span');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                this.querySelector('i').className = 'fas fa-chevron-up';
                toggleText.textContent = 'Hide Details';
            } else {
                content.style.display = 'none';
                this.querySelector('i').className = 'fas fa-chevron-down';
                toggleText.textContent = 'Show Details';
            }
        });
    });

    // Set up benchmark button
    document.getElementById('run-benchmark-button').addEventListener('click', runBenchmark);
    
    // Check setup status
    checkSetupStatus();
});

// Export main functions so they can be used by other modules
export {
    showLoading,
    hideLoading
};