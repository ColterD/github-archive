// dashboard/logs.js - Log fetching and display

import { api } from '../common/api.js';
import { showAlert } from '../common/utils.js';

// Global variables
let logsAutoRefreshInterval;
const MAX_LOG_LINES = parseInt(localStorage.getItem('logLines') || '100');

// Set up logs functionality
export function setupLogs() {
    // Get DOM elements
    const clearLogsButton = document.getElementById('clear-logs');
    const downloadLogsButton = document.getElementById('download-logs');
    const logTypeSelect = document.getElementById('log-type');
    const autoRefreshLogs = document.getElementById('auto-refresh-logs');
    
    // Set up event listeners
    if (clearLogsButton) {
        clearLogsButton.addEventListener('click', clearLogs);
    }
    
    if (downloadLogsButton) {
        downloadLogsButton.addEventListener('click', downloadLogs);
    }
    
    if (logTypeSelect) {
        logTypeSelect.addEventListener('change', () => fetchLogs(logTypeSelect.value));
    }
    
    if (autoRefreshLogs) {
        autoRefreshLogs.addEventListener('change', () => toggleLogsAutoRefresh(autoRefreshLogs.checked));
    }
    
    // Initial logs fetch
    fetchLogs();
    
    // Set up auto-refresh if enabled
    if (autoRefreshLogs && autoRefreshLogs.checked) {
        toggleLogsAutoRefresh(true);
    }
}

// Fetch logs based on selected type
export async function fetchLogs(logType = 'miner') {
    const logsDisplay = document.getElementById('logs-display');
    const lastRefreshSpan = document.getElementById('last-refresh');
    
    if (!logsDisplay) return;
    
    try {
        const logs = await api.getLogs(logType);
        
        // Update logs display
        logsDisplay.textContent = logs || 'No logs available';
        
        // Update last refresh timestamp
        if (lastRefreshSpan) {
            lastRefreshSpan.textContent = `Last refresh: ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
        logsDisplay.textContent = `Error fetching logs: ${error.message}`;
    }
}

// Toggle logs auto-refresh
export function toggleLogsAutoRefresh(enabled) {
    if (enabled) {
        // Clear any existing interval
        if (logsAutoRefreshInterval) {
            clearInterval(logsAutoRefreshInterval);
        }
        
        // Set new interval (10 seconds)
        logsAutoRefreshInterval = setInterval(() => {
            const logTypeSelect = document.getElementById('log-type');
            fetchLogs(logTypeSelect ? logTypeSelect.value : 'miner');
        }, 10000);
    } else {
        // Clear interval
        if (logsAutoRefreshInterval) {
            clearInterval(logsAutoRefreshInterval);
            logsAutoRefreshInterval = null;
        }
    }
}

// Clear logs display
function clearLogs() {
    const logsDisplay = document.getElementById('logs-display');
    if (logsDisplay) {
        logsDisplay.textContent = 'Logs cleared from display. Refresh to fetch again.';
    }
}

// Download logs
function downloadLogs() {
    const logsDisplay = document.getElementById('logs-display');
    const logTypeSelect = document.getElementById('log-type');
    
    if (!logsDisplay) return;
    
    const logType = logTypeSelect ? logTypeSelect.value : 'miner';
    const logText = logsDisplay.textContent;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `srbminer-${logType}-logs-${timestamp}.txt`;
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert(`Logs downloaded as ${filename}`, 'success');
}