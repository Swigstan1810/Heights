// app/(protected)/crypto/page.tsx - Enhanced with more coins
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { toast } from 'sonner';
import { 
  Bitcoin,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Search,
  Info,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { coinbaseService } from '@/lib/services/coinbase-service';
import dynamic from 'next/dynamic';

// Lazy load TradingView widget
const TradingViewWidget = dynamic(
  () => import('@/components/trading/tradingview-widget'),
  { 
    ssr: false,
    loading: () => <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
  }
);

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  price_change_percentage_7d?: number;
  sparkline_in_7d?: { price: number[] };
  image: string;
  isFavorite?: boolean;
}

// Expanded list of cryptocurrencies
const ALL_CRYPTOS = [
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano',
  'solana', 'polkadot', 'dogecoin', 'avalanche-2', 'chainlink',
  'polygon', 'stellar', 'cosmos', 'algorand', 'vechain',
  'internet-computer', 'filecoin', 'tron', 'ethereum-classic', 'monero',
  'tezos', 'hedera-hashgraph', 'aave', 'uniswap', 'litecoin',
  'near', 'bitcoin-cash', 'aptos', 'arbitrum', 'optimism'
];

// Cache management
const CACHE_DURATION = 30000; // 30 seconds
const CACHE_KEY = 'crypto_data_cache_v2';

