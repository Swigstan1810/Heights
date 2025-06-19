// app/home/page.tsx - Updated with real-time Coinbase data
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';
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
  PieChart,
  Wifi,
  WifiOff,
  Flame,
  CheckCircle2
} from "lucide-react";
import Link from 'next/link';
import TradingViewWidget from '@/components/trading/tradingview-widget';
import TradingViewAdvancedChart from '@/components/trading/tradingview-widget';

// Enhanced TradingView Widget Component with real-time symbol updates
const LiveTradingViewWidget = ({ symbol, height = 400, marketData }: {
  symbol: string;
  height?: number;
  marketData?: MarketData;
}) => {
  const [displaySymbol, setDisplaySymbol] = useState(symbol);

  useEffect(() => {
    // Update symbol when market data changes
    if (marketData) {
      // Convert to TradingView format
      const tvSymbol = `COINBASE:${marketData.productId.replace('-', '')}`;
      setDisplaySymbol(tvSymbol);
    }
  }, [marketData]);

  return (
    <div className="relative">
      <TradingViewAdvancedChart
        symbol={displaySymbol}
        height={height}
      />
      {marketData && (
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">${marketData.price.toFixed(2)}</span>
            <span className={`${marketData.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {marketData.change24hPercent >= 0 ? '+' : ''}{marketData.change24hPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
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

// Real-time Market Stats Component
const LiveMarketStats = () => {
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);

  // Top symbols to track
  const TRACKED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'AVAX'];

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to market data for tracked symbols
    TRACKED_SYMBOLS.forEach(symbol => {
      const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (data) => {
        setMarketData(prev => new Map(prev).set(symbol, data));
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    });

    // Monitor connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(coinbaseRealtimeService.getConnectionState());
    }, 1000);

    // Load initial data
    Promise.all(
      TRACKED_SYMBOLS.map(symbol => coinbaseRealtimeService.getMarketData(symbol))
    ).then(results => {
      const dataMap = new Map<string, MarketData>();
      results.forEach((data, index) => {
        if (data) {
          dataMap.set(TRACKED_SYMBOLS[index], data);
        }
      });
      setMarketData(dataMap);
      setLoading(false);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      clearInterval(statusInterval);
    };
  }, []);

  const stats = Array.from(marketData.values()).slice(0, 6);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {TRACKED_SYMBOLS.map((symbol, index) => (
          <div key={symbol} className="animate-pulse">
            <div className="bg-card/50 border border-border/50 rounded-lg p-4">
              <div className="h-4 bg-muted rounded w-16 mb-2"></div>
              <div className="h-6 bg-muted rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${
            connectionStatus === 'connected' ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500'
          }`}>
            {connectionStatus === 'connected' ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : (
              <WifiOff className="h-3 w-3 mr-1" />
            )}
            {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
          </Badge>
          <span className="text-sm text-muted-foreground">Coinbase WebSocket</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Last update: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/70 transition-all cursor-pointer group relative overflow-hidden"
            onClick={() => window.open(`/crypto?symbol=${item.symbol}`, '_blank')}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 opacity-5 ${
              item.change24hPercent >= 0 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                : 'bg-gradient-to-br from-red-500 to-rose-500'
            }`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {item.symbol}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  item.change24hPercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">
                  ${item.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: item.price < 1 ? 4 : 2
                  })}
                </p>
                <div className={`text-sm flex items-center ${
                  item.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {item.change24hPercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {item.change24hPercent >= 0 ? '+' : ''}{item.change24hPercent.toFixed(2)}%
                </div>
              </div>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-muted-foreground">Click to trade</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Portfolio Summary Component with Real Data
const PortfolioSummary = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    holdingsCount: 0,
    walletBalance: 500000
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  const fetchPortfolioData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: summary, error: summaryError } = await supabase
        .from('portfolio_summary_view')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: walletData, error: walletError } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'INR')
        .single();

      const walletBalance = walletData?.balance || 500000;

      if (summary) {
        setPortfolioData({
          totalValue: Number(summary.total_value) || 0,
          totalInvested: Number(summary.total_invested) || 0,
          totalPnL: Number(summary.total_pnl) || 0,
          totalPnLPercentage: Number(summary.total_pnl_percentage) || 0,
          holdingsCount: Number(summary.holdings_count) || 0,
          walletBalance: walletBalance
        });
      } else {
        setPortfolioData(prev => ({
          ...prev,
          walletBalance: walletBalance
        }));
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchPortfolioData();

    const handlePortfolioUpdate = () => {
      fetchPortfolioData();
    };

    window.addEventListener('portfolioUpdate', handlePortfolioUpdate);
    window.addEventListener('syncAllData', handlePortfolioUpdate);

    const subscription = supabase
      .channel('portfolio-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolio_holdings',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => {
          fetchPortfolioData();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'wallet_balance',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchPortfolioData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('portfolioUpdate', handlePortfolioUpdate);
      window.removeEventListener('syncAllData', handlePortfolioUpdate);
      subscription.unsubscribe();
    };
  }, [user, fetchPortfolioData, supabase]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-green-500">Portfolio Value</span>
          </div>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-bold">
            {formatCurrency(portfolioData.totalValue / 83)}
          </p>
          <p className="text-xs sm:text-sm text-green-500 flex items-center">
            {portfolioData.totalPnL >= 0 ? (
              <ArrowRight className="h-3 w-3 mr-1 rotate-[-45deg]" />
            ) : (
              <ArrowRight className="h-3 w-3 mr-1 rotate-[45deg]" />
            )}
            {portfolioData.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnL / 83)} 
            ({portfolioData.totalPnLPercentage.toFixed(2)}%) all time
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            <span className="text-xs sm:text-sm font-medium text-blue-500">Active Positions</span>
          </div>
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-bold">
            <AnimatedCounter value={portfolioData.holdingsCount} />
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
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
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-purple-500">Available Balance</span>
          </div>
          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-bold">
            ₹<AnimatedCounter value={portfolioData.walletBalance} decimals={0} />
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ready for trading
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Updated RecentNews Component with improved error handling and data mapping
const RecentNews = () => {
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try different categories for variety
      const categories = ['business', 'all', 'general'];
      const category = categories[retryCount % categories.length];
      
      // Fetch from your API route with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/news?category=${category}&limit=6`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Map the API response to match the expected format
        const mappedArticles = data.data.map((article: any, index: number) => ({
          id: article.id || `article-${Date.now()}-${index}`,
          title: article.title,
          description: article.summary || article.description || article.content?.substring(0, 150) + '...',
          publishedAt: article.timestamp || new Date().toISOString(),
          source: {
            name: article.source || 'Unknown Source'
          },
          url: article.url,
          urlToImage: article.image || article.urlToImage,
          category: article.category || 'general',
          sentiment: article.sentiment || 'neutral',
          impact: article.impact || 'medium',
          tags: article.tags || []
        }));
        
        setNewsArticles(mappedArticles.slice(0, 5));
        console.log(`✅ News loaded successfully from ${data.source || 'API'}`);
      } else {
        throw new Error(data.error || 'No news data available');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      
      if (retryCount < 2) {
        // Retry with different category
        console.log(`🔄 Retrying news fetch (attempt ${retryCount + 2}/3)`);
        setTimeout(() => fetchNews(retryCount + 1), 2000);
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load news');
      
      // Fallback to comprehensive demo data
      const fallbackNews = [
        {
          id: '1',
          title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Grows',
          description: 'Major financial institutions continue to embrace cryptocurrency, driving Bitcoin to new monthly highs amid increased trading volume and regulatory clarity.',
          publishedAt: new Date().toISOString(),
          source: { name: 'CryptoNews' },
          url: '#',
          category: 'crypto',
          sentiment: 'positive',
          impact: 'high',
          tags: ['Bitcoin', 'Cryptocurrency', 'Institutional']
        },
        {
          id: '2',
          title: 'Indian Stock Market Reaches Record High on Strong Q3 Earnings',
          description: 'Nifty 50 and Sensex both hit all-time highs as major companies report better-than-expected quarterly results across IT and pharmaceutical sectors.',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          source: { name: 'Economic Times' },
          url: '#',
          category: 'india',
          sentiment: 'positive',
          impact: 'medium',
          tags: ['Nifty', 'Sensex', 'Earnings']
        },
        {
          id: '3',
          title: 'Global Tech Stocks Face Pressure Amid Rising Interest Rates',
          description: 'Technology stocks worldwide decline as central banks signal continued monetary tightening to combat persistent inflation pressures.',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          source: { name: 'Financial Times' },
          url: '#',
          category: 'global',
          sentiment: 'negative',
          impact: 'high',
          tags: ['Technology', 'Interest Rates', 'Global']
        },
        {
          id: '4',
          title: 'Ethereum 2.0 Staking Rewards Attract Institutional Interest',
          description: 'Major investment firms explore Ethereum staking opportunities as the network\'s proof-of-stake transition creates new yield generation methods.',
          publishedAt: new Date(Date.now() - 10800000).toISOString(),
          source: { name: 'DeFi Pulse' },
          url: '#',
          category: 'crypto',
          sentiment: 'positive',
          impact: 'medium',
          tags: ['Ethereum', 'Staking', 'DeFi']
        },
        {
          id: '5',
          title: 'Federal Reserve Signals Potential Rate Adjustments',
          description: 'Fed officials indicate readiness to adjust monetary policy based on upcoming economic data and inflation trends in the coming quarters.',
          publishedAt: new Date(Date.now() - 14400000).toISOString(),
          source: { name: 'Reuters' },
          url: '#',
          category: 'economy',
          sentiment: 'neutral',
          impact: 'high',
          tags: ['Federal Reserve', 'Interest Rates', 'Monetary Policy']
        }
      ];
      setNewsArticles(fallbackNews);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 15 minutes (reasonable for news)
    const interval = setInterval(() => fetchNews(), 900000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const getSentimentStyle = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'negative':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getImpactStyle = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="animate-pulse"
          >
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="flex gap-2 mt-3">
                  <div className="h-5 bg-muted rounded w-16"></div>
                  <div className="h-5 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error && newsArticles.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Unable to load news at the moment</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live News
          </Badge>
          <span className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        {error && (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
            <AlertCircle className="h-3 w-3 mr-1" />
            Using cached data
          </Badge>
        )}
      </div>

      {newsArticles.map((article, index) => (
        <motion.div
          key={article.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all cursor-pointer p-4"
          onClick={() => article.url && window.open(article.url, '_blank')}
        >
          {/* Gradient background based on sentiment */}
          <div className={`absolute inset-0 opacity-5 ${
            article.sentiment === 'positive' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500'
              : article.sentiment === 'negative'
              ? 'bg-gradient-to-br from-red-500 to-rose-500'
              : 'bg-gradient-to-br from-blue-500 to-purple-500'
          }`} />
          
          <div className="relative z-10 flex items-start gap-4">
            {/* Article Image */}
            {article.urlToImage && (
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-2">
                {article.sentiment && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs border ${getSentimentStyle(article.sentiment)}`}
                  >
                    {article.sentiment === 'positive' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : article.sentiment === 'negative' ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : (
                      <Activity className="h-3 w-3 mr-1" />
                    )}
                    {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                  </Badge>
                )}
                
                {article.impact && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs border ${getImpactStyle(article.impact)}`}
                  >
                    {article.impact === 'high' ? (
                      <Flame className="h-3 w-3 mr-1" />
                    ) : article.impact === 'medium' ? (
                      <Zap className="h-3 w-3 mr-1" />
                    ) : (
                      <Target className="h-3 w-3 mr-1" />
                    )}
                    {article.impact.charAt(0).toUpperCase() + article.impact.slice(1)} Impact
                  </Badge>
                )}
                
                {article.category && (
                  <Badge variant="secondary" className="text-xs">
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <h4 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {article.description}
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="text-xs border-border/50">
                    {article.source?.name || 'Unknown Source'}
                  </Badge>
                </div>
                
                {article.url && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                    <Badge 
                      key={tagIndex} 
                      variant="secondary" 
                      className="text-xs bg-muted/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-muted/50">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      
      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <Button variant="outline" className="group" asChild>
          <Link href="/news">
            <BookOpen className="h-4 w-4 mr-2" />
            View All Market News
            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

// Updated Recent Activity Component with Real Data from /api/crypto/trades
const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from robust API route
      const response = await fetch('/api/crypto/trades?limit=6');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch trading activities');
      }

      setActivities((data.trades || []).map((trade: any) => ({
        id: trade.id,
        type: trade.trade_type,
        symbol: trade.symbol,
        name: trade.symbol, // Optionally map to full name
        amount: trade.total_inr,
        quantity: trade.quantity,
        price: trade.price_inr,
        status: trade.status,
        createdAt: trade.executed_at,
        asset_type: 'crypto',
        fees: trade.brokerage_fee || 0
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // Auto-refresh every 2 minutes for real-time updates
    const interval = setInterval(fetchActivities, 120000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Listen for portfolio updates
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      fetchActivities();
    };

    window.addEventListener('portfolioUpdate', handlePortfolioUpdate);
    window.addEventListener('syncAllData', handlePortfolioUpdate);

    return () => {
      window.removeEventListener('portfolioUpdate', handlePortfolioUpdate);
      window.removeEventListener('syncAllData', handlePortfolioUpdate);
    };
  }, [fetchActivities]);

  // Format currency to INR
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get crypto icon
  const getCryptoIcon = (symbol: string) => {
    const iconMap: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'SOL': '◎',
      'MATIC': '⬡',
      'LINK': '🔗',
      'AVAX': '▲',
      'ADA': '₳',
      'UNI': '🦄',
      'AAVE': 'Ⓐ'
    };
    return iconMap[symbol] || symbol.charAt(0);
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="animate-pulse"
          >
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Unable to load trading activity</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchActivities()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (activities.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">No recent trading activity</p>
        <p className="text-xs text-muted-foreground mb-4">Start trading to see your transaction history</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/crypto">
            <TrendingUp className="h-4 w-4 mr-2" />
            Start Trading
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live Activity
          </Badge>
          <span className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        {error && (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error loading data
          </Badge>
        )}
      </div>

      {activities.slice(0, 5).map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all p-4"
        >
          {/* Gradient background based on trade type */}
          <div className={`absolute inset-0 opacity-5 ${
            activity.type === 'buy'
              ? 'bg-gradient-to-br from-green-500 to-emerald-500'
              : 'bg-gradient-to-br from-red-500 to-rose-500'
          }`} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Trade Type Icon */}
              <div className={`p-2 rounded-full ${
                activity.type === 'buy' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {activity.type === 'buy' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              
              {/* Crypto Icon */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                {getCryptoIcon(activity.symbol)}
              </div>
              
              {/* Trade Details */}
              <div>
                <p className="font-medium">
                  {activity.type === 'buy' ? 'Bought' : 'Sold'} {activity.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.quantity.toFixed(6)} {activity.symbol} @ {formatINR(activity.price)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusStyle(activity.status)}`}
                  >
                    {activity.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    ) : activity.status === 'pending' ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    ) : (
                      activity.status
                    )}
                  </Badge>
                  {activity.fees > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Fee: {formatINR(activity.fees)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Amount and Time */}
            <div className="text-right">
              <p className={`font-medium ${
                activity.type === 'buy' ? 'text-red-500' : 'text-green-500'
              }`}>
                {activity.type === 'buy' ? '-' : '+'}{formatINR(activity.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {/* Hover Effect */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </motion.div>
      ))}
      
      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <Button variant="outline" className="group" asChild>
          <Link href="/portfolio?tab=activity">
            <Activity className="h-4 w-4 mr-2" />
            View All Activity
            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [selectedCrypto, setSelectedCrypto] = useState<MarketData | null>(null);
  const { scrollY } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Get BTC data for main chart
  useEffect(() => {
    const unsubscribe = coinbaseRealtimeService.subscribe('BTC', (data) => {
      setSelectedCrypto(data);
    });

    // Load initial BTC data
    coinbaseRealtimeService.getMarketData('BTC').then(data => {
      if (data) setSelectedCrypto(data);
    });

    return unsubscribe;
  }, []);

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
          </div>
          
          <LiveMarketStats />
        </motion.section>

        {/* Trading Charts Section with Real-time Data */}
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
                  {selectedCrypto && (
                    <Badge variant="outline" className="ml-auto">
                      ${selectedCrypto.price.toFixed(2)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <LiveTradingViewWidget 
                  symbol="COINBASE:BTCUSD" 
                  height={400} 
                  marketData={selectedCrypto || undefined}
                />
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
                <TradingViewAdvancedChart symbol="COINBASE:ETHUSD" height={400} />
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
              onClick={() => router.push('/crypto')}
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
                    $<AnimatedCounter value={10} suffix="B+" />
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