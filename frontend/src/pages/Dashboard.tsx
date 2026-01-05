import { useHealthReady } from '@/hooks/useHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Database, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ApiErrorDisplay } from '@/components/common/ApiErrorDisplay';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { 
    data: health, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useHealthReady();

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            Retry Connection
          </Button>
        </div>
        <ApiErrorDisplay error={error} retry={() => refetch()} />
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';
  const dbStatus = health?.checks?.database?.status;
  const dbLatency = health?.checks?.database?.latency_ms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching || isLoading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span className="text-xs text-muted-foreground">Checking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div className="text-2xl font-bold capitalize">
                  {health?.status || 'Unknown'}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Database
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dbLatency ? `${dbLatency}ms` : 'N/A'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <div className={cn(
                     "h-2 w-2 rounded-full",
                     dbStatus === 'healthy' ? "bg-green-500" : "bg-destructive"
                   )} />
                   <p className="text-xs text-muted-foreground capitalize">
                     {dbStatus || 'Unknown'}
                   </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};