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
  Activity,
  Bitcoin,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Info
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import dynamic from 'next/dynamic';

// Dynamically import TradingView widget
const TradingViewWidget = dynamic(
  () => import('@/components/trading/tradingview-widget'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-muted/50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
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
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  isFavorite?: boolean;
}

// Main cryptocurrencies to display
const MAIN_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' }
];

export default function CryptoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderAmount, setOrderAmount] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/crypto');
    }
  }, [authLoading, user, router]);

  // Fetch crypto data from CoinGecko API
  const fetchCryptoData = async () => {
    try {
      const ids = MAIN_CRYPTOS.map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
      );
      
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      
      const data = await response.json();
      
      const formattedData = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        circulating_supply: coin.circulating_supply,
        isFavorite: favorites.includes(coin.symbol.toUpperCase())
      }));
      
      setCryptoData(formattedData);
      if (!selectedCrypto && formattedData.length > 0) {
        setSelectedCrypto(formattedData[0]);
      }
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load favorites from database
  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('crypto_favorites')
        .select('symbol')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setFavorites(data.map(item => item.symbol));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (symbol: string) => {
    if (!user) return;
    
    try {
      if (favorites.includes(symbol)) {
        await supabase
          .from('crypto_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
        
        setFavorites(prev => prev.filter(s => s !== symbol));
      } else {
        await supabase
          .from('crypto_favorites')
          .insert({ user_id: user.id, symbol });
        
        setFavorites(prev => [...prev, symbol]);
      }
      
      // Update crypto data
      setCryptoData(prev => prev.map(crypto => 
        crypto.symbol === symbol 
          ? { ...crypto, isFavorite: !crypto.isFavorite }
          : crypto
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadFavorites();
      fetchCryptoData();
      
      // Refresh data every 30 seconds
      const interval = setInterval(fetchCryptoData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  const filteredCryptos = cryptoData.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTrade = () => {
    // Open Coinbase OAuth flow
    const clientId = process.env.NEXT_PUBLIC_COINBASE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/coinbase/callback`);
    const state = Math.random().toString(36).substring(7);
    
    // Store state for verification
    sessionStorage.setItem('coinbase_oauth_state', state);
    
    const authUrl = `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=wallet:accounts:read,wallet:transactions:send`;
    
    window.location.href = authUrl;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                Cryptocurrency Markets
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time cryptocurrency prices powered by CoinGecko. Trade securely with our integrated platform.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                fetchCryptoData();
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Top Cryptocurrencies</CardTitle>
                <CardDescription>By market cap</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredCryptos.map((crypto) => (
                    <motion.div
                      key={crypto.id}
                      className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                        selectedCrypto?.id === crypto.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedCrypto(crypto)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">{crypto.symbol.slice(0, 3)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{crypto.name}</p>
                            <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(crypto.symbol);
                            }}
                            className="mb-1"
                          >
                            <Star className={`h-4 w-4 ${
                              crypto.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
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
                            {crypto.price_change_percentage_24h.toFixed(2)}%
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
            {selectedCrypto && (
              <>
                {/* Selected Crypto Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">{selectedCrypto.symbol.slice(0, 3)}</span>
                        </div>
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
                            <ArrowUpRight className="h-5 w-5 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 mr-1" />
                          )}
                          {formatCurrency(Math.abs(selectedCrypto.price_change_24h))} 
                          ({selectedCrypto.price_change_percentage_24h.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Market Cap</p>
                        <p className="font-medium">{formatMarketCap(selectedCrypto.market_cap)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h Volume</p>
                        <p className="font-medium">{formatMarketCap(selectedCrypto.total_volume)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h High</p>
                        <p className="font-medium">{formatCurrency(selectedCrypto.high_24h)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h Low</p>
                        <p className="font-medium">{formatCurrency(selectedCrypto.low_24h)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* TradingView Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Price Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[500px] w-full">
                      <TradingViewWidget
                        symbol={`${selectedCrypto.symbol}USD`}
                        height={500}
                        theme="dark"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade {selectedCrypto.name}</CardTitle>
                    <CardDescription>
                      Execute trades securely through our integrated platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'buy' | 'sell')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy">Buy</TabsTrigger>
                        <TabsTrigger value="sell">Sell</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="buy" className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Amount (USD)</label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={orderAmount}
                              onChange={(e) => setOrderAmount(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>You'll receive</span>
                            <span className="font-medium">
                              {orderAmount && selectedCrypto.current_price 
                                ? (parseFloat(orderAmount) / selectedCrypto.current_price).toFixed(8)
                                : '0.00000000'
                              } {selectedCrypto.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Price per {selectedCrypto.symbol}</span>
                            <span className="font-medium">{formatCurrency(selectedCrypto.current_price)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleTrade}
                          disabled={!orderAmount || parseFloat(orderAmount) <= 0}
                        >
                          Buy {selectedCrypto.symbol}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="sell" className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Amount ({selectedCrypto.symbol})</label>
                          <Input
                            type="number"
                            placeholder="0.00000000"
                            value={orderAmount}
                            onChange={(e) => setOrderAmount(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>You'll receive</span>
                            <span className="font-medium">
                              {orderAmount && selectedCrypto.current_price 
                                ? formatCurrency(parseFloat(orderAmount) * selectedCrypto.current_price)
                                : '$0.00'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Price per {selectedCrypto.symbol}</span>
                            <span className="font-medium">{formatCurrency(selectedCrypto.current_price)}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          size="lg"
                          variant="destructive"
                          onClick={handleTrade}
                          disabled={!orderAmount || parseFloat(orderAmount) <= 0}
                        >
                          Sell {selectedCrypto.symbol}
                        </Button>
                      </TabsContent>
                    </Tabs>
                    
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Trading is executed through secure integration with licensed exchanges. 
                        All trades are subject to market conditions and exchange fees.
                      </AlertDescription>
                    </Alert>
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