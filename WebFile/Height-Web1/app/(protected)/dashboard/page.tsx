// app/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp,
  Loader2,
  Bitcoin,
  BarChart3,
  Building2,
  Plus,
  Shield,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Activity,
  PieChart,
  Target,
  Zap,
  Star,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { motion } from 'framer-motion';

interface WalletBalance {
  balance: number;
  locked_balance: number;
  currency: string;
}

export default function Dashboard() {
  const { user, profile, loading, isAuthenticated, profileError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  const supabase = createClientComponentClient<Database>();

  // Redirect logic for authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Fetch wallet balance (should be zero for new users)
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) return;

      try {
        setLoadingData(true);
        
        // Fetch or create wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_balance')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code === 'PGRST116') {
          // No wallet balance found, create one with zero balance
          const { data: newWallet, error: createError } = await supabase
            .from('wallet_balance')
            .insert({
              user_id: user.id,
              balance: 0,
              locked_balance: 0,
              currency: 'INR'
            })
            .select()
            .single();

          if (!createError && newWallet) {
            setWalletBalance(newWallet);
          }
        } else if (!walletError && walletData) {
          setWalletBalance(walletData);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        // Set default zero balance on error
        setWalletBalance({
          balance: 0,
          locked_balance: 0,
          currency: 'INR'
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchWalletBalance();
    }
  }, [user, supabase]);

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold">Failed to load profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const safeWalletBalance = walletBalance ?? { balance: 0, locked_balance: 0, currency: 'INR' };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-green-500" />
              Secure session active • Zero-balance wallet ready
            </p>
          </div>
          
          <div className="flex gap-2">
            <AssistantButton />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
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
                  Ready for your first deposit
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0.00</div>
                <p className="text-xs text-muted-foreground">
                  Start investing today
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watchlist Items</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Add cryptos to track
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Your trading journey awaits
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="stocks" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="mutual-funds" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Mutual Funds
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Getting Started */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Complete these steps to begin your investment journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">Welcome to Heights!</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Add Funds to Wallet</p>
                        <p className="text-sm text-muted-foreground">Deposit money to start investing</p>
                      </div>
                    </div>
                    <Button size="sm" disabled>
                      Add Funds
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Create Watchlist</p>
                        <p className="text-sm text-muted-foreground">Track your favorite cryptos</p>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <a href="/crypto">
                        Start
                      </a>
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Explore Markets</p>
                        <p className="text-sm text-muted-foreground">View real-time charts and data</p>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <a href="/crypto">
                        Explore
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Market Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription>
                    Live cryptocurrency market data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Bitcoin', symbol: 'BTC', price: 67234.56, change: 1.87, positive: true },
                      { name: 'Ethereum', symbol: 'ETH', price: 3456.78, change: -2.52, positive: false },
                      { name: 'Solana', symbol: 'SOL', price: 178.45, change: 7.43, positive: true },
                      { name: 'Cardano', symbol: 'ADA', price: 0.4567, change: 5.41, positive: true }
                    ].map((crypto) => (
                      <div key={crypto.symbol} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">{crypto.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{crypto.name}</p>
                            <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${crypto.price.toLocaleString()}</p>
                          <p className={`text-sm flex items-center justify-end ${
                            crypto.positive ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {crypto.positive ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {crypto.positive ? '+' : ''}{crypto.change}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/crypto">
                        View All Cryptocurrencies
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Start exploring Heights features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex-col" asChild>
                    <a href="/crypto">
                      <Bitcoin className="h-6 w-6 mb-2" />
                      <span>Explore Crypto</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col" asChild>
                    <a href="/news">
                      <Activity className="h-6 w-6 mb-2" />
                      <span>Read News</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col" asChild>
                    <a href="/ai">
                      <Shield className="h-6 w-6 mb-2" />
                      <span>AI Assistant</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cryptocurrency Markets</CardTitle>
                <CardDescription>
                  View real-time cryptocurrency prices and charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bitcoin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Explore cryptocurrency markets with live charts and data</p>
                  <Button asChild>
                    <a href="/crypto">
                      <Bitcoin className="h-4 w-4 mr-2" />
                      View Crypto Markets
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <Card>
              <CardHeader>
                <CardTitle>Stock Markets</CardTitle>
                <CardDescription>
                  Access Indian and global stock markets (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Stock trading features coming soon</p>
                  <Button variant="outline" disabled>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
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
                  Invest in diversified mutual funds (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Mutual fund investment features coming soon</p>
                  <Button variant="outline" disabled>
                    <Building2 className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}