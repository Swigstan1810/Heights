// app/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { marketDataService, type MarketData } from "@/lib/market-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownRight, 
  Wallet, 
  LineChart, 
  TrendingUp,
  Loader2,
  Bitcoin,
  Search,
  Star,
  Activity,
  BarChart3,
  Plus
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import { Input } from "@/components/ui/input";
import dynamic from 'next/dynamic';

// Dynamically import the chart component to avoid SSR issues
const PriceChart = dynamic(
  () => import('@/components/trading/simple-price-chart'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'crypto');
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [selectedCrypto, setSelectedCrypto] = useState('CRYPTO:BTC');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['CRYPTO:BTC', 'CRYPTO:ETH']));
  const [portfolioValue, setPortfolioValue] = useState(125432.50);
  const [portfolioChange, setPortfolioChange] = useState(2.4);

  // Debug log for auth state
  console.log('[Dashboard] user:', user, 'loading:', loading);

  // Extended list of cryptocurrencies (like CoinSpot)
  const CRYPTO_LIST = [
    { symbol: 'CRYPTO:BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'CRYPTO:ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'CRYPTO:SOL', name: 'Solana', icon: 'S' },
    { symbol: 'CRYPTO:MATIC', name: 'Polygon', icon: 'M' },
    { symbol: 'CRYPTO:LINK', name: 'Chainlink', icon: 'L' },
    { symbol: 'CRYPTO:AVAX', name: 'Avalanche', icon: 'A' },
    { symbol: 'CRYPTO:DOT', name: 'Polkadot', icon: 'D' },
    { symbol: 'CRYPTO:ADA', name: 'Cardano', icon: 'C' },
    { symbol: 'CRYPTO:XRP', name: 'Ripple', icon: 'X' },
    { symbol: 'CRYPTO:ATOM', name: 'Cosmos', icon: 'Ω' },
    { symbol: 'CRYPTO:UNI', name: 'Uniswap', icon: 'U' },
    { symbol: 'CRYPTO:AAVE', name: 'Aave', icon: 'Aa' },
  ];
  
  useEffect(() => {
    if (!loading && !user) {
        router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Connect to market data
      marketDataService.connect();
      
      // Subscribe to all cryptos
      const unsubscribes: (() => void)[] = [];
      
      CRYPTO_LIST.forEach(crypto => {
        const unsubscribe = marketDataService.subscribe(crypto.symbol, (data) => {
          setCryptoData(prev => new Map(prev).set(crypto.symbol, data));
        });
        unsubscribes.push(unsubscribe);
      });
      
      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }
  }, [user]);
  
  // Filter cryptos based on search
  const filteredCryptos = CRYPTO_LIST.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.email?.split('@')[0]}</h1>
            <p className="text-muted-foreground">Manage your portfolio across all asset classes</p>
          </div>
          
          <div className="flex gap-2">
            <AssistantButton />
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
              <p className={`text-xs ${portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioChange >= 0 ? '+' : ''}{portfolioChange}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Across crypto and stocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+$1,245.30</div>
              <p className="text-xs text-muted-foreground">
                +0.99% today
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              Cryptocurrencies
            </TabsTrigger>
            <TabsTrigger value="stocks" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="mutual-funds" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Mutual Funds
            </TabsTrigger>
          </TabsList>
          
          {/* Crypto Tab - CoinSpot Style */}
          <TabsContent value="crypto" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Crypto List */}
              <div className="lg:col-span-1">
                <Card className="h-full w-full min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Cryptocurrency Markets
                      <Button size="sm" variant="outline" onClick={() => router.push('/trade')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <div className="mt-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search coins..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto">
                      {/* Favorites Section */}
                      {favorites.size > 0 && (
                        <>
                          <div className="px-6 py-2 border-b bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Favorites</p>
                          </div>
                          {filteredCryptos.filter(c => favorites.has(c.symbol)).map((crypto) => {
                            const data = cryptoData.get(crypto.symbol);
                            return (
                              <div
                                key={crypto.symbol}
                                className={`px-6 py-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                                  selectedCrypto === crypto.symbol ? 'bg-muted' : ''
                                }`}
                                onClick={() => setSelectedCrypto(crypto.symbol)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold">
                                      {crypto.icon}
                                    </div>
                                    <div>
                                      <p className="font-medium">{crypto.name}</p>
                                      <p className="text-sm text-muted-foreground">{crypto.symbol.split(':')[1]}</p>
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
                                        favorites.has(crypto.symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                      }`} />
                                    </button>
                                    {data ? (
                                      <>
                                        <p className="font-medium">${data.price.toLocaleString()}</p>
                                        <p className={`text-sm flex items-center justify-end ${
                                          data.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                          {data.change24hPercent >= 0 ? '+' : ''}{data.change24hPercent.toFixed(2)}%
                                        </p>
                                      </>
                                    ) : (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      
                      {/* All Coins */}
                      <div className="px-6 py-2 border-b bg-muted/50">
                        <p className="text-sm font-medium text-muted-foreground">All Coins</p>
                      </div>
                      {filteredCryptos.filter(c => !favorites.has(c.symbol)).map((crypto) => {
                        const data = cryptoData.get(crypto.symbol);
                        return (
                          <div
                            key={crypto.symbol}
                            className={`px-6 py-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                              selectedCrypto === crypto.symbol ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedCrypto(crypto.symbol)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold">
                                  {crypto.icon}
                                </div>
                                <div>
                                  <p className="font-medium">{crypto.name}</p>
                                  <p className="text-sm text-muted-foreground">{crypto.symbol.split(':')[1]}</p>
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
                                    favorites.has(crypto.symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                                  }`} />
                                </button>
                                {data ? (
                                  <>
                                    <p className="font-medium">${data.price.toLocaleString()}</p>
                                    <p className={`text-sm flex items-center justify-end ${
                                      data.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                      {data.change24hPercent >= 0 ? '+' : ''}{data.change24hPercent.toFixed(2)}%
                                    </p>
                                  </>
                                ) : (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart and Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Selected Crypto Details */}
                {(cryptoData.get(selectedCrypto) || selectedCrypto) && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">
                            {CRYPTO_LIST.find(c => c.symbol === selectedCrypto)?.name || 'Bitcoin'}
                          </CardTitle>
                          <p className="text-muted-foreground">{selectedCrypto.split(':')[1]}/USD</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            ${cryptoData.get(selectedCrypto)?.price.toLocaleString() || '45,234.56'}
                          </p>
                          <p className={`text-lg flex items-center justify-end ${
                            (cryptoData.get(selectedCrypto)?.change24hPercent || 2.4) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {(cryptoData.get(selectedCrypto)?.change24hPercent || 2.4) >= 0 ? (
                              <TrendingUp className="h-5 w-5 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 mr-1" />
                            )}
                            {(cryptoData.get(selectedCrypto)?.change24hPercent || 2.4) >= 0 ? '+' : ''}
                            ${Math.abs(cryptoData.get(selectedCrypto)?.change24h || 1087.30).toFixed(2)} 
                            ({(cryptoData.get(selectedCrypto)?.change24hPercent || 2.4).toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">24h High</p>
                          <p className="font-medium">
                            ${(cryptoData.get(selectedCrypto)?.high24h || 46123.45).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Low</p>
                          <p className="font-medium">
                            ${(cryptoData.get(selectedCrypto)?.low24h || 44567.89).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Volume</p>
                          <p className="font-medium">
                            ${((cryptoData.get(selectedCrypto)?.volume24h || 28547000000) / 1000000).toFixed(2)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="font-medium">
                            {cryptoData.get(selectedCrypto)?.marketCap 
                              ? `$${(cryptoData.get(selectedCrypto)!.marketCap! / 1000000000).toFixed(2)}B`
                              : '$890.5B'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex gap-3">
                        <Button 
                          className="flex-1" 
                          onClick={() => router.push(`/trade?symbol=${selectedCrypto}`)}
                        >
                          Buy {selectedCrypto.split(':')[1]}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => router.push(`/trade?symbol=${selectedCrypto}`)}
                        >
                          Sell {selectedCrypto.split(':')[1]}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Price Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Price Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 w-full">
                      <PriceChart
                        symbol={selectedCrypto}
                        height={400}
                        showIntervalTabs={true}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indian Stock Market</CardTitle>
                  <CardDescription>
                    Trade NSE and BSE listed stocks with real-time prices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Stock trading coming soon</p>
                    <Button variant="outline">Get Notified</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>US Stock Market</CardTitle>
                  <CardDescription>
                    Access NASDAQ and NYSE listed stocks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">US stock trading coming soon</p>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Mutual Funds Tab */}
          <TabsContent value="mutual-funds">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Equity Mutual Funds</CardTitle>
                  <CardDescription>
                    Invest in top-performing equity mutual funds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Equity funds coming soon</p>
                    <Button variant="outline">Explore Funds</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Debt Mutual Funds</CardTitle>
                  <CardDescription>
                    Stable returns with debt mutual funds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Debt funds coming soon</p>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}