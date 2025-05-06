"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { generateMockMarketData, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Wallet,
  Lock
} from "lucide-react";

export default function TradePage() {
  const { user, isLoading, kycCompleted } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading) {
      // If user not logged in, redirect to login
      if (!user) {
        router.push("/login");
      }
      // If KYC not completed, redirect to KYC form
      else if (!kycCompleted) {
        router.push("/kyc");
      }
    }
  }, [user, isLoading, kycCompleted, router]);
  
  // Sample market data
  const marketData = generateMockMarketData(6);
  const selectedAsset = marketData[0];
  
  // Show loading 
  if (isLoading || !user || !kycCompleted) {
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
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Trade</h1>
          <p className="text-muted-foreground">Buy and sell assets instantly</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Asset List */}
          <div className="lg:col-span-1 bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold">Available Assets</h2>
            </div>
            
            <div className="divide-y divide-border">
              {marketData.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer">
                  <div>
                    <p className="font-medium">{asset.symbol}</p>
                    <p className="text-sm text-muted-foreground">{asset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(asset.price)}</p>
                    <p className={`text-sm ${asset.change24h > 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-end`}>
                      {asset.change24h > 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {Math.abs(asset.change24h).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Trade Form */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <ArrowDown className="h-5 w-5 mr-2 text-green-500" />
                Buy {selectedAsset.symbol}
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-bold">{formatCurrency(selectedAsset.price)}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Buy</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="0.00" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input placeholder="0.00" />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Trading Fee (0.1%)</p>
                  <p>{formatCurrency(selectedAsset.price * 0.001)}</p>
                </div>
                
                <div className="flex justify-between items-center text-sm font-medium">
                  <p>Total</p>
                  <p>{formatCurrency(selectedAsset.price + selectedAsset.price * 0.001)}</p>
                </div>
                
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Buy {selectedAsset.symbol}
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <ArrowUp className="h-5 w-5 mr-2 text-red-500" />
                Sell {selectedAsset.symbol}
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-bold">{formatCurrency(selectedAsset.price)}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Sell</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="0.00" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input placeholder="0.00" />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Trading Fee (0.1%)</p>
                  <p>{formatCurrency(selectedAsset.price * 0.001)}</p>
                </div>
                
                <div className="flex justify-between items-center text-sm font-medium">
                  <p>Total</p>
                  <p>{formatCurrency(selectedAsset.price - selectedAsset.price * 0.001)}</p>
                </div>
                
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Sell {selectedAsset.symbol}
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Portfolio</h2>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 mr-1" /> Updated just now
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Available Balance</p>
                      <p className="text-sm text-muted-foreground">For trading</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(125432)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Locked Balance</p>
                      <p className="text-sm text-muted-foreground">In open orders</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(5000)}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium mb-4">Your Assets</h3>
                
                <div className="space-y-2">
                  {marketData.slice(0, 3).map((asset) => (
                    <div key={`holding-${asset.symbol}`} className="flex justify-between items-center p-3 rounded-md bg-accent/30">
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">{(Math.random() * 2).toFixed(5)} {asset.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(asset.price * Math.random() * 2)}</p>
                        <p className={`text-sm ${asset.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}