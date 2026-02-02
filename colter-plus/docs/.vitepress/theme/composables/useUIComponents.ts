// docs/.vitepress/theme/composables/useUIComponents.ts
import { ref } from 'vue';

export function useUIComponents() {
  const isDarkMode = ref(true);
  
  return {
    isDarkMode
  };
}