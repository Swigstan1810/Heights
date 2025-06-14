// components/ai-dashboard.tsx - Enhanced Responsive Heights+ AI Investment Dashboard
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { HeightsLogo } from '@/components/ui/heights-logo';
import InvestmentChatbot from '@/components/ai-assistant/investment-chatbot';
import {
  Brain,
  Send,
  Sparkles,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  User,
  Zap,
  Star,
  Clock,
  MessageSquare,
  ChevronRight,
  Loader2,
  Lightbulb,
  Target,
  Rocket,
  Globe,
  Shield,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Bell,
  PieChart,
  Wallet,
  Copy,
  Check,
  X,
  Newspaper,
  Bitcoin,
  LineChart,
  Gem,
  Search,
  Settings,
  HelpCircle,
  BookOpen,
  DollarSign,
  Menu,
  AlertTriangle
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Enhanced interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'prediction' | 'alert' | 'financial' | 'investment';
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionable?: boolean;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    analysis?: any;
    symbols?: string[];
    assetType?: string;
  };
}

interface RealTimeMetrics {
  portfolioValue: number;
  dayChange: number;
  weekChange: number;
  totalAssets: number;
  profitableAssets: number;
  totalAnalyses: number;
  successRate: number;
  averageConfidence: number;
  responseTime: number;
  activeAlerts: number;
}

interface MarketDataPoint {
  symbol: string;
  price: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  source: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  prompt: string;
  category: 'analysis' | 'trading' | 'portfolio' | 'market' | 'investment';
}

// Real Quick actions
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'market-overview',
    label: 'Market Overview',
    icon: BarChart3,
    color: 'text-blue-500',
    prompt: 'Give me a comprehensive overview of today\'s market performance across crypto, stocks, and commodities',
    category: 'market'
  },
  {
    id: 'crypto-analysis',
    label: 'Crypto Analysis',
    icon: Bitcoin,
    color: 'text-orange-500',
    prompt: 'Analyze the top 10 cryptocurrencies and provide investment insights',
    category: 'investment'
  },
  {
    id: 'portfolio-review',
    label: 'Portfolio Review',
    icon: PieChart,
    color: 'text-green-500',
    prompt: 'Help me optimize my investment portfolio based on current market conditions',
    category: 'portfolio'
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    icon: Shield,
    color: 'text-red-500',
    prompt: 'Analyze current market risks and provide risk management strategies',
    category: 'analysis'
  },
  {
    id: 'news-impact',
    label: 'News Impact',
    icon: Newspaper,
    color: 'text-purple-500',
    prompt: 'Analyze latest financial news and its potential impact on markets',
    category: 'market'
  },
  {
    id: 'trading-signals',
    label: 'Trading Signals',
    icon: Target,
    color: 'text-indigo-500',
    prompt: 'Generate trading signals for major assets with entry/exit points',
    category: 'trading'
  }
];

// Animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }: any) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
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
    <span className="font-mono">
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};

