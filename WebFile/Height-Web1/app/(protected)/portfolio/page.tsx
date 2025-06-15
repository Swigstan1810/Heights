// app/(protected)/portfolio/page.tsx - Enhanced portfolio with real trading data
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Percent,
  IndianRupee,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { cryptoTradingService } from '@/lib/services/crypto-trading-service';

interface PortfolioSummary {
  total_invested_inr: number;
  current_value_inr: number;
  total_pnl_inr: number;
  total_pnl_percentage: number;
  holdings_count: number;
  inr_balance: number;
}

interface CryptoHolding {
  symbol: string;
  balance: number;
  average_buy_price: number;
  current_price_usd: number;
  current_price_inr: number;
  current_value_inr: number;
  total_invested_inr: number;
  pnl_inr: number;
  pnl_percentage: number;
  change_24h_percent: number;
}

interface TradeHistory {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price_inr: number;
  total_inr: number;
  brokerage_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function EnhancedPortfolioPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // State management
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/portfolio');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Load portfolio data
  const loadPortfolioData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [summaryData, holdingsData, historyData] = await Promise.all([
        cryptoTradingService.getPortfolioSummary(user.id),
        cryptoTradingService.getUserHoldings(user.id),
        cryptoTradingService.getTradeHistory(user.id, 50)
      ]);

