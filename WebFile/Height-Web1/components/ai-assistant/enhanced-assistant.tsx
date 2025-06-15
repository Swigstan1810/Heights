// components/ai-assistant/enhanced-assistant.tsx - Mobile-Optimized
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  Sparkles
} from 'lucide-react';
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';
import { HeightsLogo } from '@/components/ui/heights-logo';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    marketData?: MarketData[];
    predictions?: unknown;
    confidence?: number;
  };
}

interface EnhancedAIAssistantProps {
  defaultSymbol?: string;
  onTradeRecommendation?: (recommendation: unknown) => void;
  className?: string;
}

export function EnhancedAIAssistant({ 
  defaultSymbol = 'CRYPTO:BTC',
  onTradeRecommendation,
  className 
}: EnhancedAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track major cryptos
  const trackedSymbols = ['BTC', 'ETH', 'SOL', 'MATIC'];

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

  useEffect(() => {
    // Subscribe to market data
    const unsubscribes: (() => void)[] = [];
    
    trackedSymbols.forEach(symbol => {
      const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (data: MarketData) => {
        setMarketData(prev => new Map(prev).set(symbol, data));
      });
      unsubscribes.push(unsubscribe);
    });

    // Initial greeting
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm your AI trading assistant powered by Claude. I have real-time access to market data from Coinbase and can help you with:

• Market analysis and predictions
• Trading recommendations based on technical indicators
• Portfolio optimization suggestions
• Risk assessment and management
• Educational content about trading

What would you like to know about the markets today?`,
      timestamp: new Date()
    }]);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
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
  }, [messages, isMobile]);

  const analyzeMarket = async () => {
    setIsAnalyzing(true);
    
    const marketDataArray = Array.from(marketData.values());
    const marketSummary = marketDataArray.map(data => ({
      symbol: data.symbol,
      price: data.price,
      change24h: data.change24h,
      change24hPercent: data.change24hPercent,
      volume24h: data.volume24h,
      high24h: data.high24h,
      low24h: data.low24h
    }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Perform a comprehensive market analysis of the following crypto data: ${JSON.stringify(marketSummary)}. 
          
          Please provide:
          1. Overall market sentiment (bullish/bearish/neutral)
          2. Top 3 trading opportunities with specific entry/exit points
          3. Risk assessment for each opportunity
          4. Any notable patterns or trends
          5. Recommended portfolio allocation percentages
          
          Be specific with price levels and percentages.`,
          history: messages.filter(m => m.role !== 'system')
        })
      });

      const data = await response.json();
      
      const analysisMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          marketData: marketDataArray,
          confidence: 0.85
        }
      };
      
      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Error analyzing market:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while analyzing the market. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Include market context in the message
      const marketContext = Array.from(marketData.values()).map(data => ({
        symbol: data.symbol,
        price: data.price,
        change24h: data.change24hPercent
      }));

      const enhancedMessage = `
User Question: ${input}

Current Market Data:
${JSON.stringify(marketContext, null, 2)}

Please provide specific, actionable insights based on this real-time data.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedMessage,
          history: messages.filter(m => m.role !== 'system').slice(-10)
        })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Check if response contains trade recommendations
      if (data.message.toLowerCase().includes('buy') || data.message.toLowerCase().includes('sell')) {
        onTradeRecommendation?.({
          message: data.message,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Analyze BTC', query: 'What\'s your analysis of Bitcoin right now?' },
    { label: 'Find Opportunities', query: 'What are the best trading opportunities today?' },
    { label: 'Risk Assessment', query: 'What are the current market risks I should be aware of?' },
    { label: 'Technical Analysis', query: 'Perform technical analysis on ETH with support/resistance levels' }
  ];

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          "flex mb-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div className={cn(
          "flex items-start gap-2 max-w-[85%] sm:max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Avatar */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-gradient-to-br from-[#255F38] to-[#1F7D53] text-white"
          )}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <HeightsLogo size="sm" className="text-white" animate={false} />
            )}
          </div>

          {/* Message Content */}
          <div className={cn(
            "rounded-lg p-3 shadow-sm",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            {message.role === 'assistant' && message.metadata?.confidence && (
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4" />
                <span className="text-xs font-medium">AI Assistant</span>
                <Badge variant="secondary" className="text-xs">
                  {(message.metadata.confidence * 100).toFixed(0)}% confident
                </Badge>
              </div>
            )}
            <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
            <div className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card 
      className={cn(
        "flex flex-col",
        isMobile 
          ? "h-[calc(100vh-8rem)]" 
          : "h-[600px]",
        className
      )}
      style={isMobile ? { height: 'calc(var(--vh, 1vh) * 100 - 8rem)' } : {}}
    >
      <CardHeader className="border-b flex-shrink-0 p-3 sm:p-6">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden sm:inline">AI Trading Assistant (Claude-Powered)</span>
            <span className="sm:hidden">AI Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeMarket}
              disabled={isAnalyzing}
              className="text-xs px-2 sm:px-3"
            >
              {isAnalyzing ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="ml-1 sm:ml-2 hidden sm:inline">Full Analysis</span>
              <span className="ml-1 sm:hidden">Analyze</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
        {/* Messages */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain p-3 sm:p-4"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="min-h-full flex flex-col justify-end">
            <div className="space-y-3 sm:space-y-4">
              {messages.map(renderMessage)}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                      <HeightsLogo size="sm" className="text-white" animate={false} />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex-shrink-0 p-3 border-t">
          <div className="flex gap-1 sm:gap-2 mb-3 overflow-x-auto pb-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => setInput(action.query)}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about markets, trading strategies, or analysis..."
                disabled={isLoading}
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                rows={isMobile ? 1 : 2}
              />
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className="h-auto px-3 sm:px-4 py-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}