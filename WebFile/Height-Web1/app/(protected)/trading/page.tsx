"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  Zap,
  Shield,
  Target
} from 'lucide-react';
import { CryptoTradingInterface } from '@/components/trading/crypto-trading-interface';
import { toast } from 'sonner';

interface TradingStats {
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
  winRate: number;
  activeTrades: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export default function TradingPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    totalVolume: 0,
    totalPnL: 0,
    winRate: 0,
    activeTrades: 0
  });
  const [topMarkets, setTopMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTradingData();
      loadMarketData();
    }
  }, [user]);

  const loadTradingData = async () => {
    try {
      const response = await fetch(`/api/trading/stats?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading trading stats:', error);
    }
  };

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trading/markets');
      if (response.ok) {
        const data = await response.json();
        setTopMarkets(data.slice(0, 5)); // Top 5 markets
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading</h1>
          <p className="text-muted-foreground">
            Trade cryptocurrencies with institutional-grade tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMarketData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Trading Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">
              Total traded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L</CardTitle>
            {stats.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Unrealized gains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrades}</div>
            <p className="text-xs text-muted-foreground">
              Open positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <Tabs defaultValue="spot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spot">Spot Trading</TabsTrigger>
          <TabsTrigger value="leverage">
            <Zap className="h-4 w-4 mr-2" />
            Leverage Trading
          </TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="spot" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Fees:</strong> Trade with industry-leading 0.08% fees on all spot trades.
            </AlertDescription>
          </Alert>
          <CryptoTradingInterface />
        </TabsContent>

        <TabsContent value="leverage" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Leverage Trading:</strong> Trade with up to 10x leverage. Higher potential returns come with higher risk.
            </AlertDescription>
          </Alert>
          <CryptoTradingInterface />
        </TabsContent>

        <TabsContent value="markets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Markets</CardTitle>
              <CardDescription>
                Most active trading pairs by volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : topMarkets.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Markets loading...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we fetch the latest market data
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topMarkets.map((market) => (
                    <div key={market.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                          {market.symbol.split('/')[0].charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{market.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            Vol: {formatNumber(market.volume24h)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(market.price)}</div>
                        <div className={`text-sm ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                View and manage your active orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                <p className="text-muted-foreground mb-4">
                  Your open orders will appear here
                </p>
                <Button variant="outline">
                  Start Trading
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}