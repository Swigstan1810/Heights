// app/(protected)/portfolio/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  BarChart2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Plus,
  AlertCircle,
  Loader2
} from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { motion } from 'framer-motion';

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  created_at: string;
  updated_at: string;
}

interface PortfolioOrder {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  order_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercentage: number;
  monthlyPnL: number;
  monthlyPnLPercentage: number;
  holdingsCount: number;
}

export default function PortfolioPage() {
  const { user, loading: authLoading, isAuthenticated, walletBalance } = useAuth();
  const router = useRouter();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [recentOrders, setRecentOrders] = useState<PortfolioOrder[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    monthlyPnL: 0,
    monthlyPnLPercentage: 0,
    holdingsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirectTo=/portfolio");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load portfolio data
  const loadPortfolioData = async () => {
    if (!user) return;

    try {
      setError(null);
      console.log('[Portfolio] Loading data for user:', user.id);

      // Fetch portfolio holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('current_value', { ascending: false });

      if (holdingsError) {
        console.error('[Portfolio] Error fetching holdings:', holdingsError);
        throw holdingsError;
      }

      // Fetch recent orders (last 10)
      const { data: ordersData, error: ordersError } = await supabase
        .from('portfolio_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('[Portfolio] Error fetching orders:', ordersError);
        throw ordersError;
      }

      console.log('[Portfolio] Holdings loaded:', holdingsData?.length || 0);
      console.log('[Portfolio] Orders loaded:', ordersData?.length || 0);

      setHoldings(holdingsData || []);
      setRecentOrders(ordersData || []);

      // Calculate portfolio statistics
      if (holdingsData && holdingsData.length > 0) {
        const stats = calculatePortfolioStats(holdingsData);
        setPortfolioStats(stats);
      } else {
        setPortfolioStats({
          totalValue: 0,
          totalInvested: 0,
          totalPnL: 0,
          totalPnLPercentage: 0,
          monthlyPnL: 0,
          monthlyPnLPercentage: 0,
          holdingsCount: 0
        });
      }

    } catch (error) {
      console.error('[Portfolio] Error loading data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio statistics
  const calculatePortfolioStats = (holdingsData: PortfolioHolding[]): PortfolioStats => {
    const totalValue = holdingsData.reduce((sum, holding) => sum + Number(holding.current_value), 0);
    const totalInvested = holdingsData.reduce((sum, holding) => sum + Number(holding.total_invested), 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // For monthly P&L, we'll use a simple approximation based on recent performance
    // In a real app, you'd track daily portfolio values
    const monthlyPnL = totalPnL * 0.3; // Approximate 30% of total gains happened this month
    const monthlyPnLPercentage = totalInvested > 0 ? (monthlyPnL / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage,
      monthlyPnL,
      monthlyPnLPercentage,
      holdingsCount: holdingsData.length
    };
  };

  // Refresh portfolio data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

  // Load data when user is available
  useEffect(() => {
    if (user && isAuthenticated) {
      loadPortfolioData();
    }
  }, [user, isAuthenticated]);

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

  // Generate mock chart data (you can replace this with real historical data later)
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    const baseValue = portfolioStats.totalValue || 10000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create some realistic portfolio value variation
      const variation = (Math.random() - 0.5) * 0.1; // ±5% daily variation
      const value = baseValue * (1 + (portfolioStats.totalPnLPercentage / 100) * (1 - i / 30) + variation);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, value)
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Show loading screen
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Overview</h1>
            <p className="text-muted-foreground">Track your investments and performance</p>
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
            <Button asChild>
              <a href="/trade">
                <Plus className="h-4 w-4 mr-2" />
                Start Trading
              </a>
            </Button>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                <PieChart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(portfolioStats.totalValue)}
                </div>
                <p className={`text-xs flex items-center mt-1 ${
                  portfolioStats.totalPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {portfolioStats.totalPnLPercentage >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(portfolioStats.totalPnLPercentage)} all time
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
                <BarChart2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(portfolioStats.totalPnL)}
                </div>
                <p className={`text-xs flex items-center mt-1 ${
                  portfolioStats.monthlyPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {portfolioStats.monthlyPnLPercentage >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(portfolioStats.monthlyPnLPercentage)} this month
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Holdings</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioStats.holdingsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active positions
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Portfolio Chart */}
        {portfolioStats.totalValue > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>30-day portfolio value trend</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1M</Button>
                  <Button variant="outline" size="sm">3M</Button>
                  <Button variant="outline" size="sm">6M</Button>
                  <Button variant="outline" size="sm">1Y</Button>
                  <Button variant="outline" size="sm">ALL</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      minTickGap={30}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      tickFormatter={(value) => formatCurrency(value)}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Portfolio Value"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Holdings Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              {holdings.length > 0 
                ? `${holdings.length} active positions` 
                : 'No holdings yet'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Asset</th>
                      <th className="px-4 py-3 text-left font-medium">Quantity</th>
                      <th className="px-4 py-3 text-left font-medium">Avg. Buy Price</th>
                      <th className="px-4 py-3 text-left font-medium">Current Price</th>
                      <th className="px-4 py-3 text-left font-medium">Value</th>
                      <th className="px-4 py-3 text-left font-medium">Profit/Loss</th>
                      <th className="px-4 py-3 text-left font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">{holding.symbol}</p>
                            <p className="text-xs text-muted-foreground">{holding.name}</p>
                            <Badge variant="outline" className="mt-1">
                              {holding.asset_type}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">{Number(holding.quantity).toFixed(4)}</td>
                        <td className="px-4 py-4">{formatCurrency(Number(holding.average_buy_price))}</td>
                        <td className="px-4 py-4">{formatCurrency(Number(holding.current_price))}</td>
                        <td className="px-4 py-4">{formatCurrency(Number(holding.current_value))}</td>
                        <td className="px-4 py-4">
                          <span className={Number(holding.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatCurrency(Number(holding.profit_loss))}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`flex items-center ${
                            Number(holding.profit_loss_percentage) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {Number(holding.profit_loss_percentage) >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {formatPercentage(Number(holding.profit_loss_percentage))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Holdings Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start investing to see your portfolio here
                </p>
                <Button asChild>
                  <a href="/trade">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Trading
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Your latest trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        order.order_type === 'buy' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}>
                        {order.order_type === 'buy' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.order_type === 'buy' ? 'Bought' : 'Sold'} {order.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.completed_at 
                            ? new Date(order.completed_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit'
                              })
                            : new Date(order.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit'
                              })
                          } • {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{Number(order.quantity).toFixed(4)} {order.symbol}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(order.total_amount))}</p>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                        className="mt-1"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Recent Orders</h3>
                <p className="text-muted-foreground mb-4">
                  Your trading history will appear here
                </p>
                <Button variant="outline" asChild>
                  <a href="/trade">
                    <Plus className="h-4 w-4 mr-2" />
                    Place Your First Order
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(walletBalance?.balance || 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Locked Balance</p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(walletBalance?.locked_balance || 0))}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    Number(walletBalance?.balance || 0) + Number(walletBalance?.locked_balance || 0)
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" asChild>
                <a href="/wallet">
                  <Wallet className="h-4 w-4 mr-2" />
                  Manage Wallet
                </a>
              </Button>
              <Button asChild>
                <a href="/trade">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Start Trading
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}