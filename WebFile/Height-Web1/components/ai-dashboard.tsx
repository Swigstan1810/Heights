// components/ai-dashboard.tsx - Futuristic AI Dashboard with Enhanced Features
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

export default function AIDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'analysis' | 'alerts'>('chat');
  const [analyses, setAnalyses] = useState<AIAnalysis[]>(SAMPLE_ANALYSES);
  const [alerts, setAlerts] = useState<MarketAlert[]>(SAMPLE_ALERTS);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'professional' | 'casual' | 'expert'>('professional');
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🚀 Welcome to Heights AI - Your Advanced Trading Intelligence!

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
      // Simulate AI response
      setTimeout(() => {
        const responses = [
          {
            content: `Based on current market conditions, I'm analyzing ${content}. Here's my assessment:

📊 **Technical Analysis**: Strong bullish momentum with RSI at 68
📈 **Price Target**: $58,000 - $62,000 in next 2 weeks  
⚠️ **Risk Level**: Medium - Watch for potential pullback at $55k resistance
🎯 **Recommendation**: Consider DCA strategy with 30% position

*Analysis confidence: 82% | Last updated: ${new Date().toLocaleTimeString()}*`,
            type: 'analysis' as const,
            confidence: 0.82
          },
          {
            content: `I've identified several key opportunities in the crypto market:

🔥 **Hot Picks**:
• **BTC**: Breakout imminent - Target $60K
• **ETH**: Strong DeFi momentum - Watch for $4200
• **SOL**: Technical consolidation complete

⚡ **Quick Insights**:
- Market sentiment: 72% bullish
- Fear & Greed Index: 68 (Greed)
- Institutional inflows: +$2.3B this week

Want me to dive deeper into any specific asset?`,
            type: 'prediction' as const,
            confidence: 0.76
          },
          {
            content: `🎯 **Personalized Trading Strategy for You**:

Based on your portfolio and risk profile:

**📈 Immediate Actions**:
1. Reduce BTC exposure by 15% (take profits)
2. Increase ETH allocation to 25% 
3. Add 5% SOL position on next dip

**🛡️ Risk Management**:
- Set stop-loss at 8% below entry
- Use position sizing: 2% risk per trade
- Diversify across 5-7 assets max

**📊 Expected Outcome**: 
15-25% portfolio growth over next quarter with managed downside risk.

Ready to execute these recommendations?`,
            type: 'analysis' as const,
            confidence: 0.89
          }
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: randomResponse.content,
          timestamp: new Date(),
          type: randomResponse.type,
          metadata: {
            confidence: randomResponse.confidence,
            actionable: true,
            category: 'market_analysis',
            priority: 'high'
          }
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500 + Math.random() * 1500); // 1.5-3s delay

    } catch (error) {
      console.error('Error sending message:', error);
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
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          }`}>
            {isUser ? <User size={20} /> : <Brain size={20} />}
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
                    Heights AI
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary" />
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Heights AI
              </h1>
              <p className="text-muted-foreground">Advanced Trading Intelligence</p>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-4 p-3 bg-card border rounded-full max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">Analyzing Markets</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Secure</span>
            </div>
          </div>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <div className="flex bg-card border rounded-full p-1">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeMode === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Chat Interface */}
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          AI Trading Assistant
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
                      <ScrollArea className="flex-1 p-6">
                        {messages.map(renderMessage)}
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start mb-6"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                                <Brain size={20} />
                              </div>
                              <div className="bg-card border rounded-2xl p-4">
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
                      <div className="p-6 border-t border-border">
                        <div className="flex flex-col gap-3">
                          {/* Quick Prompts */}
                          <div className="flex flex-wrap gap-2">
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
                          <div className="flex gap-2">
                            <Textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Ask me about markets, trading strategies, or portfolio optimization..."
                              className="flex-1 min-h-[60px] resize-none"
                              disabled={isLoading}
                            />
                            <Button
                              onClick={() => sendMessage(input)}
                              disabled={isLoading || !input.trim()}
                              size="lg"
                              className="px-6"
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
                        <Card className="h-full">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all duration-300"
                                  style={{ width: `${analysis.confidence * 100}%` }}
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

                            <div className="flex items-center justify-between pt-2 border-t">
                              <Badge variant="outline" className={
                                analysis.riskLevel === 'low' ? 'text-green-600' :
                                analysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Smart Market Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {alerts.map((alert, index) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-lg border-l-4 ${
                              alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                              alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                              'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {alert.symbol}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {alert.type.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-1">{alert.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {alert.triggered.toLocaleTimeString()} • {alert.triggered.toLocaleDateString()}
                                </p>
                              </div>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-green-500 rounded-full h-1.5 w-[87%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">92.1%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-blue-500 rounded-full h-1.5 w-[92%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Response Speed</span>
                    <span className="font-medium">1.2s avg</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-purple-500 rounded-full h-1.5 w-[95%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: TrendingUp, label: 'Portfolio Analysis', color: 'text-green-500' },
                  { icon: BarChart3, label: 'Market Summary', color: 'text-blue-500' },
                  { icon: Target, label: 'Risk Assessment', color: 'text-orange-500' },
                  { icon: Lightbulb, label: 'Trading Ideas', color: 'text-purple-500' }
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personality</label>
                  <select 
                    className="w-full p-2 text-sm border rounded"
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