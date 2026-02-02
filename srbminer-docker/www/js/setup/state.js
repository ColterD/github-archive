// setup/state.js - State management for setup wizard

// Global state object for the setup wizard
export const setupState = {
    currentStep: 1,
    totalSteps: 7,
    hardwareData: null,
    selectedHardware: {
        cpu: false,
        nvidia_gpus: [],
        amd_gpus: [],
        intel_gpus: []
    },
    selectedAlgorithm: null,
    selectedPool: null,
    customPool: '',
    walletAddress: '',
    workerName: 'srbminer-docker',
    intensity: 21,
    memoryTweak: 0,
    powerLimit: 0,
    autoTune: true,
    benchmarkResults: null,
    recommendedSettings: null
};

// Function to update the state
export function updateState(key, value) {
    if (key in setupState) {
        setupState[key] = value;
        return true;
    }
    return false;
}

// Function to reset state to defaults
export function resetState() {
    setupState.currentStep = 1;
    setupState.selectedHardware = {
        cpu: false,
        nvidia_gpus: [],
        amd_gpus: [],
        intel_gpus: []
    };
    setupState.selectedAlgorithm = null;
    setupState.selectedPool = null;
    setupState.customPool = '';
    setupState.walletAddress = '';
    setupState.workerName = 'srbminer-docker';
    setupState.intensity = 21;
    setupState.memoryTweak = 0;
    setupState.powerLimit = 0;
    setupState.autoTune = true;
    setupState.benchmarkResults = null;
    setupState.recommendedSettings = null;
}