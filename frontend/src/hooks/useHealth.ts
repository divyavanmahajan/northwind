import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthService.getHealth(),
    staleTime: 30000,
  });
}

export function useHealthReady() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => healthService.getHealthReady(),
    staleTime: 30000,
    refetchInterval: 30000,
  });
}
