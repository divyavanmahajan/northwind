import api from '@/lib/api';

export interface HealthStatus {
  status: string;
  timestamp?: string;
  checks?: {
    database: {
      status: string;
      latency_ms: number;
    };
  };
}

export const healthService = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  },
  getHealthReady: async (): Promise<HealthStatus> => {
    const response = await api.get<HealthStatus>('/health/ready');
    return response.data;
  },
};
