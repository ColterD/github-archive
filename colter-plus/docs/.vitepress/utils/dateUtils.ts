// docs/.vitepress/utils/dateUtils.ts
export interface FormattedDate {
    raw: string;
    formatted: string;
    year: number;
    month: number;
    day: number;
  }
  
  export function formatDate(dateString?: string, fallback = '1970-01-01'): FormattedDate {
    const date = new Date(dateString || fallback);
    
    return {
      raw: dateString || fallback,
      formatted: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }
  
  export function formatTimeSince(date: Date | null): string {
    if (!date) return 'N/A';
    
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) {
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${Math.floor(seconds)}s`;
  }