"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { generateMockMarketData } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, LineChart, Settings, User } from "lucide-react";

export default function Dashboard() {
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
  const marketData = generateMockMarketData(4);
  
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
          <h1 className="text-3xl font-bold">Welcome back, {user.email?.split('@')[0]}</h1>
          <p className="text-muted-foreground">Your market summary for today</p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Total Balance</p>
                <h3 className="text-2xl font-bold mt-1">₹125,432.00</h3>
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
                <h3 className="text-2xl font-bold mt-1">₹98,750.00</h3>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+5.2% all time</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Today's Profit</p>
                <h3 className="text-2xl font-bold mt-1">₹1,245.00</h3>
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
                <p className="text-muted-foreground text-sm">Active Positions</p>
                <h3 className="text-2xl font-bold mt-1">8</h3>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <Settings className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-yellow-500 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              <span>-2 since yesterday</span>
            </div>
          </div>
        </div>
        
        {/* Market Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.map((item) => (
              <div key={item.symbol} className="bg-card rounded-lg p-4 border border-border shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.symbol}</p>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                  </div>
                  <div className="text-right">
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
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Activities & Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card rounded-lg p-6 border border-border shadow-sm">
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
                <p className="font-medium">₹2,345.00</p>
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
                <p className="font-medium">₹15,780.00</p>
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
                <p className="font-medium">₹4,560.00</p>
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
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full text-primary mr-4">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.email?.split('@')[0]}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
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
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">March 2023</p>
              </div>
              
              <button className="w-full mt-4 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md">
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}