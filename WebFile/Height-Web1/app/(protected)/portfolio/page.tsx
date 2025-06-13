// app/(protected)/portfolio/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAccount, useBalance } from 'wagmi';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Wallet,
  Bitcoin,
  Info,
  Calculator,
  BarChart3,
  LineChart,
  Clock,
  Target,
  Shield,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  Percent
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LightweightChart } from '@/components/trading/lightweight-chart';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation: number;
  logo?: string;
}

interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
  cagr: number;
  bestPerformer: Holding | null;
  worstPerformer: Holding | null;
  holdingsCount: number;
  riskScore: number;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function PortfolioPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: walletBalance } = useBalance({ address });
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/portfolio');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Fetch portfolio data from wallet
  const fetchWalletHoldings = useCallback(async () => {
    if (!isConnected || !address) return [];

    try {
      // In a real implementation, you would:
      // 1. Fetch token balances from blockchain
      // 2. Get prices from CoinGecko/other APIs
      // 3. Calculate metrics
      
      // For now, we'll fetch from database and sync with wallet
      const { data: dbHoldings } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', user?.id);

      if (!dbHoldings) return [];

      // Fetch current prices
      const symbols = dbHoldings.map(h => h.symbol.toLowerCase()).join(',');
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd&include_24hr_change=true`
      );
      const prices = await priceResponse.json();

      // Update holdings with current prices
      const updatedHoldings: Holding[] = dbHoldings.map(holding => {
        const currentPrice = prices[holding.symbol.toLowerCase()]?.usd || holding.current_price;
        const currentValue = holding.quantity * currentPrice;
        const profitLoss = currentValue - holding.total_invested;
        const profitLossPercentage = (profitLoss / holding.total_invested) * 100;

        return {
          id: holding.id,
          symbol: holding.symbol.toUpperCase(),
          name: holding.name,
          quantity: holding.quantity,
          averageBuyPrice: holding.average_buy_price,
          currentPrice,
          totalInvested: holding.total_invested,
          currentValue,
          profitLoss,
          profitLossPercentage,
          allocation: 0, // Will be calculated after
          logo: `https://assets.coingecko.com/coins/images/1/small/${holding.symbol.toLowerCase()}.png`
        };
      });

      // Calculate allocations
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
      updatedHoldings.forEach(h => {
        h.allocation = (h.currentValue / totalValue) * 100;
      });

      return updatedHoldings;
    } catch (error) {
      console.error('Error fetching wallet holdings:', error);
      toast.error('Failed to fetch portfolio data');
      return [];
    }
  }, [isConnected, address, user, supabase]);

  // Calculate portfolio metrics
  const calculateMetrics = useCallback((holdings: Holding[]): PortfolioMetrics => {
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Calculate daily change (simplified - in real app, fetch from API)
    const dailyChange = totalValue * 0.02; // Mock 2% daily change
    const dailyChangePercentage = 2;

    // Calculate CAGR (simplified)
    const years = 1; // Assuming 1 year for demo
    const cagr = totalInvested > 0 ? (Math.pow(totalValue / totalInvested, 1 / years) - 1) * 100 : 0;

    // Find best and worst performers
    const sortedByPerformance = [...holdings].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage);
    const bestPerformer = sortedByPerformance[0] || null;
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1] || null;

    // Calculate risk score (simplified)
    const volatilities = holdings.map(h => Math.abs(h.profitLossPercentage));
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
    const riskScore = Math.min(100, Math.max(0, avgVolatility * 2));

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercentage,
      dailyChange,
      dailyChangePercentage,
      cagr,
      bestPerformer,
      worstPerformer,
      holdingsCount: holdings.length,
      riskScore
    };
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('portfolio_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const formattedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          type: tx.order_type as 'buy' | 'sell',
          symbol: tx.symbol,
          name: tx.name,
          quantity: tx.quantity,
          price: tx.price,
          total: tx.total_amount,
          date: tx.created_at || '',
          status: tx.status as 'completed' | 'pending' | 'failed'
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user, supabase]);

  // Generate portfolio history data
  const generatePortfolioHistory = useCallback((holdings: Holding[], timeframe: string) => {
    // In a real app, fetch historical data from API
    const days = timeframe === '1D' ? 1 : 
                timeframe === '1W' ? 7 : 
                timeframe === '1M' ? 30 : 
                timeframe === '3M' ? 90 : 
                timeframe === '1Y' ? 365 : 730;

    const data = [];
    const endValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const startValue = holdings.reduce((sum, h) => sum + h.totalInvested, 0);

    for (let i = 0; i <= days; i++) {
      const progress = i / days;
      const value = startValue + (endValue - startValue) * progress;
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      data.push({
        date: date.toLocaleDateString(),
        value: value + (Math.random() - 0.5) * value * 0.05, // Add some volatility
        timestamp: date.getTime()
      });
    }

    return data;
  }, []);

  // Load all data
  const loadPortfolioData = useCallback(async () => {
    setLoading(true);
    try {
      const holdingsData = await fetchWalletHoldings();
      setHoldings(holdingsData);
      
      if (holdingsData.length > 0) {
        const metricsData = calculateMetrics(holdingsData);
        setMetrics(metricsData);
        
        const history = generatePortfolioHistory(holdingsData, timeframe);
        setPortfolioHistory(history);
      }
      
      await fetchTransactions();
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [fetchWalletHoldings, calculateMetrics, generatePortfolioHistory, fetchTransactions, timeframe]);

  // Initial load
  useEffect(() => {
    if (user && isConnected) {
      loadPortfolioData();
    } else if (user && !isConnected) {
      // Show prompt to connect wallet
      setLoading(false);
    }
  }, [user, isConnected, loadPortfolioData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
    toast.success('Portfolio data refreshed');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Pie chart data
  const pieChartData = useMemo(() => {
    return holdings.map((holding: Holding, index: number) => ({
      name: holding.symbol,
      value: holding.currentValue,
      percentage: holding.allocation,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [holdings]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your crypto wallet to view and manage your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                We support Coinbase Wallet, MetaMask, and WalletConnect
              </p>
              <Button 
                onClick={() => router.push('/crypto')}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Go to Trading Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PieChart className="h-8 w-8 text-primary" />
              Portfolio Overview
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your crypto investments and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Export functionality */}}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : metrics && holdings.length > 0 ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
                      <div className={`flex items-center gap-1 mt-1 ${metrics.dailyChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {metrics.dailyChangePercentage >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {formatPercentage(metrics.dailyChangePercentage)} today
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className={`text-2xl font-bold ${metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(Math.abs(metrics.totalProfitLoss))}
                      </p>
                      <p className={`text-sm mt-1 ${metrics.totalProfitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(metrics.totalProfitLossPercentage)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${metrics.totalProfitLoss >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {metrics.totalProfitLoss >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CAGR</p>
                      <p className="text-2xl font-bold">{metrics.cagr.toFixed(2)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Annual Growth</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <Percent className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p className="text-2xl font-bold">{metrics.riskScore.toFixed(0)}/100</p>
                      <div className="mt-2">
                        <Progress value={metrics.riskScore} className="h-2" />
                      </div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-full">
                      <Shield className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Portfolio Chart */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Portfolio Value</CardTitle>
                        <div className="flex gap-1">
                          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf: string) => (
                            <Button
                              key={tf}
                              variant={timeframe === tf ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setTimeframe(tf as '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL')}
                            >
                              {tf}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={portfolioHistory}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9ca3af"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="#9ca3af"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: 'none',
                                borderRadius: '8px'
                              }}
                              formatter={(value: any) => formatCurrency(value)}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#10b981"
                              fillOpacity={1}
                              fill="url(#colorValue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Asset Allocation */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Allocation</CardTitle>
                      <CardDescription>Portfolio distribution by asset</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percentage }: { name: string; percentage: number }) => `${name} ${percentage.toFixed(1)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metrics.bestPerformer && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium">{metrics.bestPerformer.symbol}</p>
                              <p className="text-sm text-muted-foreground">{metrics.bestPerformer.name}</p>
                            </div>
                          </div>
                          <p className="text-green-500 font-medium">
                            {formatPercentage(metrics.bestPerformer.profitLossPercentage)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Worst Performer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metrics.worstPerformer && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium">{metrics.worstPerformer.symbol}</p>
                              <p className="text-sm text-muted-foreground">{metrics.worstPerformer.name}</p>
                            </div>
                          </div>
                          <p className="text-red-500 font-medium">
                            {formatPercentage(metrics.worstPerformer.profitLossPercentage)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Diversification</span>
                          <Badge variant={holdings.length >= 5 ? 'default' : 'secondary'}>
                            <span>{holdings.length >= 5 ? 'Good' : 'Low'}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Risk Level</span>
                          <Badge variant={metrics.riskScore < 50 ? 'default' : 'destructive'}>
                            <span>{metrics.riskScore < 30 ? 'Low' : metrics.riskScore < 70 ? 'Medium' : 'High'}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coming Soon Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-dashed">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Stocks Portfolio</CardTitle>
                        <Badge variant="secondary">
                          <span>Coming Soon</span>
                        </Badge>
                      </div>
                      <CardDescription>Track your stock market investments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Stock trading integration will be available soon
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Mutual Funds</CardTitle>
                        <Badge variant="secondary">
                          <span>Coming Soon</span>
                        </Badge>
                      </div>
                      <CardDescription>Manage your mutual fund investments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Mutual funds integration will be available soon
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Holdings Tab */}
              <TabsContent value="holdings">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Holdings</CardTitle>
                    <CardDescription>Your cryptocurrency positions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4">Asset</th>
                            <th className="text-right p-4">Quantity</th>
                            <th className="text-right p-4">Avg Buy Price</th>
                            <th className="text-right p-4">Current Price</th>
                            <th className="text-right p-4">Current Value</th>
                            <th className="text-right p-4">P&L</th>
                            <th className="text-right p-4">Allocation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map((holding: Holding) => (
                            <motion.tr
                              key={holding.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Bitcoin className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{holding.symbol}</p>
                                    <p className="text-sm text-muted-foreground">{holding.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right p-4">{holding.quantity.toFixed(4)}</td>
                              <td className="text-right p-4">{formatCurrency(holding.averageBuyPrice)}</td>
                              <td className="text-right p-4">{formatCurrency(holding.currentPrice)}</td>
                              <td className="text-right p-4 font-medium">{formatCurrency(holding.currentValue)}</td>
                              <td className="text-right p-4">
                                <div className={holding.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  <p className="font-medium">{formatCurrency(Math.abs(holding.profitLoss))}</p>
                                  <p className="text-sm">{formatPercentage(holding.profitLossPercentage)}</p>
                                </div>
                              </td>
                              <td className="text-right p-4">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{holding.allocation.toFixed(1)}%</span>
                                  <div className="w-16">
                                    <Progress value={holding.allocation} className="h-2" />
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Total Return</span>
                            <span className={`font-medium ${metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(Math.abs(metrics.totalProfitLoss))}
                            </span>
                          </div>
                          <Progress 
                            value={Math.abs(metrics.totalProfitLossPercentage)} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">CAGR</span>
                            <span className="font-medium">{metrics.cagr.toFixed(2)}%</span>
                          </div>
                          <Progress value={metrics.cagr} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Win Rate</span>
                            <span className="font-medium">
                              {((holdings.filter((h: Holding) => h.profitLoss >= 0).length / holdings.length) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={(holdings.filter((h: Holding) => h.profitLoss >= 0).length / holdings.length) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your portfolio risk score is {metrics.riskScore.toFixed(0)}/100
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Volatility</span>
                            <Badge variant={metrics.riskScore < 50 ? 'default' : 'destructive'}>
                              <span>{metrics.riskScore < 30 ? 'Low' : metrics.riskScore < 70 ? 'Medium' : 'High'}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Concentration Risk</span>
                            <Badge variant={holdings[0]?.allocation < 50 ? 'default' : 'destructive'}>
                              <span>{holdings[0]?.allocation < 50 ? 'Balanced' : 'High'}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Market Exposure</span>
                            <Badge>
                              <span>Crypto Only</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Asset Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Asset Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {holdings.map((holding: Holding) => (
                        <div key={holding.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Bitcoin className="h-6 w-6 text-orange-500" />
                              <div>
                                <p className="font-medium">{holding.name}</p>
                                <p className="text-sm text-muted-foreground">{holding.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${holding.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercentage(holding.profitLossPercentage)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(holding.profitLoss)}
                              </p>
                            </div>
                          </div>
                          <div className="h-[100px]">
                            <LightweightChart 
                              symbol={holding.symbol.toLowerCase()} 
                              height={100}
                              showVolume={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Transaction History</CardTitle>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2">
                        {transactions.map((tx: Transaction) => (
                          <div
                            key={tx.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  tx.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                                }`}>
                                  {tx.type === 'buy' ? (
                                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.quantity} {tx.symbol}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(tx.date).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(tx.total)}</p>
                                <p className="text-sm text-muted-foreground">
                                  @ {formatCurrency(tx.price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>No Holdings Yet</CardTitle>
              <CardDescription>
                Start building your portfolio by purchasing cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/crypto')} className="gap-2">
                <Bitcoin className="h-4 w-4" />
                Start Trading
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}