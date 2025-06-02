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
  Star
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import LightweightChartWidget from '@/components/trading/lightweight-chart-widget';
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'crypto');
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [selectedCrypto, setSelectedCrypto] = useState('CRYPTO:BTC');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['CRYPTO:BTC', 'CRYPTO:ETH']));

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
                    <CardTitle>Cryptocurrency Markets</CardTitle>
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
                {cryptoData.get(selectedCrypto) && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">
                            {CRYPTO_LIST.find(c => c.symbol === selectedCrypto)?.name}
                          </CardTitle>
                          <p className="text-muted-foreground">{selectedCrypto.split(':')[1]}/USD</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            ${cryptoData.get(selectedCrypto)!.price.toLocaleString()}
                          </p>
                          <p className={`text-lg flex items-center justify-end ${
                            cryptoData.get(selectedCrypto)!.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {cryptoData.get(selectedCrypto)!.change24hPercent >= 0 ? (
                              <TrendingUp className="h-5 w-5 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 mr-1" />
                            )}
                            {cryptoData.get(selectedCrypto)!.change24hPercent >= 0 ? '+' : ''}
                            ${Math.abs(cryptoData.get(selectedCrypto)!.change24h).toFixed(2)} 
                            ({cryptoData.get(selectedCrypto)!.change24hPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">24h High</p>
                          <p className="font-medium">${cryptoData.get(selectedCrypto)!.high24h.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Low</p>
                          <p className="font-medium">${cryptoData.get(selectedCrypto)!.low24h.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Volume</p>
                          <p className="font-medium">
                            ${(cryptoData.get(selectedCrypto)!.volume24h / 1000000).toFixed(2)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="font-medium">
                            {cryptoData.get(selectedCrypto)!.marketCap 
                              ? `$${(cryptoData.get(selectedCrypto)!.marketCap! / 1000000000).toFixed(2)}B`
                              : 'N/A'
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

                {/* TradingView Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Price Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <LightweightChartWidget
                      symbol={selectedCrypto}
                      height={400}
                      showIntervalTabs={true}
                      showVolume={true}
                      className="p-4 w-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <Card>
              <CardHeader>
                <CardTitle>Stock Market</CardTitle>
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
          </TabsContent>
          
          {/* Mutual Funds Tab */}
          <TabsContent value="mutual-funds">
            <Card>
              <CardHeader>
                <CardTitle>Mutual Funds</CardTitle>
                <CardDescription>
                  Invest in top-performing mutual funds with expert management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Mutual fund investments coming soon</p>
                  <Button variant="outline">Learn More</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}