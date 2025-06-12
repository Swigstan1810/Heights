// app/(protected)/dashboard/page.tsx - Fixed version
"use client";

import { memo, useCallback, useMemo, Suspense, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp,
  Bitcoin,
  BarChart3,
  Building2,
  Shield,
  CheckCircle2,
  Star,
  Activity,
  Zap,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Plus,
  Clock,
  Loader2
} from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Simple hooks (inline to avoid import issues)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useOptimizedFetch<T>(
  url: string | null,
  deps: any[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Lazy load heavy components
const AssistantButton = dynamic(
  () => import('@/components/ai-assistant').then(mod => ({ default: mod.AssistantButton })),
  {
    loading: () => <Button size="sm" disabled>AI Assistant</Button>,
    ssr: false,
  }
);

// Types
interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  added_at: string;
}

interface PortfolioData {
  totalValue?: number;
  totalPnL?: number;
  totalPnLPercentage?: number;
  holdingsCount?: number;
}

// Memoized components
const StatsCard = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: { value: number; positive: boolean };
}) => (
  <Card className="relative overflow-hidden">
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
          {trend.positive ? '+' : ''}{trend.value.toFixed(2)}%
        </p>
      )}
    </CardContent>
  </Card>
));

const CardSkeleton = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-32 w-full" />
    </CardContent>
  </Card>
));

const QuickAction = memo(({ 
  href, 
  icon: Icon, 
  label 
}: { 
  href: string; 
  icon: any; 
  label: string; 
}) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Button variant="outline" className="h-24 w-full flex-col" asChild>
      <a href={href}>
        <Icon className="h-6 w-6 mb-2" />
        <span>{label}</span>
      </a>
    </Button>
  </motion.div>
));

export default function DashboardPage() {
  const { user, profile, walletBalance, loading: authLoading, isAuthenticated, refreshWalletBalance } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const supabase = createClientComponentClient<Database>();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirectTo=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  // Debounce wallet balance to prevent excessive re-renders
  const debouncedBalance = useDebounce(walletBalance, 100);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user) return { portfolioData: null, watchlistData: null };

    try {
      setError(null);
      
      // Fetch portfolio and watchlist data
      const [portfolioResponse, watchlistResponse] = await Promise.allSettled([
        supabase
          .from('portfolio_holdings')
          .select('current_value, profit_loss')
          .eq('user_id', user.id),
        supabase
          .from('crypto_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })
          .limit(5)
      ]);

      let portfolioData: PortfolioData | null = null;
      let watchlistData: WatchlistItem[] = [];

      // Process portfolio data
      if (portfolioResponse.status === 'fulfilled' && portfolioResponse.value.data) {
        const holdings = portfolioResponse.value.data;
        const totalValue = holdings.reduce((sum, holding) => sum + Number(holding.current_value || 0), 0);
        const totalPnL = holdings.reduce((sum, holding) => sum + Number(holding.profit_loss || 0), 0);
        
        portfolioData = {
          totalValue,
          totalPnL,
          totalPnLPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
          holdingsCount: holdings.length
        };
      }

      // Process watchlist data
      if (watchlistResponse.status === 'fulfilled' && watchlistResponse.value.data) {
        watchlistData = watchlistResponse.value.data;
      }

      return { portfolioData, watchlistData };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      return { portfolioData: null, watchlistData: [] };
    }
  }, [user, supabase]);

  // Use effect to load data
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user && isAuthenticated) {
      setDataLoading(true);
      loadDashboardData().then(({ portfolioData, watchlistData }) => {
        setPortfolioData(portfolioData);
        setWatchlistData(watchlistData || []);
        setDataLoading(false);
      });
    }
  }, [user, isAuthenticated, loadDashboardData]);

  // Memoized calculations
  const safeWalletBalance = useMemo(() => 
    debouncedBalance ?? { balance: 0, locked_balance: 0, currency: 'INR' }
  , [debouncedBalance]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshWalletBalance(),
      loadDashboardData().then(({ portfolioData, watchlistData }) => {
        setPortfolioData(portfolioData);
        setWatchlistData(watchlistData || []);
      })
    ]);
    setRefreshing(false);
  };

  const statsData = useMemo(() => [
    {
      title: "Wallet Balance",
      value: formatCurrency(Number(safeWalletBalance.balance)),
      subtitle: Number(safeWalletBalance.locked_balance) > 0 
        ? `Locked: ${formatCurrency(Number(safeWalletBalance.locked_balance))}`
        : "Available for trading",
      icon: Wallet,
    },
    {
      title: "Portfolio Value",
      value: formatCurrency(portfolioData?.totalValue || 0),
      subtitle: `${portfolioData?.holdingsCount || 0} positions`,
      icon: TrendingUp,
      trend: portfolioData?.totalPnLPercentage ? {
        value: portfolioData.totalPnLPercentage,
        positive: portfolioData.totalPnLPercentage >= 0
      } : undefined,
    },
    {
      title: "Watchlist Items",
      value: watchlistData?.length || 0,
      subtitle: "Tracked assets",
      icon: Star,
    },
    {
      title: "Total P&L",
      value: formatCurrency(portfolioData?.totalPnL || 0),
      subtitle: "All time",
      icon: Activity,
    },
  ], [safeWalletBalance, portfolioData, watchlistData, formatCurrency]);

  const quickActions = useMemo(() => [
    { href: "/crypto", icon: Bitcoin, label: "Explore Crypto" },
    { href: "/portfolio", icon: BarChart3, label: "View Portfolio" },
    { href: "/trade", icon: Zap, label: "Start Trading" },
  ], []);

  // Show loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}!
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
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Suspense fallback={<Button size="sm" disabled>AI Assistant</Button>}>
              <AssistantButton />
            </Suspense>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <StatsCard
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                trend={stat.trend}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Complete these steps to unlock Heights' full potential
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
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Create Watchlist</p>
                    <p className="text-sm text-muted-foreground">Track your favorite assets</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <a href="/crypto">Start</a>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
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
                  <a href="/crypto">Explore</a>
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
                  <a href="/watchlist">
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
              {dataLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : watchlistData && watchlistData.length > 0 ? (
                <div className="space-y-3">
                  {watchlistData.slice(0, 3).map((item, index) => (
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
                          <span className="text-xs font-medium">{item.symbol?.slice(0, 2) || 'NA'}</span>
                        </div>
                        <div>
                          <p className="font-medium">{item.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{item.symbol || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Added {new Date(item.added_at).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {watchlistData.length > 3 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      +{watchlistData.length - 3} more items
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No assets in your watchlist yet</p>
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Start exploring Heights features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <QuickAction
                  key={action.href}
                  href={action.href}
                  icon={action.icon}
                  label={action.label}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
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
                      {profile?.email_verified 
                        ? 'Your email address has been verified' 
                        : 'Please verify your email address'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={profile?.email_verified ? "default" : "secondary"}>
                  {profile?.email_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}