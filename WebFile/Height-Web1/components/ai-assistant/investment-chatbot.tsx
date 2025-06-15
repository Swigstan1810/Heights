// components/ai-assistant/investment-chatbot.tsx - Mobile-Optimized
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { HeightsLogo } from '@/components/ui/heights-logo';
import {
  Send,
  Mic,
  MicOff,
  Bot,
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
  Lightbulb
} from 'lucide-react';
import { AIResponse, MarketDataPoint, NewsItem, AnalysisResult } from '@/types/ai-types';
import { cn } from '@/lib/utils';

interface Message extends AIResponse {
  role: 'user' | 'assistant';
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  prompt: string;
  category: 'crypto' | 'stocks' | 'general' | 'analysis';
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'btc_analysis',
    label: 'Bitcoin Analysis',
    icon: TrendingUp,
    prompt: 'Give me a comprehensive analysis of Bitcoin including current price, recent news, and predictions',
    category: 'crypto',
    color: 'text-orange-500'
  },
  {
    id: 'market_summary',
    label: 'Market Summary',
    icon: BarChart3,
    prompt: 'Provide a summary of today\'s market performance across major indices',
    category: 'general',
    color: 'text-blue-500'
  },
  {
    id: 'stock_recommendation',
    label: 'Stock Picks',
    icon: Target,
    prompt: 'What are some good stock investment opportunities right now?',
    category: 'stocks',
    color: 'text-green-500'
  },
  {
    id: 'risk_assessment',
    label: 'Risk Check',
    icon: Shield,
    prompt: 'What are the current market risks I should be aware of?',
    category: 'analysis',
    color: 'text-red-500'
  },
  {
    id: 'gold_analysis',
    label: 'Gold Outlook',
    icon: Sparkles,
    prompt: 'Is gold a good investment this week? What\'s the outlook?',
    category: 'general',
    color: 'text-yellow-500'
  },
  {
    id: 'reliance_info',
    label: 'Reliance Stock',
    icon: LineChart,
    prompt: 'Tell me about Reliance Industries stock performance and history',
    category: 'stocks',
    color: 'text-purple-500'
  }
];

export default function InvestmentChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);

  // Check if mobile and handle viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Handle viewport height on mobile
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 **Welcome to Heights AI Investment Assistant!**

I'm your intelligent financial companion, powered by Heights +. I can help you with:

📊 **Live Market Data** - Real-time prices from Coinbase, Alpha Vantage, Polygon
📈 **Technical Analysis** - RSI, MACD, support/resistance levels  
📰 **Breaking News** - Latest financial news from Benzinga, GNews
🔮 **AI Predictions** - Smart forecasts using Heights +
💼 **Investment Advice** - Personalized recommendations and risk analysis
🌍 **Global Markets** - Crypto, stocks, mutual funds, commodities

**Try asking naturally:**
• "What's Bitcoin doing today?"
• "Should I invest in Tesla?"
• "Tell me about Reliance Industries"
• "Is gold a good investment this week?"

