"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { marketDataService, type MarketData } from '@/lib/market-data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingDownIcon
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

// Portfolio Summary Component
const PortfolioSummary = () => {
  const { walletBalance, profile } = useAuth();
  
  const mockPortfolioData = {
    totalValue: 125432.50,
    todayChange: 2847.23,
    todayChangePercent: 2.32,
    positions: 12,
    winners: 8,
    losers: 4
  };

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
            <Wallet className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-500">Portfolio Value</span>
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold">
            ₹<AnimatedCounter value={mockPortfolioData.totalValue} decimals={2} />
          </p>
          <p className="text-sm text-green-500 flex items-center">
            <ArrowRight className="h-3 w-3 mr-1 rotate-[-45deg]" />
            +₹{mockPortfolioData.todayChange.toLocaleString()} ({mockPortfolioData.todayChangePercent}%) today
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
            <AnimatedCounter value={mockPortfolioData.positions} />
          </p>
          <p className="text-sm text-muted-foreground">
            {mockPortfolioData.winners} winners • {mockPortfolioData.losers} losers
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
            <DollarSign className="h-5 w-5 text-purple-500" />
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
  const STOCK_SYMBOLS = ['NSE:RELIANCE', 'NSE:TCS', 'NSE:INFY', 'NSE:HDFCBANK', 'NSE:ICICIBANK', 'NSE:SBIN'];

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
          style={{ y: heroY, opacity: heroOpacity }}
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
              Welcome back to Heights
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
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Command Center
              </motion.span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Monitor markets, analyze trends, and execute trades with professional-grade tools
            </p>
          </motion.div>
        </motion.section>

        {/* Portfolio Summary */}
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

        {/* Live Market Data */}
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
              Live
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
                <p className="text-muted-foreground">Loading real-time market data...</p>
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
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                Cryptocurrency
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

            <TabsContent value="crypto" className="space-y-6">
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
            </TabsContent>

            <TabsContent value="stocks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Reliance Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TradingViewWidget symbol="NSE:RELIANCE" height={400} />
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Tata Consultancy Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TradingViewWidget symbol="NSE:TCS" height={400} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mutual-funds" className="space-y-6">
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">Mutual Funds Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We're working on bringing you the best mutual fund investment platform. 
                  Stay tuned for diversified portfolio options managed by experts.
                </p>
                <Button variant="outline" disabled>
                  <Rocket className="h-4 w-4 mr-2" />
                  Notify Me When Available
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mb-12"
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

        {/* Performance Metrics */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mb-12"
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

        {/* Recent Activity */}
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
                <CardTitle className="text-lg">Market Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { symbol: 'BTC', message: 'Bitcoin breaks above $45,000 resistance', time: '2 min ago', type: 'bullish' },
                    { symbol: 'ETH', message: 'Ethereum showing strong momentum', time: '15 min ago', type: 'bullish' },
                    { symbol: 'RELIANCE', message: 'Reliance approaching support level', time: '1 hour ago', type: 'neutral' }
                  ].map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'bullish' ? 'bg-green-500' : 
                          alert.type === 'bearish' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.symbol}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'New AI Trading Assistant Released', time: '1 day ago', type: 'feature' },
                    { title: 'Enhanced Mobile Trading Experience', time: '3 days ago', type: 'improvement' },
                    { title: 'Added 50+ New Cryptocurrency Pairs', time: '1 week ago', type: 'feature' }
                  ].map((update, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.7 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          update.type === 'feature' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
                        }`}>
                          {update.type === 'feature' ? 
                            <Sparkles className="h-4 w-4" /> : 
                            <TrendingUp className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-muted-foreground">{update.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </main>
  );
}