"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { marketDataService, type MarketData } from '@/lib/market-data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Bitcoin, 
  BarChart3, 
  Building2,
  ArrowRight,
  Activity,
  ChevronRight,
  Sparkles,
  Globe,
  Shield,
  Zap,
  Users,
  Award,
  Star,
  DollarSign,
  Lock,
  LineChart,
  Wallet,
  RefreshCw,
  Eye,
  Brain,
  Target,
  Rocket,
  Diamond,
  AlertCircle,
  Loader2,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  TrendingDownIcon,
  CreditCard,
  PieChart
} from "lucide-react";
import Link from 'next/link';

// Enhanced TradingView Widget Component
const TradingViewWidget = ({ symbol, height = 400, theme = 'dark' }: {
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "1D",
          timezone: "Asia/Kolkata",
          theme: theme,
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerRef.current.id,
          height: height,
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
          show_popup_button: false,
          hide_side_toolbar: true,
          hide_legend: false,
          save_image: false,
          hide_volume: false,
        });
      }
    };

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, height, theme]);

  return (
    <div 
      ref={containerRef} 
      id={`tradingview_${symbol.replace(':', '_')}`}
      className="w-full rounded-lg overflow-hidden"
      style={{ height: `${height}px` }}
    />
  );
};

// Animated Counter Component
function AnimatedCounter({ 
  value, 
  prefix = "", 
  suffix = "", 
  decimals = 0,
  duration = 2000 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value, duration, isVisible]);
  
  return (
    <span ref={ref}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// Market Stats Component
const MarketStats = ({ data }: { data: Map<string, MarketData> }) => {
  const stats = Array.from(data.values()).slice(0, 6);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((item, index) => (
        <motion.div
          key={item.symbol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/70 transition-all cursor-pointer group"
          onClick={() => window.open(`/trade?symbol=${item.symbol}`, '_blank')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {item.symbol.replace('CRYPTO:', '').replace('NSE:', '')}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              item.change24hPercent >= 0 ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-lg">
              ${item.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
            <p className={`text-sm flex items-center ${
              item.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {item.change24hPercent >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {item.change24hPercent >= 0 ? '+' : ''}{item.change24hPercent.toFixed(2)}%
            </p>
          </div>
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-muted-foreground">Click to trade</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Portfolio Summary Component with Real Data
const PortfolioSummary = () => {
  const { walletBalance, profile, user } = useAuth();
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    holdingsCount: 0,
    todayChange: 0,
    todayChangePercent: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user) return;

      try {
        // Get portfolio summary from database
        const { data: summary, error: summaryError } = await supabase
          .rpc('get_portfolio_summary', { p_user_id: user.id });

        if (summaryError) {
          console.error('Error fetching portfolio summary:', summaryError);
          return;
        }

        if (summary && summary.length > 0) {
          const data = summary[0];
          setPortfolioData({
            totalValue: Number(data.total_value) || 0,
            totalInvested: Number(data.total_invested) || 0,
            totalPnL: Number(data.total_pnl) || 0,
            totalPnLPercentage: Number(data.total_pnl_percentage) || 0,
            holdingsCount: Number(data.holdings_count) || 0,
            todayChange: Number(data.total_pnl) * 0.02, // Simulate today's change
            todayChangePercent: 2.32 // Simulate today's change percentage
          });
        }
      } catch (error) {
        console.error('Error loading portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [user, supabase]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-500">Portfolio Value</span>
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            {formatCurrency(portfolioData.totalValue)}
          </p>
          <p className="text-sm text-green-500 flex items-center">
            {portfolioData.totalPnL >= 0 ? (
              <ArrowRight className="h-3 w-3 mr-1 rotate-[-45deg]" />
            ) : (
              <ArrowRight className="h-3 w-3 mr-1 rotate-[45deg]" />
            )}
            {portfolioData.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnL)} 
            ({portfolioData.totalPnLPercentage.toFixed(2)}%) all time
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">Active Positions</span>
          </div>
          <Activity className="h-5 w-5 text-blue-500" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            <AnimatedCounter value={portfolioData.holdingsCount} />
          </p>
          <p className="text-sm text-muted-foreground">
            {portfolioData.holdingsCount > 0 
              ? `Across crypto & stocks`
              : 'No active positions'
            }
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">Available Balance</span>
          </div>
          <Eye className="h-5 w-5 text-purple-500" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            ₹<AnimatedCounter value={Number(walletBalance?.balance || 0)} decimals={2} />
          </p>
          <p className="text-sm text-muted-foreground">
            Ready for trading
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// News Component with Real Data
const RecentNews = () => {
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news?category=business&pageSize=5');
        const data = await response.json();
        
        if (data.success && data.articles) {
          setNewsArticles(data.articles.slice(0, 5));
        } else {
          setError('Failed to load news');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || newsArticles.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Unable to load news at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {newsArticles.map((article, index) => (
        <motion.div
          key={article.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all cursor-pointer"
          onClick={() => window.open(article.url, '_blank')}
        >
          <div className="flex-1">
            <h4 className="font-medium line-clamp-2 mb-1">{article.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{article.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {article.source?.name || 'News'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        </motion.div>
      ))}
    </div>
  );
};

// Recent Activity Component with Real Data
const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      try {
        // Fetch recent orders
        const { data: orders, error } = await supabase
          .from('portfolio_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }

        const formattedActivities = orders?.map(order => ({
          id: order.id,
          type: order.order_type,
          symbol: order.symbol,
          name: order.name,
          amount: order.total_amount,
          quantity: order.quantity,
          price: order.price,
          status: order.status,
          createdAt: order.created_at
        })) || [];

        setActivities(formattedActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No recent trading activity</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/trade">
            <TrendingUp className="h-4 w-4 mr-2" />
            Start Trading
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              activity.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {activity.type === 'buy' ? 
                <TrendingUp className="h-4 w-4" /> : 
                <TrendingDown className="h-4 w-4" />
              }
            </div>
            <div>
              <p className="font-medium">
                {activity.type === 'buy' ? 'Bought' : 'Sold'} {activity.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {activity.quantity} {activity.symbol} @ ₹{activity.price}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">₹{activity.amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(activity.createdAt).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [selectedTab, setSelectedTab] = useState('crypto');
  const [loadingData, setLoadingData] = useState(true);
  const { scrollY } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Major symbols to track
  const CRYPTO_SYMBOLS = ['CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL', 'CRYPTO:MATIC', 'CRYPTO:LINK', 'CRYPTO:AVAX'];

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Connect to market data service
      marketDataService.connect();
      
      // Subscribe to real-time updates
      const unsubscribes = CRYPTO_SYMBOLS.map(symbol => 
        marketDataService.subscribe(symbol, (data) => {
          setCryptoData(prev => new Map(prev).set(symbol, data));
          setLoadingData(false);
        })
      );
      
      // Fetch initial data
      Promise.all(
        CRYPTO_SYMBOLS.map(symbol => marketDataService.getMarketData(symbol))
      ).then(results => {
        const dataMap = new Map();
        results.forEach((data, index) => {
          if (data) {
            dataMap.set(CRYPTO_SYMBOLS[index], data);
          }
        });
        setCryptoData(dataMap);
        setLoadingData(false);
      });

      return () => {
        unsubscribes.forEach(unsub => unsub());
        marketDataService.disconnect();
      };
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            <RefreshCw className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Welcome Hero Section */}
        <motion.section 
          style={{ y: heroY, opacity: heroOpacity } as any}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Welcome back, {user?.email?.split('@')[0]}!
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Trading{" "}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ backgroundSize: "200% 200%" } as any}
              >
                Command Center
              </motion.span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Monitor markets, analyze trends, and execute trades with professional-grade tools
            </p>
          </motion.div>
        </motion.section>

        {/* Portfolio Summary with Real Data */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Portfolio Overview
          </h2>
          <PortfolioSummary />
        </motion.section>

        {/* Live Market Data from Coinbase */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary animate-pulse" />
              Live Market Data
            </h2>
            <Badge variant="outline" className="text-green-500 border-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live from Coinbase
            </Badge>
          </div>
          
          <AnimatePresence mode="wait">
            {loadingData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Connecting to Coinbase WebSocket...</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MarketStats data={cryptoData} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Trading Charts Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Market Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                  Bitcoin (BTC/USD)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewWidget symbol="BTCUSD" height={400} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Diamond className="h-5 w-5 text-blue-500" />
                  Ethereum (ETH/USD)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewWidget symbol="ETHUSD" height={400} />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Recent Activity Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Recent Activity
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Market News
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/news">
                      View All
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentNews />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Your Recent Trades
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/portfolio">
                      View All
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6 cursor-pointer group"
              onClick={() => router.push('/trade')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2">Start Trading</h3>
              <p className="text-sm text-muted-foreground">
                Execute trades with advanced tools and real-time data
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6 cursor-pointer group"
              onClick={() => router.push('/portfolio')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2">Portfolio</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your investments and track performance
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 cursor-pointer group"
              onClick={() => router.push('/ai')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered market insights and trading advice
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-6 cursor-pointer group"
              onClick={() => router.push('/news')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Globe className="h-6 w-6 text-orange-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2">Market News</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with latest financial and crypto news
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Platform Performance */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-12"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Platform Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-primary mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                  >
                    <AnimatedCounter value={99.9} decimals={1} suffix="%" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-primary mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                  >
                    <AnimatedCounter value={12} suffix="ms" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Avg. Latency</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-primary mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                  >
                    <AnimatedCounter value={100000} suffix="+" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-primary mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.6 }}
                  >
                    ₹<AnimatedCounter value={10} suffix="B+" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Daily Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}