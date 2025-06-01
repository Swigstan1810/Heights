// app/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { TradingAssistant } from "@/components/ai-assistant";
<<<<<<< HEAD
import { marketDataService, getUserPortfolio, toTradingViewSymbol, type MarketData } from "@/lib/market-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
=======
import { generateMockMarketData } from "@/lib/utils";
import { marketDataService, getUserPortfolio, toTradingViewSymbol } from "@/lib/market-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  LineChart, 
  Settings, 
  User,
  Brain,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Bot,
<<<<<<< HEAD
  ChartBar,
  AlertCircle,
  Loader2,
  Bitcoin,
  DollarSign,
  Activity
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import TradingViewWidget from '@/components/trading/tradingview-widget';

// Crypto symbols to track
const TRACKED_CRYPTOS = [
  { symbol: 'CRYPTO:BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'CRYPTO:ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'CRYPTO:SOL', name: 'Solana', icon: 'S' },
  { symbol: 'CRYPTO:MATIC', name: 'Polygon', icon: 'M' },
  { symbol: 'CRYPTO:LINK', name: 'Chainlink', icon: 'L' },
  { symbol: 'CRYPTO:AVAX', name: 'Avalanche', icon: 'A' }
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('CRYPTO:BTC');
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(true);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
=======
  ChartBar
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import type { MarketData } from '@/lib/market-data';

export default function Dashboard() {
  const { user, loading, kycCompleted } = useAuth();
  const router = useRouter();
  const [marketData, setMarketData] = useState(generateMockMarketData(4));
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  
  // Real-time BTC/ETH data
  const [btcData, setBtcData] = useState<MarketData | null>(null);
  const [ethData, setEthData] = useState<MarketData | null>(null);
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      }
<<<<<<< HEAD
    }
  }, [user, loading, router]);
