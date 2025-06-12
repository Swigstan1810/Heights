// app/(protected)/crypto/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Wallet
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { coinbaseService } from '@/lib/services/coinbase-service';
import dynamic from 'next/dynamic';

// Lazy load TradingView widget for better performance
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
  image: string;
  isFavorite?: boolean;
}

// Optimized crypto list - only essential coins
const MAIN_CRYPTOS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano'];

export default function CryptoPage() {
  const { user, loading: authLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/crypto');
    }
  }, [authLoading, user, router]);

  // Optimized data fetching with caching
  const fetchCryptoData = useCallback(async () => {
    try {
      const ids = MAIN_CRYPTOS.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
        { next: { revalidate: 30 } } // Cache for 30 seconds
      );
      
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      
      const data = await response.json();
      const formattedData: CryptoData[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        image: coin.image,
        isFavorite: favorites.has(coin.symbol.toUpperCase())
      }));
      
      setCryptoData(formattedData);
      if (!selectedCrypto && formattedData.length > 0) {
        setSelectedCrypto(formattedData[0]);
      }
      
      // Update cache in database
      await updateMarketCache(formattedData);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      toast.error('Failed to fetch crypto data');
      // Try to load from cache
      await loadFromCache();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [favorites, selectedCrypto]);

  // Update market cache in database
  const updateMarketCache = async (data: CryptoData[]) => {
    try {
      const updates = data.map(crypto => ({
        symbol: crypto.symbol,
        price: crypto.current_price,
        change_24h_percent: crypto.price_change_percentage_24h,
        market_cap: crypto.market_cap,
        updated_at: new Date().toISOString()
      }));

      await supabase
        .from('market_data_cache')
        .upsert(updates, { onConflict: 'symbol' });
    } catch (error) {
      console.error('Error updating market cache:', error);
    }
  };

  // Load from cache when API fails
  const loadFromCache = async () => {
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .in('symbol', MAIN_CRYPTOS.map(c => c.toUpperCase()));

      if (!error && data) {
        const formattedData: CryptoData[] = data.map(item => ({
          id: item.symbol.toLowerCase(),
          symbol: item.symbol,
          name: item.symbol,
          current_price: Number(item.price),
          price_change_percentage_24h: Number(item.change_24h_percent),
          market_cap: Number(item.market_cap),
          image: `https://assets.coingecko.com/coins/images/1/small/${item.symbol.toLowerCase()}.png`,
          isFavorite: favorites.has(item.symbol)
        }));
        setCryptoData(formattedData);
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  };

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
  const toggleFavorite = async (symbol: string, name: string) => {
    if (!user) return;
    
    try {
      if (favorites.has(symbol)) {
        await supabase
          .from('crypto_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(symbol);
          return newSet;
        });
      } else {
        await supabase
          .from('crypto_watchlist')
          .insert({ user_id: user.id, symbol, name });
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.add(symbol);
          return newSet;
        });
      }
      
      // Update crypto data
      setCryptoData(prev => prev.map(crypto => 
        crypto.symbol === symbol 
          ? { ...crypto, isFavorite: !crypto.isFavorite }
          : crypto
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update watchlist');
    }
  };

  // Handle trade
  const handleTrade = async () => {
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
  };

  useEffect(() => {
    if (user) {
      loadFavorites();
      fetchCryptoData();
      
      // Refresh data every 30 seconds
      const interval = setInterval(fetchCryptoData, 30000);
      return () => clearInterval(interval);
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
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  }, [formatCurrency]);

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
                Crypto Trading
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect your wallet and start trading
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ConnectWalletButton />
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Cryptocurrencies</CardTitle>
                <CardDescription>Select to view details and trade</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cryptoData.map((crypto) => (
                    <div
                      key={crypto.id}
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedCrypto?.id === crypto.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedCrypto(crypto)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={crypto.image} 
                            alt={crypto.name}
                            className="w-8 h-8 rounded-full"
                            loading="lazy"
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
                              toggleFavorite(crypto.symbol, crypto.name);
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
                    </div>
                  ))}
                </div>
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
                        <p className={`text-lg flex items-center justify-end ${
                          selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {selectedCrypto.price_change_percentage_24h >= 0 ? (
                            <ArrowUpRight className="h-5 w-5 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 mr-1" />
                          )}
                          {selectedCrypto.price_change_percentage_24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Trading Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade {selectedCrypto.symbol}</CardTitle>
                    <CardDescription>
                      {isConnected ? 'Enter amount to trade' : 'Connect wallet to start trading'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy">Buy</TabsTrigger>
                        <TabsTrigger value="sell">Sell</TabsTrigger>
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
                      />
                    </div>
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