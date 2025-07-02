// app/(protected)/portfolio/page.tsx - Connected to Crypto Trading
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/navbar';
import { HeightsTradingInterface } from '@/components/trading/heights-trading-interface';
import { createHeightsTokenContract, HeightsTokenUtils } from '@/lib/contracts/heights-token';
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
  EyeOff,
  Building2,
  Coins,
  Banknote,
  Star,
  Sparkles,
  Zap,
  ExternalLink,
  Plus,
  Minus,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import Link from 'next/link';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ethers } from 'ethers';
import { HeightsWallet } from '@/components/wallet/heights-wallet';
import { brokerageEngine } from '@/lib/services/brokerage-engine';

// Interfaces
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
  updated_at: string;
  wallet_address?: string;
  network?: string;
  is_heights_token?: boolean;
}

interface TradeRecord {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price_inr: number;
  total_inr: number;
  brokerage_fee: number;
  status: string;
  executed_at: string;
}

interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_pnl: number;
  total_pnl_percentage: number;
  holdings_count: number;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ConnectedPortfolioPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { refreshAllData } = useRealtimeSync();
  const supabase = createClientComponentClient();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
  const [cryptoHoldings, setCryptoHoldings] = useState<PortfolioHolding[]>([]);
  const [stockHoldings, setStockHoldings] = useState<PortfolioHolding[]>([]);
  const [mfHoldings, setMfHoldings] = useState<PortfolioHolding[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeRecord[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    total_value: 0,
    total_invested: 0,
    total_pnl: 0,
    total_pnl_percentage: 0,
    holdings_count: 0
  });
  const [walletBalance, setWalletBalance] = useState(500000);

  // Demo data for stocks and MFs (for Laven Patel demo)
  const demoStockHoldings = [
    {
      id: 'stock-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      asset_type: 'stock',
      quantity: 15,
      average_buy_price: 15066, // INR
      current_price: 15482, // INR  
      total_invested: 225990,
      current_value: 232230,
      profit_loss: 6240,
      profit_loss_percentage: 2.76,
      updated_at: new Date().toISOString()
    },
    {
      id: 'stock-2',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      asset_type: 'stock',
      quantity: 8,
      average_buy_price: 11295, // INR
      current_price: 11712, // INR
      total_invested: 90360,
      current_value: 93696,
      profit_loss: 3336,
      profit_loss_percentage: 3.69,
      updated_at: new Date().toISOString()
    },
    {
      id: 'stock-3',
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries',
      asset_type: 'stock',
      quantity: 25,
      average_buy_price: 2850,
      current_price: 2920,
      total_invested: 71250,
      current_value: 73000,
      profit_loss: 1750,
      profit_loss_percentage: 2.46,
      updated_at: new Date().toISOString()
    }
  ];

  const demoMFHoldings = [
    {
      id: 'mf-1',
      symbol: 'HDFC_EQUITY',
      name: 'HDFC Equity Fund',
      asset_type: 'mutual_fund',
      quantity: 150,
      average_buy_price: 680,
      current_price: 695,
      total_invested: 102000,
      current_value: 104250,
      profit_loss: 2250,
      profit_loss_percentage: 2.21,
      updated_at: new Date().toISOString()
    },
    {
      id: 'mf-2',
      symbol: 'ICICI_BLUE_CHIP',
      name: 'ICICI Prudential Bluechip Fund',
      asset_type: 'mutual_fund',
      quantity: 200,
      average_buy_price: 58,
      current_price: 60,
      total_invested: 11600,
      current_value: 12000,
      profit_loss: 400,
      profit_loss_percentage: 3.45,
      updated_at: new Date().toISOString()
    }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/portfolio');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Enhanced Heights Token integration
  const addHeightsTokenBalance = async () => {
    if (!user) return;
    try {
      // Get HGT balance from smart contract using Heights Token contract
      const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
      const hgtContract = createHeightsTokenContract(provider);
      
      // Get user's Heights wallet address
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('wallet_address')
        .eq('user_id', user.id)
        .eq('type', 'heights')
        .eq('network', 'arbitrum')
        .single();

      if (wallet) {
        const balance = await hgtContract.balanceOf(wallet.wallet_address);
        const formattedBalance = ethers.formatEther(balance);
        
        // Get token info for accurate pricing
        const tokenInfo = await hgtContract.getTokenInfo();
        
        if (parseFloat(formattedBalance) > 0) {
          const hgtPrice = 0.002; // HGT initial price in USD, update from price feed
          const hgtPriceINR = hgtPrice * 83.25; // Convert to INR
          
          setCryptoHoldings(prev => {
            const filtered = prev.filter(h => h.symbol !== 'HGT');
            return [...filtered, {
              id: 'hgt-arbitrum',
              symbol: 'HGT',
              name: 'Heights Token',
              asset_type: 'crypto',
              quantity: parseFloat(formattedBalance),
              average_buy_price: hgtPriceINR,
              current_price: hgtPriceINR,
              total_invested: parseFloat(formattedBalance) * hgtPriceINR,
              current_value: parseFloat(formattedBalance) * hgtPriceINR,
              profit_loss: 0, // Calculate based on purchase history
              profit_loss_percentage: 0,
              updated_at: new Date().toISOString(),
              wallet_address: wallet.wallet_address,
              network: 'arbitrum',
              is_heights_token: true
            }];
          });
        }
      }
    } catch (error) {
      console.error('Error loading HGT balance:', error);
    }
  };

  // Fetch portfolio data from API
  const fetchPortfolioData = useCallback(async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      
      const [holdingsRes, summaryRes, tradesRes, balanceRes] = await Promise.all([
        supabase.from('portfolio_holdings').select('*').eq('user_id', user.id).gt('quantity', 0),
        supabase.from('portfolio_summary_view').select('*').eq('user_id', user.id).single(),
        supabase.from('crypto_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('wallet_balance').select('balance, currency').eq('user_id', user.id).eq('currency', 'INR').single()
      ]);

      if (holdingsRes.data) {
        const cryptoHoldings = holdingsRes.data.filter((h: any) => h.asset_type === 'crypto');
        setCryptoHoldings(cryptoHoldings);
        setPortfolioHoldings(holdingsRes.data);
        
        setStockHoldings(demoStockHoldings);
        setMfHoldings(demoMFHoldings);
      }

      if (summaryRes.data) {
        const cryptoSummary = summaryRes.data;
        const stockValue = demoStockHoldings.reduce((sum, h) => sum + h.current_value, 0);
        const mfValue = demoMFHoldings.reduce((sum, h) => sum + h.current_value, 0);
        
        const totalValue = (Number(cryptoSummary.total_value) || 0) + stockValue + mfValue;
        const totalInvested = (Number(cryptoSummary.total_invested) || 0) + 
          demoStockHoldings.reduce((sum, h) => sum + h.total_invested, 0) +
          demoMFHoldings.reduce((sum, h) => sum + h.total_invested, 0);
        
        setPortfolioSummary({
          total_value: totalValue,
          total_invested: totalInvested,
          total_pnl: totalValue - totalInvested,
          total_pnl_percentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
          holdings_count: (Number(cryptoSummary.holdings_count) || 0) + demoStockHoldings.length + demoMFHoldings.length
        });
      }

      if (balanceRes.data) {
        setWalletBalance(Number(balanceRes.data.balance) || 500000);
      }

      if (tradesRes.data) {
        setRecentTrades(tradesRes.data.map(trade => ({
          id: trade.id,
          symbol: trade.symbol,
          trade_type: trade.trade_type,
          quantity: trade.quantity,
          price_inr: trade.price_inr,
          total_inr: trade.total_inr,
          brokerage_fee: trade.brokerage_fee,
          status: trade.status,
          executed_at: trade.executed_at || trade.created_at
        })));
      }

      // Add Heights Token check
      await addHeightsTokenBalance();

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast.error('Failed to fetch portfolio data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user, supabase]);

  // Format currency
  const formatINR = (value: number) => {
    if (!value || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return '$0.00';
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

  // Get crypto icon
  const getCryptoIcon = (symbol: string) => {
    const iconMap: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'SOL': '◎',
      'MATIC': '⬡',
      'LINK': '🔗',
      'AVAX': '▲',
      'ADA': '₳',
      'UNI': '🦄',
      'AAVE': 'Ⓐ'
    };
    return iconMap[symbol] || symbol.charAt(0);
  };

  // Pie chart data for asset allocation
  const pieChartData = [
    { 
      name: 'Crypto', 
      value: cryptoHoldings.reduce((sum, h) => sum + h.current_value, 0), 
      color: CHART_COLORS[0] 
    },
    { 
      name: 'Stocks', 
      value: demoStockHoldings.reduce((sum, h) => sum + h.current_value, 0), 
      color: CHART_COLORS[1] 
    },
    { 
      name: 'Mutual Funds', 
      value: demoMFHoldings.reduce((sum, h) => sum + h.current_value, 0), 
      color: CHART_COLORS[2] 
    }
  ];

  const handleRefresh = async () => {
    await fetchPortfolioData();
    toast.success('Portfolio data refreshed');
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user, fetchPortfolioData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && user) {
        fetchPortfolioData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshing, user, fetchPortfolioData]);

  // Add useEffect for syncAllData and portfolioUpdate
  useEffect(() => {
    const handleSyncData = () => {
      fetchPortfolioData();
    };

    window.addEventListener('syncAllData', handleSyncData);
    window.addEventListener('portfolioUpdate', handleSyncData);

    return () => {
      window.removeEventListener('syncAllData', handleSyncData);
      window.removeEventListener('portfolioUpdate', handleSyncData);
    };
  }, [fetchPortfolioData]);

  // Add fee report component to Activity Tab
  const FeeReport = () => {
    const [feeReport, setFeeReport] = useState<any>(null);
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');
    useEffect(() => {
      if (user) {
        brokerageEngine.getUserFeeReport(user.id, period).then(setFeeReport);
      }
    }, [user, period]);
    if (!feeReport) return null;
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Fee Report
          </CardTitle>
          <div className="flex gap-2">
            {(['day', 'week', 'month', 'all'] as const).map(p => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">${feeReport.totalFees.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average per Trade</p>
                <p className="text-2xl font-bold">${feeReport.averageFeePerTrade.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Fees by Type</p>
              <div className="space-y-1">
                {Object.entries(feeReport.feesByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">${(amount as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Heights charges only 0.08% on trades - lower than most competitors!
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isInitialized || loading) {
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

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 pb-16">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white">
                  <PieChart className="h-6 w-6" />
                </div>
                Portfolio Overview
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Real-time portfolio tracking with live crypto trading integration
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="gap-2"
              >
                {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="hidden sm:inline">{showBalances ? 'Hide' : 'Show'}</span>
              </Button>
              
              <Link href="/crypto">
                <Button variant="outline" size="sm" className="gap-2">
                  <Bitcoin className="h-4 w-4" />
                  <span className="hidden sm:inline">Trade Crypto</span>
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/10 dark:to-blue-950/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                    <p className="text-3xl font-bold">
                      {showBalances ? formatINR(portfolioSummary.total_value) : '••••••'}
                    </p>
                    <div className={`flex items-center gap-1 mt-2 ${portfolioSummary.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {portfolioSummary.total_pnl >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {showBalances ? formatPercentage(portfolioSummary.total_pnl_percentage) : '••••'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
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
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
                    <p className={`text-3xl font-bold ${portfolioSummary.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {showBalances ? formatINR(Math.abs(portfolioSummary.total_pnl)) : '••••••'}
                    </p>
                    <p className={`text-sm mt-2 ${portfolioSummary.total_pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {showBalances ? formatPercentage(portfolioSummary.total_pnl_percentage) : '••••'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${portfolioSummary.total_pnl >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                    {portfolioSummary.total_pnl >= 0 ? (
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
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available Cash</p>
                    <p className="text-2xl font-bold">
                      {showBalances ? formatINR(walletBalance) : '••••••'}
                    </p>
                    <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      INR Wallet
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-full">
                    <Wallet className="h-6 w-6 text-blue-500" />
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
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
                    <p className="text-3xl font-bold">
                      {portfolioSummary.holdings_count}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>{cryptoHoldings.length} Crypto</span>
                      <span>•</span>
                      <span>{demoStockHoldings.length} Stocks</span>
                      <span>•</span>
                      <span>{demoMFHoldings.length} MFs</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 h-14">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-950/20">
              <PieChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 dark:data-[state=active]:bg-orange-950/20">
              <Bitcoin className="h-4 w-4 mr-2" />
              Crypto
              {cryptoHoldings.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cryptoHoldings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stocks" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-950/20">
              <Building2 className="h-4 w-4 mr-2" />
              Stocks
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {demoStockHoldings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mutualfunds" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 dark:data-[state=active]:bg-purple-950/20">
              <Banknote className="h-4 w-4 mr-2" />
              Mutual Funds
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {demoMFHoldings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 dark:data-[state=active]:bg-pink-950/20">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation Chart */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald-500" />
                    Asset Allocation
                  </CardTitle>
                  <CardDescription>Portfolio distribution by asset class</CardDescription>
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
                          label={({ name, value }) => `${name} ${((value / portfolioSummary.total_value) * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatINR(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Manage your portfolio easily</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/crypto">
                    <Button className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                      <Bitcoin className="h-5 w-5" />
                      Trade Cryptocurrencies
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full justify-start gap-3 h-12" disabled>
                    <Building2 className="h-5 w-5" />
                    Trade Stocks
                    <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-3 h-12" disabled>
                    <Banknote className="h-5 w-5" />
                    Invest in Mutual Funds
                    <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Funds
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Minus className="h-4 w-4" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pieChartData.map((asset, index) => (
                <Card key={asset.name} className="border-2 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {asset.name === 'Crypto' && <Bitcoin className="h-5 w-5 text-orange-500" />}
                        {asset.name === 'Stocks' && <Building2 className="h-5 w-5 text-blue-500" />}
                        {asset.name === 'Mutual Funds' && <Banknote className="h-5 w-5 text-purple-500" />}
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.name === 'Crypto' && `${cryptoHoldings.length} assets`}
                            {asset.name === 'Stocks' && `${demoStockHoldings.length} assets`}
                            {asset.name === 'Mutual Funds' && `${demoMFHoldings.length} funds`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{showBalances ? formatINR(asset.value) : '••••••'}</p>
                        <p className="text-sm text-muted-foreground">
                          {((asset.value / portfolioSummary.total_value) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(asset.value / portfolioSummary.total_value) * 100} 
                      className="h-2"
                      style={{ 
                        background: `linear-gradient(to right, ${asset.color}20 0%, ${asset.color}20 100%)` 
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Cryptocurrency Holdings</h3>
                <p className="text-muted-foreground">Live crypto portfolio with real-time P&L</p>
              </div>
              <Link href="/crypto">
                <Button className="gap-2">
                  <Bitcoin className="h-4 w-4" />
                  Trade Crypto
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {cryptoHoldings.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                    <Bitcoin className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Crypto Holdings</h3>
                  <p className="text-muted-foreground mb-4">Start trading cryptocurrencies to build your crypto portfolio</p>
                  <Link href="/crypto">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Start Trading Crypto
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cryptoHoldings.map((crypto, index) => (
                  <motion.div
                    key={crypto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${
                      crypto.is_heights_token 
                        ? 'border-gradient-to-r from-purple-500 to-pink-500 bg-gradient-to-br from-purple-50/20 to-pink-50/20 dark:from-purple-950/10 dark:to-pink-950/10' 
                        : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              crypto.is_heights_token 
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                : 'bg-gradient-to-br from-orange-500 to-yellow-500'
                            }`}>
                              {crypto.is_heights_token ? 'H' : getCryptoIcon(crypto.symbol)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-lg">{crypto.name}</p>
                                {crypto.is_heights_token && (
                                  <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                    <Star className="h-3 w-3 mr-1" />
                                    Platform Token
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {crypto.quantity.toFixed(6)} {crypto.symbol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg: {formatINR(crypto.average_buy_price)}
                              </p>
                              {crypto.is_heights_token && (
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                  Network: Arbitrum • Auto-detected
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {showBalances ? formatINR(crypto.current_value) : '••••••'}
                            </p>
                            <p className={`text-sm ${crypto.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {showBalances ? formatINR(crypto.profit_loss) : '••••'}
                            </p>
                            <p className={`text-xs ${crypto.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {showBalances ? formatPercentage(crypto.profit_loss_percentage) : '••••'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Current Price</span>
                            <span>{formatINR(crypto.current_price)}</span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, crypto.profit_loss_percentage + 50))} 
                            className="h-2" 
                          />
                          {crypto.is_heights_token && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                🎉 As a Heights Token holder, you get reduced trading fees and governance rights!
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Crypto Summary */}
                <Card className="border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Crypto Value</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatINR(cryptoHoldings.reduce((sum, h) => sum + h.current_value, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total P&L</p>
                        <p className="text-lg font-semibold text-green-500">
                          +{formatPercentage(cryptoHoldings.reduce((sum, h) => sum + h.profit_loss_percentage, 0) / cryptoHoldings.length)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Stock Holdings</h3>
                <p className="text-muted-foreground">Your equity portfolio positions</p>
              </div>
              <Button variant="outline" disabled className="gap-2">
                <Building2 className="h-4 w-4" />
                Trade Stocks
                <Badge variant="secondary">Coming Soon</Badge>
              </Button>
            </div>

            <div className="space-y-4">
              {demoStockHoldings.map((stock, index) => (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                            {stock.symbol.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{stock.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {stock.quantity} shares
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg: {formatINR(stock.average_buy_price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {showBalances ? formatINR(stock.current_value) : '••••••'}
                          </p>
                          <p className={`text-sm ${stock.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalances ? formatINR(stock.profit_loss) : '••••'}
                          </p>
                          <p className={`text-xs ${stock.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalances ? formatPercentage(stock.profit_loss_percentage) : '••••'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Current Price</span>
                          <span>{formatINR(stock.current_price)}</span>
                        </div>
                        <Progress 
                          value={Math.min(100, Math.max(0, stock.profit_loss_percentage + 50))} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Mutual Funds Tab */}
          <TabsContent value="mutualfunds" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mutual Fund Holdings</h3>
                <p className="text-muted-foreground">Your mutual fund investments</p>
              </div>
              <Button variant="outline" disabled className="gap-2">
                <Banknote className="h-4 w-4" />
                Invest in MFs
                <Badge variant="secondary">Coming Soon</Badge>
              </Button>
            </div>

            <div className="space-y-4">
              {demoMFHoldings.map((fund, index) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {fund.symbol.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{fund.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {fund.quantity} units
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                Avg NAV: {formatINR(fund.average_buy_price)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {fund.asset_type === 'mutual_fund' ? 'Large Cap' : 'Equity'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {showBalances ? formatINR(fund.current_value) : '••••••'}
                          </p>
                          <p className={`text-sm ${fund.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalances ? formatINR(fund.profit_loss) : '••••'}
                          </p>
                          <p className={`text-xs ${fund.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalances ? formatPercentage(fund.profit_loss_percentage) : '••••'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Current NAV</span>
                          <span>{formatINR(fund.current_price)}</span>
                        </div>
                        <Progress 
                          value={Math.min(100, Math.max(0, fund.profit_loss_percentage + 50))} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <p className="text-muted-foreground mb-6">Your latest transactions and portfolio changes</p>
            </div>

            {recentTrades.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                    <Activity className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground mb-4">Start trading to see your transaction history</p>
                  <Link href="/crypto">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Start Trading
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade, index) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              trade.trade_type === 'buy' 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-600' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-600'
                            }`}>
                              {trade.trade_type === 'buy' ? (
                                <Plus className="h-4 w-4" />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {trade.trade_type === 'buy' ? 'Bought' : 'Sold'} {trade.symbol}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {trade.quantity.toFixed(6)} {trade.symbol} at {formatINR(trade.price_inr)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trade.executed_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatINR(trade.total_inr)}</p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={trade.status === 'completed' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {trade.status === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </>
                                ) : (
                                  trade.status
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Fee: {formatINR(trade.brokerage_fee)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
            <FeeReport />
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Heights Wallet
                </CardTitle>
                <CardDescription>
                  Your non-custodial wallet for trading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/wallet">
                  <Button className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Open Wallet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}