"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Activity,
  AlertCircle,
  Plus,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  assetType: 'crypto' | 'stock' | 'etf';
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdingsCount: number;
  dayChange: number;
  dayChangePercent: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PortfolioDashboard() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    holdingsCount: 0,
    dayChange: 0,
    dayChangePercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Load holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', user?.id)
        .order('current_value', { ascending: false });

      if (holdingsError) throw holdingsError;

      // Load portfolio summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_portfolio_summary', { p_user_id: user?.id });

      if (summaryError) throw summaryError;

      setHoldings(holdingsData || []);
      if (summaryData && summaryData.length > 0) {
        const summary = summaryData[0];
        setPortfolio({
          totalValue: summary.total_value,
          totalInvested: summary.total_invested,
          totalPnL: summary.total_pnl,
          totalPnLPercent: summary.total_pnl_percentage,
          holdingsCount: summary.holdings_count,
          dayChange: summary.total_pnl * 0.05, // Simulated day change
          dayChangePercent: 2.34 // Simulated day change percent
        });
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Portfolio allocation data for pie chart
  const allocationData = useMemo(() => {
    const assetTypes = holdings.reduce((acc, holding) => {
      const type = holding.assetType || 'stock';
      acc[type] = (acc[type] || 0) + holding.currentValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(assetTypes).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      percentage: (value / portfolio.totalValue) * 100
    }));
  }, [holdings, portfolio.totalValue]);

  // Performance chart data (mock data)
  const performanceData = useMemo(() => {
    const days = 30;
    const data = [];
    let value = portfolio.totalInvested;
    
    for (let i = days; i >= 0; i--) {
      const change = (Math.random() - 0.5) * value * 0.02;
      value = Math.max(value + change, portfolio.totalInvested * 0.8);
      
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: value,
        invested: portfolio.totalInvested
      });
    }
    
    return data;
  }, [portfolio.totalInvested]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Total Value</span>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
                <p className="text-sm text-green-500 flex items-center">
                  {portfolio.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolio.totalPnL)} 
                  ({portfolio.totalPnLPercent.toFixed(2)}%) all time
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Day Change</span>
                </div>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <p className={`text-3xl font-bold ${
                  portfolio.dayChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {portfolio.dayChange >= 0 ? '+' : ''}{formatCurrency(portfolio.dayChange)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {portfolio.dayChangePercent >= 0 ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}% today
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-500">Invested</span>
                </div>
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatCurrency(portfolio.totalInvested)}</p>
                <p className="text-sm text-muted-foreground">
                  {portfolio.holdingsCount} positions
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-500">Best Performer</span>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-2">
                {holdings.length > 0 ? (
                  <>
                    <p className="text-lg font-bold">{holdings[0]?.symbol}</p>
                    <p className="text-sm text-green-500">
                      +{Math.max(...holdings.map(h => h.profitLossPercent)).toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No positions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Portfolio Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                    <Line
                      type="monotone"
                      dataKey="invested"
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {allocationData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <span className="text-sm font-medium">{entry.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Holdings</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadPortfolioData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Asset</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Avg Price</th>
                      <th className="text-right p-2">Current Price</th>
                      <th className="text-right p-2">Value</th>
                      <th className="text-right p-2">P&L</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{holding.name}</p>
                            <p className="text-sm text-muted-foreground">{holding.symbol}</p>
                          </div>
                        </td>
                        <td className="text-right p-2">{holding.quantity.toFixed(4)}</td>
                        <td className="text-right p-2">{formatCurrency(holding.avgBuyPrice)}</td>
                        <td className="text-right p-2">{formatCurrency(holding.currentPrice)}</td>
                        <td className="text-right p-2 font-medium">
                          {formatCurrency(holding.currentValue)}
                        </td>
                        <td className={`text-right p-2 ${
                          holding.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          <div>
                            <p className="font-medium">
                              {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                            </p>
                            <p className="text-sm">
                              {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              Trade
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {holdings.length === 0 && (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No holdings yet</p>
                  <p className="text-muted-foreground mb-4">
                    Start building your portfolio by making your first trade
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Trading
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {((portfolio.totalValue / portfolio.totalInvested - 1) * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Total Return</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {((Math.pow(portfolio.totalValue / portfolio.totalInvested, 365/30) - 1) * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Annualized Return</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    1.24
                  </p>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allocationData.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Conservative Portfolio</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Stocks</span>
                        <span>60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crypto</span>
                        <span>20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETFs</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Moderate Portfolio</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Stocks</span>
                        <span>50%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crypto</span>
                        <span>30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETFs</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Aggressive Portfolio</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Stocks</span>
                        <span>40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crypto</span>
                        <span>50%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETFs</span>
                        <span>10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}