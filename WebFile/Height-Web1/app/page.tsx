"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
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
  BookOpen,
  Layers,
  Network,
  Code,
  Cpu,
  Database,
  CloudLightning,
  Infinity as InfinityIcon,
  Fingerprint,
  Bot,
  PieChart,
  TrendingUpIcon,
  Coins,
  Banknote,
  CreditCard,
  Smartphone,
  Monitor,
  Headphones
} from "lucide-react";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TradingViewWidget from "@/components/trading/tradingview-widget";

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

// Enhanced Floating particles with network effect
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Main particles */}
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute w-1 h-1 bg-gradient-to-r from-emerald-400/40 to-blue-400/40 rounded-full shadow-lg"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [-30, 30, -30],
          x: [-20, 20, -20],
          opacity: [0.2, 0.8, 0.2],
          scale: [0.5, 1.2, 0.5],
        }}
        transition={{
          duration: 4 + Math.random() * 6,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: "easeInOut"
        }}
      />
    ))}
    
    {/* Network connections */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`line-${i}`}
        className="absolute h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
        style={{
          left: `${10 + i * 12}%`,
          top: `${20 + Math.random() * 60}%`,
          width: `${20 + Math.random() * 30}%`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          scaleX: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// TradingView Charts Section
const TradingViewCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-background border border-border rounded-2xl p-2">
        <h3 className="text-xl font-bold text-center my-2">BTC/USD Chart</h3>
        <div className="h-[400px]">
          <TradingViewWidget symbol="COINBASE:BTCUSD" />
        </div>
      </div>
      <div className="bg-gradient-to-br from-background border border-border rounded-2xl p-2">
        <h3 className="text-xl font-bold text-center my-2">Tata Motors (NSE)</h3>
        <div className="h-[400px]">
          <TradingViewWidget symbol="NSE:TATAMOTORS" />
        </div>
      </div>
    </div>
  );
};

