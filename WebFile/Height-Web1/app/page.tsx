"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  ArrowUp,
  Crown,
  Rocket,
  Target,
  TrendingDownIcon,
  Eye,
  Brain,
  Heart,
  X,
  BookOpen
} from "lucide-react";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Animated Counter Component
function AnimatedCounter({ 
  value, 
  prefix = "", 
  suffix = "", 
  decimals = 0,
  className = ""
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${value}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [value, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

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
  }, [value, isVisible]);
  
  return (
    <span id={`counter-${value}`} className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
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
);

// Enhanced Live Crypto Ticker
const LiveCryptoTicker = () => {
  const [cryptoData, setCryptoData] = useState<Map<string, MarketData>>(new Map());
  const [loading, setLoading] = useState(true);
  const trackedSymbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'AVAX'];

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    trackedSymbols.forEach(symbol => {
      const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (data) => {
        setCryptoData(prev => new Map(prev).set(symbol, data));
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {trackedSymbols.map((symbol, index) => (
          <div key={symbol} className="animate-pulse">
            <div className="bg-background border border-border rounded-xl p-3 md:p-4">
              <div className="h-4 bg-muted rounded w-12 mb-2"></div>
              <div className="h-6 bg-muted rounded w-20 mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {Array.from(cryptoData.entries()).map(([symbol, data], index) => (
        <motion.div
          key={symbol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="bg-gradient-to-br from-background border border-border rounded-xl p-3 md:p-4 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-semibold text-foreground">
                  {symbol}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  data.change24hPercent >= 0 ? 'bg-emerald-400' : 'bg-red-400'
                } animate-pulse`} />
              </div>
              
              <div className="space-y-1">
                <p className="font-bold text-sm md:text-lg text-foreground">
                  ${data.price.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: data.price < 1 ? 4 : 2
                  })}
                </p>
                <div className={`text-xs md:text-sm flex items-center ${
                  data.change24hPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.change24hPercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {data.change24hPercent >= 0 ? '+' : ''}{data.change24hPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Feature cards with enhanced design
const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your assets are protected with industry-leading security measures and cold storage",
    color: "from-emerald-500 to-teal-500",
    stats: "99.9% Secure"
  },
  {
    icon: Zap,
    title: "Lightning Fast Execution",
    description: "Execute trades in milliseconds with our high-performance matching engine",
    color: "from-yellow-500 to-orange-500",
    stats: "<10ms Latency"
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get intelligent trading recommendations powered by advanced machine learning",
    color: "from-purple-500 to-pink-500",
    stats: "95% Accuracy"
  },
  {
    icon: Globe,
    title: "Global Markets Access",
    description: "Trade across multiple exchanges and access international markets seamlessly",
    color: "from-blue-500 to-cyan-500",
    stats: "50+ Exchanges"
  },
  {
    icon: Users,
    title: "Expert Community",
    description: "Join a community of professional traders and learn from the best",
    color: "from-red-500 to-rose-500",
    stats: "100K+ Traders"
  },
  {
    icon: Crown,
    title: "Premium Experience",
    description: "Enjoy premium features with institutional-grade tools and analytics",
    color: "from-indigo-500 to-purple-500",
    stats: "Pro Tools"
  }
];

// Trading Intelligence Section - Add this between Features and Social Proof sections
const TradingIntelligenceSection = () => {
  const tradingStrategies = [
    {
      name: 'Scalping',
      description: 'Quick profits from small price movements',
      timeframe: 'Seconds to Minutes',
      riskLevel: 'High',
      skillLevel: 'Advanced',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Day Trading',
      description: 'Hold positions within a single trading day',
      timeframe: 'Minutes to Hours',
      riskLevel: 'Medium-High',
      skillLevel: 'Intermediate',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Swing Trading',
      description: 'Capture medium-term price swings',
      timeframe: 'Days to Weeks',
      riskLevel: 'Medium',
      skillLevel: 'Beginner-Intermediate',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Position Trading',
      description: 'Long-term trend following strategy',
      timeframe: 'Weeks to Months',
      riskLevel: 'Low-Medium',
      skillLevel: 'Beginner',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const tradingPrinciples = [
    {
      title: 'Risk Management',
      description: 'Never risk more than you can afford to lose',
      icon: Shield,
      tips: ['Use stop-loss orders', 'Position sizing', 'Diversification']
    },
    {
      title: 'Technical Analysis',
      description: 'Study price charts and market patterns',
      icon: LineChart,
      tips: ['Support & resistance', 'Chart patterns', 'Technical indicators']
    },
    {
      title: 'Market Psychology',
      description: 'Understand market sentiment and emotions',
      icon: Brain,
      tips: ['Fear & greed cycles', 'Market sentiment', 'Crowd psychology']
    },
    {
      title: 'Continuous Learning',
      description: 'Markets evolve, so should your knowledge',
      icon: BookOpen,
      tips: ['Study market trends', 'Learn from mistakes', 'Stay updated']
    }
  ];

  const tradingTools = [
    {
      category: 'Chart Analysis',
      tools: ['Candlestick Patterns', 'Moving Averages', 'RSI & MACD', 'Volume Analysis'],
      icon: BarChart3,
      color: 'blue'
    },
    {
      category: 'Risk Management',
      tools: ['Stop Loss Orders', 'Position Sizing', 'Risk/Reward Ratios', 'Portfolio Balance'],
      icon: Shield,
      color: 'green'
    },
    {
      category: 'Market Research',
      tools: ['News Analysis', 'Economic Calendar', 'Market Sentiment', 'Competitor Analysis'],
      icon: Globe,
      color: 'purple'
    },
    {
      category: 'Order Types',
      tools: ['Market Orders', 'Limit Orders', 'Stop Orders', 'Trailing Stops'],
      icon: Target,
      color: 'orange'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Medium-High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Low-Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'Advanced': return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'Intermediate': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'Beginner-Intermediate': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getToolColor = (color: string) => {
    const colorMap = {
      blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-500',
      green: 'from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-500',
      purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-500',
      orange: 'from-orange-500/10 to-red-500/10 border-orange-500/20 text-orange-500'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <motion.section 
      className="py-20 px-4 md:px-8 bg-gradient-to-br from-background to-slate-50/50 dark:to-slate-900/50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-6"
          >
            <Brain className="h-4 w-4 mr-2" />
            Trading Intelligence Hub
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Master the Art of Trading
          </h2>
          <p className="text-xl text-foreground max-w-3xl mx-auto">
            Discover proven strategies, essential tools, and fundamental principles that successful traders use to navigate the markets.
          </p>
        </div>

        {/* Trading Strategies */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Popular Trading Strategies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tradingStrategies.map((strategy, index) => (
              <motion.div
                key={strategy.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-background border border-border rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${strategy.color}`}>
                    <strategy.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline" className={getSkillColor(strategy.skillLevel)}>
                    {strategy.skillLevel}
                  </Badge>
                </div>
                
                <h4 className="text-lg font-semibold mb-2">{strategy.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="font-medium">{strategy.timeframe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Risk Level:</span>
                    <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                      {strategy.riskLevel}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading Principles */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Essential Trading Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tradingPrinciples.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                className="bg-background border border-border rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group"
              >
                <div className="p-3 bg-emerald-500/20 rounded-xl mb-4 w-fit">
                  <principle.icon className="h-6 w-6 text-emerald-500" />
                </div>
                
                <h4 className="text-lg font-semibold mb-2">{principle.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{principle.description}</p>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Key Points:</p>
                  {principle.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading Tools */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Professional Trading Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tradingTools.map((toolCategory, index) => (
              <motion.div
                key={toolCategory.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.8 }}
                className={`bg-gradient-to-br border rounded-2xl p-6 hover:scale-105 transition-all duration-300 ${getToolColor(toolCategory.color)}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <toolCategory.icon className="h-6 w-6" />
                  <h4 className="text-lg font-semibold">{toolCategory.category}</h4>
                </div>
                
                <div className="space-y-2">
                  {toolCategory.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60" />
                      <span className="text-sm opacity-80">{tool}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading Wisdom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Trading Wisdom</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Remember: Successful trading is not about being right all the time, but about managing risk and cutting losses quickly while letting profits run.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background/50 rounded-xl">
              <Target className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Plan Your Trade</h4>
              <p className="text-sm text-muted-foreground">
                Have a clear strategy before entering any position
              </p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-xl">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Manage Your Risk</h4>
              <p className="text-sm text-muted-foreground">
                Protect your capital with proper risk management
              </p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-xl">
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Control Emotions</h4>
              <p className="text-sm text-muted-foreground">
                Keep fear and greed in check for better decisions
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default function EnhancedHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (searchParams?.get('code')) {
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Supabase client
  const supabase = createClientComponentClient();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [fetchedNames, setFetchedNames] = useState<string[]>([]);

  // Fetch testimonials from Supabase profile table
  useEffect(() => {
    async function fetchTestimonials() {
      setLoadingTestimonials(true);
      const { data, error } = await supabase
        .from('profile')
        .select('quote, author, role, rating');
      if (!error && data) {
        setTestimonials(data);
      }
      setLoadingTestimonials(false);
    }
    fetchTestimonials();
  }, [supabase]);

  // Fetch full_name, username, and email from Supabase profiles table (MCP convention)
  useEffect(() => {
    async function fetchNames() {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, email')
        .limit(3);
      if (!error && data) {
        setFetchedNames(data.map((row: any) => row.full_name || row.username || row.email));
      }
    }
    fetchNames();
  }, [supabase]);

  const hardcodedTestimonials = [
    {
      quote: "Heights has transformed my trading experience. The platform is intuitive, fast, and reliable. I've seen a 40% improvement in my trading performance.",
      role: "Professional Trader",
      rating: 5
    },
    {
      quote: "The security and transparency Heights offers is unmatched. I appreciate the real-time data and advanced analytics tools that help me make informed decisions.",
      role: "Portfolio Manager",
      rating: 5
    },
    {
      quote: "As someone new to trading, the AI guidance on Heights has been invaluable. It helps me understand when to buy, sell, or hold without overwhelming me with complex data.",
      role: "Crypto Investor",
      rating: 5
    }
  ];

  // Use hardcoded names for testimonials
  const hardcodedNames = ['Pratham Patel', 'Darshan Patel', 'Mili'];

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Navbar />
      
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-blue-500/5" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <FloatingParticles />
      </div>
      
      {/* Hero Section */}
      <motion.section 
        className="relative pt-24 pb-16 px-4 md:px-8"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Trusted by 25+ Professional Investors 
              <Sparkles className="h-4 w-4 ml-2" />
            </motion.div>
            
            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Experience{" "}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 inline-block"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Seamless
              </motion.span>
              <br />
              Heights
            </h1>
            
            {/* Subheadline */}
            <motion.p 
              className="text-xl md:text-2xl text-foreground max-w-4xl mx-auto mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Trade cryptocurrencies stocks and much more securely and efficiently on our Heights platform. 
              Built for traders and investors who demand speed, security, and sophistication.
            </motion.p>
            
            {/* CTA Section */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-xl shadow-emerald-500/25 border-0 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Start Trading Now
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 border-border text-foreground hover:bg-background hover:border-emerald-500/50"
                onClick={() => setShowDemo(true)}
              >
                <Eye className="h-5 w-5 mr-2" />
                View Live Demo
              </Button>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="flex flex-wrap justify-center items-center gap-8 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="text-sm">SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-400" />
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                <span className="text-sm">Bank-Grade Security</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Key Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            {[
              { value: 25, prefix: "", suffix: "+", label: "Active Traders", icon: Users },
              { value: 87, prefix: "", suffix: "%", label: "AI Accuracy", icon: Brain },
              { value: 150, prefix: "", suffix: "+", label: "Trading Pairs", icon: BarChart3 },
              { value: 99.9, prefix: "", suffix: "%", label: "Uptime", decimals: 1, icon: Target }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-background border border-border rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-emerald-400" />
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    <AnimatedCounter 
                      value={stat.value} 
                      prefix={stat.prefix} 
                      suffix={stat.suffix}
                      decimals={stat.decimals || 0}
                    />
                  </div>
                  <div className="text-sm text-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Live Market Data */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Live Market Data
              </h2>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                Real-time price feeds from major exchanges with institutional-grade reliability
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-background to-background backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                    <Activity className="h-4 w-4" />
                    Live Data
                  </div>
                  <span className="text-foreground text-sm">Updated every second</span>
                </div>
                <Badge variant="outline" className="border-border text-foreground">
                  Coinbase WebSocket
                </Badge>
              </div>
              
              <LiveCryptoTicker />
            </div>
          </motion.div>
        </div>
      </motion.section>

      <TradingIntelligenceSection />

      {/* Features Section */}
      <motion.section 
        className="py-20 px-4 md:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose Heights?
            </h2>
            <p className="text-xl text-foreground max-w-3xl mx-auto">
              Built for professional traders who demand the best. Every feature designed for performance, security, and user experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <div className="h-full bg-gradient-to-br from-background border border-border rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                        <feature.icon className="h-8 w-8 text-foreground" />
                      </div>
                      <Badge variant="outline" className="border-border text-foreground text-xs">
                        {feature.stats}
                      </Badge>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-foreground">
                      {feature.title}
                    </h3>
                    
                    <p className="text-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center text-emerald-400 text-sm font-medium">
                        Learn more
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Social Proof Section */}
      <motion.section 
        className="py-20 px-4 md:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trusted by Professional Traders
          </h2>
          <p className="text-xl text-foreground mb-16 max-w-3xl mx-auto">
            Join thousands of traders who have made Heights their platform of choice for cryptocurrency trading.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hardcodedTestimonials.map((testimonial, index) => {
              const displayName = hardcodedNames[index] || `User ${index + 1}`;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-gradient-to-br from-background border border-border rounded-2xl p-8"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-foreground font-bold mr-4">
                      {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{displayName}</div>
                      <div className="text-foreground text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section 
        className="py-20 px-4 md:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-background border border-border rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <Rocket className="h-10 w-10 text-foreground" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Elevate Your Trading?
              </h2>
              <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
                Join <AnimatedCounter value={50} suffix="+" className="text-emerald-400 font-bold" /> traders 
                who have chosen Heights as their preferred trading platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-xl shadow-emerald-500/25 border-0"
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Start Trading Today
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 border-border text-foreground hover:bg-background"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-8 text-foreground text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>24/7 support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Instant setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}