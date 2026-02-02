import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStatusData, type ServiceStatus } from '../../../docs/.vitepress/theme/composables/useStatusData';

// Mock the useStorage function from @vueuse/core
vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn((_key, defaultValue) => {
    return {
      value: defaultValue
    };
  })
}));

// Mock the formatTimeSince function
vi.mock('../../../docs/.vitepress/utils/dateUtils', () => ({
  formatTimeSince: vi.fn((date) => {
    if (!date) return 'N/A';
    return '5d 2h';
  })
}));

describe('useStatusData', () => {
  // Mock fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Mock fetch to return mock data
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { 
            name: 'Media Server', 
            status: 'operational', 
            latency: 15, 
            lastOutage: '2023-01-01T00:00:00Z' 
          }
        ])
      })
    );
    
    // Mock environment variables
    vi.stubGlobal('import.meta', { 
      env: { 
        PROD: false, 
        DEV_MOCKS: true 
      } 
    });
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });
  
  it('should initialize with initial data', () => {
    const initialData: ServiceStatus[] = [
      { 
        name: 'Test Service', 
        icon: 'test', 
        status: 'loading', 
        uptime: '99.9%', 
        ping: null, 
        lastOutage: null 
      }
    ];
    
    const { data, loading } = useStatusData('test-key', initialData);
    
    expect(data.value).toEqual(initialData);
    expect(loading.value).toBe(true);
  });
  
  it('should calculate operationalCount and isAllOperational correctly', async () => {
    const initialData: ServiceStatus[] = [
      { 
        name: 'Service 1', 
        icon: 'test', 
        status: 'operational', 
        uptime: '99.9%', 
        ping: 10, 
        lastOutage: null 
      },
      { 
        name: 'Service 2', 
        icon: 'test', 
        status: 'degraded', 
        uptime: '95%', 
        ping: 50, 
        lastOutage: new Date() 
      }
    ];
    
    const { operationalCount, isAllOperational } = useStatusData('test-key', initialData);
    
    expect(operationalCount.value).toBe(1);
    expect(isAllOperational.value).toBe(false);
  });
  
  it('should generate mock data correctly', async () => {
    const initialData: ServiceStatus[] = [
      { 
        name: 'Test Service', 
        icon: 'test', 
        status: 'loading', 
        uptime: '99.9%', 
        ping: null, 
        lastOutage: null 
      }
    ];
    
    const { data, fetchData, loading } = useStatusData('test-key', initialData);
    
    await fetchData();
    
    expect(loading.value).toBe(false);
    expect(data.value.length).toBe(1);
    expect(data.value[0].name).toBe('Test Service');
    expect(['operational', 'degraded', 'down']).toContain(data.value[0].status);
    expect(data.value[0].ping).toBeGreaterThan(0);
    expect(data.value[0].lastOutage).toBeInstanceOf(Date);
  });
});