      setSummary(summaryData);
      setHoldings(
        holdingsData.map((h: any) => ({
          symbol: h.symbol,
          balance: h.balance,
          average_buy_price: h.average_buy_price ?? 0,
          current_price_usd: h.current_price_usd ?? 0,
          current_price_inr: h.current_price_inr ?? 0,
          current_value_inr: h.current_value_inr ?? 0,
          total_invested_inr: h.total_invested_inr ?? 0,
          pnl_inr: h.pnl_inr ?? 0,
          pnl_percentage: h.pnl_percentage ?? 0,
          change_24h_percent: h.change_24h_percent ?? 0,
        }))
      );
      setTradeHistory(historyData);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user, loadPortfolioData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
    toast.success('Portfolio data refreshed');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Pie chart data for asset allocation
  const pieChartData = holdings.map((holding, index) => ({
    name: holding.symbol,
    value: holding.current_value_inr,
    percentage: summary ? (holding.current_value_inr / summary.current_value_inr) * 100 : 0,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Performance metrics calculation
  const calculateMetrics = () => {
    if (!summary || !holdings.length) return null;

    const totalInvested = summary.total_invested_inr;
    const currentValue = summary.current_value_inr;
    const profitLoss = summary.total_pnl_inr;
    
    // Find best and worst performers
    const sortedByPerformance = [...holdings].sort((a, b) => b.pnl_percentage - a.pnl_percentage);
    const bestPerformer = sortedByPerformance[0];
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

    // Calculate diversification score
    const largestHolding = Math.max(...holdings.map(h => (h.current_value_inr / currentValue) * 100));
    const diversificationScore = Math.max(0, 100 - largestHolding);

    // Calculate risk score based on volatility
    const volatilities = holdings.map(h => Math.abs(h.change_24h_percent));
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
    const riskScore = Math.min(100, avgVolatility * 3);

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercentage: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
      bestPerformer,
      worstPerformer,
      diversificationScore,
      riskScore,
      holdingsCount: holdings.length
    };
  };

  const metrics = calculateMetrics();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>No Portfolio Yet</CardTitle>
              <CardDescription>
                Start trading cryptocurrencies to build your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/crypto')} className="gap-2">
                <Bitcoin className="h-4 w-4" />
                Start Trading
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PieChart className="h-8 w-8 text-primary" />
              Portfolio Overview
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your crypto investments and performance
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
          </div>
        ) : summary && metrics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">
                          {showBalances ? formatCurrency(summary.current_value_inr) : '••••••'}
                        </p>
                        <div className={`flex items-center gap-1 mt-1 ${summary.total_pnl_inr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {summary.total_pnl_inr >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {showBalances ? formatPercentage(summary.total_pnl_percentage) : '••••'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total P&L</p>
                        <p className={`text-2xl font-bold ${summary.total_pnl_inr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {showBalances ? formatCurrency(Math.abs(summary.total_pnl_inr)) : '••••••'}
                        </p>
                        <p className={`text-sm mt-1 ${summary.total_pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {showBalances ? formatPercentage(summary.total_pnl_percentage) : '••••'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${summary.total_pnl_inr >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {summary.total_pnl_inr >= 0 ? (
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">INR Balance</p>
                        <p className="text-2xl font-bold">
                          {showBalances ? formatCurrency(summary.inr_balance) : '••••••'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Available to trade</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <IndianRupee className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Holdings</p>
                        <p className="text-2xl font-bold">{summary.holdings_count}</p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Risk Score</span>
                            <span className="text-xs font-medium">{metrics.riskScore.toFixed(0)}/100</span>
                          </div>
                          <Progress value={metrics.riskScore} className="h-2 mt-1" />
                        </div>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-full">
                        <BarChart3 className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
                      <CardTitle>Asset Allocation</CardTitle>
                      <CardDescription>Portfolio distribution by cryptocurrency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pieChartData.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatCurrency(value)} />
                              <Legend />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <PieChart className="h-12 w-12 mx-auto mb-4" />
                            <p>No holdings to display</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                      <CardDescription>Key portfolio metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metrics.bestPerformer && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600 mb-2">Best Performer</h4>
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div>
                              <p className="font-medium">{metrics.bestPerformer.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {metrics.bestPerformer.balance.toFixed(6)} coins
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-600 font-medium">
                                {formatPercentage(metrics.bestPerformer.pnl_percentage)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(metrics.bestPerformer.pnl_inr)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {metrics.worstPerformer && (
                        <div>
                          <h4 className="text-sm font-medium text-red-600 mb-2">Worst Performer</h4>
                          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div>
                              <p className="font-medium">{metrics.worstPerformer.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {metrics.worstPerformer.balance.toFixed(6)} coins
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-600 font-medium">
                                {formatPercentage(metrics.worstPerformer.pnl_percentage)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(metrics.worstPerformer.pnl_inr)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Diversification</p>
                          <p className="text-lg font-medium">{metrics.diversificationScore.toFixed(0)}/100</p>
                          <Progress value={metrics.diversificationScore} className="h-2 mt-1" />
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Holdings Count</p>
                          <p className="text-lg font-medium">{metrics.holdingsCount}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {metrics.holdingsCount >= 5 ? 'Well diversified' : 'Consider diversifying'}
                          </p>
                        </div>
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
                    {holdings.length > 0 ? (
                      <div className="space-y-4">
                        {holdings.map((holding, index) => (
                          <motion.div
                            key={holding.symbol}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                                  {holding.symbol.substring(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium">{holding.symbol}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {holding.balance.toFixed(8)} coins
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Avg: {formatCurrency(holding.average_buy_price)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-lg">
                                  {showBalances ? formatCurrency(holding.current_value_inr) : '••••••'}
                                </p>
                                <p className={`text-sm ${holding.pnl_inr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {showBalances ? (
                                    <>
                                      {formatPercentage(holding.pnl_percentage)} ({formatCurrency(holding.pnl_inr)})
                                    </>
                                  ) : '••••••'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Current: {formatCurrency(holding.current_price_inr)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Allocation</span>
                                <span>{((holding.current_value_inr / summary.current_value_inr) * 100).toFixed(1)}%</span>
                              </div>
                              <Progress 
                                value={(holding.current_value_inr / summary.current_value_inr) * 100} 
                                className="h-2" 
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No holdings yet</p>
                        <Button 
                          variant="outline" 
                          className="mt-4" 
                          onClick={() => router.push('/crypto')}
                        >
                          <Bitcoin className="h-4 w-4 mr-2" />
                          Start Trading
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Return</span>
                          <span className={`font-medium ${summary.total_pnl_inr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalances ? formatCurrency(Math.abs(summary.total_pnl_inr)) : '••••••'}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, Math.abs(summary.total_pnl_percentage))} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

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
                              {metrics.riskScore < 30 ? 'Low' : metrics.riskScore < 70 ? 'Medium' : 'High'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Diversification</span>
                            <Badge variant={metrics.diversificationScore > 70 ? 'default' : 'secondary'}>
                              {metrics.diversificationScore > 70 ? 'Good' : 'Needs Improvement'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Your recent cryptocurrency trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      {tradeHistory.length > 0 ? (
                        <div className="space-y-2">
                          {tradeHistory.map((trade, index) => (
                            <motion.div
                              key={trade.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${
                                    trade.trade_type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                  }`}>
                                    {trade.trade_type === 'buy' ? (
                                      <ArrowDownRight className="h-4 w-4" />
                                    ) : (
                                      <ArrowUpRight className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {trade.trade_type === 'buy' ? 'Bought' : 'Sold'} {trade.quantity.toFixed(8)} {trade.symbol}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      @ {formatCurrency(trade.price_inr)} • Fee: {formatCurrency(trade.brokerage_fee)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(trade.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {showBalances ? formatCurrency(trade.net_amount) : '••••••'}
                                  </p>
                                  <Badge variant={trade.status === 'completed' ? 'default' : 'secondary'}>
                                    {trade.status}
                                  </Badge>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No transactions yet</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => router.push('/crypto')}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Start Trading
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </main>
  );
}