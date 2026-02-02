// dashboard/main.js - Main dashboard entry point

// Import required modules
import { initCharts, updateCharts } from './charts.js';
import { updateHardwareDisplay } from './hardware.js';
import { setupLogs, fetchLogs, toggleLogsAutoRefresh } from './logs.js';
import { openSettingsModal, saveSettings } from './settings.js';
import { api } from '../common/api.js';
import { showLoading, hideLoading, showAlert, formatHashrate, formatUptime } from '../common/utils.js';

// Global variables
let autoRefreshInterval;
let dashboardData = {
    running: false,
    hardware: {
        gpus: [],
        cpu: null
    },
    hashrates: {},
    temperatures: {},
    power: {}
};

// Initialize dashboard
export function initDashboard() {
    console.log('Initializing dashboard...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initializeTheme();
    
    // Initialize charts
    initCharts();
    
    // Set up logs functionality
    setupLogs();
    
    // Fetch initial data
    fetchDashboardData();
    
    // Set up auto-refresh with stored interval or default (30s)
    const refreshInterval = parseInt(localStorage.getItem('refreshInterval') || '30') * 1000;
    startAutoRefresh(refreshInterval);
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    
    // Refresh button
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchDashboardData);
    }
    
    // Config button
    const configButton = document.getElementById('config-button');
    if (configButton) {
        configButton.addEventListener('click', openSettingsModal);
    }
    
    // Stop button
    const stopButton = document.getElementById('stop-button');
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            document.getElementById('confirm-stop-modal').style.display = 'block';
        });
    }
    
    // Start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startMiner);
    }
    
    // Close modals
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(el => {
        el.addEventListener('click', () => {
            const modalId = el.dataset.modal || 'settings-modal';
            document.getElementById(modalId).style.display = 'none';
        });
    });
    
    // Save settings
    const saveSettingsButton = document.getElementById('save-settings');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveSettings);
    }
    
    // Confirm stop mining
    const confirmStopButton = document.getElementById('confirm-stop');
    if (confirmStopButton) {
        confirmStopButton.addEventListener('click', stopMiner);
    }
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activate selected tab
            tab.classList.add('active');
            const tabContent = document.getElementById(tab.dataset.tab);
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Special handling for performance tab to resize charts
                if (tab.dataset.tab === 'performance') {
                    window.dispatchEvent(new Event('resize'));
                }
            }
        });
    });
    
    // Setup wizard button
    const setupWizardButton = document.getElementById('setup-wizard-button');
    if (setupWizardButton) {
        setupWizardButton.addEventListener('click', () => {
            window.location.href = '/setup.html';
        });
    }
    
    // Check for updates
    const checkUpdatesButton = document.getElementById('check-updates-link');
    if (checkUpdatesButton) {
        checkUpdatesButton.addEventListener('click', checkForUpdates);
    }
}

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${savedTheme}-theme`);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
    
    // Select the correct theme option in settings modal
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.theme === savedTheme);
    });
}

// Toggle between light and dark theme
function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const isDarkTheme = themeToggle.checked;
    
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(isDarkTheme ? 'dark-theme' : 'light-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // Update charts for new theme
    window.dispatchEvent(new Event('resize'));
}

// Fetch dashboard data
async function fetchDashboardData() {
    showLoading('Fetching miner data...');
    
    try {
        // Get summary data from API
        const summaryData = await api.getSummary();
        
        // Update global dashboard data
        dashboardData = summaryData;
        
        // Update dashboard UI
        updateDashboard(summaryData);
        
        // Add data to charts
        updateCharts(summaryData);
        
        hideLoading();
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showAlert(`Error: ${error.message || 'Failed to fetch dashboard data'}`, 'error');
        
        // Check if we're in setup mode
        checkSetupMode();
        
        hideLoading();
    }
}

// Check if we're in setup mode
async function checkSetupMode() {
    try {
        const setupStatus = await api.getSetupStatus();
        
        if (setupStatus.setup_required) {
            showAlert('Miner is in setup mode. Redirecting to setup wizard...', 'warning');
            
            // Redirect to setup wizard
            setTimeout(() => {
                window.location.href = '/setup.html';
            }, 3000);
        }
    } catch (error) {
        console.error('Error checking setup status:', error);
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update status
    const statusElement = document.getElementById('miner-status');
    if (statusElement) {
        if (data.running) {
            statusElement.innerHTML = '<span class="status status-running"><i class="fas fa-play-circle"></i> Running</span>';
        } else {
            statusElement.innerHTML = '<span class="status status-stopped"><i class="fas fa-stop-circle"></i> Stopped</span>';
        }
    }
    
    // Check for setup mode
    if (data.setup_mode) {
        showAlert('Miner is in setup mode. Please complete the setup wizard.', 'warning');
        setTimeout(() => {
            window.location.href = '/setup.html';
        }, 3000);
        return;
    }
    
    // Update basic stats
    updateElement('total-hashrate', formatHashrate(data.hashrate_total));
    updateElement('algorithm', data.algorithm || 'N/A');
    updateElement('uptime', formatUptime(data.uptime));
    updateElement('version', data.version || 'N/A');
    updateElement('about-version', data.version || 'N/A');
    updateElement('pool', data.pool || 'N/A');
    updateElement('wallet', abbreviateWallet(data.wallet));
    updateElement('worker', data.rig_id || 'N/A');
    
    // Update shares if available
    if (data.accepted !== undefined) {
        const accepted = data.accepted || 0;
        const rejected = data.rejected || 0;
        const invalid = data.invalid || 0;
        updateElement('shares', `${accepted} / ${rejected} / ${invalid}`);
        
        // Also update CPU shares if CPU mining is enabled
        if (data.cpu_mining) {
            updateElement('cpu-shares', `${accepted} / ${rejected} / ${invalid}`);
        }
    }
    
    // Dev fee
    if (data.dev_fee !== undefined) {
        updateElement('dev-fee', `${data.dev_fee}%`);
    }
    
    // Update GPU and CPU displays
    updateHardwareDisplay(data);
}

// Helper to safely update element text
function updateElement(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Abbreviate wallet address
function abbreviateWallet(wallet) {
    if (!wallet || wallet === 'YOUR_WALLET_ADDRESS') return 'Not set';
    
    return wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4);
}

// Start auto-refresh interval
function startAutoRefresh(interval) {
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set new interval
    autoRefreshInterval = setInterval(fetchDashboardData, interval);
    console.log(`Auto-refresh set to ${interval/1000} seconds`);
}

// Stop miner
async function stopMiner() {
    showLoading('Stopping miner...');
    
    try {
        const result = await api.stopMiner();
        
        hideLoading();
        if (result.success) {
            showAlert('Miner stopped successfully', 'success');
            document.getElementById('confirm-stop-modal').style.display = 'none';
            
            // Refresh dashboard data
            setTimeout(fetchDashboardData, 1000);
        } else {
            showAlert(`Failed to stop miner: ${result.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        hideLoading();
        showAlert(`Error stopping miner: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Start miner
async function startMiner() {
    showLoading('Starting miner...');
    
    try {
        const result = await api.restartMiner();
        
        hideLoading();
        if (result.success) {
            showAlert('Miner started successfully', 'success');
            
            // Refresh dashboard data
            setTimeout(fetchDashboardData, 1000);
        } else {
            showAlert(`Failed to start miner: ${result.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        hideLoading();
        showAlert(`Error starting miner: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Check for updates
async function checkForUpdates() {
    showLoading('Checking for updates...');
    
    try {
        // This is a stub - you would need to implement an API endpoint for this
        const updateCheck = await fetch('/api/update/check', { method: 'POST' });
        const updateResult = await updateCheck.json();
        
        hideLoading();
        if (updateResult.updateAvailable) {
            showAlert(`Update available: version ${updateResult.latestVersion}. Installing update...`, 'info');
            
            // Install update
            const installResult = await fetch('/api/update/install', { method: 'POST' });
            const installData = await installResult.json();
            
            if (installData.success) {
                showAlert('Update installed successfully. Restarting miner...', 'success');
                
                // Restart miner
                await api.restartMiner();
                
                // Refresh dashboard after delay
                setTimeout(fetchDashboardData, 3000);
            } else {
                showAlert(`Failed to install update: ${installData.error || 'Unknown error'}`, 'error');
            }
        } else {
            showAlert('No updates available. You have the latest version.', 'success');
        }
    } catch (error) {
        hideLoading();
        showAlert(`Error checking for updates: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Export necessary functions
export {
    fetchDashboardData,
    startAutoRefresh,
    dashboardData
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);