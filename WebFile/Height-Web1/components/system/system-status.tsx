
"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Database,
  TrendingUp,
  Activity
} from 'lucide-react';

interface SystemHealthCheck {
  database: boolean;
  markets: boolean;
  realtime: boolean;
  api: boolean;
  lastUpdated: string;
}

export function SystemStatus() {
  const [health, setHealth] = useState<SystemHealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/health');
      const result = await response.json();
      
      if (result.success) {
        setHealth(result.health);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Error checking system health:', error);
      setHealth({
        database: false,
        markets: false,
        realtime: false,
        api: false,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    if (!health) return 'unknown';
    const systems = [health.database, health.markets, health.realtime, health.api];
    const healthy = systems.filter(Boolean).length;
    
    if (healthy === systems.length) return 'healthy';
    if (healthy >= systems.length / 2) return 'degraded';
    return 'unhealthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">System Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkSystemHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status</span>
          <Badge
            variant={
              overallStatus === 'healthy' ? 'default' :
              overallStatus === 'degraded' ? 'secondary' : 'destructive'
            }
          >
            {overallStatus === 'healthy' ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </Badge>
        </div>

        {/* Individual Systems */}
        {health && (
          <div className="space-y-2">
            <StatusItem
              label="Database"
              status={health.database}
              icon={Database}
            />
            <StatusItem
              label="Market Data"
              status={health.markets}
              icon={TrendingUp}
            />
            <StatusItem
              label="Real-time Updates"
              status={health.realtime}
              icon={health.realtime ? Wifi : WifiOff}
            />
            <StatusItem
              label="API Services"
              status={health.api}
              icon={Activity}
            />
          </div>
        )}

        {/* Last Updated */}
        {lastCheck && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* System Alerts */}
        {overallStatus !== 'healthy' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some services may be experiencing issues. Please refresh or try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function StatusItem({ 
  label, 
  status, 
  icon: Icon 
}: { 
  label: string; 
  status: boolean; 
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${status ? 'text-green-500' : 'text-red-500'}`} />
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant={status ? 'default' : 'destructive'} className="text-xs">
        {status ? 'Online' : 'Offline'}
      </Badge>
    </div>
  );
}
