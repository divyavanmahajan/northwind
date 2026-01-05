import { apiClient } from '@/lib/api';
import { HealthResponse, HealthReadyResponse } from '@/types/api';

export const healthService = {
  getHealth: async (): Promise<HealthResponse> => {
    return apiClient.get<HealthResponse>('/health');
  },
  getHealthReady: async (): Promise<HealthReadyResponse> => {
    return apiClient.get<HealthReadyResponse>('/health/ready');
  },
};