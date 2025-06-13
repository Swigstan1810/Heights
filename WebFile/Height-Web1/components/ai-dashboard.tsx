// components/ai-dashboard.tsx - Heights+ AI Dashboard with Enhanced Features
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
  TrendingUp as TrendUp,
  MoreHorizontal,
  Bell
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'prediction' | 'alert';
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionable?: boolean;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
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
}

interface MarketAlert {
  id: string;
  type: 'price' | 'volume' | 'news' | 'technical';
  symbol: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggered: Date;
  isRead: boolean;
}

const SAMPLE_ANALYSES: AIAnalysis[] = [
  {
    symbol: 'BTC',
    sentiment: 'bullish',
    confidence: 0.78,
    prediction: 'Expected 15-20% upward movement in next 30 days',  
    timeframe: '30 days',
    keyFactors: ['Institutional adoption', 'Technical breakout', 'Positive sentiment'],
    riskLevel: 'medium',
    lastUpdated: new Date()
  },
  {
    symbol: 'ETH',
    sentiment: 'neutral',
    confidence: 0.65,
    prediction: 'Consolidation expected around current levels',
    timeframe: '14 days',
    keyFactors: ['Network upgrades', 'DeFi activity', 'Market correlation'],
    riskLevel: 'low',
    lastUpdated: new Date()
  }
];

const SAMPLE_ALERTS: MarketAlert[] = [
  {
    id: '1',
    type: 'price',
    symbol: 'BTC',
    message: 'Bitcoin broke above $52,000 resistance level',
    severity: 'info',
    triggered: new Date(Date.now() - 300000),
    isRead: false
  },
  {
    id: '2',
    type: 'technical',
    symbol: 'ETH',
    message: 'Ethereum showing bullish divergence on RSI',
    severity: 'warning',
    triggered: new Date(Date.now() - 600000),
    isRead: false
  }
];

// Helper for responsive alert card classes
const alertCardClass = (severity: string) =>
  `w-full p-4 rounded-lg border-l-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 ` +
  (
    severity === 'critical'
      ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
      : severity === 'warning'
      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      : 'border-[#255F38] bg-[#255F38]/10 dark:bg-[#255F38]/10'
  );

export default function AIDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analysis' | 'alerts'>('chat');
  const [analyses, setAnalyses] = useState<AIAnalysis[]>(SAMPLE_ANALYSES);
  const [alerts, setAlerts] = useState<MarketAlert[]>(SAMPLE_ALERTS);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'professional' | 'casual' | 'expert'>('professional');
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientComponentClient();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 Welcome to Heights+ - Your Advanced Trading Intelligence!

I'm your AI-powered trading assistant, equipped with:
• Real-time market analysis and predictions
• Advanced technical indicators and sentiment analysis  
• Risk assessment and portfolio optimization
• Personalized trading recommendations
• Voice interaction capabilities

