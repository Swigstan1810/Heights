// types/ai-types.ts

import type { InvestorProfile } from '@/lib/services/investor-profiling-service';
import type { PartialInvestorProfile } from '@/lib/services/investor-profiling-service';

export type QueryIntent = 
  | 'price' 
  | 'explanation' 
  | 'prediction' 
  | 'news' 
  | 'analysis' 
  | 'comparison' 
  | 'portfolio';

export type AssetType = 
  | 'crypto' 
  | 'stock' 
  | 'mutualfund' 
  | 'commodity' 
  | 'bond' 
  | 'index';

export type ServiceProvider = 
  | 'claude' 
  | 'perplexity' 
  | 'coinbase' 
  | 'alpha_vantage' 
  | 'polygon' 
  | 'twelve_data' 
  | 'benzinga' 
  | 'gnews';

export interface ClassifiedQuery {
  intent: QueryIntent;
  assetType: AssetType;
  assetSymbol?: string;
  timeframe?: string;
  confidence: number;
  suggestedServices: ServiceProvider[];
  parameters: Record<string, any>;
}

export interface MarketDataPoint {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  timestamp: string;
  source: ServiceProvider;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  image?: string;
}

export interface AnalysisResult {
  symbol: string;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  technicalIndicators?: {
    rsi?: number;
    macd?: { signal: string; value: number };
    sma?: { sma20: number; sma50: number };
    support?: number;
    resistance?: number;
  };
  priceTargets?: {
    short: number;
    medium: number;
    long: number;
  };
  risks: string[];
  opportunities: string[];
  timeframe: string;
  lastUpdated: string;
}

export interface EnhancedAnalysis extends AnalysisResult {
  confidenceScore: number; // 0-100
  confidenceFactors: {
    technicalAlignment: number;  // How well technicals align (0-100)
    fundamentalStrength: number; // Fundamental analysis score (0-100)
    marketConditions: number;    // Market environment favorability (0-100)
    newssentiment: number;       // News sentiment alignment (0-100)
  };
  confidenceBreakdown: string; // Explanation of confidence calculation
}

export interface TimeframeAnalysis {
  '1min': TimeframeTrend;
  '5min': TimeframeTrend;
  '15min': TimeframeTrend;
  '1hour': TimeframeTrend;
  '4hour': TimeframeTrend;
  'daily': TimeframeTrend;
  'weekly': TimeframeTrend;
  'monthly': TimeframeTrend;
  summary: {
    alignment: number; // 0-100, how well timeframes align
    primaryTrend: 'bullish' | 'bearish' | 'neutral';
    conviction: 'strong' | 'moderate' | 'weak';
  };
}

export interface TimeframeTrend {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  momentum: 'increasing' | 'decreasing' | 'stable';
  keyLevels: {
    support: number;
    resistance: number;
    pivot: number;
  };
}

export interface TradeSetup {
  symbol: string;
  currentPrice: number;
  entry: number;
  stopLoss: number;
  targets: TradeTarget[];
  riskRewardRatio: number;
  positionSize: number;
  portfolioPercentage: number;
  maxLoss: number;
  expectedReturn: number;
  winProbability: number;
  kellyPercentage: number; // Optimal position size based on Kelly Criterion
  setup: {
    pattern?: string;
    trigger?: string;
    timeframe?: string;
  };
}

export interface TradeTarget {
  price: number;
  percentage: number; // % of position to exit
  riskReward: number;
  probability: number; // probability of reaching
}

export interface PortfolioRiskAnalysis {
  totalRisk: number; // Portfolio VaR
  correlationRisk: number; // Risk from correlated positions
  concentrationRisk: number; // Risk from position concentration
  sectorExposure: { [sector: string]: number };
  recommendations: string[];
}

export interface EnhancedMarketDataPoint extends MarketDataPoint {
  technicalSignals: {
    rsi: { value: number; signal: 'oversold' | 'neutral' | 'overbought' };
    macd: { value: number; signal: 'bullish' | 'bearish' | 'neutral' };
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
      signal: 'bullish' | 'bearish' | 'neutral';
    };
  };
  volumeAnalysis: {
    averageVolume: number;
    volumeRatio: number; // current vs average
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
  };
  priceAction: {
    candlePattern?: string;
    trendStrength: number;
    volatility: number;
  };
}

export interface AIPrediction {
  target: number;
  confidence: number;
  timeframe: string;
  confidenceInterval: {
    lower: number; // 95% CI lower bound
    upper: number; // 95% CI upper bound
  };
  scenarios: {
    bullish: { target: number; probability: number; conditions: string[] };
    base: { target: number; probability: number; conditions: string[] };
    bearish: { target: number; probability: number; conditions: string[] };
  };
  keyFactors: string[];
  riskFactors: string[];
}

export interface ComprehensiveAnalysisResult extends AnalysisResult {
  enhancedAnalysis: EnhancedAnalysis;
  timeframeAnalysis: TimeframeAnalysis;
  tradeSetup: TradeSetup;
  prediction: AIPrediction;
  portfolioImpact?: PortfolioRiskAnalysis;
}

