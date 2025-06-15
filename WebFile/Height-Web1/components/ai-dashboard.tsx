// components/ai-dashboard.tsx - Mobile-Optimized Responsive Design
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
  AlertTriangle,
  Mic,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Share2,
  Filter,
  ChevronLeft
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMarketData } from '@/hooks/use-market-data';

// Message Interface
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

// Real-time metrics interface
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

// Market data interface
interface MarketDataPoint {
  symbol: string;
  price: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  source: string;
}

// Quick actions
const QUICK_ACTIONS = [
  {
    id: 'market-overview',
    label: 'Market Overview',
    icon: BarChart3,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    prompt: 'Give me a comprehensive overview of today\'s market performance',
  },
  {
    id: 'crypto-analysis',
    label: 'Crypto Analysis',
    icon: Bitcoin,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    prompt: 'Analyze the top cryptocurrencies and provide insights',
  },
  {
    id: 'portfolio-review',
    label: 'Portfolio Review',
    icon: PieChart,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    prompt: 'Review my portfolio and suggest optimizations',
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    prompt: 'Analyze current market risks',
  },
  {
    id: 'news-impact',
    label: 'News Impact',
    icon: Newspaper,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    prompt: 'Analyze latest financial news impact',
  },
  {
    id: 'trading-signals',
    label: 'Trading Signals',
    icon: Target,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    prompt: 'Generate trading signals for major assets',
  }
];

// Suggested prompts
const SUGGESTED_PROMPTS = [
  "What's the current price of Bitcoin?",
  "Analyze AAPL stock for investment",
  "Compare ETH vs SOL performance",
  "Best crypto investments today",
  "Market sentiment analysis",
];

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
  const { data: marketDataMap, loading: isLoadingData } = useMarketData({ symbols: ['BTC', 'ETH', 'SOL', 'MATIC', 'AAPL', 'GOOGL', 'TSLA'] });
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Welcome to Heights AI Investment Assistant!**

I'm powered by Heights + to provide you with:

📊 **Real-time Market Analysis** - Live prices and trends
💡 **Investment Insights** - AI-powered recommendations
📈 **Portfolio Optimization** - Personalized strategies
🎯 **Trading Signals** - Entry and exit points