How can I help you dominate the markets today?`,
      timestamp: new Date(),
      type: 'text',
      metadata: {
        category: 'welcome',
        actionable: true
      }
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulated real-time updates
  useEffect(() => {
    if (!autoAnalysis) return;

    const interval = setInterval(() => {
      // Update analyses confidence periodically
      setAnalyses(prev => prev.map(analysis => ({
        ...analysis,
        confidence: Math.max(0.5, Math.min(0.95, analysis.confidence + (Math.random() - 0.5) * 0.1)),
        lastUpdated: new Date()
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [autoAnalysis]);

  // Fetch real alerts from Supabase
  useEffect(() => {
    if (!user) return;
    setAlertsLoading(true);
    setAlertsError(null);
    supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error) {
          setAlertsError('Failed to load alerts.');
          setAlerts(SAMPLE_ALERTS);
        } else if (data && data.length > 0) {
          // Map Supabase data to MarketAlert[]
          setAlerts(
            data.map((row: any, i: number) => ({
              id: row.id,
              type: row.metadata?.type || 'news',
              symbol: row.metadata?.symbol || 'N/A',
              message: row.user_message || row.ai_response || 'Alert',
              severity: row.metadata?.severity || 'info',
              triggered: row.created_at ? new Date(row.created_at) : new Date(),
              isRead: !!row.metadata?.isRead,
            }))
          );
        } else {
          setAlerts(SAMPLE_ALERTS);
        }
        setAlertsLoading(false);
      });
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
      // Call Claude API via your backend
      const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
  });

  if (!response.ok) {
    const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown API error');
  }

  const data = await response.json();
  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
        content: data.message || data.output || 'No response from AI.',
    timestamp: new Date(),
        type: 'analysis',
        metadata: {
          confidence: data.confidence || undefined,
          actionable: true,
          category: 'market_analysis',
          priority: 'high'
        }
  };
  setMessages(prev => [...prev, aiMessage]);
      // Optionally, handle data.suggestions, data.relatedSymbols, etc.
} catch (error) {
  console.error('Error fetching AI response:', error);
  setMessages(prev => [...prev, {
    id: (Date.now() + 2).toString(),
    role: 'assistant',
    content: `Apologies, I encountered an error: ${error instanceof Error ? error.message : String(error)}. Please try again later.`,
    timestamp: new Date(),
    type: 'alert',
        metadata: { actionable: false, category: 'error', priority: 'high' }
  }]);
} finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickPrompts = [
    "Analyze Bitcoin's current trend",
    "Show me portfolio optimization ideas", 
    "What are the top crypto opportunities?",
    "Assess market risk levels",
    "Generate trading signals for ETH",
    "Compare DeFi protocols performance"
  ];

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`max-w-[80%] flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-gradient-to-br from-[#255F38] to-[#1F7D53] text-white'
          }`}>
            {isUser ? <User size={20} /> : <HeightsLogo size="sm" className="text-white" animate={false} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl p-4 shadow-lg ${
            isUser
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card border border-border'
          }`}>
            {/* Message Header */}
            {!isUser && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Heights+ AI
                  </Badge>
                  {message.metadata?.confidence && (
                    <Badge variant="outline" className="text-xs">
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
            {!isUser && message.metadata?.actionable && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Star size={12} className="mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Share size={12} className="mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Download size={12} className="mr-1" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-black dark:via-black dark:to-gray-900/20 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 md:mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HeightsLogo size="xl" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
                Heights+
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Advanced Trading Intelligence</p>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3 bg-card dark:bg-gray-900 border rounded-full max-w-xs sm:max-w-md mx-auto text-xs">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <span className="text-muted-foreground">Online</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-[#1F7D53]" />
              <span className="text-muted-foreground">Analyzing Markets</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Secure</span>
            </div>
          </div>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-3 md:mb-6"
        >
          <div className="flex bg-card dark:bg-gray-900 border rounded-full p-1 w-full max-w-xs sm:max-w-md">
            {[
              { id: 'chat', label: 'AI Chat', icon: MessageSquare },
              { id: 'analysis', label: 'Market Analysis', icon: BarChart3 },
              { id: 'alerts', label: 'Smart Alerts', icon: Bell }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeMode === id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveMode(id as any)}
                className="rounded-full"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 w-full">
            <AnimatePresence mode="wait">
              {activeMode === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2 md:space-y-6"
                >
                  {/* Chat Interface */}
                  <Card className="flex flex-col bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38] md:h-[70vh] md:min-h-[400px]">
                    <CardHeader className="border-b border-[#255F38] dark:border-[#255F38] bg-transparent">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          <span className="text-base sm:text-lg">AI Trading Assistant</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsListening(!isListening)}
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSpeaking(!isSpeaking)}
                          >
                            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 flex flex-col">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-2 sm:p-4 md:p-6">
                        {messages.map(renderMessage)}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start mb-6"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] text-white flex items-center justify-center">
                                <HeightsLogo size="sm" className="text-white" animate={false} />
                              </div>
                              <div className="bg-card dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-2 sm:p-4">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm text-muted-foreground">
                                    Analyzing markets and crafting response...
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </ScrollArea>

                      {/* Input Area */}
                      <div className="p-2 sm:p-4 border-t border-[#255F38] dark:border-[#255F38] bg-transparent">
                        <div className="flex flex-col gap-2 sm:gap-3">
                          {/* Quick Prompts */}
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {quickPrompts.slice(0, 3).map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => sendMessage(prompt)}
                                disabled={isLoading}
                                className="text-xs"
                              >
                                {prompt}
                              </Button>
                            ))}
                          </div>
                          {/* Input Field */}
                          <div className="flex flex-col xs:flex-row gap-2 w-full items-stretch xs:items-end">
                            <Textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Ask me about markets, trading strategies, or portfolio optimization..."
                              className="w-full min-h-[48px] sm:min-h-[60px] max-h-[80px] resize-none bg-transparent border-[#255F38] dark:bg-transparent dark:border-[#255F38] text-xs sm:text-sm"
                              disabled={isLoading}
                            />
                            <Button
                              onClick={() => sendMessage(input)}
                              disabled={isLoading || !input.trim()}
                              size="lg"
                              className="w-full xs:w-auto h-[48px] sm:h-[60px] px-4 sm:px-6 mt-2 xs:mt-0"
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeMode === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Market Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analyses.map((analysis, index) => (
                      <motion.div
                        key={analysis.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38]">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#255F38] to-[#1F7D53] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {analysis.symbol}
                                </div>
                                <CardTitle className="text-lg">{analysis.symbol}</CardTitle>
                              </div>
                              <Badge 
                                variant={analysis.sentiment === 'bullish' ? 'default' : analysis.sentiment === 'bearish' ? 'destructive' : 'secondary'}
                              >
                                {analysis.sentiment.toUpperCase()}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Confidence</span>
                                <span className="text-sm font-medium">{Math.round(analysis.confidence * 100)}%</span>
                              </div>
                                  <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
                                <motion.div 
                                  className="bg-[#1F7D53] rounded-full h-2"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${analysis.confidence * 100}%` }}
                                  transition={{ duration: 1, delay: index * 0.2 }}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium mb-1">Prediction</p>
                              <p className="text-sm text-muted-foreground">{analysis.prediction}</p>
                            </div>

                            <div>
                              <p className="text-sm font-medium mb-2">Key Factors</p>
                              <div className="space-y-1">
                                {analysis.keyFactors.map((factor, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span>{factor}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#255F38] dark:border-[#255F38]">
                              <Badge variant="outline" className={
                                analysis.riskLevel === 'low' ? 'text-green-600 dark:text-green-400' :
                                analysis.riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                              }>
                                {analysis.riskLevel.toUpperCase()} RISK
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Updated {analysis.lastUpdated.toLocaleTimeString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeMode === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Smart Alerts */}
                  <Card className="bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Smart Market Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {alertsLoading ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="text-muted-foreground">Loading alerts...</span>
                        </div>
                      ) : alertsError ? (
                        <div className="flex items-center justify-center p-6 text-red-500">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          {alertsError}
                        </div>
                      ) : alerts.length === 0 ? (
                        <div className="flex items-center justify-center p-6 text-muted-foreground">
                          No alerts found.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {alerts.map((alert, index) => (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={alertCardClass(alert.severity)}
                            >
                              <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {alert.symbol}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {alert.type.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-1 break-words">{alert.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {alert.triggered.toLocaleTimeString()} • {alert.triggered.toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex-shrink-0 flex items-center justify-end">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Stats */}
            <Card className="bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38]">
              <CardHeader>
                <CardTitle className="text-sm">AI Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-sm text-muted-foreground">Accuracy</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="w-full bg-muted/20 dark:bg-muted/20 rounded-full h-1.5">
                    <motion.div 
                      className="bg-[#1F7D53] rounded-full h-1.5"
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="font-medium">92.1%</span>
                  </div>
                  <div className="w-full bg-muted/20 dark:bg-muted/20 rounded-full h-1.5">
                    <motion.div 
                      className="bg-[#255F38] rounded-full h-1.5"
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-sm text-muted-foreground">Response Speed</span>
                    <span className="font-medium">1.2s avg</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-1.5">
                    <motion.div 
                      className="bg-[#1F7D53] rounded-full h-1.5"
                      initial={{ width: 0 }}
                      animate={{ width: "95%" }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38]">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: TrendingUp, label: 'Portfolio Analysis', color: 'text-[#1F7D53]' },
                  { icon: BarChart3, label: 'Market Summary', color: 'text-[#255F38]' },
                  { icon: Target, label: 'Risk Assessment', color: 'text-[#27391C]' },
                  { icon: Lightbulb, label: 'Trading Ideas', color: 'text-[#18230F]' }
                ].map(({ icon: Icon, label, color }, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                    onClick={() => sendMessage(`Give me ${label.toLowerCase()}`)}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${color}`} />
                    {label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-transparent backdrop-blur-sm border-[#255F38] dark:bg-transparent dark:border-[#255F38]">
              <CardHeader>
                <CardTitle className="text-sm">AI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personality</label>
                  <select 
                    className="w-full p-2 text-sm border rounded bg-transparent border-[#255F38] dark:bg-transparent dark:border-[#255F38]"
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value as any)}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto Analysis</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoAnalysis(!autoAnalysis)}
                    className={autoAnalysis ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {autoAnalysis ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}