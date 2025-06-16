// components/ai-assistant/enhanced-assistant.tsx - Mobile-First Enhanced Design
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Brain, 
  BarChart,
  Activity,
  Loader2,
  User,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  Crown,
  Star,
  Copy,
  Share,
  Bookmark,
  MessageSquare,
  ChevronDown,
  Mic,
  MicOff,
  Settings,
  Download,
  ChevronRight,
  ArrowUp,
  Lightbulb,
  Globe,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';
import { HeightsLogo } from '@/components/ui/heights-logo';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    marketData?: MarketData[];
    predictions?: unknown;
    confidence?: number;
    suggestions?: string[];
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  prompt: string;
  category: 'crypto' | 'stocks' | 'general' | 'analysis';
  color: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'btc_analysis',
    label: 'Bitcoin Analysis',
    icon: TrendingUp,
    prompt: 'Give me a comprehensive analysis of Bitcoin including current price, recent news, technical indicators, and price predictions for the next 24 hours',
    category: 'crypto',
    color: 'text-orange-500',
    description: 'Deep dive into BTC trends'
  },
  {
    id: 'portfolio_review',
    label: 'Portfolio Review',
    icon: BarChart,
    prompt: 'Review my current portfolio performance and suggest optimizations based on market conditions',
    category: 'general',
    color: 'text-blue-500',
    description: 'Optimize your holdings'
  },
  {
    id: 'market_sentiment',
    label: 'Market Sentiment',
    icon: Activity,
    prompt: 'What is the current overall market sentiment and how should I position my investments?',
    category: 'analysis',
    color: 'text-purple-500',
    description: 'Current market mood'
  },
  {
    id: 'risk_assessment',
    label: 'Risk Analysis',
    icon: Shield,
    prompt: 'Analyze the current market risks and provide risk management strategies for my portfolio',
    category: 'analysis',
    color: 'text-red-500',
    description: 'Stay protected'
  },
  {
    id: 'trading_signals',
    label: 'Trading Signals',
    icon: Target,
    prompt: 'Show me current trading signals and entry/exit points for top cryptocurrencies',
    category: 'crypto',
    color: 'text-green-500',
    description: 'Smart trade timing'
  },
  {
    id: 'defi_opportunities',
    label: 'DeFi Yields',
    icon: Sparkles,
    prompt: 'What are the best DeFi yield farming opportunities with good risk-reward ratios?',
    category: 'crypto',
    color: 'text-yellow-500',
    description: 'Earn passive income'
  }
];

const EXAMPLE_PROMPTS = [
  "What's the best crypto to invest in right now?",
  "Explain the current Bitcoin price action",
  "Should I buy Ethereum at current levels?",
  "Analyze the correlation between stocks and crypto",
  "What are the risks of investing in altcoins?",
  "How do I build a balanced crypto portfolio?"
];

export default function EnhancedAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showExamples, setShowExamples] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track major cryptos for context
  const trackedSymbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'AVAX'];

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

  // Initialize with welcome message and market data
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // Subscribe to market data
    trackedSymbols.forEach(symbol => {
      const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (data: MarketData) => {
        setMarketData(prev => new Map(prev).set(symbol, data));
      });
      unsubscribes.push(unsubscribe);
    });

    // Set welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 **Welcome to Heights AI - Your Advanced Trading Intelligence**

I'm your personal AI trading assistant, powered by Claude-3.5 Sonnet and real-time market data. I can help you with:

📊 **Live Market Analysis** - Real-time price data and technical indicators
📈 **Smart Predictions** - AI-powered price forecasts and trend analysis  
📰 **News Integration** - Latest market news and sentiment analysis
💼 **Portfolio Optimization** - Personalized investment strategies
🎯 **Trading Signals** - Entry/exit points with risk management
🔮 **Future Insights** - Market outlook and opportunity identification

**Try asking me:**
• "What's driving Bitcoin's current price action?"
• "Should I buy the dip in Ethereum?"
• "Show me trading signals for top altcoins"
• "Analyze my portfolio risk exposure"