=======
      // KYC check bypassed for testing:
      // else if (!kycCompleted) {
      //   router.push("/kyc");
      // }
    }
  }, [user, loading, kycCompleted, router]);
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007

  useEffect(() => {
    if (user) {
      // Fetch user's portfolio
      getUserPortfolio(user.id).then(setPortfolio).catch(console.error);
      
      // Connect to market data
      marketDataService.connect();
      
<<<<<<< HEAD
      // Subscribe to all tracked cryptos
      const unsubscribes: (() => void)[] = [];
      
      TRACKED_CRYPTOS.forEach(crypto => {
        const unsubscribe = marketDataService.subscribe(crypto.symbol, (data) => {
          setCryptoData(prev => new Map(prev).set(crypto.symbol, data));
          setIsLoadingMarketData(false);
        });
        unsubscribes.push(unsubscribe);
      });
      
      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }
  }, [user]);

  // Fetch AI insights
  const fetchAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // Get current market data
      const marketDataArray = Array.from(cryptoData.values());
      const marketSummary = marketDataArray.map(data => ({
        symbol: data.symbol,
        price: data.price,
        change24h: data.change24h,
        change24hPercent: data.change24hPercent,
        volume24h: data.volume24h
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze the current crypto market data and provide insights: ${JSON.stringify(marketSummary)}. Give me 3 key insights and any trading opportunities you see.`,
          history: []
        })
      });

      const data = await response.json();
      setAiInsights(data.message);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights('Unable to fetch AI insights at this time.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    // Fetch AI insights when market data is loaded
    if (!isLoadingMarketData && cryptoData.size > 0 && !aiInsights) {
      fetchAIInsights();
    }
  }, [isLoadingMarketData, cryptoData.size]);
  
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading market data...</p>
=======
      // Subscribe to BTC and ETH
      const unsubBtc = marketDataService.subscribe('CRYPTO:BTC', setBtcData);
      const unsubEth = marketDataService.subscribe('CRYPTO:ETH', setEthData);
      
      return () => {
        unsubBtc();
        unsubEth();
      };
    }
  }, [user]);
  
  if (loading || !user /* || !kycCompleted */) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
        </div>
      </div>
    );
  }
  
  // Calculate portfolio metrics
<<<<<<< HEAD
  const totalBalance = 125432;
=======
  const totalBalance = 125432; // This should come from actual balance
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
  const totalInvested = 98750;
  const totalProfit = totalBalance - totalInvested;
  const profitPercentage = (totalProfit / totalInvested) * 100;
  
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
<<<<<<< HEAD
        {/* Real-Time Market Ticker */}
        <div className="mb-6 bg-card border border-border rounded-lg p-2 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {isLoadingMarketData ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading market data...</span>
              </div>
            ) : (
              Array.from(cryptoData.entries()).map(([symbol, data]) => {
                const crypto = TRACKED_CRYPTOS.find(c => c.symbol === symbol);
                return (
                  <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                      selectedSymbol === symbol 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span className="text-lg font-bold">{crypto?.icon}</span>
                    <span className="font-medium">{crypto?.name}</span>
                    <span className="font-bold">${data.price.toLocaleString()}</span>
                    <span className={`text-sm flex items-center ${
                      data.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {data.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(data.change24hPercent).toFixed(2)}%
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.email?.split('@')[0]}</h1>
            <p className="text-muted-foreground">Real-time market data powered by Coinbase & TradingView</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => fetchAIInsights()}
              disabled={isLoadingInsights}
              className="flex items-center gap-2"
            >
              {isLoadingInsights ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Refresh AI Insights
            </Button>
            <AssistantButton />
          </div>
        </div>

        {/* AI Insights Card */}
        {aiInsights && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Market Analysis (Powered by Claude)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {aiInsights}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Trading View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* TradingView Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{TRACKED_CRYPTOS.find(c => c.symbol === selectedSymbol)?.name} Chart</span>
                  <span className="text-sm text-muted-foreground">Powered by TradingView</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewWidget 
                  symbol={toTradingViewSymbol(selectedSymbol)} 
                  height={400}
                  showIntervalTabs={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Market Stats */}
          <div className="space-y-4">
            {cryptoData.get(selectedSymbol) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Price</span>
                    <span className="font-bold text-xl">
                      ${cryptoData.get(selectedSymbol)!.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Change</span>
                    <span className={`font-medium ${
                      cryptoData.get(selectedSymbol)!.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {cryptoData.get(selectedSymbol)!.change24h >= 0 ? '+' : ''}
                      ${cryptoData.get(selectedSymbol)!.change24h.toFixed(2)} 
                      ({cryptoData.get(selectedSymbol)!.change24hPercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h High</span>
                    <span>${cryptoData.get(selectedSymbol)!.high24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Low</span>
                    <span>${cryptoData.get(selectedSymbol)!.low24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span>${(cryptoData.get(selectedSymbol)!.volume24h / 1000000).toFixed(2)}M</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/trade?symbol=${selectedSymbol}`)}
                >
                  Trade {TRACKED_CRYPTOS.find(c => c.symbol === selectedSymbol)?.name}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/portfolio')}
                >
                  View Portfolio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+{profitPercentage.toFixed(1)}%</span> all time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+₹1,245</div>
              <p className="text-xs text-muted-foreground mt-1">+1.2% today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">8.7/10</div>
              <p className="text-xs text-muted-foreground mt-1">Trading performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="market">Live Market</TabsTrigger>
            <TabsTrigger value="ai-trading">AI Trading</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Crypto Prices (Coinbase)</CardTitle>
                <CardDescription>Live market data with AI-powered signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(cryptoData.entries()).map(([symbol, data]) => {
                    const crypto = TRACKED_CRYPTOS.find(c => c.symbol === symbol);
                    const aiSignal = data.change24hPercent > 2 ? 'BUY' : data.change24hPercent < -2 ? 'SELL' : 'HOLD';
                    
                    return (
                      <Card key={symbol} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedSymbol(symbol)}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold flex items-center gap-2">
                                <span className="text-xl">{crypto?.icon}</span>
                                {crypto?.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{symbol.split(':')[1]}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              aiSignal === 'BUY' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                              aiSignal === 'SELL' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              AI: {aiSignal}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold">${data.price.toLocaleString()}</div>
                            <div className={`text-sm flex items-center ${
                              data.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {data.change24h >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)} ({data.change24hPercent.toFixed(2)}%)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Vol: ${(data.volume24h / 1000000).toFixed(2)}M
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-trading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Trading Recommendations</CardTitle>
                <CardDescription>Claude-powered market analysis and trading signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Strong Buy: Bitcoin (BTC)
                      </h4>
                      <span className="text-sm font-medium text-green-600">85% confidence</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Technical indicators show oversold conditions with strong support at $61,000. 
                      Volume increasing, suggesting accumulation phase.
                    </p>
                    <Button size="sm" className="mt-3" onClick={() => router.push('/trade?symbol=CRYPTO:BTC')}>
                      Execute Trade
                    </Button>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-yellow-600" />
                        Watch: Ethereum (ETH)
                      </h4>
                      <span className="text-sm font-medium text-yellow-600">72% confidence</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Consolidating near resistance. Wait for breakout above $3,100 for entry.
                      Set alerts for price movement.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      Set Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            {/* Portfolio content */}
            <Card>
              <CardHeader>
                <CardTitle>Your Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Portfolio tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            {/* Activity content */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Activity feed coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
=======
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        {/* Real-Time Crypto Prices */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Crypto Prices (Coinbase)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="font-bold mb-2">BTC/USD</h3>
              {btcData ? (
                <>
                  <div className="text-2xl font-bold">${btcData.price.toLocaleString()}</div>
                  <div className={btcData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {btcData.change24h >= 0 ? '+' : ''}{btcData.change24h.toFixed(2)} ({btcData.change24hPercent.toFixed(2)}%)
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">24h High: ${btcData.high24h.toLocaleString()} | 24h Low: ${btcData.low24h.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-muted-foreground">Loading...</div>
              )}
            </div>
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="font-bold mb-2">ETH/USD</h3>
              {ethData ? (
                <>
                  <div className="text-2xl font-bold">${ethData.price.toLocaleString()}</div>
                  <div className={ethData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {ethData.change24h >= 0 ? '+' : ''}{ethData.change24h.toFixed(2)} ({ethData.change24hPercent.toFixed(2)}%)
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">24h High: ${ethData.high24h.toLocaleString()} | 24h Low: ${ethData.low24h.toLocaleString()}</div>
                </>
              ) : (
                <div className="text-muted-foreground">Loading...</div>
              )}
            </div>
          </div>
        </section>
        {/* TradingView Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">BTC/USD Chart (TradingView)</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <TradingViewWidget symbol="CRYPTO:BTC" height={500} />
          </div>
        </section>
        {/* AI Assistant Button */}
        <AssistantButton />
        
        {/* Welcome Section with AI Quick Actions */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.email?.split('@')[0]}</h1>
            <p className="text-muted-foreground">Your AI-powered market summary for today</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setAiInsightsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Brain className="h-4 w-4" />
              AI Insights
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
              <MessageCircle className="h-4 w-4" />
              Ask Claude
            </button>
          </div>
        </div>
        
        {/* AI Market Alert Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">AI Market Alert</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bitcoin showing bullish momentum with 2.4% gain. RSI indicates potential continuation. 
                Ethereum forming support at $3,400. Consider portfolio rebalancing.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats with AI Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Total Balance</p>
                <h3 className="text-2xl font-bold mt-1">₹{totalBalance.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">AI Prediction: +4.2% (7d)</p>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+2.4% today</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Invested</p>
                <h3 className="text-2xl font-bold mt-1">₹{totalInvested.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">Portfolio Health: Excellent</p>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+{profitPercentage.toFixed(1)}% all time</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Today's Profit</p>
                <h3 className="text-2xl font-bold mt-1">₹1,245.00</h3>
                <p className="text-xs text-muted-foreground mt-1">AI Score: 8.5/10</p>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <LineChart className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+1.2% today</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">AI Opportunities</p>
                <h3 className="text-2xl font-bold mt-1">3</h3>
                <p className="text-xs text-muted-foreground mt-1">High confidence trades</p>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <Brain className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-yellow-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>View suggestions</span>
            </div>
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Market Overview with AI Signals */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Market Overview</h2>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  AI-Enhanced Analysis
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketData.map((item) => (
                  <div key={item.symbol} className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.symbol}</p>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.change24h > 2 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                            Buy
                          </span>
                        )}
                        {item.change24h < -2 && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                            Sell
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-medium">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 2
                          }).format(item.price)}
                        </p>
                        <p className={`text-sm ${item.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">AI Score</p>
                        <p className="text-sm font-medium">{(Math.random() * 3 + 7).toFixed(1)}/10</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI Trading Opportunities */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Trading Opportunities
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">BTC/USD - Strong Buy Signal</p>
                      <p className="text-sm text-muted-foreground">RSI oversold, support level holding</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">85% confidence</p>
                    <p className="text-xs text-muted-foreground">Entry: $51,200</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                      <ChartBar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">ETH/USD - Accumulation Zone</p>
                      <p className="text-sm text-muted-foreground">Consolidating, breakout expected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">72% confidence</p>
                    <p className="text-xs text-muted-foreground">Watch: $3,450</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Portfolio Rebalancing Suggested</p>
                      <p className="text-sm text-muted-foreground">Optimize for current market conditions</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai-insights">
            {/* AI Insights content placeholder */}
          </TabsContent>
          
          <TabsContent value="portfolio">
            {/* Portfolio Analysis content placeholder */}
          </TabsContent>
          
          <TabsContent value="activities">
            {/* Recent Activities */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Bought RELIANCE</p>
                      <p className="text-sm text-muted-foreground">Today, 10:45 AM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹2,345.00</p>
                    <p className="text-xs text-muted-foreground">AI recommended</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 mr-3">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Sold BTC</p>
                      <p className="text-sm text-muted-foreground">Yesterday, 3:30 PM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹15,780.00</p>
                    <p className="text-xs text-green-500">+12.3% profit</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Bought HDFC</p>
                      <p className="text-sm text-muted-foreground">March 2, 11:15 AM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹4,560.00</p>
                    <p className="text-xs text-muted-foreground">Manual trade</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Deposit</p>
                      <p className="text-sm text-muted-foreground">Feb 28, 2:00 PM</p>
                    </div>
                  </div>
                  <p className="font-medium">₹25,000.00</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Profile Card with AI Stats */}
        <div className="mt-8">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full text-primary mr-4">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user.email?.split('@')[0]}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">AI Trading Score</p>
                <p className="text-lg font-bold text-primary">8.7/10</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="font-medium">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">KYC Status</p>
                <p className="font-medium">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Verified
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">AI Trades Success</p>
                <p className="font-medium">87.5%</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">March 2023</p>
              </div>
            </div>
          </div>
        </div>
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
      </div>
    </main>
  );
}