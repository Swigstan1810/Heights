// app/(protected)/crypto/page.tsx - Using Coinbase API directly
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
  BarChart3,
  AlertCircle,
  Activity
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  high_24h: number;
  low_24h: number;
  image?: string;
  isFavorite?: boolean;
}

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
  const [error, setError] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('volume');
  const [activeTab, setActiveTab] = useState('overview');
  
  const supabase = createClientComponentClient();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/crypto');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Fetch crypto data from Coinbase API
  const fetchCryptoData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch from your API route that calls Coinbase
      const response = await fetch('/api/coinbase/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch crypto data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data received from API');
      }

      // Map Coinbase data to our format
      const formattedData: CryptoData[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.price,
        price_change_percentage_24h: coin.change24h,
        market_cap: coin.volume24h * coin.price, // Estimate based on volume
        total_volume: coin.volume24h,
        high_24h: coin.high24h,
        low_24h: coin.low24h,
        image: getCryptoIcon(coin.symbol),
        isFavorite: favorites.has(coin.symbol)
      }));
      
      setCryptoData(formattedData);
      setFilteredData(formattedData);
      
      if (!selectedCrypto && formattedData.length > 0) {
        setSelectedCrypto(formattedData[0]);
      }
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching crypto data:', error);
      setError(error.message || 'Failed to fetch crypto data from Coinbase');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [favorites, selectedCrypto]);

  // Get crypto icon URL
  const getCryptoIcon = (symbol: string) => {
    // Map common symbols to CoinGecko IDs for icons
    const symbolMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'AVAX': 'avalanche-2',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'SHIB': 'shiba-inu',
      'DAI': 'dai',
      'TRX': 'tron',
      'WBTC': 'wrapped-bitcoin',
      'UNI': 'uniswap',
      'LTC': 'litecoin',
      'LINK': 'chainlink',
      'ATOM': 'cosmos',
      'XLM': 'stellar',
      'ALGO': 'algorand',
      'NEAR': 'near',
      'BCH': 'bitcoin-cash',
      'VET': 'vechain',
      'AAVE': 'aave',
      'SAND': 'the-sandbox',
      'MANA': 'decentraland',
      'XTZ': 'tezos',
      'FIL': 'filecoin',
      'APE': 'apecoin',
      'EOS': 'eos',
      'SUSHI': 'sushi',
      'MKR': 'maker',
      'COMP': 'compound-governance-token',
      'SNX': 'synthetix-network-token',
      '1INCH': '1inch',
      'BAT': 'basic-attention-token',
      'ENJ': 'enjincoin',
      'CRV': 'curve-dao-token',
      'ZRX': '0x',
      'YFI': 'yearn-finance',
      'GRT': 'the-graph',
      'STORJ': 'storj',
      'BAL': 'balancer',
      'LRC': 'loopring',
      'BAND': 'band-protocol',
      'REN': 'republic-protocol',
      'NMR': 'numeraire',
      'OMG': 'omisego'
    };

    const geckoId = symbolMap[symbol] || symbol.toLowerCase();
    return `https://assets.coingecko.com/coins/images/1/thumb/${geckoId}.png`;
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
  const toggleFavorite = useCallback(async (crypto: CryptoData) => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    const newFavorites = new Set(favorites);
    
    try {
      if (favorites.has(crypto.symbol)) {
        newFavorites.delete(crypto.symbol);
        await supabase
          .from('crypto_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', crypto.symbol);
        toast.success(`${crypto.name} removed from favorites`);
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
        toast.success(`${crypto.name} added to favorites`);
      }
      
      setFavorites(newFavorites);
      
      // Update local data
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
  }, [user, favorites, cryptoData, supabase]);

  // Handle trade through Coinbase
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
      // Call your API route that handles Coinbase orders
      const response = await fetch('/api/coinbase/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          side: tradeType,
          productId: selectedCrypto.id,
          amount: parseFloat(tradeAmount),
          userId: user.id,
          walletAddress: address
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
        setTradeAmount('');
        
        // Log to database
        await supabase.from('crypto_transactions').insert({
          user_id: user.id,
          wallet_address: address,
          transaction_type: tradeType,
          currency_pair: selectedCrypto.id,
          amount: parseFloat(tradeAmount),
          price: selectedCrypto.current_price,
          total_value: parseFloat(tradeAmount) * (tradeType === 'buy' ? 1 : selectedCrypto.current_price),
          status: 'completed',
          coinbase_order_id: result.orderId
        });
      } else {
        toast.error(result.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      toast.error('Failed to execute trade');
    } finally {
      setIsTrading(false);
    }
  }, [isConnected, address, selectedCrypto, user, tradeAmount, tradeType, supabase]);

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
        case 'volume':
        default:
          return b.total_volume - a.total_volume;
      }
    });
    
    setFilteredData(filtered);
  }, [cryptoData, searchQuery, sortBy]);

  // Initial load
  useEffect(() => {
    fetchCryptoData();
  }, []);

  // Load user-specific data and set up auto-refresh
  useEffect(() => {
    if (user) {
      loadFavorites();
    }

    // Set up auto-refresh interval (every 10 seconds for Coinbase data)
    refreshIntervalRef.current = setInterval(() => {
      fetchCryptoData();
    }, 10000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
    }
    };
  }, [user, loadFavorites, fetchCryptoData]);

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

  const formatVolume = (value: number) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return formatCurrency(value);
  };

  // Show loading skeleton
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
                Coinbase Trading
              </h1>
              <p className="text-muted-foreground mt-2">
                Trade all available Coinbase cryptocurrencies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">
                <Activity className="h-3 w-3 mr-1" />
                Live from Coinbase
              </Badge>
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

          {/* Error Alert */}
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="pb-3">
                <CardTitle>Available Cryptocurrencies</CardTitle>
                <CardDescription>All Coinbase trading pairs</CardDescription>
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
                      variant={sortBy === 'volume' ? 'default' : 'outline'}
                      onClick={() => setSortBy('volume')}
                      className="flex-1"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Volume
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
                ) : filteredData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No cryptocurrencies found</p>
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
            {selectedCrypto ? (
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
                          <p className="text-muted-foreground">{selectedCrypto.id}</p>
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
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">24h High</p>
                        <p className="font-medium">{formatCurrency(selectedCrypto.high_24h)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Low</p>
                        <p className="font-medium">{formatCurrency(selectedCrypto.low_24h)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Volume</p>
                        <p className="font-medium">{formatVolume(selectedCrypto.total_volume)}</p>
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
                          <h3 className="text-lg font-semibold mb-3">Market Statistics</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Price Information</CardTitle>
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
                                  <span className="text-muted-foreground">Trading Pair</span>
                                  <span className="font-medium">{selectedCrypto.id}</span>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">24h Trading Data</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">High</span>
                                  <span className="font-medium">{formatCurrency(selectedCrypto.high_24h)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Low</span>
                                  <span className="font-medium">{formatCurrency(selectedCrypto.low_24h)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Volume</span>
                                  <span className="font-medium">{formatVolume(selectedCrypto.total_volume)}</span>
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
                            symbol={`COINBASE:${selectedCrypto.symbol}USD`}
                            height={600}
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
                                {tradeAmount && selectedCrypto.current_price > 0 && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    ≈ {(parseFloat(tradeAmount) / selectedCrypto.current_price).toFixed(6)} {selectedCrypto.symbol}
                                  </p>
                                )}
                              </div>
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                  Orders will be executed through Coinbase at market price
                                </AlertDescription>
                              </Alert>
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
                                {tradeAmount && selectedCrypto.current_price > 0 && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    ≈ {formatCurrency(parseFloat(tradeAmount) * selectedCrypto.current_price)}
                                  </p>
                                )}
                              </div>
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                  Orders will be executed through Coinbase at market price
                                </AlertDescription>
                              </Alert>
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
                                  Connect your wallet to start trading on Coinbase
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
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <Bitcoin className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a cryptocurrency to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}