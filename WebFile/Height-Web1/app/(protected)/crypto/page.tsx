// app/(protected)/crypto/page.tsx - Integrated with Portfolio
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/navbar';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Search,
  Info,
  DollarSign,
  BarChart3,
  AlertCircle,
  Star,
  Plus,
  Minus,
  ChevronDown,
  Sparkles,
  Target,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Bitcoin,
  LineChart,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedTradingViewWidget from '@/components/trading/tradingview-widget';

interface CryptoData {
  id?: string;
  symbol: string;
  name: string;
  price_usd: number;
  price_inr: number;
  change_24h: number;
  change_24h_percent: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  coinbase_product_id?: string;
  last_updated?: string;
  isFavorite?: boolean;
}

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
}

interface WalletBalance {
  balance: number;
  currency: string;
}

export const dynamic = "force-dynamic";

export default function IntegratedCryptoPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  // State management
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('volume');
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ balance: 500000, currency: 'INR' });
  const [portfolioSummary, setPortfolioSummary] = useState({
    total_value: 0,
    total_invested: 0,
    total_pnl: 0,
    total_pnl_percentage: 0,
    holdings_count: 0
  });

  // Demo holdings for Laven Patel
  const demoHoldings = [
    { symbol: 'BTC', balance: 0.0156, value: 45000 * 0.0156, change: 5.2 },
    { symbol: 'ETH', balance: 0.25, value: 3000 * 0.25, change: 3.8 },
    { symbol: 'SOL', balance: 5.8, value: 100 * 5.8, change: -2.1 },
    { symbol: 'ADA', balance: 1200, value: 0.5 * 1200, change: 8.4 },
    { symbol: 'MATIC', balance: 850, value: 0.8 * 850, change: 1.9 }
  ];

  // Check authentication
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/crypto');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Fetch crypto markets data
  const fetchCryptoData = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/crypto/markets');
      const result = await response.json();
      
      if (result.success) {
        const formattedData = result.data.map((crypto: any) => ({
          ...crypto,
          isFavorite: favorites.has(crypto.symbol)
        }));
        
        setCryptoData(formattedData);
        setFilteredData(formattedData);
        
        if (!selectedCrypto && formattedData.length > 0) {
          setSelectedCrypto(formattedData[0]);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch crypto data');
      }
    } catch (error: any) {
      console.error('Error fetching crypto data:', error);
      setError(error.message || 'Failed to fetch crypto data');
    }
  }, [favorites, selectedCrypto]);

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch holdings and summary
      const [holdingsRes, summaryRes] = await Promise.all([
        fetch('/api/portfolio?action=holdings'),
        fetch('/api/portfolio?action=summary')
      ]);

      // Fetch balance separately with error handling
      let balanceData = { balance: { balance: 500000, currency: 'INR' } };
      try {
        const balanceRes = await fetch('/api/portfolio?action=balance');
        if (balanceRes.ok) {
          balanceData = await balanceRes.json();
        }
      } catch (balanceError) {
        console.log('Using default balance');
      }

      const [holdingsData, summaryData] = await Promise.all([
        holdingsRes.json(),
        summaryRes.json()
      ]);

      if (holdingsData.holdings) {
        setPortfolioHoldings(holdingsData.holdings.filter((h: any) => h.asset_type === 'crypto'));
      }

      if (summaryData.summary) {
        setPortfolioSummary(summaryData.summary);
      }

      if (balanceData.balance) {
        setWalletBalance({
          balance: Number(balanceData.balance.balance) || 500000,
          currency: balanceData.balance.currency || 'INR'
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast.error('Failed to load portfolio data');
    }
  }, [user]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/crypto/favorites');
      const result = await response.json();
      
      if (result.success && result.data) {
        setFavorites(new Set(result.data.map((item: any) => item.symbol)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [user]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (crypto: CryptoData) => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    const newFavorites = new Set(favorites);
    
    try {
      if (favorites.has(crypto.symbol)) {
        newFavorites.delete(crypto.symbol);
        await fetch('/api/crypto/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: crypto.symbol })
        });
        toast.success(`${crypto.name} removed from favorites`);
      } else {
        newFavorites.add(crypto.symbol);
        await fetch('/api/crypto/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: crypto.symbol, name: crypto.name })
        });
        toast.success(`${crypto.name} added to favorites`);
      }
      
      setFavorites(newFavorites);
      
      const updatedData = cryptoData.map(c => ({
        ...c,
        isFavorite: newFavorites.has(c.symbol)
      }));
      setCryptoData(updatedData);
      setFilteredData(updatedData);
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite');
    }
  }, [user, favorites, cryptoData]);

  // Formatters
  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 8 : 2,
    }).format(value);
  };

  const formatINR = (value: number) => {
    if (!value || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return formatCurrency(value);
  };

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

  const handleTrade = useCallback(async () => {
    if (!selectedCrypto || !user) {
      toast.error('Please select a cryptocurrency and ensure you are logged in');
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsTrading(true);
    try {
      const amount = parseFloat(tradeAmount);
      const priceUSD = selectedCrypto.price_usd;
      const priceINR = selectedCrypto.price_inr;
      
      let quantity: number;
      let totalINR: number;

      if (tradeType === 'buy') {
        totalINR = amount;
        quantity = totalINR / priceINR;
        
        if (totalINR > walletBalance.balance) {
          toast.error(`Insufficient balance. Available: ${formatINR(walletBalance.balance)}`);
          setIsTrading(false);
          return;
        }
      } else {
        quantity = amount;
        totalINR = quantity * priceINR;
        
        const userHolding = portfolioHoldings.find(h => h.symbol === selectedCrypto.symbol);
        if (!userHolding || quantity > userHolding.quantity) {
          toast.error(`Insufficient ${selectedCrypto.symbol}. Available: ${userHolding?.quantity.toFixed(6) || '0'}`);
          setIsTrading(false);
          return;
        }
      }
      
      const response = await fetch('/api/crypto/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedCrypto.symbol,
          tradeType,
          quantity,
          priceUSD,
          totalINR,
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        // Real-time state updates
        const brokerageFee = Math.max(10, Math.min(1000, totalINR * 0.001));
        
          setWalletBalance(prev => ({
            ...prev,
          balance: tradeType === 'buy' 
            ? prev.balance - totalINR - brokerageFee
            : prev.balance + totalINR - brokerageFee
        }));
        
        setPortfolioHoldings(prev => {
          const existingIndex = prev.findIndex(h => h.symbol === selectedCrypto.symbol);
          if (existingIndex >= 0) {
            const updated = [...prev];
            if (result.data.newQuantity > 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: result.data.newQuantity,
                current_value: result.data.newCurrentValue,
                profit_loss: result.data.newProfitLoss,
                profit_loss_percentage: result.data.newProfitLossPercentage,
                current_price: priceINR
              };
        } else {
              updated.splice(existingIndex, 1);
            }
            return updated;
          } else if (tradeType === 'buy') {
            return [...prev, {
              id: `temp-${Date.now()}`,
              symbol: selectedCrypto.symbol,
              name: selectedCrypto.name,
              asset_type: 'crypto',
              quantity: quantity,
              average_buy_price: priceINR,
              current_price: priceINR,
              total_invested: totalINR,
              current_value: totalINR,
              profit_loss: 0,
              profit_loss_percentage: 0
            }];
        }
          return prev;
        });
        
        // Trigger real-time sync across pages
        const event = new CustomEvent('portfolioUpdate', {
          detail: { type: tradeType, symbol: selectedCrypto.symbol, quantity, totalINR }
        });
        window.dispatchEvent(event);
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {tradeType === 'buy' ? 'Bought' : 'Sold'} {quantity.toFixed(6)} {selectedCrypto.symbol} for {formatINR(totalINR)}
            </span>
          </div>
        );
        
        setTradeAmount('');
      } else {
        throw new Error(result.error || 'Trade execution failed');
      }
    } catch (error: any) {
      console.error('Trade error:', error);
      toast.error(error.message || 'Failed to execute trade');
    } finally {
      setIsTrading(false);
    }
  }, [selectedCrypto, user, tradeAmount, tradeType, walletBalance.balance, portfolioHoldings, formatINR]);

  // Search and filter
  useEffect(() => {
    let filtered = [...cryptoData];
    
    if (searchQuery) {
      filtered = filtered.filter(crypto => 
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price_usd - a.price_usd;
        case 'change':
          return b.change_24h_percent - a.change_24h_percent;
        case 'volume':
        default:
          return b.volume_24h - a.volume_24h;
      }
    });
    
    setFilteredData(filtered);
  }, [cryptoData, searchQuery, sortBy]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCryptoData(),
          fetchPortfolioData(),
          loadFavorites()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchCryptoData, fetchPortfolioData, loadFavorites]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing) {
        fetchCryptoData();
        fetchPortfolioData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isRefreshing, fetchCryptoData, fetchPortfolioData]);

  // Loading skeleton
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 h-96 bg-muted rounded-lg"></div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-muted rounded-lg"></div>
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            </div>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-border/50 p-6 md:p-8">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl shadow-lg">
                      <Bitcoin className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Crypto Trading
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Sparkles className="h-4 w-4" />
                        Integrated portfolio tracking with real-time trading
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Portfolio Summary */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <PieChart className="h-4 w-4 text-purple-500" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {showBalances ? formatINR(portfolioSummary.total_value * 83) : '••••••'}
                      </div>
                      <div className={`text-xs ${portfolioSummary.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {showBalances ? `${portfolioSummary.total_pnl >= 0 ? '+' : ''}${portfolioSummary.total_pnl_percentage.toFixed(2)}%` : '••••'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Wallet Balance */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-sm">
                      {showBalances ? formatINR(walletBalance.balance) : '••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalances(!showBalances)}
                      className="h-6 w-6 p-0"
                    >
                      {showBalances ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <ConnectWalletButton />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRefreshing(true);
                      Promise.all([fetchCryptoData(), fetchPortfolioData()]).finally(() => {
                        setIsRefreshing(false);
                      });
                    }}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="mt-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Crypto List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-350px)] shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-emerald-500" />
                      Live Markets
                    </CardTitle>
                    <CardDescription>Real-time crypto prices</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    {filteredData.length}
                  </Badge>
                </div>
                
                <div className="space-y-3 pt-4">
                  {/* Enhanced Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cryptocurrencies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-border/50 focus:bg-background"
                    />
                  </div>
                  
                  {/* Enhanced Sort Options */}
                  <div className="flex gap-2">
                    {[
                      { id: 'volume', label: 'Volume', icon: DollarSign },
                      { id: 'price', label: 'Price', icon: Target },
                      { id: 'change', label: '24h %', icon: TrendingUp }
                    ].map(({ id, label, icon: Icon }) => (
                      <Button
                        key={id}
                        size="sm"
                        variant={sortBy === id ? 'default' : 'outline'}
                        onClick={() => setSortBy(id as any)}
                        className="flex-1 gap-1 h-8"
                      >
                        <Icon className="h-3 w-3" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {filteredData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No cryptocurrencies found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-500px)]">
                    <div className="space-y-1 p-3">
                      <AnimatePresence>
                        {filteredData.map((crypto, index) => {
                          const userHolding = portfolioHoldings.find(h => h.symbol === crypto.symbol);
                          return (
                            <motion.div
                              key={crypto.symbol}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.02 }}
                              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/50 group border ${
                                selectedCrypto?.symbol === crypto.symbol 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-md' 
                                  : 'border-transparent hover:border-border/50'
                              }`}
                              onClick={() => setSelectedCrypto(crypto)}
                            >
                              {/* Portfolio Indicator */}
                              {userHolding && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* Crypto Icon */}
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                      {getCryptoIcon(crypto.symbol)}
                                    </div>
                                    
                                    {/* Favorite Star */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(crypto);
                                      }}
                                    >
                                      <Star className={`h-3 w-3 ${crypto.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                    </Button>
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold text-sm">{crypto.name}</p>
                                    <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                                    {userHolding && (
                                      <p className="text-xs text-green-600 font-medium">
                                        {userHolding.quantity.toFixed(6)} held
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-semibold text-sm">{formatCurrency(crypto.price_usd)}</p>
                                  <div className={`text-xs flex items-center justify-end gap-1 ${
                                    crypto.change_24h_percent >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {crypto.change_24h_percent >= 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {crypto.change_24h_percent.toFixed(2)}%
                                  </div>
                                  {userHolding && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatINR(userHolding.current_value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Trading Interface */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCrypto ? (
              <>
                {/* Enhanced Crypto Info */}
                <Card className="overflow-hidden shadow-xl border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/10 dark:to-blue-950/10 p-6 border-b border-border/50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {getCryptoIcon(selectedCrypto.symbol)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold">{selectedCrypto.name}</h2>
                              <Badge variant="outline" className="text-green-600 border-green-500/50 bg-green-500/10">
                                <Activity className="h-3 w-3 mr-1" />
                                Live
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{selectedCrypto.coinbase_product_id || `${selectedCrypto.symbol}-USD`}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            {formatCurrency(selectedCrypto.price_usd)}
                          </p>
                          <div className={`flex items-center justify-end gap-2 mt-1 ${
                            selectedCrypto.change_24h_percent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedCrypto.change_24h_percent >= 0 ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5" />
                            )}
                            <span className="text-lg font-semibold">
                              {selectedCrypto.change_24h_percent >= 0 ? '+' : ''}{selectedCrypto.change_24h_percent.toFixed(2)}%
                            </span>
                            <span className="text-sm text-muted-foreground">(24h)</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Market Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-background/30 backdrop-blur-sm rounded-xl border border-border/30">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">24h High</p>
                          <p className="font-semibold">{formatCurrency(selectedCrypto.high_24h)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">24h Low</p>
                          <p className="font-semibold">{formatCurrency(selectedCrypto.low_24h)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">24h Volume</p>
                          <p className="font-semibold">{formatVolume(selectedCrypto.volume_24h)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Trading Tabs */}
                <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-14">
                        <TabsTrigger value="chart" className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-950/20">
                          <LineChart className="h-4 w-4 mr-2" />
                          Chart
                        </TabsTrigger>
                        <TabsTrigger value="trade" className="flex-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 dark:data-[state=active]:bg-purple-950/20">
                          <Zap className="h-4 w-4 mr-2" />
                          Trade
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="flex-1 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-950/20">
                          <PieChart className="h-4 w-4 mr-2" />
                          Portfolio
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Chart Tab */}
                      <TabsContent value="chart" className="p-0">
                        <div className="h-[500px] w-full">
                          <EnhancedTradingViewWidget
                            symbol={selectedCrypto.symbol}
                            height={500}
                          />
                        </div>
                      </TabsContent>

                      {/* Enhanced Trade Tab */}
                      <TabsContent value="trade" className="p-6">
                        <div className="max-w-md mx-auto space-y-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">Trade {selectedCrypto.symbol}</h3>
                            <p className="text-muted-foreground">Execute instant trades with real portfolio updates</p>
                          </div>

                          <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                              <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Buy
                              </TabsTrigger>
                              <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                <Minus className="h-4 w-4 mr-2" />
                                Sell
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="buy" className="space-y-4 mt-6">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (USD)</label>
                                <Input
                                  type="number"
                                  placeholder="100"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  className="text-lg h-12"
                                />
                                {tradeAmount && selectedCrypto.price_usd > 0 && (
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>≈ {(parseFloat(tradeAmount) / selectedCrypto.price_usd).toFixed(6)} {selectedCrypto.symbol}</p>
                                    <p>Total: {formatINR(parseFloat(tradeAmount) * 83)}</p>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                {[25, 50, 75].map((percent) => (
                                  <Button
                                    key={percent}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTradeAmount(((walletBalance.balance * percent) / 100 / 83).toString())}
                                    className="text-xs"
                                  >
                                    {percent}%
                                  </Button>
                                ))}
                              </div>

                              <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                  Trade will be executed instantly and portfolio updated automatically
                                </AlertDescription>
                              </Alert>

                              <Button
                                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                onClick={handleTrade}
                                disabled={isTrading || !tradeAmount}
                              >
                                {isTrading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-2" />
                                )}
                                Buy {selectedCrypto.symbol}
                              </Button>
                            </TabsContent>
                            
                            <TabsContent value="sell" className="space-y-4 mt-6">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Amount ({selectedCrypto.symbol})</label>
                                <Input
                                  type="number"
                                  placeholder="0.001"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  className="text-lg h-12"
                                  step="0.000001"
                                />
                                {tradeAmount !== '' && !isNaN(Number(tradeAmount)) && selectedCrypto.price_inr > 0 && (
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>≈ {formatINR(parseFloat(tradeAmount) * selectedCrypto.price_inr)}</p>
                                    <p>Price: {formatINR(selectedCrypto.price_inr)} per {selectedCrypto.symbol}</p>
                                  </div>
                                )}
                              </div>

                              {/* Show available balance for selling */}
                              {(() => {
                                const userHolding = portfolioHoldings.find(h => h.symbol === selectedCrypto.symbol);
                                return userHolding && (
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Available to sell</p>
                                    <p className="font-semibold">{userHolding.quantity.toFixed(6)} {selectedCrypto.symbol}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setTradeAmount(userHolding.quantity.toString())}
                                      className="mt-2 text-xs"
                                    >
                                      Sell All
                                    </Button>
                                  </div>
                                );
                              })()}

                              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                                <Info className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700 dark:text-red-300">
                                  Trade will be executed instantly and portfolio updated automatically
                                </AlertDescription>
                              </Alert>

                              <Button
                                className="w-full h-12 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                                onClick={handleTrade}
                                disabled={isTrading || !tradeAmount}
                              >
                                {isTrading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Minus className="h-4 w-4 mr-2" />
                                )}
                                Sell {selectedCrypto.symbol}
                              </Button>
                            </TabsContent>
                          </Tabs>
                          
                          {/* Available Balance */}
                          <div className="p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/30">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">INR Balance</span>
                              <span className="font-medium">{formatINR(walletBalance.balance)}</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Portfolio Tab */}
                      <TabsContent value="portfolio" className="p-6">
                        <div className="space-y-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">Your Crypto Portfolio</h3>
                            <p className="text-muted-foreground">Live portfolio tracking with P&L</p>
                          </div>

                          {portfolioHoldings.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                                <PieChart className="h-8 w-8" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
                              <p className="text-muted-foreground mb-4">Start trading to build your crypto portfolio</p>
                              <Button onClick={() => setActiveTab('trade')}>
                                Start Trading
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {portfolioHoldings.map((holding) => (
                                <div key={holding.id} className="p-4 bg-background/50 backdrop-blur-sm rounded-xl hover:bg-background/70 transition-colors border border-border/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                        {getCryptoIcon(holding.symbol)}
                                      </div>
                                      <div>
                                        <p className="font-semibold">{holding.name}</p>
                                        <p className="text-sm text-muted-foreground">{holding.quantity.toFixed(6)} {holding.symbol}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Avg: {formatINR(holding.average_buy_price)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">{formatINR(holding.current_value)}</p>
                                      <p className={`text-sm ${holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {holding.profit_loss >= 0 ? '+' : ''}{formatINR(holding.profit_loss)}
                                      </p>
                                      <p className={`text-xs ${holding.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Portfolio Summary */}
                              <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-xl text-center bg-background/30 backdrop-blur-sm">
                                <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                  {formatINR(portfolioSummary.total_value * 83)}
                                </p>
                                <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                                  <span className="text-muted-foreground">
                                    Invested: {formatINR(portfolioSummary.total_invested * 83)}
                                  </span>
                                  <span className={portfolioSummary.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    P&L: {portfolioSummary.total_pnl >= 0 ? '+' : ''}{portfolioSummary.total_pnl_percentage.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                    <Bitcoin className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a Cryptocurrency</h3>
                  <p>Choose from the list to view details and start trading</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}