// app/(protected)/dashboard/page.tsx - Enhanced with better loading and error handling
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info,
  Clock,
  TrendingDown
} from "lucide-react";
import { AssistantButton } from '@/components/ai-assistant';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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

interface DashboardStats {
  portfolioValue: number;
  portfolioChange: number;
  totalPnL: number;
  winRate: number;
}

// Enhanced loading skeleton components
const StatsCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-[120px] mb-2" />
      <Skeleton className="h-3 w-[80px]" />
    </CardContent>
  </Card>
);

const WatchlistSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-[100px] mb-1" />
            <Skeleton className="h-3 w-[60px]" />
          </div>
        </div>
        <Skeleton className="h-3 w-[80px]" />
      </div>
    ))}
  </div>
);

const NewsCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export default function Dashboard() {
  const { 
    user, 
    profile, 
    walletBalance, 
    loading: authLoading, 
    isAuthenticated, 
    isInitialized,
    refreshWalletBalance,
    error: authError,
    profileError,
    clearError,
    retryProfileLoad
  } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    transactionCount: 0
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    portfolioValue: 0,
    portfolioChange: 0,
    totalPnL: 0,
    winRate: 0
  });
  const [loadingData, setLoadingData] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  const supabase = createClientComponentClient<Database>();

  // Memoized computed values
  const safeWalletBalance = useMemo(() => 
    walletBalance ?? { balance: 0, locked_balance: 0, currency: 'INR' }
  , [walletBalance]);
  
  const totalBalance = useMemo(() => 
    Number(safeWalletBalance.balance) + Number(safeWalletBalance.locked_balance)
  , [safeWalletBalance]);

  const formatCurrency = useMemo(() => (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Enhanced redirect logic with better error handling
  useEffect(() => {
    if (authLoading || !isInitialized) {
      return; // Still loading auth
    }

    if (!isAuthenticated || !user) {
      console.log('[Dashboard] Redirecting to login - not authenticated');
      router.push("/login?redirectTo=/dashboard");
      return;
    }

    console.log('[Dashboard] User authenticated, proceeding...');
  }, [authLoading, isAuthenticated, user, router, isInitialized]);

  // Enhanced data fetching with retry logic
  const fetchDashboardData = async (retryCount = 0) => {
    if (!user || authLoading || !isAuthenticated) {
      return;
    }

    try {
      setLoadingData(true);
      setError(null);
      console.log('[Dashboard] Fetching data for user:', user.id);
      
      // Parallel data fetching with individual error handling
      const promises = [
        // Fetch watchlist
        supabase
          .from('crypto_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })
          .then(result => ({ type: 'watchlist', ...result })),
        
        // Fetch transactions
        supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .then(result => ({ type: 'transactions', ...result })),
        
        // Fetch news
        fetch('/api/news?category=business&pageSize=5')
          .then(res => res.json())
          .then(data => ({ type: 'news', data: data.articles || [], error: null }))
          .catch(err => ({ type: 'news', data: [], error: err }))
      ];

      const results = await Promise.allSettled(promises);
      
      // Process results individually
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          
          switch (data.type) {
            case 'watchlist':
              if (data.error) {
                console.error('[Dashboard] Watchlist error:', data.error);
              } else if (data.data) {
                console.log('[Dashboard] Watchlist loaded:', data.data.length, 'items');
                setWatchlistItems(data.data);
              }
              break;
              
            case 'transactions':
              if (data.error) {
                console.error('[Dashboard] Transactions error:', data.error);
              } else if (data.data) {
                console.log('[Dashboard] Transactions loaded:', data.data.length, 'items');
                const summary = data.data.reduce((acc: TransactionSummary, tx: any) => {
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
              break;
              
            case 'news':
              if (data.data && data.data.length > 0) {
                console.log('[Dashboard] News loaded:', data.data.length, 'items');
                setNewsItems(data.data);
              }
              break;
          }
        } else {
          console.error('[Dashboard] Promise rejected:', result.reason);
        }
      });

      // Generate mock portfolio stats
      setDashboardStats({
        portfolioValue: totalBalance * 1.05, // Mock 5% growth
        portfolioChange: 2.34,
        totalPnL: totalBalance * 0.05,
        winRate: 68.5
      });

      setDataLastUpdated(new Date());

    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
      
      if (retryCount < 2) {
        console.log(`[Dashboard] Retrying data fetch (attempt ${retryCount + 1})`);
        setTimeout(() => fetchDashboardData(retryCount + 1), 2000 * (retryCount + 1));
        return;
      }
      
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoadingData(false);
      console.log('[Dashboard] Data loading complete');
    }
  };

  // Fetch dashboard data when user is ready
  useEffect(() => {
    if (user && isAuthenticated && !authLoading && isInitialized) {
      fetchDashboardData();
    }
  }, [user, isAuthenticated, authLoading, isInitialized, totalBalance]);

  // Enhanced refresh function
  const handleRefresh = async () => {
    if (loadingData) return;
    
    await Promise.all([
      refreshWalletBalance(),
      fetchDashboardData()
    ]);
  };

  // Handle profile errors with retry option
  if (profileError && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Profile Loading Error</h2>
          <p className="text-muted-foreground mb-4">{profileError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={retryProfileLoad}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show enhanced loading screen
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Loader2 className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Enhanced Error Alerts */}
        <AnimatePresence>
          {(error || authError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error || authError}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      clearError();
                      setError(null);
                      handleRefresh();
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with enhanced user greeting */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Whats Up!, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Secure session active
              </p>
              <Badge variant={profile?.email_verified ? "default" : "secondary"}>
                {profile?.email_verified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </>
                )}
              </Badge>
              {dataLastUpdated && (
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Updated {dataLastUpdated.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loadingData}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <AssistantButton />
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {loadingData ? (
              <StatsCardSkeleton />
            ) : (
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
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
                    {showBalance ? formatCurrency(Number(safeWalletBalance.balance)) : "••••••"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Number(safeWalletBalance.locked_balance) > 0 && showBalance && 
                      `Locked: ${formatCurrency(Number(safeWalletBalance.locked_balance))}`
                    }
                    {Number(safeWalletBalance.locked_balance) === 0 && "Available for trading"}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {loadingData ? (
              <StatsCardSkeleton />
            ) : (
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {showBalance ? formatCurrency(dashboardStats.portfolioValue) : "••••••"}
                  </div>
                  <p className="text-xs text-green-500 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{dashboardStats.portfolioChange}% today
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {loadingData ? (
              <StatsCardSkeleton />
            ) : (
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Watchlist Items</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{watchlistItems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Tracked cryptocurrencies
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {loadingData ? (
              <StatsCardSkeleton />
            ) : (
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                  <Activity className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {showBalance ? formatCurrency(dashboardStats.totalPnL) : "••••••"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.winRate}% win rate
                  </p>
                </CardContent>
              </Card>
            )}
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
                    Complete these steps to unlock the full potential of Heights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-muted-foreground">Welcome to Heights!</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Complete
                    </Badge>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Profile Setup</p>
                        <p className="text-sm text-muted-foreground">Your profile is configured</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Complete
                    </Badge>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
                  </motion.div>
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
                    <WatchlistSkeleton />
                  ) : watchlistItems.length > 0 ? (
                    <div className="space-y-3">
                      {watchlistItems.slice(0, 5).map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push('/crypto')}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
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
                        </motion.div>
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

            {/* Market News */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Market News
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/news">
                      View All
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Latest financial and cryptocurrency news
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingNews ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <NewsCardSkeleton key={i} />)}
                  </div>
                ) : newsItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newsItems.slice(0, 4).map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <h4 className="font-medium line-clamp-2 mb-2">{article.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {article.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{article.source.name}</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No news available at the moment</p>
                    <Button variant="outline" onClick={() => setLoadingNews(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh News
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col" asChild>
                      <a href="/crypto">
                        <Bitcoin className="h-6 w-6 mb-2" />
                        <span>Explore Crypto</span>
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col" asChild>
                      <a href="/news">
                        <Activity className="h-6 w-6 mb-2" />
                        <span>Read News</span>
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col" asChild>
                      <a href="/ai">
                        <Sparkles className="h-6 w-6 mb-2" />
                        <span>AI Assistant</span>
                      </a>
                    </Button>
                  </motion.div>
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
                          {profile?.two_factor_enabled ? 'Enabled' : 'Recommended for security'}
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