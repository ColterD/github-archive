const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const os = require('os');

const PORT = process.env.WEB_UI_PORT || 8080;
const API_PORT = process.env.API_PORT || 7000;
const LOG_FILE = '/var/log/srbminer.log';
const CONFIG_FILE = '/srbminer/config/config.json';
const SETUP_COMPLETE_FLAG = '/srbminer/config/.setup_complete';
const MAX_LOG_LINES = parseInt(process.env.LOG_LINES || '100');

// Basic algorithm info
const ALGORITHM_INFO = {
    "ethash": { "cpu": false, "amd": true, "nvidia": true, "intel": true, "dev_fee": 0.65 },
    "etchash": { "cpu": false, "amd": true, "nvidia": true, "intel": true, "dev_fee": 0.65 },
    "randomx": { "cpu": true, "amd": true, "nvidia": true, "intel": true, "dev_fee": 0.85 },
    "kawpow": { "cpu": false, "amd": true, "nvidia": true, "intel": true, "dev_fee": 0.85 },
    "autolykos2": { "cpu": false, "amd": true, "nvidia": true, "intel": true, "dev_fee": 1.00 },
    // Add more algorithms as needed...
};

// Check if we're in setup mode
function isSetupMode() {
    // Check if config file exists
    if (!fs.existsSync(CONFIG_FILE)) {
        return true;
    }
    
    // Check if setup has been completed
    if (!fs.existsSync(SETUP_COMPLETE_FLAG)) {
        return true;
    }
    
    // Read config to see if setup_mode flag is set
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        return !!config.setup_mode;
    } catch (error) {
        console.error('Error reading config file:', error);
        return true; // Default to setup mode on error
    }
}

// Safely read and parse the config file
function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error reading config file:', error);
    }
    return null;
}

// Write config to file
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing config file:', error);
        return false;
    }
}

// Restart the miner service
function restartMiner() {
    try {
        execSync('supervisorctl restart srbminer');
        return true;
    } catch (error) {
        console.error('Error restarting miner:', error);
        return false;
    }
}

// Complete the setup process
function completeSetup() {
    try {
        // Create the setup complete flag file
        fs.writeFileSync(SETUP_COMPLETE_FLAG, new Date().toISOString());
        
        // Update config to remove setup mode flag
        const config = getConfig();
        if (config) {
            delete config.setup_mode;
            saveConfig(config);
        }
        
        // Restart services
        execSync('supervisorctl reload');
        return true;
    } catch (error) {
        console.error('Error completing setup:', error);
        return false;
    }
}

// Get system hardware information
function getHardwareInfo() {
    try {
        const hardwareInfo = execSync('/srbminer/scripts/hardware-detect.sh').toString();
        return JSON.parse(hardwareInfo);
    } catch (error) {
        console.error('Error detecting hardware:', error);
        return {
            cpu: {
                model: os.cpus()[0].model,
                cores: os.cpus().length,
                recommended_threads: Math.floor(os.cpus().length / 2) || 1
            },
            nvidia_gpus: [],
            amd_gpus: [],
            intel_gpus: [],
            opencl_available: false,
            algorithms: [],
            recommended_pools: []
        };
    }
}

