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
  Filter
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
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
}

// Mock crypto data (in production, this would come from CoinGecko API)
const MOCK_CRYPTO_DATA: CryptoData[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    current_price: 67234.56,
    price_change_24h: 1234.78,
    price_change_percentage_24h: 1.87,
    market_cap: 1320000000000,
    total_volume: 28500000000,
    image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
    high_24h: 67890.12,
    low_24h: 65123.45,
    circulating_supply: 19654218,
    isWatched: false
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    current_price: 3456.78,
    price_change_24h: -89.45,
    price_change_percentage_24h: -2.52,
    market_cap: 415000000000,
    total_volume: 15200000000,
    image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
    high_24h: 3567.89,
    low_24h: 3398.12,
    circulating_supply: 120280000,
    isWatched: false
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    current_price: 178.45,
    price_change_24h: 12.34,
    price_change_percentage_24h: 7.43,
    market_cap: 82000000000,
    total_volume: 2800000000,
    image: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
    high_24h: 182.56,
    low_24h: 165.23,
    circulating_supply: 459000000,
    isWatched: false
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    current_price: 0.4567,
    price_change_24h: 0.0234,
    price_change_percentage_24h: 5.41,
    market_cap: 16000000000,
    total_volume: 320000000,
    image: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png',
    high_24h: 0.4789,
    low_24h: 0.4234,
    circulating_supply: 35045000000,
    isWatched: false
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    current_price: 6.789,
    price_change_24h: -0.234,
    price_change_percentage_24h: -3.33,
    market_cap: 9800000000,
    total_volume: 145000000,
    image: 'https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png',
    high_24h: 7.123,
    low_24h: 6.567,
    circulating_supply: 1440000000,
    isWatched: false
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    current_price: 14.567,
    price_change_24h: 0.789,
    price_change_percentage_24h: 5.73,
    market_cap: 8900000000,
    total_volume: 287000000,
    image: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
    high_24h: 15.234,
    low_24h: 13.789,
    circulating_supply: 613000000,
    isWatched: false
  }
];

export default function CryptoPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(MOCK_CRYPTO_DATA);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>(MOCK_CRYPTO_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'market_cap' | 'price' | 'change'>('market_cap');
  const [showOnlyWatched, setShowOnlyWatched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load watchlist from database
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!user) return;
      
      try {
        const { data: watchlist } = await supabase
          .from('crypto_watchlist')
          .select('symbol')
          .eq('user_id', user.id);
        
        if (watchlist) {
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

    if (user) {
      loadWatchlist();
    }
  }, [user, supabase]);

  const toggleWatchlist = async (crypto: CryptoData) => {
    if (!user) return;

    try {
      if (crypto.isWatched) {
        // Remove from watchlist
        await supabase
          .from('crypto_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', crypto.symbol);
      } else {
        // Add to watchlist
        await supabase
          .from('crypto_watchlist')
          .insert({
            user_id: user.id,
            symbol: crypto.symbol,
            name: crypto.name
          });
      }
      
      // Update local state
      setCryptoData(prev => prev.map(item => 
        item.id === crypto.id 
          ? { ...item, isWatched: !item.isWatched }
          : item
      ));
      
      if (selectedCrypto.id === crypto.id) {
        setSelectedCrypto(prev => ({ ...prev, isWatched: !prev.isWatched }));
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would fetch real data from CoinGecko API
    setCryptoData(prev => prev.map(crypto => ({
      ...crypto,
      current_price: crypto.current_price * (1 + (Math.random() - 0.5) * 0.02),
      price_change_24h: crypto.price_change_24h * (1 + (Math.random() - 0.5) * 0.1),
      price_change_percentage_24h: crypto.price_change_percentage_24h * (1 + (Math.random() - 0.5) * 0.1)
    })));
    
    setIsRefreshing(false);
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
          return b.market_cap - a.market_cap;
      }
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
                Cryptocurrency Markets
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time cryptocurrency prices and charts. Track your favorite coins and analyze market trends.
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
                Watchlist
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="market_cap">Market Cap</option>
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
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredAndSortedCrypto.map((crypto) => (
                    <motion.div
                      key={crypto.id}
                      className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedCrypto.id === crypto.id ? 'bg-muted' : ''
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
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="font-medium">{formatMarketCap(selectedCrypto.market_cap)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="font-medium">{formatMarketCap(selectedCrypto.total_volume)}</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Circulating Supply</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {selectedCrypto.circulating_supply.toLocaleString()} {selectedCrypto.symbol}
                  </p>
                </CardContent>
              </Card>
              
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Volume/Market Cap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {((selectedCrypto.total_volume / selectedCrypto.market_cap) * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Volume ratio</p>
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
                  <Button variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Set Price Alert
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Technical Analysis
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Note:</strong> This is a view-only cryptocurrency tracker. 
                    Trading functionality has been removed as requested. 
                    Use this page to monitor prices, analyze charts, and manage your watchlist.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}