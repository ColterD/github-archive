// common/api.js - API communication functions

// API endpoint URLs
const API_ENDPOINTS = {
    setup_status: '/api/setup/status',
    hardware: '/api/hardware',
    config: '/api/config',
    complete_setup: '/api/setup/complete',
    summary: '/api/summary',
    logs: '/api/logs',
    miner_restart: '/api/miner/restart',
    miner_stop: '/api/miner/stop'
};

// API functions
export const api = {
    // Check setup status
    async getSetupStatus() {
        const response = await fetch(API_ENDPOINTS.setup_status);
        if (!response.ok) {
            throw new Error(`Setup status API error: ${response.status}`);
        }
        return await response.json();
    },

    // Get hardware information
    async getHardwareInfo() {
        const response = await fetch(API_ENDPOINTS.hardware);
        if (!response.ok) {
            throw new Error(`Hardware API error: ${response.status}`);
        }
        return await response.json();
    },

    // Get configuration
    async getConfig() {
        const response = await fetch(API_ENDPOINTS.config);
        if (!response.ok) {
            throw new Error(`Config API error: ${response.status}`);
        }
        return await response.json();
    },

    // Save configuration
    async saveConfig(config) {
        const response = await fetch(API_ENDPOINTS.config, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        if (!response.ok) {
            throw new Error(`Save config API error: ${response.status}`);
        }
        return await response.json();
    },

    // Complete setup
    async completeSetup() {
        const response = await fetch(API_ENDPOINTS.complete_setup, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`Complete setup API error: ${response.status}`);
        }
        return await response.json();
    },

    // Get miner summary
    async getSummary() {
        const response = await fetch(API_ENDPOINTS.summary);
        if (!response.ok) {
            throw new Error(`Summary API error: ${response.status}`);
        }
        return await response.json();
    },

    // Get logs
    async getLogs(logType = 'miner') {
        const endpoint = logType === 'miner' ? API_ENDPOINTS.logs : `${API_ENDPOINTS.logs}/${logType}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Logs API error: ${response.status}`);
        }
        return await response.text();
    },

    // Restart miner
    async restartMiner() {
        const response = await fetch(API_ENDPOINTS.miner_restart, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`Restart miner API error: ${response.status}`);
        }
        return await response.json();
    },

    // Stop miner
    async stopMiner() {
        const response = await fetch(API_ENDPOINTS.miner_stop, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`Stop miner API error: ${response.status}`);
        }
        return await response.json();
    }
};