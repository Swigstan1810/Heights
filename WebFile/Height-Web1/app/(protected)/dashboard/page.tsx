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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Plus,
  Shield,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import { Input } from "@/components/ui/input";
import dynamic from 'next/dynamic';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

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

interface WalletBalance {
  balance: number;
  locked_balance: number;
  currency: string;
}

interface Portfolio {
  symbol: string;
  quantity: number;
  average_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

export default function Dashboard() {
  const { user, profile, loading, isAuthenticated, checkSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'crypto');
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [selectedCrypto, setSelectedCrypto] = useState('CRYPTO:BTC');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sessionValid, setSessionValid] = useState(true);
  
  const supabase = createClientComponentClient<Database>();

  // Extended list of cryptocurrencies
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

  // Session validation check
  useEffect(() => {
    const validateSession = async () => {
      const isValid = await checkSession();
      setSessionValid(isValid);
      if (!isValid && !loading) {
        router.push("/login");
      }
    };

    validateSession();
    // Check session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSession, loading, router]);

  // Fetch user data (wallet, portfolio, watchlist)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !sessionValid) {
        setLoadingData(false);
        return;
      }

      let timeoutId: NodeJS.Timeout | null = null;
      try {
        setLoadingData(true);
        // Fallback: stop loading after 5 seconds
        timeoutId = setTimeout(() => setLoadingData(false), 5000);

        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_balance')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!walletError && walletData) {
          setWalletBalance(walletData);
        }

        // Fetch portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id);

        if (!portfolioError && portfolioData) {
          setPortfolio(portfolioData);
        }

        // Fetch watchlist/favorites
        const { data: watchlistData, error: watchlistError } = await supabase
          .from('watchlist')
          .select('symbol')
          .eq('user_id', user.id);

        if (!watchlistError && watchlistData) {
          setFavorites(new Set(watchlistData.map(item => item.symbol)));
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingData(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    fetchUserData();
  }, [user, sessionValid]);

  // Redirect logic for authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Connect to market data
  useEffect(() => {
    if (isAuthenticated && sessionValid) {
      marketDataService.connect();
      
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
  }, [isAuthenticated, sessionValid]);

  // Toggle favorite with database sync
  const toggleFavorite = async (symbol: string) => {
    if (!user) return;

    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol);
      // Remove from database
      await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);
    } else {
      newFavorites.add(symbol);
      // Add to database
      await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol });
    }
    
    setFavorites(newFavorites);
  };

  // Filter cryptos based on search
  const filteredCryptos = CRYPTO_LIST.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate portfolio metrics
  const portfolioMetrics = {
    totalValue: portfolio.reduce((sum, p) => sum + (p.current_value || 0), 0) + (walletBalance?.balance ?? 0),
    totalPL: portfolio.reduce((sum, p) => sum + (p.profit_loss || 0), 0),
    totalPLPercent: portfolio.length > 0 
      ? portfolio.reduce((sum, p) => sum + (p.profit_loss_percent || 0), 0) / portfolio.length 
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !sessionValid) {
    // Optionally redirect or show a message
    return null;
  }

  // If walletBalance is still null after loading, set to zero balance
  const safeWalletBalance = walletBalance ?? { balance: 0, locked_balance: 0, currency: 'INR' };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Security Status Alert */}
        {profile?.kyc_completed === false && (
          <Alert className="mb-6 border-yellow-600 bg-yellow-600/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-600">
              Complete your KYC verification to unlock trading features.
              <Button 
                variant="link" 
                className="text-yellow-600 underline ml-2 p-0 h-auto"
                onClick={() => router.push('/kyc')}
              >
                Complete KYC
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-green-500" />
              Secure session active • Last login: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
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
              <div className="text-2xl font-bold">
                {loadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(portfolioMetrics.totalValue)
                )}
              </div>
              <p className={`text-xs ${portfolioMetrics.totalPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioMetrics.totalPLPercent >= 0 ? '+' : ''}{portfolioMetrics.totalPLPercent.toFixed(2)}% all time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(safeWalletBalance.balance)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(portfolioMetrics.totalPL)}
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolio.length} active positions
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
          
          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Crypto List */}
              <div className="lg:col-span-1">
                <Card className="h-full w-full min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Cryptocurrency Markets
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push('/trade')}
                        disabled={!profile?.kyc_completed}
                      >
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
                          disabled={!profile?.kyc_completed}
                        >
                          {profile?.kyc_completed ? `Buy ${selectedCrypto.split(':')[1]}` : 'Complete KYC to Trade'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => router.push(`/trade?symbol=${selectedCrypto}`)}
                          disabled={!profile?.kyc_completed}
                        >
                          {profile?.kyc_completed ? `Sell ${selectedCrypto.split(':')[1]}` : 'KYC Required'}
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