Ready to get started? 🎯`,
      type: 'text',
      metadata: {
        sources: [],
        confidence: 1.0,
        dataFreshness: 'historical',
        processingTime: 0,
        classification: {
          intent: 'explanation',
          assetType: 'stock',
          confidence: 1.0,
          suggestedServices: [],
          parameters: {}
        }
      },
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom with mobile handling
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    const delay = isMobile ? 300 : 100;
    const timer = setTimeout(scrollToBottom, delay);
    return () => clearTimeout(timer);
  }, [messages, streamingMessage, isMobile]);

  // Fetch real market data on mount
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const perplexityRes = await fetch('/api/market/perplexity?symbols=BTC,ETH,SOL,MATIC,AAPL,GOOGL,TSLA,MSFT');
        const perplexityData = (await perplexityRes.json()).data || [];
        setMarketData(perplexityData as MarketDataPoint[]);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    fetchMarketData();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      type: 'text',
      metadata: {
        sources: [],
        confidence: 1.0,
        dataFreshness: 'historical',
        processingTime: 0,
        classification: {
          intent: 'explanation',
          assetType: 'stock',
          confidence: 1.0,
          suggestedServices: [],
          parameters: {}
        }
      },
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5), // Send last 5 messages for context
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message || data.content,
        type: data.type || 'text',
        metadata: data.metadata || {
          sources: ['claude'],
          confidence: 0.8,
          dataFreshness: 'recent',
          processingTime: data.responseTime || 0,
          classification: data.classification
        },
        marketData: data.marketData,
        news: data.news,
        analysis: data.analysis,
        suggestions: data.suggestions,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your question.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'text',
        metadata: {
          sources: [],
          confidence: 0,
          dataFreshness: 'historical',
          processingTime: 0,
          classification: {
            intent: 'explanation',
            assetType: 'stock',
            confidence: 0,
            suggestedServices: [],
            parameters: {}
          }
        },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const formatPrice = (price: number, symbol?: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: symbol?.includes('BTC') ? 0 : 2,
    }).format(price);
    return formatted;
  };

  const renderMarketData = (marketData: MarketDataPoint[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
      {marketData.slice(0, 3).map((data, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs sm:text-sm">{data.symbol}</span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {data.source}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm sm:text-lg font-bold">
              {formatPrice(data.price, data.symbol)}
            </div>
            <div className={`flex items-center gap-1 text-xs sm:text-sm ${
              data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
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

  const renderNews = (news: NewsItem[]) => (
    <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
      <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
        <Newspaper className="h-4 w-4" />
        Recent News
      </h4>
      {news.slice(0, 3).map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-2.5 sm:p-3 bg-muted/30 rounded-lg border-l-2 border-l-primary/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                {item.title}
              </h5>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 line-clamp-2">
                {item.summary.slice(0, isMobile ? 80 : 100)}...
              </p>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <Badge 
                  variant={item.sentiment === 'positive' ? 'default' : item.sentiment === 'negative' ? 'destructive' : 'secondary'}
                  className="text-[8px] sm:text-xs"
                >
                  {item.sentiment}
                </Badge>
                <span className="text-muted-foreground truncate">{item.source}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => window.open(item.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderAnalysis = (analysis: AnalysisResult) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Brain className="h-4 w-4 text-primary" />
          AI Analysis for {analysis.symbol}
        </h4>
        <Badge 
          variant={analysis.recommendation.includes('buy') ? 'default' : 
                  analysis.recommendation.includes('sell') ? 'destructive' : 'secondary'}
          className="uppercase text-xs w-fit"
        >
          {analysis.recommendation.replace('_', ' ')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="font-medium text-xs sm:text-sm">Confidence</span>
          </div>
          <Progress value={analysis.confidence * 100} className="h-2" />
          <span className="text-xs text-muted-foreground">
            {(analysis.confidence * 100).toFixed(1)}%
          </span>
        </div>
        
        {analysis.technicalIndicators && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="font-medium text-xs sm:text-sm">Technical Signals</span>
            </div>
            <div className="text-xs space-y-1">
              {analysis.technicalIndicators.rsi && (
                <div>RSI: {analysis.technicalIndicators.rsi.toFixed(1)}</div>
              )}
              {analysis.technicalIndicators.support && (
                <div>Support: {formatPrice(analysis.technicalIndicators.support)}</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs sm:text-sm mt-3 text-muted-foreground">
        {analysis.reasoning}
      </p>
    </motion.div>
  );

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 group px-2 sm:px-0`}
      >
        <div className={`w-full max-w-[90%] sm:max-w-[85%] flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-gradient-to-br from-[#255F38] to-[#1F7D53] text-white'
          }`}>
            {isUser ? (
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <HeightsLogo size="sm" className="text-white" animate={false} />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm w-full ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border'
          }`}>
            {/* Message Header for Assistant */}
            {!isUser && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  Heights AI
                </Badge>
                {message.metadata?.sources?.length > 0 && (
                  <div className="flex items-center gap-1">
                    {message.metadata.sources.slice(0, isMobile ? 2 : 3).map(source => (
                      <Badge key={source} variant="outline" className="text-[8px] sm:text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
                {message.metadata?.confidence !== undefined && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {(message.metadata.confidence * 100).toFixed(0)}% confident
                  </Badge>
                )}
              </div>
            )}

            {/* Message Text */}
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
                {message.content}
              </div>
            </div>

            {/* Market Data */}
            {message.marketData && renderMarketData(message.marketData)}

            {/* News */}
            {message.news && renderNews(message.news)}

            {/* Analysis */}
            {message.analysis && renderAnalysis(message.analysis)}

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {message.suggestions.slice(0, isMobile ? 2 : 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-[10px] sm:text-xs h-6 sm:h-7 px-2"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {isMobile && suggestion.length > 20 ? `${suggestion.slice(0, 20)}...` : suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp and Actions */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] sm:text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              {!isUser && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-70 hover:opacity-100"
                    onClick={() => navigator.clipboard.writeText(message.content)}
                  >
                    <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-70 hover:opacity-100"
                  >
                    <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const filteredActions = selectedCategory === 'all' 
    ? QUICK_ACTIONS 
    : QUICK_ACTIONS.filter(action => action.category === selectedCategory);

  return (
    <div 
      className="flex flex-col w-full max-w-6xl mx-auto"
      style={isMobile ? { 
        height: 'calc(var(--vh, 1vh) * 100 - 12rem)',
        minHeight: '400px'
      } : { 
        height: 'clamp(400px, 70vh, 800px)',
        minHeight: '400px'
      }}
    >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-gradient-to-r from-card to-muted/20 border-b p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
              <HeightsLogo size="sm" className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-lg">Heights AI Assistant</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Powered by Heights + with Real-time Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setMessages([messages[0]])}>
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">Quick Actions</span>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1">
            {['all', 'crypto', 'stocks', 'general', 'analysis'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className="text-[10px] sm:text-xs h-6 sm:h-7 capitalize whitespace-nowrap flex-shrink-0"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "grid gap-1.5 sm:gap-2",
            isMobile 
              ? "grid-cols-2" 
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          )}>
            {filteredActions.map(action => (
              <motion.div key={action.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-auto p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2 hover:bg-primary/5"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  <action.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${action.color}`} />
                  <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="min-h-full flex flex-col justify-end">
          <div className="w-full p-3 sm:p-4">
            <AnimatePresence>
              {messages.map(renderMessage)}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                    <HeightsLogo size="sm" className="text-white" animate={false} />
                  </div>
                  <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 max-w-xs">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </motion.div>
                      <div>
                        <div className="text-xs sm:text-sm font-medium">AI is analyzing...</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          Using Heights +
                        </div>
                      </div>
                    </div>
                    
                    {/* Animated dots */}
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/40"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.8, 
                            delay: i * 0.2 
                          }}
                        />
                      ))}
                    </div>

                    {/* Progress steps */}
                    <div className="mt-2 sm:mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Gathering market data...</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Searching latest news...</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                        <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                        <span className="text-muted-foreground">AI analysis in progress...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Streaming Message */}
            {streamingMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                    <HeightsLogo size="sm" className="text-white" animate={false} />
                  </div>
                  <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 max-w-2xl">
                    <div className="whitespace-pre-wrap text-sm">
                      {streamingMessage}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="ml-1"
                      >
                        |
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Show real market data below welcome message if present and no AI response marketData */}
            {messages.length === 1 && marketData.length > 0 && (
              <div className="mt-3 sm:mt-4 px-2 sm:px-0">
                {renderMarketData(marketData)}
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm p-3 sm:p-4">
        <div className="w-full">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isMobile 
                  ? "Ask about investments, stocks, crypto..." 
                  : "Ask about any stock, crypto, commodity, or investment... (e.g., 'Detailed analysis of Tesla stock')"
                }
                className="min-h-[40px] sm:min-h-[50px] max-h-[120px] resize-none pr-10 sm:pr-12 text-sm"
                disabled={isLoading}
                maxLength={500}
                rows={isMobile ? 1 : 2}
              />
              
              {/* Voice Input Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                onClick={() => setIsListening(!isListening)}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                ) : (
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="lg"
              className="h-[40px] sm:h-[50px] px-4 sm:px-6 bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </form>

          {/* Input Helper */}
          <div className="flex flex-wrap items-center justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:block">Try: "Bitcoin analysis", "Tesla vs Apple", "Gold investment outlook"</span>
              <span className="sm:hidden">Press Enter to send</span>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  <span>Heights +</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>Heights +</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500" />
              <span>Real-time data</span>
            </div>
          </div>

          {/* Features Showcase */}
          {!isMobile && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>Live Prices</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Newspaper className="h-3 w-3 text-blue-500" />
                  <span>Breaking News</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BarChart3 className="h-3 w-3 text-purple-500" />
                  <span>Technical Analysis</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="h-3 w-3 text-orange-500" />
                  <span>AI Predictions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}