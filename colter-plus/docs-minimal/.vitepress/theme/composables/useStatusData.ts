// docs/.vitepress/theme/composables/useStatusData.ts
import { ref, computed } from 'vue';

export interface ServiceStatus {
  name: string;
  icon?: string;
  status: 'operational' | 'degraded' | 'down' | 'loading';
  uptime?: string;
  ping?: number | null;
  lastOutage: Date | null;
}

export function useStatusData(_key: string, initialData: ServiceStatus[] = []) {
  const data = ref<ServiceStatus[]>(initialData);
  const loading = ref(true);
  
  const operationalCount = computed(() => {
    return data.value.filter(service => service.status === 'operational').length;
  });
  
  const isAllOperational = computed(() => {
    return operationalCount.value === data.value.length;
  });
  
  const fetchData = async () => {
    // Mock implementation
    loading.value = false;
    data.value = data.value.map(service => ({
      ...service,
      status: 'operational' as const,
      ping: 10,
      lastOutage: new Date()
    }));
  };
  
  return {
    data,
    loading,
    fetchData,
    operationalCount,
    isAllOperational,
    statusData: ref({
      status: 'operational' as const,
      message: 'All systems operational',
      lastUpdated: new Date().toISOString()
    })
  };
}