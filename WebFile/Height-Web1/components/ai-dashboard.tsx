// components/ai-dashboard.tsx - Enhanced Heights+ AI Dashboard
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { HeightsLogo } from '@/components/ui/heights-logo';
import { 
  Brain, 
  Send, 
  Sparkles, 
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  Eye,
  Download,
  Share,
  Star,
  Clock,
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Target,
  Rocket,
  Globe,
  Shield,
  Cpu,
  Database,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  MoreHorizontal,
  Bell,
  LineChart,
  PieChart,
  BarChart,
  Wallet,
  CandlestickChart,
  ArrowUp,
  ArrowDown,
  Info,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  X,
  Newspaper,
  Hash,
  Users,
  Building,
  Briefcase,
  Calculator,
  TrendingUp as TrendUp,
  Award
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Enhanced interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'prediction' | 'alert' | 'financial';
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionable?: boolean;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    analysis?: any;
    symbols?: string[];
  };
}

interface AIAnalysis {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  prediction: string;
  timeframe: string;
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  technicalIndicators?: {
    rsi?: number;
    macd?: { value: number; signal: number };
    sma?: { sma20: number; sma50: number; sma200: number };
  };
  priceTargets?: {
    short: number;
    medium: number;
    long: number;
  };
}

interface MarketMetrics {
  totalAnalyses: number;
  successRate: number;
  averageConfidence: number;
  responseTime: number;
  activeAlerts: number;
  portfolioValue?: number;
  dayChange?: number;
  weekChange?: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  prompt: string;
  category: 'analysis' | 'trading' | 'portfolio' | 'market';
}

// Quick actions configuration
const QUICK_ACTIONS: QuickAction[] = [
  { 
    id: 'portfolio', 
    label: 'Portfolio Analysis', 
    icon: PieChart, 
    color: 'text-[#1F7D53]',
    prompt: 'Analyze my current portfolio performance and provide optimization suggestions',
    category: 'portfolio'
  },
  { 
    id: 'market', 
    label: 'Market Summary', 
    icon: BarChart3, 
    color: 'text-[#255F38]',
    prompt: 'Give me a comprehensive market summary including major indices and trends',
    category: 'market'
  },
  { 
    id: 'risk', 
    label: 'Risk Assessment', 
    icon: Shield, 
    color: 'text-[#27391C]',
    prompt: 'Assess current market risks and my portfolio exposure',
    category: 'analysis'
  },
  { 
    id: 'ideas', 
    label: 'Trading Ideas', 
    icon: Lightbulb, 
    color: 'text-[#18230F]',
    prompt: 'Generate top trading ideas based on current market conditions',
    category: 'trading'
  },
  { 
    id: 'technical', 
    label: 'Technical Analysis', 
    icon: CandlestickChart, 
    color: 'text-[#1F7D53]',
    prompt: 'Perform technical analysis on my watchlist stocks',
    category: 'analysis'
  },
  { 
    id: 'news', 
    label: 'News Impact', 
    icon: Newspaper, 
    color: 'text-[#255F38]',
    prompt: 'Analyze latest news and its potential market impact',
    category: 'market'
  }
];

// Animated components
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