How can I help you today?`,
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

  // Auto-scroll to bottom with better mobile handling
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    // Delay scroll on mobile to account for keyboard
    const isMobile = window.innerWidth < 768;
    const delay = isMobile ? 300 : 100;
    
    const timer = setTimeout(scrollToBottom, delay);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle viewport height changes on mobile
  useEffect(() => {
    const handleResize = () => {
      // Update CSS custom property for mobile viewport height
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

  // Send message function
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
        type: data.type || 'text',
        metadata: {
          confidence: data.metadata?.confidence,
          actionable: true,
          category: 'analysis',
          analysis: data.analysis,
          assetType: data.metadata?.classification?.assetType
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
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        type: 'alert',
        metadata: { actionable: false, category: 'error' }
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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 group px-2 sm:px-0`}
      >
        <div className={`w-full max-w-[85%] sm:max-w-[80%] flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg ${
            isUser
              ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53]'
              : 'bg-gradient-to-br from-[#255F38] to-[#1F7D53]'
          }`}>
            {isUser ? (
              <User size={16} className="text-white sm:w-5 sm:h-5" />
            ) : (
              <HeightsLogo size="sm" className="text-white" animate={false} />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-xl sm:rounded-2xl shadow-lg w-full ${
            isUser
              ? 'bg-gradient-to-br from-[#27391C] to-[#1F7D53] text-white'
              : 'bg-card border border-border'
          }`}>
            {/* Message Header */}
            {!isUser && message.metadata?.confidence && (
              <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-2 border-b border-border/10">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    Heights AI
                  </Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {Math.round(message.metadata.confidence * 100)}% confident
                  </Badge>
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {/* Message Body */}
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 break-words">{line}</p>
                ))}
              </div>
            </div>

            {/* Message Actions */}
            {!isUser && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    onClick={() => copyToClipboard(message.content, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 sm:h-8 text-xs px-2 sm:px-3">
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Quick Actions */}
      <div className="p-3 sm:p-4 border-b">
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
          <Rocket className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className={cn(
                "h-auto py-2 sm:py-3 px-2 sm:px-3 flex flex-col items-center gap-1 sm:gap-2 hover:border-primary/50 text-xs",
                action.bgColor
              )}
              onClick={() => {
                setActiveMode('chat');
                sendMessage(action.prompt);
                setShowMobileSidebar(false);
              }}
            >
              <action.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", action.color)} />
              <span className="text-[10px] sm:text-xs text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Market Overview */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
          <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          Live Market
        </h3>
        <div className="space-y-1.5 sm:space-y-2">
          {isLoadingData ? (
            <div className="text-center py-6 sm:py-8">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Loading market data...</p>
            </div>
          ) : (
            (() => {
              const validAssets = Array.from(marketDataMap.values()).filter(
                asset => typeof asset.price === 'number' && typeof asset.change24hPercent === 'number'
              );
              if (validAssets.length === 0) {
                return <div className="text-center py-6 text-muted-foreground text-xs">No market data available</div>;
              }
              return validAssets.slice(0, 8).map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      ['BTC','ETH','SOL','MATIC'].includes(asset.symbol) ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium text-xs sm:text-sm">{asset.symbol}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-xs sm:text-sm">${asset.price.toFixed(2)}</p>
                    <p className={cn(
                      "text-[10px] sm:text-xs",
                      asset.change24hPercent >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>

      {/* Resources */}
      <div className="p-3 sm:p-4 border-t">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
            <BookOpen className="h-3 w-3 mr-2" />
            Help & Docs
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
            <Settings className="h-3 w-3 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Top Header - Fixed */}
      <div className="flex-shrink-0 border-b bg-card/50 backdrop-blur-sm z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Sidebar Toggle */}
              <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 w-8 p-0"
                  >
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2">
                <HeightsLogo size="md" className="sm:hidden" />
                <HeightsLogo size="lg" className="hidden sm:block" />
                <div>
                  <h1 className="text-base sm:text-xl font-bold">Heights AI</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Powered by Heights +</p>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs sm:text-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                Live Indicators
              </div>
              <Badge variant="secondary" className="hidden md:flex text-[10px] sm:text-xs">Heights</Badge>
              <Badge variant="secondary" className="hidden md:flex text-[10px] sm:text-xs">+</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-[320px] xl:w-[360px] border-r bg-card/50 backdrop-blur-sm flex-col">
          <SidebarContent />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-background">
          {/* Mode Tabs - Fixed */}
          <div className="flex-shrink-0 border-b z-10">
            <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="w-full">
              <TabsList className="w-full h-10 sm:h-12 rounded-none bg-transparent border-b-0 p-0">
                <TabsTrigger 
                  value="investment" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg text-xs sm:text-sm"
                >
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Investment</span>
                  <span className="sm:hidden">Invest</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg text-xs sm:text-sm"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg text-xs sm:text-sm"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analysis</span>
                  <span className="sm:hidden">Data</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg text-xs sm:text-sm"
                >
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Insights</span>
                  <span className="sm:hidden">Tips</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Tabs value={activeMode} className="h-full">
              {/* Investment Tab */}
              <TabsContent value="investment" className="h-full m-0 p-0">
                <InvestmentChatbot />
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="h-full m-0 p-0 flex flex-col">
                {/* Messages Area - Flexible height with proper scrolling */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div 
                    ref={messagesContainerRef}
                    className="h-full overflow-y-auto overscroll-behavior-contain"
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    <div className="min-h-full flex flex-col justify-end">
                      <div className="w-full max-w-4xl mx-auto py-4 sm:py-6">
                        {messages.length === 1 && (
                          <div className="text-center py-6 sm:py-12 px-4">
                            <Brain className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                            <h3 className="text-base sm:text-lg font-semibold mb-2">Start a conversation</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Ask me anything about investments, markets, or trading</p>
                            
                            {/* Suggested Prompts */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendMessage(prompt)}
                                  className="text-[10px] sm:text-xs h-7 sm:h-8"
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
                            className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-0"
                          >
                            <div className="w-full max-w-[85%] sm:max-w-[80%] flex items-start gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
                                <HeightsLogo size="sm" className="text-white" animate={false} />
                              </div>
                              <div className="bg-card border border-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        <div ref={messagesEndRef} className="h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area - Fixed at bottom */}
                <div className="flex-shrink-0 border-t bg-card/50 backdrop-blur-sm p-3 sm:p-4">
                  <div className="w-full max-w-4xl mx-auto">
                    {/* Quick Actions Bar - Horizontal scroll on mobile */}
                    <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1 sm:pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                      {QUICK_ACTIONS.slice(0, 4).map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(action.prompt)}
                          disabled={isLoading}
                          className="whitespace-nowrap text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
                        >
                          <action.icon className={cn("h-3 w-3 mr-1", action.color)} />
                          {action.label}
                        </Button>
                      ))}
                    </div>

                    {/* Input Field */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about any stock, crypto, or investment strategy..."
                          className="min-h-[50px] sm:min-h-[60px] max-h-[120px] sm:max-h-[200px] resize-none pr-10 sm:pr-12 text-sm leading-normal"
                          disabled={isLoading}
                          rows={2}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 sm:gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0" disabled>
                            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0" disabled>
                            <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendMessage(input)}
                        disabled={isLoading || !input.trim()}
                        size="lg"
                        className="h-[50px] sm:h-[60px] px-4 sm:px-6 bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53] flex-shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </Button>
                    </div>

                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center">
                      Press Enter to send • Shift+Enter for new line • Powered by Heights +
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="h-full m-0 overflow-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Market Analysis</h2>
                    <div className="grid gap-3 sm:gap-4">
                      <Card>
                        <CardHeader className="p-4 sm:p-6">
                          <CardTitle className="text-sm sm:text-base">AI Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs sm:text-sm">Total Analyses Today</span>
                              <span className="font-bold text-xs sm:text-sm">{metrics.totalAnalyses}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs sm:text-sm">Average Confidence</span>
                              <span className="font-bold text-xs sm:text-sm">{metrics.averageConfidence.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs sm:text-sm">Success Rate</span>
                              <span className="font-bold text-xs sm:text-sm">{metrics.successRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="h-full m-0 overflow-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Market Insights</h2>
                    <div className="grid gap-3 sm:gap-4">
                      <Card>
                        <CardHeader className="p-4 sm:p-6">
                          <CardTitle className="text-sm sm:text-base">Today's Top Movers</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                          <div className="space-y-2 sm:space-y-3">
                            {Array.from(marketDataMap.values()).slice(0, 5).map((asset, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted rounded-lg">
                                <div>
                                  <p className="font-medium text-xs sm:text-sm">{asset.symbol}</p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{asset.source}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-xs sm:text-sm">${asset.price.toFixed(2)}</p>
                                  <p className={cn(
                                    "text-[10px] sm:text-xs",
                                    asset.change24hPercent >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}