Ready to elevate your trading game? 🎮`,
      timestamp: new Date(),
      metadata: {
        confidence: 1.0,
        suggestions: EXAMPLE_PROMPTS.slice(0, 3)
      }
    };

    setMessages([welcomeMessage]);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
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
    
    const delay = isMobile ? 300 : 100;
    const timer = setTimeout(scrollToBottom, delay);
    return () => clearTimeout(timer);
  }, [messages, isMobile]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowExamples(false);

    try {
      // Add market context to the message
      const marketContext = Array.from(marketData.values()).map(data => ({
        symbol: data.symbol,
        price: data.price,
        change24h: data.change24hPercent,
        volume: data.volume24h
      }));

      const enhancedMessage = `
User Question: ${text}

Current Market Context:
${JSON.stringify(marketContext, null, 2)}

Please provide specific, actionable insights based on this real-time data. Include technical analysis, market sentiment, and clear recommendations where appropriate.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedMessage,
          history: messages.filter(m => m.role !== 'system').slice(-8),
          preferences: {
            usePerplexity: true,
            structured: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message || data.content,
        timestamp: new Date(),
        metadata: {
          confidence: data.metadata?.confidence || 0.8,
          marketData: marketContext.map((d) => ({
            symbol: d.symbol,
            productId: d.symbol ? `${d.symbol}-USD` : '',
            price: d.price,
            change24h: d.change24h ?? 0,
            change24hPercent: d.change24h ?? 0,
            volume24h: d.volume ?? 0,
            high24h: 0,
            low24h: 0,
            timestamp: new Date(),
            source: 'coinbase',
          })),
          suggestions: data.suggestions || generateSuggestions(text)
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Please try again or rephrase your question.\n\n**Error**: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (query: string): string[] => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('bitcoin') || lowerQuery.includes('btc')) {
      return [
        "What's the next resistance level for Bitcoin?",
        "Should I DCA into Bitcoin now?",
        "Bitcoin correlation with traditional markets"
      ];
    } else if (lowerQuery.includes('ethereum') || lowerQuery.includes('eth')) {
      return [
        "Ethereum 2.0 impact on price",
        "Best Ethereum staking strategies",
        "ETH vs BTC performance comparison"
      ];
    }
    return EXAMPLE_PROMPTS.slice(0, 3);
  };

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

  const handleExamplePrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Add toast notification here
  };

  const filteredActions = selectedCategory === 'all' 
    ? QUICK_ACTIONS 
    : QUICK_ACTIONS.filter(action => action.category === selectedCategory);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "flex mb-6 group",
          isUser ? "justify-end" : "justify-start",
          isSystem && "justify-center"
        )}
      >
        <div className={cn(
          "flex items-start gap-3 max-w-[90%] sm:max-w-[85%]",
          isUser ? "flex-row-reverse" : "flex-row",
          isSystem && "max-w-[95%]"
        )}>
          {/* Avatar */}
          {!isSystem && (
            <Avatar className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0",
              isUser 
                ? "bg-gradient-to-br from-blue-500 to-purple-500" 
                : "bg-gradient-to-br from-emerald-500 to-blue-500"
            )}>
              {isUser ? (
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              ) : (
                <HeightsLogo size="sm" className="text-white" animate={false} />
              )}
              <AvatarFallback>
                {isUser ? 'U' : 'AI'}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Message Content */}
          <div className={cn(
            "rounded-2xl p-4 sm:p-5 shadow-lg relative",
            isUser
              ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
              : isSystem
              ? "bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700/50 text-gray-300 backdrop-blur-sm"
              : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 text-white backdrop-blur-sm"
          )}>
            {/* Assistant Header */}
            {!isUser && !isSystem && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400">
                    <Brain className="h-3 w-3 mr-1" />
                    Heights AI
                  </Badge>
                  {message.metadata?.confidence && (
                    <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                      {(message.metadata.confidence * 100).toFixed(0)}% confident
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-700/50"
                    onClick={() => copyMessage(message.content)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-700/50"
                  >
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Message Text */}
            <div className="prose prose-sm sm:prose-base max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed break-words">
                {message.content}
              </div>
            </div>

            {/* Suggestions */}
            {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-600/30">
                <p className="text-xs text-gray-400 mb-2">Suggested follow-ups:</p>
                <div className="flex flex-wrap gap-2">
                  {message.metadata.suggestions.slice(0, isMobile ? 2 : 3).map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-3 border-gray-600 hover:bg-gray-700/50 hover:border-emerald-500/50"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs opacity-60 mt-3">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      className="flex flex-col w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden shadow-2xl"
      style={isMobile ? { 
        height: 'calc(var(--vh, 1vh) * 100 - 8rem)',
        minHeight: '500px'
      } : { 
        height: 'clamp(600px, 80vh, 900px)',
        minHeight: '600px'
      }}
    >
      {/* Enhanced Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-b border-gray-700/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white">Heights AI Assistant</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <span>Powered by Claude-3.5 Sonnet</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Online
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setMessages([messages[0]])}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Quick Actions</span>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {['all', 'crypto', 'analysis', 'general'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "text-xs h-7 capitalize whitespace-nowrap flex-shrink-0 transition-all duration-300",
                  selectedCategory === category 
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 shadow-lg" 
                    : "border-gray-600 hover:bg-gray-700/50"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {filteredActions.map(action => (
              <motion.div key={action.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-700/50 hover:border-emerald-500/30 border-gray-600 transition-all duration-300"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <div className="text-center">
                    <div className="text-xs font-medium text-white">{action.label}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{action.description}</div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain bg-gradient-to-b from-transparent to-gray-900/20"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="min-h-full flex flex-col justify-end">
          <div className="w-full p-4 sm:p-6">
            <AnimatePresence>
              {messages.map(renderMessage)}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-6"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-blue-500">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                  </Avatar>
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 rounded-2xl p-4 sm:p-5 max-w-xs backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >
                        <Brain className="h-5 w-5 text-emerald-400" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-medium text-white">AI is thinking...</div>
                        <div className="text-xs text-gray-400">Analyzing markets</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-emerald-400/40"
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

            {/* Example Prompts */}
            {showExamples && messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Try asking me about:</h3>
                  <p className="text-sm text-gray-400">Click any example to get started</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full text-left p-4 h-auto justify-start border-gray-700 hover:bg-gray-800/50 hover:border-emerald-500/30 group transition-all duration-300"
                        onClick={() => handleExamplePrompt(prompt)}
                      >
                        <MessageSquare className="h-4 w-4 mr-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 group-hover:text-white">{prompt}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-500 group-hover:text-emerald-400" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-900/90 p-4 sm:p-6">
        <div className="w-full">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isMobile 
                  ? "Ask about crypto, trading, markets..." 
                  : "Ask me anything about crypto markets, trading strategies, or get personalized investment advice..."
                }
                className="min-h-[50px] sm:min-h-[60px] max-h-[120px] resize-none bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl pr-12"
                disabled={isLoading}
                maxLength={1000}
                rows={isMobile ? 2 : 3}
              />
              
              {/* Voice Input Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-gray-700/50"
                onClick={() => setIsListening(!isListening)}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-400" />
                ) : (
                  <Mic className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="lg"
              className="h-[50px] sm:h-[60px] px-6 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-lg shadow-emerald-500/25 border-0 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>

          {/* Input Helper */}
          <div className="flex flex-wrap items-center justify-between mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="hidden sm:block">Press Enter to send • Shift+Enter for new line</span>
              <span className="sm:hidden">Tap to send</span>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3 text-emerald-400" />
                  <span>Claude</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-blue-400" />
                  <span>Live Data</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-emerald-400" />
              <span>Real-time analysis</span>
            </div>
          </div>

          {/* Features Showcase */}
          {!isMobile && (
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span>Live Prices</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe className="h-3 w-3 text-blue-400" />
                  <span>Market News</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <BarChart className="h-3 w-3 text-purple-400" />
                  <span>Technical Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Target className="h-3 w-3 text-orange-400" />
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