export interface ComprehensiveAnalysis extends AnalysisResult {
  // Fundamental Analysis
  fundamentals?: {
    financials: {
      revenue: { current: number; growth: number; trend: string };
      earnings: { eps: number; growth: number; quality: string };
      margins: { gross: number; operating: number; net: number };
      cashFlow: { free: number; operating: number; quality: string };
    };
    valuation: {
      pe: { current: number; forward: number; sectorAvg: number };
      pb: number;
      ps: number;
      evEbitda: number;
      peg: number;
      fairValue: number;
      upside: number;
    };
    ratios: {
      roe: number;
      roa: number;
      roic: number;
      debtToEquity: number;
      currentRatio: number;
      interestCoverage: number;
    };
    management: {
      ceoTenure: number;
      insiderOwnership: number;
      recentTransactions: string[];
      rating: 'poor' | 'average' | 'good' | 'excellent';
    };
  };
  
  // Enhanced Technical Analysis
  technicalAnalysis?: {
    trend: {
      primary: 'bullish' | 'bearish' | 'neutral';
      strength: number; // 0-100
      stage: 'accumulation' | 'markup' | 'distribution' | 'decline';
    };
    patterns: {
      current: string[];
      forming: string[];
      reliability: number;
    };
    indicators: {
      momentum: { rsi: number; macd: any; stochastic: number };
      trend: { adx: number; aroon: number; ichimoku: string };
      volume: { obv: number; mfi: number; vwap: number };
      volatility: { atr: number; bollingerBands: any; keltner: any };
    };
    levels: {
      support: { s1: number; s2: number; s3: number };
      resistance: { r1: number; r2: number; r3: number };
      pivotPoint: number;
      fibonacci: { [key: string]: number };
    };
  };
  
  // Crypto-specific Analysis
  cryptoMetrics?: {
    onChain: {
      activeAddresses: number;
      transactionVolume: number;
      hashRate?: number;
      difficulty?: number;
      nvt: number; // Network Value to Transactions
      mvrv: number; // Market Value to Realized Value
    };
    tokenomics: {
      circulatingSupply: number;
      totalSupply: number;
      maxSupply?: number;
      inflationRate: number;
      stakingRatio?: number;
      burnRate?: number;
    };
    defi: {
      tvl?: number; // Total Value Locked
      protocols: number;
      yield?: number;
      liquidity: string;
    };
    development: {
      githubActivity: number;
      commits30d: number;
      contributors: number;
      lastUpdate: string;
    };
  };
  
  // Market Environment Context
  marketContext?: {
    macro: {
      inflationRate: number;
      interestRates: number;
      gdpGrowth: number;
      unemploymentRate: number;
      vix: number;
    };
    sector: {
      performance: number;
      ranking: number;
      rotation: 'into' | 'out of' | 'neutral';
      correlation: number;
    };
    sentiment: {
      overall: number; // -100 to 100
      retail: number;
      institutional: number;
      options: { putCallRatio: number; maxPain: number };
      social: { score: number; mentions: number; trend: string };
    };
  };
  
  // Risk Assessment
  riskAssessment?: {
    overall: 'low' | 'medium' | 'high' | 'extreme';
    factors: {
      market: number;
      liquidity: number;
      volatility: number;
      regulatory: number;
      technical: number;
      fundamental: number;
    };
    var: { // Value at Risk
      daily95: number;
      daily99: number;
      monthly95: number;
    };
    scenarios: {
      bullCase: { target: number; probability: number };
      baseCase: { target: number; probability: number };
      bearCase: { target: number; probability: number };
    };
  };
  
  // AI Consensus
  aiConsensus?: {
    claude: { rating: string; confidence: number; reasoning: string };
    perplexity: { rating: string; confidence: number; reasoning: string };
    combined: { 
      action: string; 
      confidence: number; 
      timeframe: string;
      keyFactors: string[];
    };
  };
  
  // Personalized Recommendations
  personalizedStrategy?: {
    allocation: { 
      suggested: number; 
      rationale: string;
      alternatives: Array<{ allocation: number; condition: string }>;
    };
    entry: {
      immediate: { price: number; size: number };
      scaled: Array<{ price: number; size: number }>;
      conditional: Array<{ condition: string; action: string }>;
    };
    exit: {
      targets: Array<{ price: number; percentage: number; reasoning: string }>;
      stopLoss: { price: number; type: 'fixed' | 'trailing' | 'mental' };
      timeBasedExit?: { days: number; reasoning: string };
    };
    hedging?: {
      suggested: boolean;
      instruments: string[];
      cost: number;
      protection: number;
    };
  };
}

export interface AIResponse {
  id: string;
  content: string;
  type: 'text' | 'analysis' | 'comparison' | 'news' | 'data';
  metadata: {
    sources: ServiceProvider[];
    confidence: number;
    dataFreshness: 'real-time' | 'recent' | 'historical';
    processingTime: number;
    classification: ClassifiedQuery;
  };
  marketData?: MarketDataPoint[];
  news?: NewsItem[];
  analysis?: AnalysisResult;
  suggestions?: string[];
  timestamp: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: ServiceProvider;
  timestamp: string;
  rateLimited?: boolean;
}

export interface ChatContext {
  userId?: string;
  sessionId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  preferences?: {
    preferredSources?: string[];
    investorProfile?: PartialInvestorProfile;
  };
  activeAnalyses?: { [key: string]: any };
}

export interface ProcessingStrategy {
  primaryService: ServiceProvider;
  fallbackServices: ServiceProvider[];
  requiresData: boolean;
  requiresAnalysis: boolean;
  maxRetries: number;
  timeout: number;
}

export interface RateLimitConfig {
  requests: number;
  period: number; // in seconds
  provider: ServiceProvider;
}