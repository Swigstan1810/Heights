// types/ai-types.ts

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
  messageHistory: AIResponse[];
  preferences?: {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentHorizon: 'short' | 'medium' | 'long';
    preferredAssets: AssetType[];
    preferredSources: ServiceProvider[];
  };
  activeAnalyses: Record<string, AnalysisResult>;
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