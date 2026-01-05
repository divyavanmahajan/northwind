import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export function createQueryHook<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return () => useQuery({ queryKey: key, queryFn: fetcher, ...options });
}