export default function EnhancedAIDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'investment' | 'chat' | 'analysis' | 'insights'>('investment');
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    portfolioValue: 0,
    dayChange: 0,
    weekChange: 0,
    totalAssets: 0,
    profitableAssets: 0,
    totalAnalyses: 0,
    successRate: 0,
    averageConfidence: 0,
    responseTime: 0,
    activeAlerts: 0
  });
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientComponentClient();

  // Fetch real metrics from Supabase and APIs
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch user's real portfolio and analytics data
        if (user?.id) {
          const [portfolioData, analyticsData, alertsData] = await Promise.all([
            supabase
              .from('user_portfolios')
              .select('total_value, day_change, week_change, total_assets, profitable_assets')
              .eq('user_id', user.id)
              .single(),
            
            supabase
              .from('ai_conversations')
              .select('metadata, created_at')
              .eq('user_id', user.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
              
            supabase
              .from('user_alerts')
              .select('id, is_active')
              .eq('user_id', user.id)
              .eq('is_active', true)
          ]);

          // Calculate real metrics
          let realMetrics: RealTimeMetrics = {
            portfolioValue: portfolioData.data?.total_value || 0,
            dayChange: portfolioData.data?.day_change || 0,
            weekChange: portfolioData.data?.week_change || 0,
            totalAssets: portfolioData.data?.total_assets || 0,
            profitableAssets: portfolioData.data?.profitable_assets || 0,
            totalAnalyses: analyticsData.data?.length || 0,
            successRate: 0,
            averageConfidence: 0,
            responseTime: 0,
            activeAlerts: alertsData.data?.length || 0
          };

          // Calculate AI metrics from conversation history
          if (analyticsData.data && analyticsData.data.length > 0) {
            const validAnalyses = analyticsData.data.filter(a => a.metadata?.confidence);
            const avgConfidence = validAnalyses.length > 0 
              ? validAnalyses.reduce((sum, a) => sum + (a.metadata.confidence || 0), 0) / validAnalyses.length 
              : 0;
            const avgResponseTime = validAnalyses.length > 0
              ? validAnalyses.reduce((sum, a) => sum + (a.metadata.responseTime || 0), 0) / validAnalyses.length
              : 0;
            const successfulAnalyses = validAnalyses.filter(a => (a.metadata.confidence || 0) > 0.7).length;

            realMetrics.averageConfidence = avgConfidence * 100;
            realMetrics.responseTime = avgResponseTime / 1000;
            realMetrics.successRate = validAnalyses.length > 0 ? (successfulAnalyses / validAnalyses.length) * 100 : 0;
          }

          setMetrics(realMetrics);
        }

        // Fetch real market data
        await fetchMarketData();
        
      } catch (error) {
        console.error('Error fetching real data:', error);
        // Fallback to basic structure with zero values
        setMetrics({
          portfolioValue: 0,
          dayChange: 0,
          weekChange: 0,
          totalAssets: 0,
          profitableAssets: 0,
          totalAnalyses: 0,
          successRate: 0,
          averageConfidence: 0,
          responseTime: 0,
          activeAlerts: 0
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRealData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchRealData, 30000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  // Fetch live market data
  const fetchMarketData = async () => {
    try {
      const [cryptoResponse, stockResponse] = await Promise.all([
        fetch('/api/market/crypto?symbols=BTC,ETH,SOL,MATIC').catch(() => null),
        fetch('/api/market/stocks?symbols=AAPL,GOOGL,TSLA,MSFT').catch(() => null)
      ]);

      const marketDataPoints: MarketDataPoint[] = [];

      if (cryptoResponse?.ok) {
        const cryptoData = await cryptoResponse.json();
        if (cryptoData.data) {
          Object.values(cryptoData.data).forEach((crypto: any) => {
            marketDataPoints.push({
              symbol: crypto.symbol || 'N/A',
              price: crypto.price || 0,
              changePercent: crypto.changePercent || 0,
              volume: crypto.volume,
              marketCap: crypto.marketCap,
              source: 'crypto'
            });
          });
        }
      }

      if (stockResponse?.ok) {
        const stockData = await stockResponse.json();
        if (stockData.data) {
          Object.values(stockData.data).forEach((stock: any) => {
            marketDataPoints.push({
              symbol: stock.symbol || 'N/A',
              price: stock.price || 0,
              changePercent: stock.changePercent || 0,
              volume: stock.volume,
              marketCap: stock.marketCap,
              source: 'stock'
            });
          });
        }
      }

      setMarketData(marketDataPoints);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 **Welcome to Heights+ AI Investment Intelligence!**

I'm your advanced AI assistant powered by Claude and Perplexity, ready to help you with:

📊 **Real-time Market Analysis** - Live data from multiple exchanges
📈 **Investment Research** - Deep analysis across all asset classes  
💰 **Portfolio Optimization** - AI-powered allocation strategies
🔍 **News & Sentiment** - Breaking financial news analysis
⚡ **Trading Signals** - Technical analysis and entry/exit points

Ready to elevate your investment game? Ask me anything!`,
      timestamp: new Date(),
      type: 'text',
      metadata: {
        category: 'welcome',
        actionable: true,
        confidence: 1.0
      }
    };

    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10),
          userId: user?.id
        })
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content,
        timestamp: new Date(),
        type: data.type || 'text',
        metadata: {
          confidence: data.metadata?.confidence || data.confidence,
          actionable: true,
          category: 'analysis',
          priority: 'medium',
          analysis: data.analysis,
          assetType: data.analysis?.asset?.type
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses + 1
      }));

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'alert',
        metadata: { actionable: false, category: 'error', priority: 'high' }
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, user?.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      >
        <div className={`max-w-[85%] sm:max-w-[75%] flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <motion.div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53]'
                : 'bg-gradient-to-br from-[#255F38] to-[#1F7D53]'
            } shadow-lg`}
          >
            {isUser ? <User size={16} className="text-white" /> : <HeightsLogo size="sm" className="text-white" animate={false} />}
          </motion.div>

          {/* Message Content */}
          <motion.div
            className={`rounded-xl p-3 sm:p-4 shadow-lg backdrop-blur-sm ${
              isUser
                ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53] text-white'
                : 'bg-card/90 border border-[#255F38]/30'
            }`}
          >
            {/* Message Header */}
            {!isUser && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs bg-[#255F38]/20 text-[#255F38]">
                    Heights+ AI
                  </Badge>
                  {message.metadata?.confidence && (
                    <Badge variant="outline" className="text-xs border-[#1F7D53]/50">
                      {Math.round(message.metadata.confidence * 100)}% confident
                    </Badge>
                  )}
                </div>
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Message Text */}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>

            {/* Message Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs hover:bg-white/10"
                onClick={() => copyToClipboard(message.content, message.id)}
              >
                {copiedMessageId === message.id ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-[#255F38]/5">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Title and Status */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <HeightsLogo size="xl" />
              </motion.div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
                  Heights+ AI Hub
                </h1>
                <p className="text-sm text-muted-foreground">Real-time Investment Intelligence</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileNav(!showMobileNav)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Status Indicators */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 backdrop-blur-sm border border-[#255F38]/20 rounded-full">
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-xs font-medium">Live</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 backdrop-blur-sm border border-[#255F38]/20 rounded-full">
                <Brain className="h-3 w-3 text-[#1F7D53]" />
                <span className="text-xs font-medium">Claude AI</span>
              </div>
            </div>
          </div>

          {/* Enhanced Metrics Cards */}
          {isLoadingData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Portfolio Value</span>
                      <Wallet className="h-4 w-4 text-[#1F7D53]" />
                    </div>
                    <p className="text-lg font-bold">
                      {metrics.portfolioValue > 0 ? (
                        <AnimatedNumber value={metrics.portfolioValue} prefix="$" decimals={2} />
                      ) : (
                        '$0.00'
                      )}
                    </p>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${
                      metrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metrics.dayChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(metrics.dayChange).toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Total Assets</span>
                      <PieChart className="h-4 w-4 text-[#255F38]" />
                    </div>
                    <p className="text-lg font-bold">
                      <AnimatedNumber value={metrics.totalAssets} />
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {metrics.profitableAssets} profitable
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">AI Analyses</span>
                      <BarChart3 className="h-4 w-4 text-[#27391C]" />
                    </div>
                    <p className="text-lg font-bold">
                      <AnimatedNumber value={metrics.totalAnalyses} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Today
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Success Rate</span>
                      <Target className="h-4 w-4 text-[#1F7D53]" />
                    </div>
                    <p className="text-lg font-bold">
                      <AnimatedNumber value={metrics.successRate} suffix="%" decimals={1} />
                    </p>
                    <Progress value={metrics.successRate} className="h-1 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">AI Confidence</span>
                      <Brain className="h-4 w-4 text-[#255F38]" />
                    </div>
                    <p className="text-lg font-bold">
                      <AnimatedNumber value={metrics.averageConfidence} suffix="%" decimals={1} />
                    </p>
                    <Progress value={metrics.averageConfidence} className="h-1 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -2 }}>
                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Active Alerts</span>
                      <Bell className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-lg font-bold">
                      <AnimatedNumber value={metrics.activeAlerts} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monitoring
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Main Section */}
          <div className="xl:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] flex flex-col bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="w-full h-full flex flex-col">
                  <CardHeader className="border-b border-[#255F38]/20 pb-3">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-[#255F38]/10">
                      <TabsTrigger value="investment" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white text-xs sm:text-sm">
                        <DollarSign className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Investment</span>
                        <span className="sm:hidden">Invest</span>
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white text-xs sm:text-sm">
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white text-xs sm:text-sm">
                        <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Analysis</span>
                        <span className="sm:hidden">Data</span>
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white text-xs sm:text-sm">
                        <Lightbulb className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Insights</span>
                        <span className="sm:hidden">Tips</span>
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="flex-1 p-0 overflow-hidden">
                    {/* Investment Tab - Main Feature */}
                    <TabsContent value="investment" className="h-full m-0">
                      <div className="h-[60vh] lg:h-[70vh] xl:h-[80vh] 2xl:h-[85vh] max-w-4xl mx-auto flex flex-col">
                        <InvestmentChatbot />
                      </div>
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent value="chat" className="h-full m-0">
                      <div className="flex flex-col h-[60vh] lg:h-[70vh] xl:h-[80vh] 2xl:h-[85vh] max-w-4xl mx-auto">
                        <ScrollArea className="flex-1 p-3 sm:p-4 lg:p-6 max-h-full">
                          <AnimatePresence>
                            {messages.map(renderMessage)}
                          </AnimatePresence>

                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-start mb-6"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                                  <HeightsLogo size="sm" className="text-white" animate={false} />
                                </div>
                                <div className="bg-card/90 border border-[#255F38]/30 rounded-xl p-4">
                                  <div className="flex items-center gap-3">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    >
                                      <Brain className="h-5 w-5 text-[#1F7D53]" />
                                    </motion.div>
                                    <span className="text-sm text-muted-foreground">
                                      Analyzing your query...
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          <div ref={messagesEndRef} />
                        </ScrollArea>

                        {/* Enhanced Input Area */}
                        <div className="p-3 sm:p-4 border-t border-[#255F38]/20 bg-gradient-to-r from-card/50 to-[#255F38]/5">
                          {/* Quick Actions */}
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                            {QUICK_ACTIONS.slice(0, 3).map((action) => (
                              <motion.div key={action.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendMessage(action.prompt)}
                                  disabled={isLoading}
                                  className="border-[#255F38]/30 hover:bg-[#255F38]/10 whitespace-nowrap text-xs"
                                >
                                  <action.icon className={`h-3 w-3 mr-1 ${action.color}`} />
                                  {action.label}
                                </Button>
                              </motion.div>
                            ))}
                          </div>

                          {/* Input Field */}
                          <div className="relative">
                            <div className="relative flex gap-2">
                              <Textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about investments, markets, or get AI analysis..."
                                className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-background/80 backdrop-blur-sm border-[#255F38]/30 focus:border-[#255F38] transition-all duration-300"
                                disabled={isLoading}
                              />
                              <Button
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                size="lg"
                                className="h-full bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53] text-white shadow-lg"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Send className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between mt-2 text-xs text-muted-foreground gap-2">
                            <span>Press Enter to send, Shift+Enter for new line</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Analysis Tab */}
                    <TabsContent value="analysis" className="h-full m-0 p-3 sm:p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Real-time Analysis</h3>
                        
                        {metrics.totalAnalyses === 0 ? (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">No analyses performed yet.</p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Start by asking questions in the Investment or Chat tabs.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">AI Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span>Total Analyses</span>
                                  <span className="font-medium">{metrics.totalAnalyses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Success Rate</span>
                                  <span className="font-medium">{metrics.successRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Average Response Time</span>
                                  <span className="font-medium">{metrics.responseTime.toFixed(2)}s</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>

                    {/* Insights Tab */}
                    <TabsContent value="insights" className="h-full m-0 p-3 sm:p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Market Insights</h3>
                        
                        {marketData.length > 0 ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-500" />
                                Live Market Data
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {marketData.slice(0, 6).map((asset, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                      <p className="font-medium">{asset.symbol}</p>
                                      <p className="text-sm text-muted-foreground capitalize">{asset.source}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{formatCurrency(asset.price)}</p>
                                      <p className={`text-sm ${asset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-6 text-center">
                              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">Loading market data...</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className={`space-y-4 ${showMobileNav ? 'block' : 'hidden xl:block'}`}>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-[#1F7D53]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUICK_ACTIONS.map((action) => (
                    <motion.div key={action.id} whileHover={{ x: 2 }}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm hover:bg-[#255F38]/10"
                        onClick={() => {
                          setActiveMode('chat');
                          sendMessage(action.prompt);
                        }}
                        disabled={isLoading}
                      >
                        <action.icon className={`h-4 w-4 mr-2 ${action.color}`} />
                        {action.label}
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Market Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#255F38]" />
                    Live Market
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {marketData.slice(0, 4).map((asset, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${asset.source === 'crypto' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(asset.price)}</p>
                        <p className={`text-xs ${asset.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  {marketData.length === 0 && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Loading market data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Help & Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#27391C]" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    User Guide
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}