// Typing animation for input placeholder
const useTypingPlaceholder = (phrases: string[]) => {
  const [placeholder, setPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (placeholder.length < currentPhrase.length) {
          setPlaceholder(currentPhrase.slice(0, placeholder.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (placeholder.length > 0) {
          setPlaceholder(placeholder.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearTimeout(timeout);
  }, [placeholder, phraseIndex, isDeleting, phrases]);
  
  return placeholder;
};

export default function EnhancedAIDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analysis' | 'insights'>('chat');
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics>({
    totalAnalyses: 127,
    successRate: 87.3,
    averageConfidence: 92.1,
    responseTime: 1.2,
    activeAlerts: 5,
    portfolioValue: 125430.50,
    dayChange: 2.34,
    weekChange: -1.28
  });
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [showFinancialAnalysis, setShowFinancialAnalysis] = useState(false);
  const [financialAnalysisData, setFinancialAnalysisData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientComponentClient();

  // 1. Enhanced State Management with Real Data
  const [realTimeData, setRealTimeData] = useState<{
    btc?: any;
    eth?: any;
    marketIndices?: any;
  }>({});

  const [aiPerformanceMetrics, setAiPerformanceMetrics] = useState({
    totalRequests: 0,
    successfulAnalyses: 0,
    averageResponseTime: 0,
    confidenceScores: [] as number[],
    modelsUsed: { claude: 0, perplexity: 0 },
    lastUpdated: new Date()
  });

  // Typing placeholder phrases
  const placeholderPhrases = [
    "Ask about Bitcoin's price prediction...",
    "Analyze my portfolio performance...",
    "What are today's top trading opportunities?",
    "Show me technical analysis for AAPL...",
    "Assess current market risks...",
    "Generate investment recommendations..."
  ];
  
  const animatedPlaceholder = useTypingPlaceholder(placeholderPhrases);

  // Initialize with enhanced welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 Welcome to Heights+ AI Trading Intelligence!

I'm your advanced AI assistant powered by Claude and Perplexity, ready to help you:

📊 **Market Analysis**: Real-time insights across stocks, crypto, and forex
📈 **Technical Analysis**: Advanced indicators, patterns, and signals
📰 **News Impact**: Breaking news analysis with sentiment scoring
💼 **Portfolio Optimization**: Personalized recommendations
🎯 **Price Predictions**: AI-powered forecasts with confidence levels
⚡ **Trading Signals**: Entry/exit points and risk management

Type a question or select a quick action to get started!`,
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      // Cmd/Ctrl + / for focus input
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulated real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        portfolioValue: (prev.portfolioValue ?? 0) + (Math.random() - 0.5) * 100,
        dayChange: (prev.dayChange ?? 0) + (Math.random() - 0.5) * 0.1,
        responseTime: Math.max(0.8, Math.min(2.0, (prev.responseTime ?? 1.2) + (Math.random() - 0.5) * 0.2))
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 2. Real-time Data Fetching
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        // Fetch crypto prices
        const cryptoResponse = await fetch('/api/market/crypto?symbols=BTC,ETH');
        const cryptoData = await cryptoResponse.json();
        // Fetch AI metrics from Supabase
        const { data: aiMetrics } = await supabase
          .from('ai_conversations')
          .select('metadata, created_at')
          .eq('user_id', user?.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });
        // Calculate real AI performance metrics
        if (aiMetrics && aiMetrics.length > 0) {
          const successfulAnalyses = aiMetrics.filter(m => m.metadata?.confidence > 0.7).length;
          const avgResponseTime = aiMetrics.reduce((acc, m) => acc + (m.metadata?.responseTime || 0), 0) / aiMetrics.length;
          const confidenceScores = aiMetrics.map(m => m.metadata?.confidence || 0).filter(c => c > 0);
          setAiPerformanceMetrics({
            totalRequests: aiMetrics.length,
            successfulAnalyses,
            averageResponseTime: avgResponseTime / 1000, // Convert to seconds
            confidenceScores,
            modelsUsed: {
              claude: aiMetrics.filter(m => m.metadata?.model?.includes('claude')).length,
              perplexity: aiMetrics.filter(m => m.metadata?.model?.includes('perplexity')).length
            },
            lastUpdated: new Date()
          });
        }
        // Update market data
        setRealTimeData({
          btc: cryptoData?.data?.BTC,
          eth: cryptoData?.data?.ETH,
          marketIndices: cryptoData?.indices
        });
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    };
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 3. Replace the metrics state update with real data
  useEffect(() => {
    if (aiPerformanceMetrics.totalRequests > 0) {
      setMetrics(prev => ({
        ...prev,
        totalAnalyses: aiPerformanceMetrics.totalRequests,
        successRate: (aiPerformanceMetrics.successfulAnalyses / aiPerformanceMetrics.totalRequests) * 100,
        averageConfidence: aiPerformanceMetrics.confidenceScores.length > 0 
          ? (aiPerformanceMetrics.confidenceScores.reduce((a, b) => a + b, 0) / aiPerformanceMetrics.confidenceScores.length) * 100
          : prev.averageConfidence,
        responseTime: aiPerformanceMetrics.averageResponseTime || prev.responseTime,
        dayChange: realTimeData.btc ? realTimeData.btc.change24hPercent : (prev.dayChange ?? 0),
        // weekChange and portfolioValue handled elsewhere
      }));
    }
  }, [aiPerformanceMetrics, realTimeData]);

  // 8. Real Portfolio Value from Wallet Balance
  useEffect(() => {
    const fetchPortfolioValue = async () => {
      if (!user) return;
      try {
        // Fetch wallet balance
        const { data: walletData } = await supabase
          .from('wallet_balance')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        // Fetch portfolio holdings
        const { data: holdings } = await supabase
          .from('portfolio_holdings')
          .select('quantity, purchase_price, symbol')
          .eq('user_id', user.id);
        let totalValue = walletData?.balance || 0;
        if (holdings && holdings.length > 0) {
          for (const holding of holdings) {
            // Get current price for each holding
            const response = await fetch(`/api/market/price?symbol=${holding.symbol}`);
            const priceData = await response.json();
            if (priceData.price) {
              totalValue += holding.quantity * priceData.price;
            }
          }
        }
        setMetrics(prev => ({
          ...prev,
          portfolioValue: totalValue,
          dayChange: realTimeData.btc ? realTimeData.btc.change24hPercent : (prev.dayChange ?? 0),
          // weekChange and portfolioValue handled elsewhere
        }));
      } catch (error) {
        console.error('Error fetching portfolio value:', error);
      }
    };
    fetchPortfolioValue();
    const interval = setInterval(fetchPortfolioValue, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // 9. Real Active Alerts Count
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      if (!user) return;
      try {
        const { data: alerts, count } = await supabase
          .from('market_alerts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        setMetrics(prev => ({
          ...prev,
          activeAlerts: count || 0
        }));
        // Update the alerts display
        const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
        document.getElementById('critical-alerts-count')?.setAttribute('data-count', criticalAlerts.toString());
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
      // Check if this is a financial analysis request
      const isFinancialAnalysis = /analyze|prediction|forecast|technical|fundamental/i.test(content);
      const symbols = content.match(/\b[A-Z]{2,5}\b/g) || [];
      
      if (isFinancialAnalysis && symbols.length > 0) {
        // Call the enhanced financial analysis endpoint
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset: symbols[0],
            timeframe: '1 year',
            usePerplexity: true,
            useClaude: true
          })
        });

        if (!response.ok) throw new Error('Analysis failed');

        const data = await response.json();
        
        setFinancialAnalysisData(data.analysis);
        setShowFinancialAnalysis(true);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've completed a comprehensive analysis of ${symbols[0]}. Here are the key insights:

📊 **Market Sentiment**: ${data.analysis.marketSentiment?.overall || 'Neutral'}
📈 **Recommendation**: ${data.analysis.recommendation?.action || 'HOLD'}
🎯 **Confidence**: ${Math.round((data.analysis.metadata?.confidence || 0.75) * 100)}%

Click on the analysis card below for detailed insights including technical indicators, news impact, and price predictions.`,
          timestamp: new Date(),
          type: 'financial',
          metadata: {
            confidence: data.analysis.metadata?.confidence,
            actionable: true,
            category: 'financial_analysis',
            priority: 'high',
            analysis: data.analysis,
            symbols
          }
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Regular chat endpoint
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: content,
            history: messages.slice(-10)
          })
        });

        if (!response.ok) throw new Error('Chat failed');

        const data = await response.json();
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          type: 'analysis',
          metadata: {
            confidence: data.confidence,
            actionable: true,
            category: 'market_analysis',
            priority: 'medium'
          }
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses + 1,
        averageConfidence: (prev.averageConfidence * prev.totalAnalyses + 85) / (prev.totalAnalyses + 1)
      }));
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `I encountered an error processing your request. Please try again or contact support if the issue persists.`,
        timestamp: new Date(),
        type: 'alert',
        metadata: { actionable: false, category: 'error', priority: 'high' }
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
      >
        <div className={`max-w-[85%] flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <motion.div 
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53]' 
                : 'bg-gradient-to-br from-[#255F38] to-[#1F7D53]'
            } shadow-lg`}
          >
            {isUser ? <User size={20} className="text-white" /> : <HeightsLogo size="sm" className="text-white" animate={false} />}
          </motion.div>

          {/* Message Content */}
          <motion.div 
            className={`rounded-2xl p-4 shadow-lg backdrop-blur-sm ${
              isUser
                ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53] text-white' 
                : 'bg-card/90 border border-[#255F38]/30 dark:bg-gray-900/90 dark:border-[#255F38]/20'
            }`}
          >
            {/* Message Header */}
            {!isUser && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-[#255F38]/20 text-[#255F38] dark:bg-[#255F38]/10">
                    Heights+ AI
                  </Badge>
                  {message.metadata?.confidence && (
                    <Badge variant="outline" className="text-xs border-[#1F7D53]/50">
                      {Math.round(message.metadata.confidence * 100)}% confident
                    </Badge>
                  )}
                  {message.type === 'financial' && (
                    <Badge className="text-xs bg-gradient-to-r from-[#255F38] to-[#1F7D53]">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Financial Analysis
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

            {/* Financial Analysis Card */}
            {message.type === 'financial' && message.metadata?.analysis && (
              <motion.div 
                className="mt-4 p-4 bg-white/10 dark:bg-black/20 rounded-lg cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setFinancialAnalysisData(message.metadata?.analysis);
                  setShowFinancialAnalysis(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#1F7D53]" />
                    <span className="font-medium">View Full Analysis</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            )}

            {/* Message Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs hover:bg-white/10"
                onClick={() => copyToClipboard(message.content, message.id)}
              >
                {copiedMessageId === message.id ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
              {!isUser && message.metadata?.actionable && (
                <>
                  <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-white/10">
                    <Star className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-white/10">
                    <Share className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-white/10">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-[#255F38]/5 dark:from-black dark:via-gray-950 dark:to-[#255F38]/10">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Enhanced Header with Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Title and Status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <HeightsLogo size="xl" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
                  Heights+ AI
                </h1>
                <p className="text-sm text-muted-foreground">Advanced Trading Intelligence</p>
              </div>
            </div>
            
            {/* Live Status Indicators */}
            <div className="flex items-center gap-4">
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
                <span className="text-xs font-medium">Claude</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 backdrop-blur-sm border border-[#255F38]/20 rounded-full">
                <Globe className="h-3 w-3 text-[#255F38]" />
                <span className="text-xs font-medium">Perplexity</span>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Portfolio Value</span>
                    <Wallet className="h-4 w-4 text-[#1F7D53]" />
                  </div>
                  <p className="text-lg font-bold">
                    $<AnimatedNumber value={metrics.portfolioValue ?? 0} decimals={2} />
                  </p>
                  <p className={`text-xs flex items-center gap-1 mt-1 ${((metrics.dayChange ?? 0) >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                    {(metrics.dayChange ?? 0) >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(metrics.dayChange ?? 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Total Analyses</span>
                    <BarChart3 className="h-4 w-4 text-[#255F38]" />
                  </div>
                  <p className="text-lg font-bold">
                    <AnimatedNumber value={metrics.totalAnalyses} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +12 today
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                    <Target className="h-4 w-4 text-[#27391C]" />
                  </div>
                  <p className="text-lg font-bold">
                    <AnimatedNumber value={metrics.successRate} suffix="%" decimals={1} />
                  </p>
                  <Progress value={metrics.successRate} className="h-1 mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <Brain className="h-4 w-4 text-[#1F7D53]" />
                  </div>
                  <p className="text-lg font-bold">
                    <AnimatedNumber value={metrics.averageConfidence} suffix="%" decimals={1} />
                  </p>
                  <Progress value={metrics.averageConfidence} className="h-1 mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-lg font-bold">
                    <AnimatedNumber value={metrics.responseTime} suffix="s" decimals={1} />
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Fast
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="col-span-1">
              <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-[#255F38]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Active Alerts</span>
                    <Bell className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-lg font-bold">
                    <AnimatedNumber value={metrics.activeAlerts} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 critical
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chat Section - Takes up 3 columns */}
          <div className="xl:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="h-[calc(100vh-320px)] flex flex-col bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="w-full">
                  <CardHeader className="border-b border-[#255F38]/20 pb-3">
                    <div className="flex items-center justify-between">
                      <TabsList className="grid w-full max-w-md grid-cols-3 bg-[#255F38]/10">
                        <TabsTrigger value="chat" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analysis
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="data-[state=active]:bg-[#255F38] data-[state=active]:text-white">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Insights
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-0 flex flex-col">
                    <TabsContent value="chat" className="flex-1 m-0">
                      {/* Messages Area */}
                      <ScrollArea className="flex-1 p-4 md:p-6">
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
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                                <HeightsLogo size="sm" className="text-white" animate={false} />
                              </div>
                              <div className="bg-card/90 border border-[#255F38]/30 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                  >
                                    <Brain className="h-5 w-5 text-[#1F7D53]" />
                                  </motion.div>
                                  <span className="text-sm text-muted-foreground">
                                    Analyzing with Claude & Perplexity...
                                  </span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                  <motion.div 
                                    className="h-2 w-2 rounded-full bg-[#255F38]"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.6 }}
                                  />
                                  <motion.div 
                                    className="h-2 w-2 rounded-full bg-[#1F7D53]"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                  />
                                  <motion.div 
                                    className="h-2 w-2 rounded-full bg-[#27391C]"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </ScrollArea>

                      {/* Enhanced Input Area */}
                      <div className="p-4 border-t border-[#255F38]/20 bg-gradient-to-r from-card/50 to-[#255F38]/5">
                        {/* Quick Actions */}
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                          {QUICK_ACTIONS.slice(0, 4).map((action) => (
                            <motion.div key={action.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendMessage(action.prompt)}
                                disabled={isLoading}
                                className="border-[#255F38]/30 hover:bg-[#255F38]/10 whitespace-nowrap"
                              >
                                <action.icon className={`h-3 w-3 mr-1 ${action.color}`} />
                                {action.label}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Input Field with Animation */}
                        <div className="relative">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#255F38]/20 to-[#1F7D53]/20 rounded-lg blur-xl"
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 3,
                              ease: "easeInOut"
                            }}
                          />
                          <div className="relative flex gap-2">
                            <Textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder={animatedPlaceholder}
                              className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-background/80 backdrop-blur-sm border-[#255F38]/30 focus:border-[#255F38] transition-all duration-300"
                              disabled={isLoading}
                            />
                            <motion.div className="flex flex-col gap-2">
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
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Input Helper Text */}
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Press Enter to send, Shift+Enter for new line</span>
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘K</kbd>
                            <span>Command Palette</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="flex-1 m-0 p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Market Analysis Overview</h3>
                        {/* Add your analysis content here */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Analysis cards */}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="insights" className="flex-1 m-0 p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">AI-Generated Insights</h3>
                        {/* Add your insights content here */}
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Quick Actions & Insights */}
          <div className="space-y-4">
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
                        onClick={() => sendMessage(action.prompt)}
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

            {/* Trading Ideas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Today's Top Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {realTimeData.btc && (
                    <motion.div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">BTC Long</span>
                        <Badge className="text-xs bg-green-500/20 text-green-600">
                          85% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strong support at $51,200
                      </p>
                    </motion.div>
                  )}
                  
                  {realTimeData.eth && (
                    <motion.div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">ETH Long</span>
                        <Badge className="text-xs bg-blue-500/20 text-blue-600">
                          85% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strong support at $1,800
                      </p>
                    </motion.div>
                  )}
                  
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Gold Hedge</span>
                      <Badge className="text-xs bg-yellow-500/20 text-yellow-600">
                        72% confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Market uncertainty rising
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Analyses */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/80 backdrop-blur-sm border-[#255F38]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#255F38]" />
                    Recent Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {messages.filter(m => m.type === 'analysis').map((message) => (
                    <div key={message.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{message.metadata?.symbols?.[0]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {message.metadata?.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(message.metadata.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                  {messages.filter(m => m.type === 'analysis').length === 0 && (
                    <p>No recent analyses</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Financial Analysis Modal */}
        <AnimatePresence>
          {showFinancialAnalysis && financialAnalysisData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowFinancialAnalysis(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-[#255F38]/30 rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {financialAnalysisData.asset} - Comprehensive Analysis
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFinancialAnalysis(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Add your financial analysis display component here */}
                <div className="space-y-6">
                  {/* Analysis content */}
                  <p className="text-muted-foreground">
                    Full financial analysis visualization would go here...
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command Palette */}
        <AnimatePresence>
          {showCommandPalette && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCommandPalette(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                className="bg-card border border-[#255F38]/30 rounded-2xl p-6 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search commands..."
                    className="flex-1 border-0 focus:ring-0 text-lg"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ x: 2 }}
                      className="p-3 hover:bg-[#255F38]/10 rounded-lg cursor-pointer flex items-center justify-between group"
                      onClick={() => {
                        sendMessage(action.prompt);
                        setShowCommandPalette(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                        <div>
                          <p className="font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.category}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}