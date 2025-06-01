"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { marketDataService, type MarketData } from '@/lib/market-data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award
} from "lucide-react";
import Link from 'next/link';

// Define the main asset categories
const ASSET_CATEGORIES = [
  {
    id: 'crypto',
    title: 'Cryptocurrencies',
    subtitle: 'Trade Bitcoin, Ethereum and 100+ digital assets',
    icon: Bitcoin,
    color: 'from-orange-500 to-yellow-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    href: '/dashboard?tab=crypto',
    stats: { markets: '150+', volume: '$2.5B', change: '+5.2%' }
  },
  {
    id: 'stocks',
    title: 'Stocks',
    subtitle: 'Invest in NSE & BSE listed companies',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    href: '/dashboard?tab=stocks',
    stats: { markets: '5000+', volume: '₹1.8B', change: '+2.1%' }
  },
  {
    id: 'mutual-funds',
    title: 'Mutual Funds',
    subtitle: 'Diversified portfolio managed by experts',
    icon: Building2,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    href: '/dashboard?tab=mutual-funds',
    stats: { funds: '2000+', aum: '₹45T', returns: '12.5%' }
  }
];

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  
  // Real-time crypto prices from Coinbase
  useEffect(() => {
    marketDataService.connect();
    
    // Subscribe to major crypto pairs
    const symbols = ['CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL', 'CRYPTO:MATIC', 'CRYPTO:LINK', 'CRYPTO:AVAX'];
    const unsubscribes = symbols.map(symbol => 
      marketDataService.subscribe(symbol, (data) => {
        setCryptoData(prev => new Map(prev).set(symbol, data));
        setLoadingCrypto(false);
      })
    );
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const handleCategoryClick = (category: typeof ASSET_CATEGORIES[0]) => {
    setSelectedCategory(category.id);
    // Small delay for animation then navigate
    setTimeout(() => {
      router.push(category.href);
    }, 300);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - TradingView Style */}
      <section className="relative pt-24 pb-16 px-4 md:px-8 lg:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Trading at New{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                Heights
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional trading platform with real-time data from global markets. 
              Trade crypto, stocks, and mutual funds all in one place.
            </p>
          </motion.div>

          {/* Asset Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {ASSET_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative group cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 ${category.borderColor} border-2 hover:shadow-xl ${
                  selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${category.bgColor}`}>
                        <category.icon className={`h-8 w-8 bg-gradient-to-br ${category.color} bg-clip-text text-transparent`} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <CardTitle className="text-2xl mt-4">{category.title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{category.subtitle}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Markets</p>
                        <p className="font-semibold">{category.stats.markets}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-semibold">{category.stats.volume}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h</p>
                        <p className={`font-semibold ${category.stats.change?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {category.stats.change ?? '--'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Live Crypto Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Live Cryptocurrency Prices</h2>
            <div className="bg-card rounded-lg border p-4">
              {loadingCrypto ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Connecting to Coinbase...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Array.from(cryptoData.entries()).map(([symbol, data]) => (
                    <div key={symbol} className="text-center p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                         onClick={() => router.push('/dashboard?tab=crypto')}>
                      <p className="font-semibold">{symbol.split(':')[1]}/USD</p>
                      <p className="text-xl font-bold">${data.price.toLocaleString()}</p>
                      <p className={`text-sm flex items-center justify-center ${
                        data.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {data.change24hPercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(data.change24hPercent).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Heights?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Bank-Grade Security</h3>
                  <p className="text-sm text-muted-foreground">Your funds are protected with industry-leading security measures</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Execute trades in milliseconds with our high-performance engine</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">Get intelligent trading recommendations with Heights+ AI</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-16"
          >
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Trading Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Join 100,000+ traders already using Heights
            </p>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
          <div className="absolute top-10 left-[10%] w-64 h-64 bg-primary/20 rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl" />
        </div>
      </section>
    </main>
  );
}