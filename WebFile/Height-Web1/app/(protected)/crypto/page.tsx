// app/(protected)/crypto/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  Search, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Bitcoin,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { marketDataService, type MarketData } from '@/lib/market-data';
import dynamic from 'next/dynamic';

// Dynamically import TradingView widget to avoid SSR issues
const TradingViewWidget = dynamic(
  () => import('@/components/trading/tradingview-widget'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-muted/50 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
  }
);

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  isWatched?: boolean;
  marketData?: MarketData;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  added_at: string;
}

// Crypto symbols to track with real Coinbase data
const CRYPTO_SYMBOLS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', coinbaseSymbol: 'CRYPTO:BTC' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', coinbaseSymbol: 'CRYPTO:ETH' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', coinbaseSymbol: 'CRYPTO:SOL' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', coinbaseSymbol: 'CRYPTO:ADA' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', coinbaseSymbol: 'CRYPTO:DOT' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', coinbaseSymbol: 'CRYPTO:LINK' },
];

// Default crypto data structure
const createDefaultCryptoData = (symbol: any): CryptoData => ({
  id: symbol.id,
  symbol: symbol.symbol,
  name: symbol.name,
  current_price: 0,
  price_change_24h: 0,
  price_change_percentage_24h: 0,
  market_cap: 0,
  total_volume: 0,
  image: `https://ui-avatars.com/api/?name=${symbol.symbol}&background=f97316&color=fff&size=64`,
  high_24h: 0,
  low_24h: 0,
  circulating_supply: 0,
  isWatched: false
});

