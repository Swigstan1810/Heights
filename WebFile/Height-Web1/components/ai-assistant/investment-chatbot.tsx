"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { HeightsLogo } from '@/components/ui/heights-logo';
import {
  Send,
  Mic,
  MicOff,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Brain,
  Globe,
  BarChart3,
  LineChart,
  Newspaper,
  Sparkles,
  Zap,
  Copy,
  Share,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Activity,
  Target,
  Shield,
  Info,
  Lightbulb,
  PieChart,
  Bell,
  Search,
  Menu,
  X,
  ArrowUp,
  ArrowDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  marketData?: MarketDataPoint[];
  news?: NewsItem[];
  analysis?: AnalysisResult;
}

interface MarketDataPoint {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume?: string;
  marketCap?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  source: string;
}

interface NewsItem {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
  source: string;
  publishedAt: string;
}

interface AnalysisResult {
  symbol: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  technicalIndicators?: {
    rsi?: number;
    support?: number;
    resistance?: number;
  };
}

// Mock market data - replace with your real API calls
const mockMarketData: MarketDataPoint[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, changePercent: 2.34, volume: '23.4B', marketCap: '1.32T', sentiment: 'bullish', source: 'coinbase' },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, changePercent: -1.23, volume: '12.8B', marketCap: '415B', sentiment: 'neutral', source: 'coinbase' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 185.64, changePercent: 0.87, volume: '45.2M', marketCap: '2.89T', sentiment: 'bullish', source: 'polygon' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 248.73, changePercent: -2.14, volume: '67.3M', marketCap: '793B', sentiment: 'bearish', source: 'polygon' },
  { symbol: 'SOL', name: 'Solana', price: 148.92, changePercent: 4.67, volume: '1.8B', marketCap: '68B', sentiment: 'bullish', source: 'coinbase' },
  { symbol: 'GOOGL', name: 'Alphabet', price: 147.23, changePercent: 1.45, volume: '28.7M', marketCap: '1.85T', sentiment: 'bullish', source: 'polygon' }
];

const QUICK_ACTIONS = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: PieChart,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Analyze my portfolio performance and suggest optimizations based on current market conditions',
  },
  {
    id: 'market',
    label: 'Market',
    icon: BarChart3,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Give me today\'s market overview including major movers and sentiment analysis',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    icon: TrendingUp,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Show me the top cryptocurrency opportunities and technical analysis',
  },
  {
    id: 'ai-picks',
    label: 'AI Picks',
    icon: Brain,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Generate AI-powered investment recommendations with confidence scores',
  },
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Summarize the latest financial news and market-moving events',
  },
  {
    id: 'risk',
    label: 'Risk',
    icon: Shield,
    color: 'text-[#1F7D53]',
    bgColor: 'bg-[#1F7D53]/10',
    prompt: 'Analyze current market risks and provide risk management strategies',
  }
];

const SUGGESTED_PROMPTS = [
  "What's Bitcoin's price outlook this week?",
  "Best crypto investments under $100?",
  "Analyze Apple stock fundamentals",
  "Portfolio diversification strategy",
  "Market sentiment analysis today",
  "Tesla vs traditional automakers"
];

export default function EnhancedInvestmentChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [marketData, setMarketData] = useState<MarketDataPoint[]>(mockMarketData);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 **Welcome to Heights AI Investment Assistant!**

I'm powered by Heights+ to provide you with:

📊 **Real-time Market Analysis** - Live prices and trends
💡 **Investment Insights** - AI-powered recommendations
📈 **Portfolio Optimization** - Personalized strategies
🎯 **Trading Signals** - Entry and exit points
📰 **Breaking News** - Latest financial developments

**Try asking:**
• "What's Bitcoin doing today?"
• "Best investment opportunities now?"
• "Analyze Tesla stock performance"
• "Portfolio risk assessment"

