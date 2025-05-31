"use client";
import { Navbar } from "@/components/navbar";
import { SplashScreen } from "@/components/splash-screen";
import { ProgressBar } from "@/components/ui/progress-bar";
import { HeroSection } from "@/components/hero-section";
import { MarketSection } from "@/components/market-section";
import { FeaturesSection } from "@/components/features-section";
import { CallToAction } from "@/components/call-to-action";
import { Footer } from "@/components/footer";
import TradingViewWidget from '@/components/trading/tradingview-widget';
import { useEffect, useState } from 'react';
import { marketDataService, type MarketData } from '@/lib/market-data';
import { TradeForm } from '@/components/trading/trade-form';
import { OrderBook } from '@/components/trading/order-book';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  // Live BTC/ETH prices
  const [btcData, setBtcData] = useState<MarketData | null>(null);
  const [ethData, setEthData] = useState<MarketData | null>(null);

  useEffect(() => {
    marketDataService.connect();
    const unsubBtc = marketDataService.subscribe('CRYPTO:BTC', setBtcData);
    const unsubEth = marketDataService.subscribe('CRYPTO:ETH', setEthData);
    return () => {
      unsubBtc();
      unsubEth();
    };
  }, []);

  return (
    <main className="min-h-screen">
      <SplashScreen />
      <ProgressBar 
        sections={[
          { id: "hero", color: "hsl(var(--chart-1))" },
          { id: "crypto", color: "hsl(var(--chart-2))" },
          { id: "stocks", color: "hsl(var(--chart-3))" },
          { id: "features", color: "hsl(var(--chart-4))" },
        ]}
      />
      <Navbar />
      
      
      
      <HeroSection />
      
      {/* --- New: Real-Time Crypto Section --- */}
      <section id="crypto-demo" className="py-16 px-4 md:px-8 lg:px-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Live Crypto Trading Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* TradingView Chart */}
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">BTC/USD Chart (TradingView)</h3>
              <TradingViewWidget symbol="CRYPTO:BTC" height={400} />
            </div>
            {/* Live Prices */}
            <div className="flex flex-col gap-6 justify-between">
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <h4 className="font-bold mb-2">BTC/USD (Coinbase)</h4>
                {btcData ? (
                  <>
                    <div className="text-2xl font-bold">${btcData.price.toLocaleString()}</div>
                    <div className={btcData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {btcData.change24h >= 0 ? '+' : ''}{btcData.change24h.toFixed(2)} ({btcData.change24hPercent.toFixed(2)}%)
                    </div>
                  </>
                ) : <div className="text-muted-foreground">Loading...</div>}
              </div>
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <h4 className="font-bold mb-2">ETH/USD (Coinbase)</h4>
                {ethData ? (
                  <>
                    <div className="text-2xl font-bold">${ethData.price.toLocaleString()}</div>
                    <div className={ethData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {ethData.change24h >= 0 ? '+' : ''}{ethData.change24h.toFixed(2)} ({ethData.change24hPercent.toFixed(2)}%)
                    </div>
                  </>
                ) : <div className="text-muted-foreground">Loading...</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- New: Buy/Sell Demo Section --- */}
      <section id="trade-demo" className="py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Buy & Sell Crypto Instantly</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Order Book (BTC/USD)</h3>
              <OrderBook symbol="CRYPTO:BTC" />
            </div>
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Buy/Sell BTC</h3>
              {/* Demo userId for preview only */}
              <TradeForm symbol="CRYPTO:BTC" currentPrice={btcData?.price || 0} userId="demo-user" />
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/crypto">
              <Button size="lg" className="text-lg font-bold">Try Full Crypto Trading (Coinbase Integration)</Button>
            </Link>
          </div>
        </div>
      </section>
      
      <div id="crypto">
        <MarketSection 
          title="Cryptocurrency"
          subtitle="Trade the most popular cryptocurrencies with real-time market data"
          type="crypto"
          limit={4}
          color="hsl(var(--chart-1))"
          actionLink="/crypto" // Add direct link to Crypto page
        />
      </div>
      
      <div id="stocks">
        <MarketSection 
          title="Indian Stocks"
          subtitle="Invest in Indian equities with instant execution and live market updates"
          type="stock"
          limit={4}
          color="hsl(var(--chart-2))"
        />
      </div>
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <CallToAction />
      
      <Footer />
    </main>
  );
}