export default function CryptoPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap' | 'price' | 'change'>('market_cap');
  const [activeTab, setActiveTab] = useState('overview');
  
  const supabase = createClientComponentClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

  // Redirect check - only after initialization
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/crypto');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Check cache first
  const getCachedData = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
    return null;
  }, []);

  // Save to cache
  const setCachedData = useCallback((data: CryptoData[]) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }, []);

  // Optimized data fetching
  const fetchCryptoData = useCallback(async (skipCache = false) => {
    // Check cache first
    if (!skipCache) {
      const cached = getCachedData();
      if (cached && cached.length > 0) {
        setCryptoData(cached);
        setFilteredData(cached);
        if (!selectedCrypto && cached.length > 0) {
          setSelectedCrypto(cached[0]);
        }
        setLoading(false);
        return;
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const ids = ALL_CRYPTOS.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=7d`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=30'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      
      const data = await response.json();
      const formattedData: CryptoData[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        circulating_supply: coin.circulating_supply,
        sparkline_in_7d: coin.sparkline_in_7d,
        image: coin.image,
        isFavorite: favorites.has(coin.symbol.toUpperCase())
      }));
      
      setCryptoData(formattedData);
      setFilteredData(formattedData);
      setCachedData(formattedData);
      
      if (!selectedCrypto && formattedData.length > 0) {
        setSelectedCrypto(formattedData[0]);
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching crypto data:', error);
        toast.error('Failed to fetch crypto data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [favorites, selectedCrypto, getCachedData, setCachedData]);

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('crypto_watchlist')
        .select('symbol')
        .eq('user_id', user.id);
      
      if (data) {
        setFavorites(new Set(data.map(item => item.symbol)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [user, supabase]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (crypto: CryptoData) => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    const newFavorites = new Set(favorites);
    
    if (favorites.has(crypto.symbol)) {
      newFavorites.delete(crypto.symbol);
      await supabase
        .from('crypto_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', crypto.symbol);
    } else {
      newFavorites.add(crypto.symbol);
      await supabase
        .from('crypto_watchlist')
        .insert({
          user_id: user.id,
          symbol: crypto.symbol,
          crypto_id: crypto.id,
          name: crypto.name
        });
    }
    
    setFavorites(newFavorites);
    
    // Update local data
    const updatedData = cryptoData.map(c => ({
      ...c,
      isFavorite: newFavorites.has(c.symbol)
    }));
    setCryptoData(updatedData);
    setFilteredData(updatedData);
  }, [user, favorites, cryptoData, supabase]);

  // Handle trade
  const handleTrade = useCallback(async () => {
    if (!isConnected || !address || !selectedCrypto || !user) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsTrading(true);
    try {
      const params = {
        userId: user.id,
        walletAddress: address,
        currency: `${selectedCrypto.symbol}-USD`,
      };

      const result = tradeType === 'buy' 
        ? await coinbaseService.createBuyOrder({
            ...params,
            amount: parseFloat(tradeAmount)
          })
        : await coinbaseService.createSellOrder({
            ...params,
            size: parseFloat(tradeAmount)
          });

      if (result.success) {
        toast.success(result.message);
        setTradeAmount('');
      } else {
        toast.error(result.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      toast.error('Failed to execute trade');
    } finally {
      setIsTrading(false);
    }
  }, [isConnected, address, selectedCrypto, user, tradeAmount, tradeType]);

  // Search and filter
  useEffect(() => {
    let filtered = [...cryptoData];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(crypto => 
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.current_price - a.current_price;
        case 'change':
          return b.price_change_percentage_24h - a.price_change_percentage_24h;
        case 'market_cap':
        default:
          return b.market_cap - a.market_cap;
      }
    });
    
    setFilteredData(filtered);
  }, [cryptoData, searchQuery, sortBy]);

  // Initial load - load crypto data immediately without waiting for auth
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Load crypto data immediately
      fetchCryptoData();
    }
  }, [fetchCryptoData]);

  // Load user-specific data after authentication
  useEffect(() => {
    if (user) {
      loadFavorites();
      
      // Set up interval with cleanup
      const interval = setInterval(() => {
        fetchCryptoData(true); // Skip cache for periodic updates
      }, 30000);
      
      return () => {
        clearInterval(interval);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [user, loadFavorites, fetchCryptoData]);

  // Memoized formatters
  const formatCurrency = useMemo(() => (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
  }, []);

  const formatMarketCap = useMemo(() => (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  }, [formatCurrency]);

  const formatVolume = useMemo(() => (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return formatCurrency(value);
  }, [formatCurrency]);

  // Show page immediately with skeleton while auth is checking
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-muted rounded-lg"></div>
              </div>
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
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bitcoin className="h-8 w-8 text-orange-500" />
                Crypto Trading
              </h1>
              <p className="text-muted-foreground mt-2">
                Track {ALL_CRYPTOS.length} cryptocurrencies and trade with your wallet
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ConnectWalletButton />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRefreshing(true);
                  fetchCryptoData(true);
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="pb-3">
                <CardTitle>Cryptocurrencies</CardTitle>
                <CardDescription>Select to view details and trade</CardDescription>
                <div className="space-y-3 pt-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search coins..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* Sort Options */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={sortBy === 'market_cap' ? 'default' : 'outline'}
                      onClick={() => setSortBy('market_cap')}
                      className="flex-1"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Cap
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'price' ? 'default' : 'outline'}
                      onClick={() => setSortBy('price')}
                      className="flex-1"
                    >
                      Price
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'change' ? 'default' : 'outline'}
                      onClick={() => setSortBy('change')}
                      className="flex-1"
                    >
                      24h %
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="divide-y">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div>
                              <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                              <div className="h-3 bg-muted rounded w-12"></div>
                            </div>
                          </div>
                          <div>
                            <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <div className="divide-y">
                      {filteredData.map((crypto) => (
                        <div
                          key={crypto.id}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedCrypto?.id === crypto.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedCrypto(crypto)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src={crypto.image} 
                                  alt={crypto.name}
                                  className="w-8 h-8 rounded-full"
                                  loading="lazy"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="absolute -top-1 -right-1 h-4 w-4 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(crypto);
                                  }}
                                >
                                  <Star className={`h-3 w-3 ${crypto.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                </Button>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{crypto.name}</p>
                                <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">{formatCurrency(crypto.current_price)}</p>
                              <p className={`text-xs flex items-center justify-end ${
                                crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {crypto.price_change_percentage_24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {crypto.price_change_percentage_24h.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trading Interface */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCrypto && (
              <>
                {/* Selected Crypto Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedCrypto.image} 
                          alt={selectedCrypto.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <CardTitle className="text-2xl">{selectedCrypto.name}</CardTitle>
                          <p className="text-muted-foreground">{selectedCrypto.symbol}/USD</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">
                          {formatCurrency(selectedCrypto.current_price)}
                        </p>
                        <div className="flex items-center justify-end gap-4 mt-1">
                          <div className={`flex items-center ${
                            selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {selectedCrypto.price_change_percentage_24h >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                            )}
                            <span className="text-sm font-medium">
                              {selectedCrypto.price_change_percentage_24h.toFixed(2)}% (24h)
                            </span>
                          </div>
                          {selectedCrypto.price_change_percentage_7d && (
                            <div className={`flex items-center ${
                              selectedCrypto.price_change_percentage_7d >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              <span className="text-sm">
                                {selectedCrypto.price_change_percentage_7d >= 0 ? '+' : ''}
                                {selectedCrypto.price_change_percentage_7d.toFixed(2)}% (7d)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Market Cap</p>
                        <p className="font-medium">{formatMarketCap(selectedCrypto.market_cap)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Volume</p>
                        <p className="font-medium">{formatVolume(selectedCrypto.total_volume)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Circulating Supply</p>
                        <p className="font-medium">
                          {selectedCrypto.circulating_supply?.toLocaleString() || 'N/A'} {selectedCrypto.symbol}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Tabs */}
                <Card>
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full rounded-none border-b">
                        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                        <TabsTrigger value="chart" className="flex-1">Chart</TabsTrigger>
                        <TabsTrigger value="trade" className="flex-1">Trade</TabsTrigger>
                      </TabsList>
                      
                      {/* Overview Tab */}
                      <TabsContent value="overview" className="p-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">About {selectedCrypto.name}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Price Statistics</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Current Price</span>
                                  <span className="font-medium">{formatCurrency(selectedCrypto.current_price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">24h Change</span>
                                  <span className={`font-medium ${
                                    selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {selectedCrypto.price_change_percentage_24h.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Market Cap Rank</span>
                                  <span className="font-medium">#{filteredData.findIndex(c => c.id === selectedCrypto.id) + 1}</span>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Market Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Market Cap</span>
                                  <span className="font-medium">{formatMarketCap(selectedCrypto.market_cap)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">24h Volume</span>
                                  <span className="font-medium">{formatVolume(selectedCrypto.total_volume)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Volume/Market Cap</span>
                                  <span className="font-medium">
                                    {((selectedCrypto.total_volume / selectedCrypto.market_cap) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Chart Tab */}
                      <TabsContent value="chart" className="p-0">
                        <div className="h-[600px] w-full">
                          <TradingViewWidget
                            symbol={`${selectedCrypto.symbol}USD`}
                            height={600}
                            theme="dark"
                          />
                        </div>
                      </TabsContent>

                      {/* Trade Tab */}
                      <TabsContent value="trade" className="p-6">
                        <div className="max-w-md mx-auto">
                          <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="buy">Buy {selectedCrypto.symbol}</TabsTrigger>
                              <TabsTrigger value="sell">Sell {selectedCrypto.symbol}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="buy" className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Amount (USD)</label>
                                <Input
                                  type="number"
                                  placeholder="100.00"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  disabled={!isConnected}
                                />
                                {tradeAmount && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    ≈ {(parseFloat(tradeAmount) / selectedCrypto.current_price).toFixed(6)} {selectedCrypto.symbol}
                                  </p>
                                )}
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleTrade}
                                disabled={!isConnected || isTrading || !tradeAmount}
                              >
                                {isTrading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Wallet className="h-4 w-4 mr-2" />
                                )}
                                {isConnected ? `Buy ${selectedCrypto.symbol}` : 'Connect Wallet to Trade'}
                              </Button>
                            </TabsContent>
                            <TabsContent value="sell" className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Amount ({selectedCrypto.symbol})</label>
                                <Input
                                  type="number"
                                  placeholder="0.001"
                                  value={tradeAmount}
                                  onChange={(e) => setTradeAmount(e.target.value)}
                                  disabled={!isConnected}
                                />
                                {tradeAmount && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    ≈ {formatCurrency(parseFloat(tradeAmount) * selectedCrypto.current_price)}
                                  </p>
                                )}
                              </div>
                              <Button
                                className="w-full"
                                variant="destructive"
                                onClick={handleTrade}
                                disabled={!isConnected || isTrading || !tradeAmount}
                              >
                                {isTrading ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Wallet className="h-4 w-4 mr-2" />
                                )}
                                {isConnected ? `Sell ${selectedCrypto.symbol}` : 'Connect Wallet to Trade'}
                              </Button>
                            </TabsContent>
                          </Tabs>
                          
                          {!isConnected && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 text-sm">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                  Connect your wallet to start trading cryptocurrencies
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}