"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Award,
  Star,
  DollarSign,
  Lock,
  LineChart,
  Wallet
} from "lucide-react";
import Link from 'next/link';

// Animated number component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// Floating animation variants
const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

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

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your funds are protected with industry-leading security measures",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Execute trades in milliseconds with our high-performance engine",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Award,
    title: "AI-Powered Insights",
    description: "Get intelligent trading recommendations with Heights+ AI",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Globe,
    title: "Global Markets",
    description: "Access international markets and diverse investment options",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "24/7 customer support from trading professionals",
    color: "from-red-500 to-rose-500"
  },
  {
    icon: Lock,
    title: "Secure Wallet",
    description: "Multi-signature wallet with cold storage protection",
    color: "from-indigo-500 to-purple-500"
  }
];

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [loadingCrypto, setLoadingCrypto] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const { scrollY } = useScroll();
  
  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const bgY1 = useTransform(scrollY, [0, 500], [0, -100]);
  const bgY2 = useTransform(scrollY, [0, 500], [0, -200]);
  
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
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full blur-3xl"
          style={{ y: bgY1 }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          style={{ y: bgY2 }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Hero Section with Parallax */}
      <motion.section 
        className="relative pt-24 pb-16 px-4 md:px-8 lg:px-16"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Trusted by over 100,000+ traders
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Trading at New{" "}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 inline-block"
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
                Heights
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Professional trading platform with real-time data from global markets. 
              Trade crypto, stocks, and mutual funds all in one place.
            </motion.p>
            
            {/* Animated stats */}
            <motion.div 
              className="flex flex-wrap justify-center gap-8 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  <AnimatedNumber value={24} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Global Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  <AnimatedNumber value={100} suffix="K+" />
                </div>
                <div className="text-sm text-muted-foreground">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ₹<AnimatedNumber value={10} suffix="B+" />
                </div>
                <div className="text-sm text-muted-foreground">Daily Volume</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Asset Categories Grid with Enhanced Animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {ASSET_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  ease: "easeOut" 
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="relative group cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg blur-xl"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': category.color.split(' ')[1],
                    '--tw-gradient-to': category.color.split(' ')[3],
                  } as any}
                />
                
                <Card className={`relative overflow-hidden transition-all duration-300 ${category.borderColor} border-2 hover:shadow-2xl ${
                  selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <motion.div 
                        className={`p-3 rounded-lg ${category.bgColor}`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <category.icon className={`h-8 w-8 bg-gradient-to-br ${category.color} bg-clip-text text-transparent`} />
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                    <CardTitle className="text-2xl mt-4">{category.title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{category.subtitle}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <p className="text-muted-foreground">Markets</p>
                        <p className="font-semibold">{category.stats.markets}</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-semibold">{category.stats.volume}</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <p className="text-muted-foreground">24h</p>
                        <p className={`font-semibold ${category.stats.change?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {category.stats.change ?? '--'}
                        </p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>
      
          {/* Live Crypto Ticker with Enhanced Animation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-16"
          >
            <motion.h2 
              className="text-2xl font-bold mb-6 flex items-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="h-6 w-6 text-primary" />
              Live Cryptocurrency Prices
            </motion.h2>
            
            <motion.div 
              className="bg-card rounded-lg border p-4"
              initial={{ borderColor: "rgba(0,0,0,0.1)" }}
              animate={{ borderColor: ["rgba(0,0,0,0.1)", "rgba(var(--primary-rgb),0.3)", "rgba(0,0,0,0.1)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AnimatePresence mode="wait">
                {loadingCrypto ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity className="h-6 w-6 text-primary" />
                    </motion.div>
                    <span className="ml-2 text-muted-foreground">Connecting to Coinbase...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {Array.from(cryptoData.entries()).map(([symbol, data], index) => (
                      <motion.div 
                        key={symbol} 
                        className="text-center p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer relative overflow-hidden group"
                        onClick={() => router.push('/dashboard?tab=crypto')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--primary-rgb),0.1)" }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        
                        <p className="font-semibold relative z-10">{symbol.split(':')[1]}/USD</p>
                        <motion.p 
                          className="text-xl font-bold relative z-10"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ${data.price.toLocaleString()}
                        </motion.p>
                        <p className={`text-sm flex items-center justify-center relative z-10 ${
                          data.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {data.change24hPercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(data.change24hPercent).toFixed(2)}%
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Features Section with Card Animations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <motion.h2 
              className="text-3xl font-bold mb-8 text-center"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Why Choose Heights?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <Card className="text-center h-full relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />
                    
                    <CardContent className="pt-6 relative z-10">
                      <motion.div
                        className="relative inline-block"
                        animate={hoveredFeature === index ? floatingAnimation.animate : {}}
                        initial={floatingAnimation.initial}
                      >
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.color} blur-xl opacity-50`}
                          animate={{
                            scale: hoveredFeature === index ? [1, 1.5, 1] : 1,
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary relative z-10" />
                      </motion.div>
                      
                      <motion.h3 
                        className="font-semibold mb-2"
                        animate={{
                          scale: hoveredFeature === index ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {feature.title}
                      </motion.h3>
                      
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      
                      {/* Animated background pattern */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                          '--tw-gradient-from': feature.color.split(' ')[1],
                          '--tw-gradient-to': feature.color.split(' ')[3],
                        } as any}
                        animate={{
                          scaleX: hoveredFeature === index ? [0, 1] : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section with Pulse Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-20"
          >
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                className="absolute inset-0 bg-primary blur-xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 relative z-10 group">
                  <span className="relative z-10">Start Trading Now</span>
                  <motion.div
                    className="absolute right-6 top-1/2 -translate-y-1/2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-sm text-muted-foreground mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Join <AnimatedNumber value={100000} prefix="" suffix="+" /> traders already using Heights
            </motion.p>
            
            {/* Trust badges with floating animation */}
            <motion.div 
              className="flex justify-center gap-8 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {[Shield, Lock, Award].map((Icon, index) => (
                <motion.div
                  key={index}
                  className="text-muted-foreground"
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: index * 0.2,
                    repeat: Infinity,
                  }}
                >
                  <Icon className="h-8 w-8" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}