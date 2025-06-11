"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  BarChart3, 
  Building2,
  Bitcoin,
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  image: string;
}

const MAJOR_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' }
];

export default function WatchlistPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch real crypto prices from CoinGecko (free API)
  const fetchCryptoPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const ids = MAJOR_CRYPTOS.map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&locale=en`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch crypto prices: ${response.status}`);
      }

      const data = await response.json();
      setCryptoPrices(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      setError('Failed to load crypto prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCryptoPrices();
      
      // Update every 30 seconds
      const interval = setInterval(fetchCryptoPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return formatPrice(marketCap);
  };

  if (authLoading) {
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
                <Star className="h-8 w-8 text-primary" />
                Watchlist
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your favorite assets across different markets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Prices
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCryptoPrices}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Stocks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Stocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Stock market integration is currently under development
                </p>
                <Button variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stocks
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Crypto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                Cryptocurrency
                <Badge variant="default" className="ml-auto">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && cryptoPrices.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={fetchCryptoPrices} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : cryptoPrices.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {cryptoPrices.map((crypto, index) => (
                    <motion.div
                      key={crypto.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-500">
                            {crypto.symbol.slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{crypto.name}</p>
                          <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatPrice(crypto.current_price)}
                        </p>
                        <p className={`text-xs flex items-center justify-end ${
                          crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {crypto.price_change_percentage_24h >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {crypto.price_change_percentage_24h.toFixed(2)}%
                        </p>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bitcoin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No crypto data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Mutual Funds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                Mutual Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Mutual funds integration is currently under development
                </p>
                <Button variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Watchlist</p>
                  <p className="text-2xl font-bold">{cryptoPrices.length}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Gainer</p>
                  {cryptoPrices.length > 0 && (
                    <>
                      <p className="text-lg font-bold">
                        {cryptoPrices.reduce((max, crypto) => 
                          crypto.price_change_percentage_24h > max.price_change_percentage_24h ? crypto : max
                        ).symbol}
                      </p>
                      <p className="text-sm text-green-500">
                        +{cryptoPrices.reduce((max, crypto) => 
                          crypto.price_change_percentage_24h > max.price_change_percentage_24h ? crypto : max
                        ).price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Loser</p>
                  {cryptoPrices.length > 0 && (
                    <>
                      <p className="text-lg font-bold">
                        {cryptoPrices.reduce((min, crypto) => 
                          crypto.price_change_percentage_24h < min.price_change_percentage_24h ? crypto : min
                        ).symbol}
                      </p>
                      <p className="text-sm text-red-500">
                        {cryptoPrices.reduce((min, crypto) => 
                          crypto.price_change_percentage_24h < min.price_change_percentage_24h ? crypto : min
                        ).price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </>
                  )}
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Update</p>
                  <p className="text-lg font-bold">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}