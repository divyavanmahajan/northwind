import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const Dashboard = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: healthService.getHealthReady,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="text-2xl font-bold capitalize">
                {health?.status || 'Unknown'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Database Latency: {health?.checks?.database?.latency_ms || 0}ms
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