// Enhanced feature cards with modern design
const features = [
  {
    icon: Shield,
    title: "Military-Grade Security",
    description: "Multi-layer encryption, cold storage, and institutional-grade security protocols protecting your assets 24/7",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    stats: "99.99% Secure",
    gradient: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5"
  },
  {
    icon: CloudLightning,
    title: "Hyper-Speed Execution",
    description: "Sub-millisecond trade execution with our quantum-powered matching engine and global infrastructure",
    color: "from-yellow-400 via-orange-500 to-red-500",
    stats: "<0.1ms Latency",
    gradient: "bg-gradient-to-br from-yellow-500/10 to-orange-500/5"
  },
  {
    icon: Bot,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning algorithms provide real-time market insights and predictive analytics",
    color: "from-purple-500 via-pink-500 to-rose-500",
    stats: "97% Accuracy",
    gradient: "bg-gradient-to-br from-purple-500/10 to-pink-500/5"
  },
  {
    icon: Network,
    title: "Omni-Chain Access",
    description: "Trade across 100+ blockchains and traditional markets through our unified liquidity network",
    color: "from-blue-500 via-indigo-500 to-purple-500",
    stats: "100+ Chains",
    gradient: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5"
  },
  {
    icon: InfinityIcon,
    title: "Infinite Scalability",
    description: "Built on cutting-edge infrastructure that scales with your trading needs, from retail to institutional",
    color: "from-green-500 via-emerald-500 to-teal-500",
    stats: "∞ Scale",
    gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/5"
  },
  {
    icon: Cpu,
    title: "Quantum Performance",
    description: "Next-generation technology stack delivering unparalleled speed, reliability, and user experience",
    color: "from-indigo-500 via-purple-500 to-pink-500",
    stats: "Quantum Speed",
    gradient: "bg-gradient-to-br from-indigo-500/10 to-purple-500/5"
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
      {/* Demo Video Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-auto p-4">
            <button
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border"
              onClick={() => setShowDemo(false)}
              aria-label="Close demo video"
            >
              <X className="h-6 w-6" />
            </button>
            <video
              src="/demo.mp4"
              controls
              autoPlay
              className="w-full h-auto rounded-2xl shadow-lg border border-border bg-black"
              style={{ maxHeight: '70vh' }}
            >
              Sorry, your browser does not support embedded videos.
            </video>
          </div>
        </div>
      )}
      {/* Futuristic Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-background to-slate-800 dark:from-slate-950 dark:via-background dark:to-slate-900" />
        
        {/* Multiple gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/8" />
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/3 via-transparent to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(59,130,246,0.1),transparent)]" />
        
        {/* Advanced grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px'
          }}
        />
        
        {/* Animated geometric shapes */}
        <motion.div
          className="absolute top-20 left-[15%] w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/15 to-blue-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
            x: [0, 80, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-gradient-to-r from-purple-500/20 to-pink-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 0.8, 1.2],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -60, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-[20%] w-[350px] h-[350px] bg-gradient-to-r from-cyan-500/15 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [0.9, 1.4, 0.9],
            opacity: [0.2, 0.5, 0.2],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 18,
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

          {/* Live Market Charts */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Live Market Charts
              </h2>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                Interactive charts for top assets, powered by TradingView.
              </p>
            </div>
            
            <TradingViewCharts />
          </motion.div>
        </div>
      </motion.section>

      <TradingIntelligenceSection />

      {/* Ecosystem Section */}
      <motion.section 
        className="py-24 px-4 md:px-8 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 text-sm font-semibold mb-8 backdrop-blur-md"
            >
              <Network className="h-4 w-4 mr-2" />
              Powered by Leading Ecosystems
            </motion.div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="text-foreground">One Platform.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
                Infinite Possibilities.
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Connect to the world's leading blockchain networks and traditional markets through our unified infrastructure.
            </p>
          </div>

          {/* Supported Networks */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Supported Networks & Exchanges
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { name: "Ethereum", icon: "Ξ", color: "from-blue-400 to-blue-600" },
                { name: "Bitcoin", icon: "₿", color: "from-orange-400 to-orange-600" },
                { name: "Solana", icon: "◎", color: "from-purple-400 to-purple-600" },
                { name: "Polygon", icon: "⬟", color: "from-indigo-400 to-indigo-600" },
                { name: "Arbitrum", icon: "Ⴙ", color: "from-blue-400 to-cyan-400" },
                { name: "Avalanche", icon: "🔺", color: "from-red-400 to-red-600" },
                { name: "Binance", icon: "B", color: "from-yellow-400 to-yellow-600" },
                { name: "Coinbase", icon: "C", color: "from-blue-500 to-blue-700" },
                { name: "Kraken", icon: "K", color: "from-purple-500 to-purple-700" },
                { name: "NYSE", icon: "₱", color: "from-green-400 to-green-600" },
                { name: "NASDAQ", icon: "Ɲ", color: "from-teal-400 to-teal-600" },
                { name: "LSE", icon: "£", color: "from-emerald-400 to-emerald-600" },
              ].map((network, index) => (
                <motion.div
                  key={network.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group"
                >
                  <div className="bg-background/50 border border-border/50 rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${network.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                      {network.icon}
                    </div>
                    <h4 className="font-semibold text-foreground">{network.name}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Asset Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Cryptocurrencies",
                description: "Trade 500+ digital assets across multiple blockchains",
                icon: Bitcoin,
                stats: "500+ Assets",
                color: "from-orange-500 to-yellow-500",
                assets: ["Bitcoin", "Ethereum", "Solana", "Cardano", "Polygon"]
              },
              {
                title: "Traditional Stocks",
                description: "Access global equity markets with fractional shares",
                icon: TrendingUpIcon,
                stats: "10,000+ Stocks",
                color: "from-green-500 to-emerald-500",
                assets: ["Apple", "Tesla", "Google", "Microsoft", "Amazon"]
              },
              {
                title: "DeFi & NFTs",
                description: "Participate in decentralized finance and digital collectibles",
                icon: Layers,
                stats: "1,000+ Protocols",
                color: "from-purple-500 to-pink-500",
                assets: ["Uniswap", "Aave", "Compound", "OpenSea", "Blur"]
              }
            ].map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <div className="bg-background/50 border border-border/50 rounded-3xl p-8 hover:border-purple-500/40 transition-all duration-500 backdrop-blur-sm h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${category.color} shadow-lg`}>
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                    <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 font-bold">
                      {category.stats}
                    </Badge>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{category.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{category.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Popular Assets:</p>
                    {category.assets.map((asset, assetIndex) => (
                      <div key={assetIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        <span className="text-sm text-muted-foreground">{asset}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

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
        
        {/* Footer with additional trust signals */}
        <motion.div 
          className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border/30"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-purple-400" />
              <span>Multi-Factor Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-pink-400" />
              <span>Regulatory Approved</span>
            </div>
          </div>
        </motion.div>
    </main>
  );
}