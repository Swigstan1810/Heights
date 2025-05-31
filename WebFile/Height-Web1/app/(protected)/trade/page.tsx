// app/(protected)/trade/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import TradingViewWidget from "@/components/trading/tradingview-widget";
import { OrderBook } from "@/components/trading/order-book";
import { TradeForm } from "@/components/trading/trade-form";
import { MarketStats } from "@/components/trading/market-stats";
import { RecentTrades } from "@/components/trading/recent-trades";
import { marketDataService, MarketData } from "@/lib/market-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Wallet,
  History,
  BookOpen
} from "lucide-react";

export default function TradePage() {
  const { user, loading, kycCompleted } = useAuth();
  const router = useRouter();
  const [selectedSymbol, setSelectedSymbol] = useState("CRYPTO:BTC");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [activeTab, setActiveTab] = useState("chart");
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!kycCompleted) {
        router.push("/kyc");
      }
    }
  }, [user, loading, kycCompleted, router]);

  useEffect(() => {
    // Connect to market data service
    marketDataService.connect();
    
    // Subscribe to real-time updates
    const unsubscribe = marketDataService.subscribe(selectedSymbol, (data) => {
      setMarketData(data);
    });

    // Fetch initial data
    marketDataService.getMarketData(selectedSymbol).then(setMarketData);

    return () => {
      unsubscribe();
    };
  }, [selectedSymbol]);

  if (loading || !user || !kycCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-fluid px-4 pt-20 pb-8">
        {/* Market Stats Bar */}
        <div className="mb-4">
          <MarketStats symbol={selectedSymbol} marketData={marketData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="orderbook" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Order Book
                </TabsTrigger>
                <TabsTrigger value="trades" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Trades
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  My Orders
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="mt-4">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <TradingViewWidget
                    symbol={selectedSymbol}
                    height={600}
                    theme={undefined}
                    allowSymbolChange={true}
                    showIntervalTabs={true}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="orderbook" className="mt-4">
                <OrderBook symbol={selectedSymbol} />
              </TabsContent>
              
              <TabsContent value="trades" className="mt-4">
                <RecentTrades symbol={selectedSymbol} />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Order History</h3>
                  {/* Order history component would go here */}
                  <p className="text-muted-foreground">Your recent orders will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Trading Panel */}
          <div className="xl:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 sticky top-20">
              <TradeForm 
                symbol={selectedSymbol} 
                currentPrice={marketData?.price || 0}
                userId={user.id}
              />
              
              {/* Balance Info */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Available Balance</span>
                  </div>
                  <span className="text-sm font-bold">₹1,25,432.00</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">In Orders</span>
                    <span>₹5,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-medium">₹1,30,432.00</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push('/wallet')}
                >
                  Manage Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Market Watchlist */}
        <div className="mt-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-4">Market Watchlist</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { symbol: "CRYPTO:BTC", name: "Bitcoin", price: 51234.56, change: 2.34 },
                { symbol: "CRYPTO:ETH", name: "Ethereum", price: 3456.78, change: -1.23 },
                { symbol: "NSE:RELIANCE", name: "Reliance", price: 2890.45, change: 0.89 },
                { symbol: "NSE:TCS", name: "TCS", price: 3567.80, change: 1.45 },
                { symbol: "CRYPTO:SOL", name: "Solana", price: 123.45, change: 5.67 },
                { symbol: "NSE:INFY", name: "Infosys", price: 1456.30, change: -0.45 },
              ].map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedSymbol === item.symbol
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.symbol.split(':')[1]}</p>
                    <p className="font-bold mt-1">₹{item.price.toLocaleString()}</p>
                    <p className={`text-xs flex items-center ${
                      item.change > 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {item.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {item.change > 0 ? "+" : ""}{item.change}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}