export default function CryptoPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap' | 'price' | 'change'>('market_cap');
  const [showOnlyWatched, setShowOnlyWatched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [marketDataSubscriptions, setMarketDataSubscriptions] = useState<(() => void)[]>([]);
  
  const supabase = createClientComponentClient<Database>();

  // Initialize crypto data with Coinbase integration
  useEffect(() => {
    console.log('Initializing crypto data with Coinbase...');
    
    // Connect to market data service
    marketDataService.connect();
    
    // Initialize crypto data array
    const initialData = CRYPTO_SYMBOLS.map(createDefaultCryptoData);
    setCryptoData(initialData);
    setSelectedCrypto(initialData[0]);
    
    // Subscribe to real-time updates for each crypto
    const unsubscribes = CRYPTO_SYMBOLS.map(symbol => {
      return marketDataService.subscribe(symbol.coinbaseSymbol, (marketData) => {
        console.log('Received market data for', symbol.symbol, marketData);
        
        setCryptoData(prev => prev.map(crypto => {
          if (crypto.symbol === symbol.symbol) {
            return {
              ...crypto,
              current_price: marketData.price,
              price_change_24h: marketData.change24h,
              price_change_percentage_24h: marketData.change24hPercent,
              high_24h: marketData.high24h,
              low_24h: marketData.low24h,
              total_volume: marketData.volume24h,
              marketData: marketData
            };
          }
          return crypto;
        }));
        
        // Update selected crypto if it matches
        setSelectedCrypto(prev => {
          if (prev && prev.symbol === symbol.symbol) {
            return {
              ...prev,
              current_price: marketData.price,
              price_change_24h: marketData.change24h,
              price_change_percentage_24h: marketData.change24hPercent,
              high_24h: marketData.high24h,
              low_24h: marketData.low24h,
              total_volume: marketData.volume24h,
              marketData: marketData
            };
          }
          return prev;
        });
      });
    });
    
    setMarketDataSubscriptions(unsubscribes);
    
    // Fetch initial data for each crypto
    CRYPTO_SYMBOLS.forEach(async (symbol) => {
      try {
        const marketData = await marketDataService.getMarketData(symbol.coinbaseSymbol);
        if (marketData) {
          console.log('Initial market data for', symbol.symbol, marketData);
          setCryptoData(prev => prev.map(crypto => {
            if (crypto.symbol === symbol.symbol) {
              return {
                ...crypto,
                current_price: marketData.price,
                price_change_24h: marketData.change24h,
                price_change_percentage_24h: marketData.change24hPercent,
                high_24h: marketData.high24h,
                low_24h: marketData.low24h,
                total_volume: marketData.volume24h,
                marketData: marketData
              };
            }
            return crypto;
          }));
        }
      } catch (error) {
        console.error('Error fetching initial data for', symbol.symbol, error);
      }
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribes.forEach(unsub => unsub());
      marketDataService.disconnect();
    };
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Crypto page - checking auth state...', { authLoading, isAuthenticated, user: !!user });
      
      if (!authLoading) {
        if (!isAuthenticated || !user) {
          console.log('Crypto page - redirecting to login');
          router.push('/login?redirectTo=/crypto');
          return;
        }
        console.log('Crypto page - user authenticated, continuing...');
        setPageLoading(false);
      }
    };

    checkAuth();
  }, [authLoading, isAuthenticated, user, router]);

  // Load watchlist from database
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!user) {
        console.log('No user, skipping watchlist load');
        return;
      }
      
      try {
        console.log('Loading watchlist for user:', user.id);
        const { data: watchlist, error } = await supabase
          .from('crypto_watchlist')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error loading watchlist:', error);
          return;
        }
        
        if (watchlist) {
          console.log('Watchlist loaded:', watchlist);
          setWatchlistItems(watchlist);
          const watchedSymbols = new Set(watchlist.map(item => item.symbol));
          setCryptoData(prev => prev.map(crypto => ({
            ...crypto,
            isWatched: watchedSymbols.has(crypto.symbol)
          })));
        }
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    };

    if (user && !authLoading) {
      loadWatchlist();
    }
  }, [user, supabase, authLoading]);

  const toggleWatchlist = async (crypto: CryptoData) => {
    if (!user) {
      setNotification({type: 'error', message: 'Please log in to manage watchlist'});
      return;
    }

    try {
      if (crypto.isWatched) {
        // Remove from watchlist
        const { error } = await supabase
          .from('crypto_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', crypto.symbol);

        if (error) {
          console.error('Error removing from watchlist:', error);
          setNotification({type: 'error', message: 'Failed to remove from watchlist'});
          return;
        }

        // Update local state
        setWatchlistItems(prev => prev.filter(item => item.symbol !== crypto.symbol));
        setNotification({type: 'success', message: `${crypto.name} removed from watchlist`});
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('crypto_watchlist')
          .insert({
            user_id: user.id,
            symbol: crypto.symbol,
            name: crypto.name
          });

        if (error) {
          console.error('Error adding to watchlist:', error);
          setNotification({type: 'error', message: 'Failed to add to watchlist'});
          return;
        }

        // Update local state
        const newItem: WatchlistItem = {
          id: Date.now().toString(), // temporary ID
          symbol: crypto.symbol,
          name: crypto.name,
          added_at: new Date().toISOString()
        };
        setWatchlistItems(prev => [...prev, newItem]);
        setNotification({type: 'success', message: `${crypto.name} added to watchlist`});
      }
      
      // Update crypto data
      setCryptoData(prev => prev.map(item => 
        item.id === crypto.id 
          ? { ...item, isWatched: !item.isWatched }
          : item
      ));
      
      if (selectedCrypto && selectedCrypto.id === crypto.id) {
        setSelectedCrypto(prev => prev ? { ...prev, isWatched: !prev.isWatched } : null);
      }

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating watchlist:', error);
      setNotification({type: 'error', message: 'An error occurred'});
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    console.log('Refreshing crypto data from Coinbase...');
    
    try {
      // Fetch fresh data for all cryptos
      const promises = CRYPTO_SYMBOLS.map(async (symbol) => {
        try {
          const marketData = await marketDataService.getMarketData(symbol.coinbaseSymbol);
          return { symbol: symbol.symbol, marketData };
        } catch (error) {
          console.error('Error refreshing data for', symbol.symbol, error);
          return { symbol: symbol.symbol, marketData: null };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Update crypto data with fresh data
      setCryptoData(prev => prev.map(crypto => {
        const result = results.find(r => r.symbol === crypto.symbol);
        if (result?.marketData) {
          return {
            ...crypto,
            current_price: result.marketData.price,
            price_change_24h: result.marketData.change24h,
            price_change_percentage_24h: result.marketData.change24hPercent,
            high_24h: result.marketData.high24h,
            low_24h: result.marketData.low24h,
            total_volume: result.marketData.volume24h,
            marketData: result.marketData
          };
        }
        return crypto;
      }));
      
      setNotification({type: 'success', message: 'Market data refreshed successfully'});
    } catch (error) {
      console.error('Error refreshing market data:', error);
      setNotification({type: 'error', message: 'Failed to refresh market data'});
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredAndSortedCrypto = cryptoData
    .filter(crypto => {
      const matchesSearch = crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWatchFilter = !showOnlyWatched || crypto.isWatched;
      return matchesSearch && matchesWatchFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.current_price - a.current_price;
        case 'change':
          return b.price_change_percentage_24h - a.price_change_percentage_24h;
        default:
          // For market cap, use volume as fallback since we don't have market cap from Coinbase
          return b.total_volume - a.total_volume;
      }
    });

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  // Show loading screen while authenticating or loading page
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cryptocurrency data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Don't render if selectedCrypto is null
  if (!selectedCrypto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load cryptocurrency data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50"
          >
            <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {notification.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bitcoin className="h-8 w-8 text-orange-500" />
                Cryptocurrency Markets
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time cryptocurrency prices from Coinbase. Track your favorite coins and analyze market trends.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showOnlyWatched ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyWatched(!showOnlyWatched)}
              >
                {showOnlyWatched ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                Watchlist ({watchlistItems.length})
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="market_cap">Volume</option>
                <option value="price">Price</option>
                <option value="change">24h Change</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>
                  {filteredAndSortedCrypto.length} cryptocurrencies
                  {showOnlyWatched && ' in your watchlist'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredAndSortedCrypto.length > 0 ? (
                    filteredAndSortedCrypto.map((crypto) => (
                      <motion.div
                        key={crypto.id}
                        className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedCrypto && selectedCrypto.id === crypto.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedCrypto(crypto)}
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={crypto.image} 
                              alt={crypto.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=f97316&color=fff&size=32`;
                              }}
                            />
                            <div>
                              <p className="font-medium">{crypto.name}</p>
                              <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(crypto);
                              }}
                              className="mb-1"
                            >
                              <Star className={`h-4 w-4 ${
                                crypto.isWatched ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                              }`} />
                            </button>
                            <p className="font-medium">{formatCurrency(crypto.current_price)}</p>
                            <p className={`text-sm flex items-center justify-end ${
                              crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {crypto.price_change_percentage_24h >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                            </p>
                            {crypto.marketData && (
                              <p className="text-xs text-muted-foreground">
                                Live • {new Date(crypto.marketData.timestamp).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {showOnlyWatched 
                          ? 'No cryptocurrencies in your watchlist match the search'
                          : 'No cryptocurrencies found'
                        }
                      </p>
                      {showOnlyWatched && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowOnlyWatched(false)}
                        >
                          Show All Cryptocurrencies
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Crypto Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedCrypto.image} 
                      alt={selectedCrypto.name}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedCrypto.symbol}&background=f97316&color=fff&size=48`;
                      }}
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
                    <p className={`text-lg flex items-center justify-end ${
                      selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedCrypto.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="h-5 w-5 mr-1" />
                      ) : (
                        <TrendingDown className="h-5 w-5 mr-1" />
                      )}
                      {selectedCrypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {formatCurrency(selectedCrypto.price_change_24h)} 
                      ({selectedCrypto.price_change_percentage_24h.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">24h High</p>
                    <p className="font-medium">{formatCurrency(selectedCrypto.high_24h)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Low</p>
                    <p className="font-medium">{formatCurrency(selectedCrypto.low_24h)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="font-medium">{formatMarketCap(selectedCrypto.total_volume)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Source</p>
                    <p className="font-medium text-blue-600">Coinbase Live</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TradingView Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
                <CardDescription>
                  Real-time {selectedCrypto.name} price chart powered by TradingView
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] w-full">
                  <TradingViewWidget
                    symbol={`${selectedCrypto.symbol}USD`}
                    height={500}
                    allowSymbolChange={true}
                    showIntervalTabs={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Price Range (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Low: {formatCurrency(selectedCrypto.low_24h)}</span>
                      <span>High: {formatCurrency(selectedCrypto.high_24h)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 to-green-500"
                        style={{
                          width: `${((selectedCrypto.current_price - selectedCrypto.low_24h) / 
                                   (selectedCrypto.high_24h - selectedCrypto.low_24h)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatMarketCap(selectedCrypto.total_volume)}
                  </p>
                  <p className="text-sm text-muted-foreground">Trading volume</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => toggleWatchlist(selectedCrypto)}
                  >
                    <Star className={`h-4 w-4 mr-2 ${
                      selectedCrypto.isWatched ? 'fill-yellow-500 text-yellow-500' : ''
                    }`} />
                    {selectedCrypto.isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </Button>
                  <Button variant="outline" disabled>
                    <Activity className="h-4 w-4 mr-2" />
                    Set Price Alert
                  </Button>
                  <Button variant="outline" disabled>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Technical Analysis
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Live Data:</strong> Prices are updated in real-time from Coinbase. 
                    Use this page to monitor prices, analyze charts, and manage your watchlist.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    Connected to Coinbase WebSocket • Real-time data
                  </span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}