// Create and start server with port conflict handling
const tryPort = (port) => {
    const server = http.createServer((req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }
        
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Setup status check endpoint
        if (url.pathname === '/api/setup/status') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                setup_required: isSetupMode(),
                config_exists: fs.existsSync(CONFIG_FILE)
            }));
            return;
        }
        
        // Hardware detection endpoint
        if (url.pathname === '/api/hardware') {
            res.setHeader('Content-Type', 'application/json');
            const hardwareInfo = getHardwareInfo();
            res.end(JSON.stringify(hardwareInfo));
            return;
        }
        
        // Configuration endpoints
        if (url.pathname === '/api/config') {
            if (req.method === 'GET') {
                // Get current configuration
                res.setHeader('Content-Type', 'application/json');
                const config = getConfig();
                if (config) {
                    res.end(JSON.stringify(config));
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Configuration not found' }));
                }
                return;
            } else if (req.method === 'POST') {
                // Update configuration
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                    // Limit the size of the request body
                    if (body.length > 1e6) {
                        body = '';
                        res.statusCode = 413;
                        res.end(JSON.stringify({ error: 'Request entity too large' }));
                        req.connection.destroy();
                    }
                });
                
                req.on('end', () => {
                    if (body) {
                        try {
                            const config = JSON.parse(body);
                            const success = saveConfig(config);
                            
                            res.setHeader('Content-Type', 'application/json');
                            if (success) {
                                res.end(JSON.stringify({ success: true, message: 'Configuration saved' }));
                            } else {
                                res.statusCode = 500;
                                res.end(JSON.stringify({ success: false, error: 'Failed to save configuration' }));
                            }
                        } catch (error) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                        }
                    } else {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ success: false, error: 'Empty request body' }));
                    }
                });
                return;
            }
        }
        
        // Complete setup endpoint
        if (url.pathname === '/api/setup/complete' && req.method === 'POST') {
            const success = completeSetup();
            
            res.setHeader('Content-Type', 'application/json');
            if (success) {
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Setup completed successfully. The container will restart with the new configuration.' 
                }));
            } else {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Failed to complete setup' 
                }));
            }
            return;
        }
        
        // Restart miner endpoint
        if (url.pathname === '/api/miner/restart' && req.method === 'POST') {
            const success = restartMiner();
            
            res.setHeader('Content-Type', 'application/json');
            if (success) {
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Miner restarted successfully' 
                }));
            } else {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Failed to restart miner' 
                }));
            }
            return;
        }

        // Logs endpoints for specific log types
        if (url.pathname === '/api/logs/update') {
            // Read update logs
            exec(`tail -n ${MAX_LOG_LINES} /var/log/miner-update.log`, (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'text/plain');
                if (error) {
                    res.statusCode = 500;
                    res.end(`Error reading update logs: ${stderr}`);
                    return;
                }
                res.end(stdout);
            });
            return;
        }

        if (url.pathname === '/api/logs/health') {
            // Read health check logs
            exec(`tail -n ${MAX_LOG_LINES} /var/log/health-check.log`, (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'text/plain');
                if (error) {
                    res.statusCode = 500;
                    res.end(`Error reading health check logs: ${stderr}`);
                    return;
                }
                res.end(stdout);
            });
            return;
        }

        // Miner control endpoints
        if (url.pathname === '/api/miner/stop' && req.method === 'POST') {
            exec('supervisorctl stop srbminer', (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'application/json');
                if (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `Failed to stop miner: ${stderr}` 
                    }));
                    return;
                }
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Miner stopped successfully' 
                }));
            });
            return;
        }

        // Setup reset endpoint
        if (url.pathname === '/api/setup/reset' && req.method === 'POST') {
            try {
                // Remove setup complete flag
                if (fs.existsSync(SETUP_COMPLETE_FLAG)) {
                    fs.unlinkSync(SETUP_COMPLETE_FLAG);
                }
                
                // Backup existing config
                if (fs.existsSync(CONFIG_FILE)) {
                    const backupPath = `/srbminer/backups/config-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                    fs.copyFileSync(CONFIG_FILE, backupPath);
                    
                    // Update config to re-enable setup mode
                    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
                    config.setup_mode = true;
                    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
                }
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Configuration reset. Setup mode enabled.'
                }));
            } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                    success: false, 
                    error: `Failed to reset configuration: ${error.message}`
                }));
            }
            return;
        }

        // Update check endpoint
        if (url.pathname === '/api/update/check' && req.method === 'POST') {
            exec('/srbminer/scripts/update-miner.sh check', (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'application/json');
                
                // Parse update check results
                const updateAvailable = stdout.includes("New version available");
                let latestVersion = "unknown";
                
                // Try to extract latest version from output
                const versionMatch = stdout.match(/New version available: ([0-9.]+)/);
                if (versionMatch && versionMatch[1]) {
                    latestVersion = versionMatch[1];
                }
                
                if (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `Failed to check for updates: ${stderr}`,
                        updateAvailable: false
                    }));
                    return;
                }
                
                res.end(JSON.stringify({ 
                    success: true, 
                    updateAvailable: updateAvailable,
                    latestVersion: latestVersion,
                    message: updateAvailable ? `Update available: ${latestVersion}` : 'No updates available'
                }));
            });
            return;
        }

        // Update install endpoint
        if (url.pathname === '/api/update/install' && req.method === 'POST') {
            exec('/srbminer/scripts/update-miner.sh install', (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'application/json');
                if (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: `Failed to install update: ${stderr}` 
                    }));
                    return;
                }
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Update installed successfully' 
                }));
            });
            return;
        }
        
        // Standard API proxy endpoints
        if (url.pathname === '/api/summary') {
            // Proxy the request to SRBMiner API
            const apiReq = http.request({
                hostname: 'localhost',
                port: API_PORT,
                path: '/api/summary',
                method: 'GET'
            }, (apiRes) => {
                let data = '';
                
                apiRes.on('data', (chunk) => {
                    data += chunk;
                });
                
                apiRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json');
                    
                    // Try to enhance the API response with additional information
                    try {
                        const summaryData = JSON.parse(data);
                        
                        // Check if the miner is running
                        exec('ps aux | grep SRBMiner-MULTI | grep -v grep', (error, stdout) => {
                            summaryData.running = !error && stdout.trim() !== '';
                            
                            // Add dev fee if available
                            if (summaryData.algorithm && ALGORITHM_INFO[summaryData.algorithm]) {
                                summaryData.dev_fee = ALGORITHM_INFO[summaryData.algorithm].dev_fee;
                            }
                            
                            // Add setup mode status
                            summaryData.setup_mode = isSetupMode();
                            
                            res.end(JSON.stringify(summaryData));
                        });
                    } catch (error) {
                        console.error('Error parsing API response:', error);
                        res.end(data);
                    }
                });
            });
            
            apiReq.on('error', (error) => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                    error: 'Unable to connect to miner API', 
                    details: error.message,
                    running: false,
                    setup_mode: isSetupMode()
                }));
            });
            
            apiReq.end();
            return;
        }
        
        // Logs endpoint
        if (url.pathname === '/api/logs') {
            // Read last N lines of log file
            exec(`tail -n ${MAX_LOG_LINES} ${LOG_FILE}`, (error, stdout, stderr) => {
                res.setHeader('Content-Type', 'text/plain');
                if (error) {
                    res.statusCode = 500;
                    res.end(`Error reading logs: ${stderr}`);
                    return;
                }
                res.end(stdout);
            });
            return;
        }
        
        // Status endpoint
        if (url.pathname === '/api/status') {
            exec('ps aux | grep SRBMiner-MULTI | grep -v grep', (error, stdout) => {
                res.setHeader('Content-Type', 'application/json');
                const isRunning = !error && stdout.trim() !== '';
                
                res.end(JSON.stringify({
                    running: isRunning,
                    setup_mode: isSetupMode(),
                    timestamp: new Date().toISOString()
                }));
            });
            return;
        }
        
        // Algorithms endpoint
        if (url.pathname === '/api/algorithms') {
            res.setHeader('Content-Type', 'application/json');
            
            // Convert the algorithm info to an array format
            const algorithms = Object.entries(ALGORITHM_INFO).map(([name, info]) => ({
                name,
                cpu: info.cpu,
                amd: info.amd,
                nvidia: info.nvidia,
                intel: info.intel,
                dev_fee: info.dev_fee
            }));
            
            res.end(JSON.stringify({ algorithms }));
            return;
        }
        
        // System info endpoint
        if (url.pathname === '/api/system') {
            res.setHeader('Content-Type', 'application/json');
            
            // Function to check for driver information
            const checkDrivers = () => {
                const promises = [];
                
                // Check NVIDIA drivers
                promises.push(
                    new Promise(resolve => {
                        exec('nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null || echo "Not installed"', (error, stdout) => {
                            resolve({
                                type: 'nvidia',
                                version: error ? 'Not installed' : stdout.trim(),
                                available: !error && stdout.trim() !== 'Not installed'
                            });
                        });
                    })
                );
                
                // Check AMD drivers (rocm-smi)
                promises.push(
                    new Promise(resolve => {
                        exec('rocm-smi --showversion 2>/dev/null || echo "Not installed"', (error, stdout) => {
                            let version = 'Not installed';
                            if (!error && stdout.trim() !== 'Not installed') {
                                const match = stdout.match(/ROCm-SMI version:\s*(.+)/);
                                version = match ? match[1].trim() : 'Unknown';
                            }
                            resolve({
                                type: 'amd',
                                version: version,
                                available: !error && stdout.trim() !== 'Not installed'
                            });
                        });
                    })
                );
                
                // Check Intel drivers
                promises.push(
                    new Promise(resolve => {
                        exec('dpkg -l | grep intel-opencl 2>/dev/null || echo "Not installed"', (error, stdout) => {
                            let version = 'Not installed';
                            if (!error && stdout.trim() !== 'Not installed') {
                                const match = stdout.match(/\s+(\d+[\d.]+\d+)\s+/);
                                version = match ? match[1].trim() : 'Installed';
                            }
                            resolve({
                                type: 'intel',
                                version: version,
                                available: !error && stdout.trim() !== 'Not installed'
                            });
                        });
                    })
                );
                
                // Check OpenCL support
                promises.push(
                    new Promise(resolve => {
                        exec('which clinfo > /dev/null && clinfo -l 2>/dev/null | grep -c "Device #" || echo "0"', (error, stdout) => {
                            const deviceCount = error ? 0 : parseInt(stdout.trim(), 10);
                            resolve({
                                type: 'opencl',
                                deviceCount: deviceCount,
                                available: deviceCount > 0
                            });
                        });
                    })
                );
                
                return Promise.all(promises);
            };
            
            // Execute the driver checks
            checkDrivers()
                .then(driverResults => {
                    const nvidiaDriver = driverResults.find(d => d.type === 'nvidia');
                    const amdDriver = driverResults.find(d => d.type === 'amd');
                    const intelDriver = driverResults.find(d => d.type === 'intel');
                    const openclInfo = driverResults.find(d => d.type === 'opencl');
                    
                    // Get CPU info
                    const cpuInfo = {
                        model: os.cpus()[0].model,
                        cores: os.cpus().length,
                        threads: os.cpus().length,
                        speed: os.cpus()[0].speed
                    };
                    
                    // Get memory info
                    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
                    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
                    
                    const memoryInfo = {
                        total: totalMem,
                        available: freeMem,
                        used: (totalMem - freeMem).toFixed(2)
                    };
                    
                    // Get OS info
                    const osInfo = {
                        type: os.type(),
                        platform: os.platform(),
                        release: os.release(),
                        arch: os.arch(),
                        name: process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux',
                        version: os.release()
                    };
                    
                    const driverInfo = {
                        nvidia: nvidiaDriver ? nvidiaDriver.version : 'Not installed',
                        amd: amdDriver ? amdDriver.version : 'Not installed',
                        intel: intelDriver ? intelDriver.version : 'Not installed',
                        opencl: {
                            available: openclInfo ? openclInfo.available : false,
                            deviceCount: openclInfo ? openclInfo.deviceCount : 0
                        }
                    };
                    
                    // Get container uptime
                    const uptime = Math.floor(os.uptime() / 60 / 60);
                    
                    // Check miner version
                    fs.readFile('/srbminer/current_version.txt', 'utf8', (err, version) => {
                        const minerVersion = err ? 'Unknown' : version.trim();
                        
                        res.end(JSON.stringify({
                            cpu: cpuInfo,
                            memory: memoryInfo,
                            os: osInfo,
                            drivers: driverInfo,
                            uptime: uptime + ' hours',
                            miner_version: minerVersion,
                            container_version: '1.0.0' // You should update this with your actual container version
                        }));
                    });
                })
                .catch(error => {
                    console.error('Error getting system information:', error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({
                        error: 'Failed to retrieve complete system information',
                        message: error.message
                    }));
                });
            return;
        }
        
        // Serve static files - Check if the requested file exists in the www directory
        const filePath = path.join('/srbminer/www', url.pathname === '/' ? 'index.html' : url.pathname);
        
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // If we're in setup mode, serve the setup HTML for any path
                if (isSetupMode() && url.pathname !== '/favicon.ico') {
                    fs.readFile(path.join('/srbminer/www', 'setup.html'), (err, data) => {
                        if (err) {
                            res.statusCode = 500;
                            res.end('Error loading setup wizard');
                            return;
                        }
                        const contentType = 'text/html';
                        res.setHeader('Content-Type', contentType);
                        res.end(data);
                    });
                    return;
                }
                
                // File not found, return 404
                res.statusCode = 404;
                res.end('Not Found');
                return;
            }
            
            // Determine content type based on file extension
            const extname = path.extname(filePath);
            let contentType = 'text/html';
            
            switch (extname) {
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.svg':
                    contentType = 'image/svg+xml';
                    break;
            }
            
            // Read and serve the file
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Error loading file');
                    return;
                }
                res.setHeader('Content-Type', contentType);
                res.end(data);
            });
        });
    });
    
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying port ${port+1}...`);
            tryPort(port+1);
        } else {
            console.error('Server error:', e);
            process.exit(1);
        }
    });
    
    server.listen(port, '0.0.0.0', () => {
        console.log(`Web UI server running at http://0.0.0.0:${port}`);
        
        // Log setup mode status
        if (isSetupMode()) {
            console.log('Running in SETUP MODE - please configure the miner through the web interface');
        } else {
            console.log('Running in NORMAL MODE - miner will start automatically');
        }
    });
};

// Try starting with the configured port
tryPort(PORT);