How can I help you today? 💼`,
      timestamp: new Date(),
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
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle viewport height on mobile
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
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
          history: messages,
          userId: user?.id,
          preferences: {
            usePerplexity: true,
            structured: true
          }
        })
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message,
        timestamp: new Date(),
        metadata: {
          confidence: data.metadata?.confidence,
          actionable: true,
          category: 'analysis',
          analysis: data.analysis,
          assetType: data.metadata?.classification?.assetType
        },
        marketData: data.marketData || (content.toLowerCase().includes('market') || content.toLowerCase().includes('price') ? marketData.slice(0, 4) : undefined),
        news: data.news,
        analysis: data.analysis
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        metadata: { actionable: false, category: 'error' }
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, user?.id, marketData]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const renderMarketData = (marketData: MarketDataPoint[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {marketData.slice(0, 4).map((data, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-black/50 border border-white/10 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1F7D53] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{data.symbol.slice(0, 2)}</span>
              </div>
              <span className="font-semibold text-white text-sm">{data.symbol}</span>
            </div>
            <Badge variant="outline" className="text-xs border-white/20 text-white/70">
              {data.source}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-white">
              {formatPrice(data.price)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              data.changePercent >= 0 ? 'text-[#1F7D53]' : 'text-red-500'
            }`}>
              {data.changePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group px-4 sm:px-0`}
      >
        <div className={`w-full max-w-[90%] sm:max-w-[80%] flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-white text-black'
              : 'bg-[#1F7D53] text-white'
          }`}>
            {isUser ? (
              <User size={16} className="sm:w-5 sm:h-5" />
            ) : (
              <HeightsLogo size="sm" className="text-white" animate={false} />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-xl sm:rounded-2xl w-full ${
            isUser
              ? 'bg-white text-black'
              : 'bg-black border border-white/10 text-white'
          }`}>
            {/* Message Header */}
            {!isUser && message.metadata?.confidence && (
              <div className="px-4 pt-3 pb-2 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-[#1F7D53]/20 text-[#1F7D53] border-[#1F7D53]/30">
                  Heights AI
                </Badge>
                  <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                    {Math.round(message.metadata.confidence * 100)}% confident
                  </Badge>
                  <span className="text-xs text-white/50 ml-auto">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {/* Message Body */}
            <div className="px-4 py-4">
              <div className="prose prose-sm max-w-none text-sm sm:text-base leading-relaxed">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 break-words">{line}</p>
                ))}
              </div>

              {/* Market Data Display */}
              {message.marketData && renderMarketData(message.marketData)}
            </div>

            {/* Message Actions */}
              {!isUser && (
              <div className="px-4 pb-4 pt-1 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-3 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => copyToClipboard(message.content, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="h-7 text-xs px-3 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Share className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-xs px-3 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
                </div>
              )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Mobile ticker component
  const MobileTicker = () => (
    <div className="relative overflow-hidden bg-black/50 border-b border-white/10">
      <motion.div
        className="flex gap-6 py-2"
        animate={{ x: [-100, -1500] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {[...marketData, ...marketData].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-white font-medium text-sm">{item.symbol}</span>
            <span className="text-white font-semibold">${item.price.toLocaleString()}</span>
            <span className={`flex items-center gap-1 text-sm ${
              item.changePercent > 0 ? 'text-[#1F7D53]' : 'text-red-500'
            }`}>
              {item.changePercent > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(item.changePercent).toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-black flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Mobile Ticker */}
      {/* <MobileTicker /> */}
      
      {/* Top Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-sm z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <HeightsLogo size="md" className="text-[#1F7D53]" />
                <div>
                  <h1 className="text-lg font-bold text-white">Heights AI</h1>
                  <p className="text-xs text-white/60">Investment Assistant</p>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-[#1F7D53]/20 text-[#1F7D53] rounded-full text-xs">
                {isOnline ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{isOnline ? 'Live' : 'Offline'}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-[#1F7D53]" />
          <span className="text-sm font-medium text-white">Quick Actions</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className={cn(
                "h-auto py-3 px-2 flex flex-col items-center gap-2 hover:border-[#1F7D53]/50 text-xs border-white/20 text-white hover:text-white",
                action.bgColor
              )}
              onClick={() => sendMessage(action.prompt)}
            >
              <action.icon className={cn("h-4 w-4", action.color)} />
              <span className="text-xs text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain bg-black"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="min-h-full flex flex-col justify-end">
          <div className="w-full max-w-4xl mx-auto py-4">
            {messages.length === 1 && (
              <div className="text-center py-8 px-4">
                <Brain className="h-12 w-12 mx-auto mb-4 text-[#1F7D53]" />
                <h3 className="text-lg font-semibold mb-2 text-white">Start investing smarter</h3>
                <p className="text-sm text-white/60 mb-6">Ask me anything about markets, crypto, or investments</p>
                
                {/* Suggested Prompts */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(prompt)}
                      className="text-xs h-8 border-white/20 text-white hover:text-white hover:border-[#1F7D53]/50"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map(renderMessage)}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-6 px-4 sm:px-0"
              >
                <div className="w-full max-w-[90%] sm:max-w-[80%] flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1F7D53] flex items-center justify-center">
                    <HeightsLogo size="sm" className="text-white" animate />
                  </div>
                  <div className="bg-black border border-white/10 rounded-xl px-4 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <Brain className="h-5 w-5 text-[#1F7D53]" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-medium text-white">Analyzing markets...</div>
                        <div className="text-xs text-white/60">Powered by Heights+</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-[#1F7D53]/40"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.8, 
                            delay: i * 0.2 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about investments, markets, or crypto..."
                className="min-h-[50px] max-h-[120px] resize-none pr-12 text-sm bg-black border-white/20 text-white placeholder-white/50 focus:border-[#1F7D53] focus:ring-[#1F7D53]/20"
                disabled={isLoading}
                rows={2}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                  className="h-6 w-6 p-0 text-white/50 hover:text-white"
                onClick={() => setIsListening(!isListening)}
              >
                {isListening ? (
                    <MicOff className="h-3 w-3 text-red-500" />
                ) : (
                    <Mic className="h-3 w-3" />
                )}
              </Button>
              </div>
            </div>
            <Button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              size="lg"
              className="h-[50px] px-6 bg-[#1F7D53] hover:bg-[#1F7D53]/80 text-white flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-white/50 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line • Powered by Heights+
          </p>
        </div>
                </div>

      {/* Voice Recording Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-black border border-white/20 rounded-2xl p-6">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-16 h-16 bg-[#1F7D53] rounded-full flex items-center justify-center"
                >
                  <Mic className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-white font-semibold">Listening...</h3>
                  <p className="text-white/60 text-sm">Speak your investment question</p>
                </div>
                <Button
                  onClick={() => setIsListening(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:text-white hover:bg-white/10"
                >
                  Stop Recording
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Toast */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">No connection</span>
            </div>
            <p className="text-white/60 text-xs mt-1">Some features may be limited</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}