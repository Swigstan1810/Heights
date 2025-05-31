"use client";

import { Navbar } from "@/components/navbar";
import MarketDashboard from "@/components/market-dashboard";

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Market Data</h1>
            <p className="text-muted-foreground mt-2">
              Real-time market data for stocks, cryptocurrencies, and global indices
            </p>
          </div>
          
          <MarketDashboard />
        </div>
      </div>
    </main>
  );
}