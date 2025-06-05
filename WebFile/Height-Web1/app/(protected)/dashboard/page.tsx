// Updated dashboard page.tsx with better error handling and loading states
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
  ArrowDownRight,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { motion } from 'framer-motion';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  added_at: string;
}

interface TransactionSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
}

export default function Dashboard() {
  const { user, profile, walletBalance, loading: authLoading, isAuthenticated, profileError, refreshWalletBalance } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    transactionCount: 0
  });
  const [loadingData, setLoadingData] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  // Wait for auth to initialize before doing anything
  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth
    }

    if (!isAuthenticated || !user) {
      console.log('Dashboard - redirecting to login, not authenticated');
      router.push("/login?redirectTo=/dashboard");
      return;
    }

    console.log('Dashboard - user authenticated, loading data');
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch dashboard data only when user is ready
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || authLoading || !isAuthenticated) {
        return;
      }

      try {
        setLoadingData(true);
        setError(null);
        console.log('Dashboard - fetching data for user:', user.id);
        
        // Fetch watchlist items
        const { data: watchlist, error: watchlistError } = await supabase
          .from('crypto_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });

        if (watchlistError) {
          console.error('Dashboard - error loading watchlist:', watchlistError);
        } else if (watchlist) {
          console.log('Dashboard - watchlist loaded:', watchlist.length, 'items');
          setWatchlistItems(watchlist);
        }

        // Fetch transaction summary
        const { data: transactions, error: transactionError } = await supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (transactionError) {
          console.error('Dashboard - error loading transactions:', transactionError);
        } else if (transactions) {
          console.log('Dashboard - transactions loaded:', transactions.length, 'items');
          const summary = transactions.reduce((acc, tx) => {
            if (tx.type === 'deposit') {
              acc.totalDeposits += Number(tx.amount);
            } else if (tx.type === 'withdrawal') {
              acc.totalWithdrawals += Number(tx.amount);
            }
            acc.transactionCount += 1;
            return acc;
          }, { totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0 });
          
          setTransactionSummary(summary);
        }

      } catch (error) {
        console.error('Dashboard - error fetching data:', error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoadingData(false);
        console.log('Dashboard - data loading complete');
      }
    };

    // Only fetch data if we have an authenticated user
    if (user && isAuthenticated && !authLoading) {
      fetchDashboardData();
    }
  }, [user, supabase, authLoading, isAuthenticated]);

  // Handle profile errors
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-bold">Failed to load profile. Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
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
  const totalBalance = Number(safeWalletBalance.balance) + Number(safeWalletBalance.locked_balance);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-green-500" />
              Secure session active • {profile?.email_verified ? 'Email verified' : 'Email pending verification'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWalletBalance}
              disabled={loadingData}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-6 w-6 p-0"
                  >
                    {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : showBalance ? (
                    formatCurrency(Number(safeWalletBalance.balance))
                  ) : (
                    "••••••"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Number(safeWalletBalance.locked_balance) > 0 && showBalance && 
                    `Locked: ${formatCurrency(Number(safeWalletBalance.locked_balance))}`
                  }
                  {Number(safeWalletBalance.locked_balance) === 0 && "Available for trading"}
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
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingData ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : showBalance ? (
                    formatCurrency(transactionSummary.totalDeposits)
                  ) : (
                    "••••••"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime deposits
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
                <div className="text-2xl font-bold">{watchlistItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tracked cryptocurrencies
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
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactionSummary.transactionCount}</div>
                <p className="text-xs text-muted-foreground">
                  Completed transactions
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
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Profile Setup</p>
                        <p className="text-sm text-muted-foreground">Your profile is configured</p>
                      </div>
                    </div>
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

              {/* Watchlist Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Watchlist</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/crypto">
                        View All
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Your tracked cryptocurrencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : watchlistItems.length > 0 ? (
                    <div className="space-y-3">
                      {watchlistItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">{item.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Added {new Date(item.added_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {watchlistItems.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground pt-2">
                          +{watchlistItems.length - 5} more items
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No cryptocurrencies in your watchlist yet</p>
                      <Button asChild>
                        <a href="/crypto">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Watchlist
                        </a>
                      </Button>
                    </div>
                  )}
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

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  Your account verification and security status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {profile?.email_verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">Email Verification</p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.email_verified ? 'Verified' : 'Pending verification'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={profile?.email_verified ? "default" : "secondary"}>
                      {profile?.email_verified ? 'Active' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {profile?.two_factor_enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.two_factor_enabled ? 'Enabled' : 'Not enabled'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      {profile?.two_factor_enabled ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>
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
                  View real-time cryptocurrency prices and charts powered by Coinbase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bitcoin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Explore cryptocurrency markets with live charts and data from Coinbase</p>
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