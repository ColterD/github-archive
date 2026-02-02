// dashboard/settings.js - Settings management

import { showAlert } from '../common/utils.js';
import { fetchDashboardData, startAutoRefresh } from './main.js';

// Open settings modal
export function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Load current settings into form
    loadCurrentSettings();
    
    // Show modal
    modal.style.display = 'block';
}

// Load current settings into form
function loadCurrentSettings() {
    // Refresh interval
    const refreshIntervalInput = document.getElementById('refresh-interval');
    if (refreshIntervalInput) {
        refreshIntervalInput.value = localStorage.getItem('refreshInterval') || '30';
    }
    
    // Log lines
    const logLinesInput = document.getElementById('log-lines');
    if (logLinesInput) {
        logLinesInput.value = localStorage.getItem('logLines') || '100';
    }
    
    // Enable charts
    const enableChartsCheckbox = document.getElementById('enable-charts');
    if (enableChartsCheckbox) {
        enableChartsCheckbox.checked = localStorage.getItem('enableCharts') !== 'false';
    }
    
    // Theme
    const themeOptions = document.querySelectorAll('.theme-option');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    themeOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.theme === currentTheme);
        
        // Add click event listener
        option.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// Save settings
export function saveSettings() {
    // Get settings values
    const refreshInterval = document.getElementById('refresh-interval')?.value || '30';
    const logLines = document.getElementById('log-lines')?.value || '100';
    const enableCharts = document.getElementById('enable-charts')?.checked ?? true;
    
    // Get selected theme
    const selectedThemeOption = document.querySelector('.theme-option.selected');
    const theme = selectedThemeOption?.dataset.theme || 'dark';
    
    // Save to localStorage
    localStorage.setItem('refreshInterval', refreshInterval);
    localStorage.setItem('logLines', logLines);
    localStorage.setItem('enableCharts', enableCharts);
    localStorage.setItem('theme', theme);
    
    // Apply theme
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    
    // Update theme toggle checkbox
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = theme === 'dark';
    }
    
    // Dispatch theme change event
    window.dispatchEvent(new Event('themechange'));
    
    // Update refresh interval
    startAutoRefresh(parseInt(refreshInterval) * 1000);
    
    // Close modal
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Show success message
    showAlert('Settings saved successfully', 'success');
    
    // Refresh dashboard to apply new settings
    fetchDashboardData();
}