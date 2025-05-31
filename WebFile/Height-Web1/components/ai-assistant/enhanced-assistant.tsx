// components/ai-assistant/enhanced-assistant.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Loader2,
  ChartBar,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';
import { marketDataService, type MarketData } from '@/lib/market-data';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    marketData?: MarketData[];
    predictions?: any;
    confidence?: number;
  };
}

interface EnhancedAIAssistantProps {
  defaultSymbol?: string;
  onTradeRecommendation?: (recommendation: any) => void;
}

export function EnhancedAIAssistant({ 
  defaultSymbol = 'CRYPTO:BTC',
  onTradeRecommendation 
}: EnhancedAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track major cryptos
  const trackedSymbols = ['CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL', 'CRYPTO:MATIC'];

  useEffect(() => {
    // Subscribe to market data
    const unsubscribes: (() => void)[] = [];
    
    trackedSymbols.forEach(symbol => {
      const unsubscribe = marketDataService.subscribe(symbol, (data) => {
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

  const analyzeMarket = async () => {
    setIsAnalyzing(true);
    
    // Get current market data
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
          history: messages.filter(m => m.role !== 'system').slice(-10) // Last 10 messages for context
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

  // Quick action buttons
  const quickActions = [
    { label: 'Analyze BTC', query: 'What\'s your analysis of Bitcoin right now?' },
    { label: 'Find Opportunities', query: 'What are the best trading opportunities today?' },
    { label: 'Risk Assessment', query: 'What are the current market risks I should be aware of?' },
    { label: 'Technical Analysis', query: 'Perform technical analysis on ETH with support/resistance levels' }
  ];

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Trading Assistant (Claude-Powered)
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
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChartBar className="h-4 w-4" />
              )}
              <span className="ml-2">Full Analysis</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4" />
                      <span className="text-xs font-medium">AI Assistant</span>
                      {message.metadata?.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {(message.metadata.confidence * 100).toFixed(0)}% confident
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-3 border-t">
          <div className="flex gap-2 mb-3 flex-wrap">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => setInput(action.query)}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about markets, trading strategies, or analysis..."
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
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