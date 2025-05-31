// app/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { TradingAssistant } from "@/components/ai-assistant";
import { marketDataService, getUserPortfolio, toTradingViewSymbol, type MarketData } from "@/lib/market-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const { user, loading, kycCompleted } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('CRYPTO:BTC');
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(true);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Fetch user's portfolio
      getUserPortfolio(user.id).then(setPortfolio).catch(console.error);
      
      // Connect to market data
      marketDataService.connect();
      
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
        </div>
      </div>
    );
  }
  
  // Calculate portfolio metrics
  const totalBalance = 125432;
  const totalInvested = 98750;
  const totalProfit = totalBalance - totalInvested;
  const profitPercentage = (totalProfit / totalInvested) * 100;
  
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
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
      </div>
    </main>
  );
}