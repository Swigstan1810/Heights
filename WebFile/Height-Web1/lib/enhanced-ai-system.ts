// lib/enhanced-ai-system-v2.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPerplexity } from "@langchain/community/chat_models/perplexity";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Enhanced Types for Financial Analysis
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
}

export interface NewsAnalysis {
  headlines: NewsItem[];
  marketImpact: string;
  sentimentScore: number;
  keyEvents: string[];
  tradingSignals: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  relevanceScore: number;
}

export interface PredictionMetrics {
  shortTerm: {
    direction: 'up' | 'down' | 'sideways';
    targetPrice: number;
    confidence: number;
    timeframe: string;
    reasoning: string[];
  };
  longTerm: {
    direction: 'up' | 'down' | 'sideways';
    targetPrice: number;
    confidence: number;
    timeframe: string;
    reasoning: string[];
  };
  technicalIndicators: {
    rsi: number;
    macd: string;
    movingAverages: string;
    support: number;
    resistance: number;
    trend: string;
  };
  riskMetrics: {
    volatility: number;
    riskLevel: 'low' | 'medium' | 'high';
    stopLoss: number;
    takeProfit: number;
  };
}

export interface ComprehensiveAnalysis {
  asset: string;
  timestamp: Date;
  marketData: MarketData;
  newsAnalysis: NewsAnalysis;
  predictions: PredictionMetrics;
  recommendation: {
    action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    reasoning: string;
    entryPoints: number[];
    exitPoints: number[];
  };
  aiConsensus: {
    perplexityView: string;
    claudeView: string;
    combinedConfidence: number;
  };
}

// AI Configuration
const AI_CONFIG = {
  claude: {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.3,
    maxTokens: 4000,
  },
  perplexity: {
    model: "llama-3.1-sonar-large-128k-online",
    temperature: 0.2,
    maxTokens: 4000,
  }
};

// Initialize AI Models
const claude = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  ...AI_CONFIG.claude
});

const perplexity = new ChatPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  ...AI_CONFIG.perplexity
});

// Enhanced Perplexity Data Fetcher
export class PerplexityMarketDataService {
  async fetchRealtimeData(symbol: string): Promise<MarketData> {
    const query = `
      Get real-time market data for ${symbol}:
      - Current price and 24h change
      - Trading volume and market cap
      - High/low prices
      - Recent price movements
      - Market sentiment
      Provide specific numbers and percentages.
    `;

    try {
      const response = await perplexity.invoke([
        new SystemMessage("You are a financial data provider. Always return specific numbers and real-time data."),
        new HumanMessage(query)
      ]);

      return this.parseMarketData(response.content as string, symbol);
    } catch (error) {
      console.error('Perplexity data fetch error:', error);
      throw error;
    }
  }

  async fetchLatestNews(symbol: string): Promise<NewsAnalysis> {
    const query = `
      Get the latest news for ${symbol} from the last 24-48 hours:
      - Breaking news and headlines
      - Market moving events
      - Analyst updates and price targets
      - Social sentiment and trends
      - Regulatory or company announcements
      Focus on actionable, market-impacting information.
    `;

    try {
      const response = await perplexity.invoke([
        new SystemMessage("You are a financial news analyst. Provide current, factual news with market impact assessment."),
        new HumanMessage(query)
      ]);

      return this.parseNewsAnalysis(response.content as string);
    } catch (error) {
      console.error('Perplexity news fetch error:', error);
      throw error;
    }
  }

  private parseMarketData(content: string, symbol: string): MarketData {
    // Extract numbers from Perplexity response
    const priceMatch = content.match(/\$?([\d,]+\.?\d*)/);
    const changeMatch = content.match(/([+-]?\d+\.?\d*)%/);
    const volumeMatch = content.match(/volume[:\s]*([\d,]+(?:\.\d+)?[MBK]?)/i);
    
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
    const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;
    
    // Determine sentiment
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (content.toLowerCase().includes('bullish') || changePercent > 2) sentiment = 'bullish';
    else if (content.toLowerCase().includes('bearish') || changePercent < -2) sentiment = 'bearish';

    return {
      symbol,
      price,
      change24h: price * (changePercent / 100),
      changePercent,
      volume: this.parseVolume(volumeMatch?.[1] || '0'),
      marketCap: this.extractMarketCap(content),
      high24h: price * 1.02, // Estimate if not found
      low24h: price * 0.98,
      sentiment,
      timestamp: new Date().toISOString()
    };
  }

  private parseNewsAnalysis(content: string): NewsAnalysis {
    // Parse news from Perplexity response
    const headlines: NewsItem[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const headline = line.replace(/^[-•]\s*/, '').trim();
        if (headline.length > 10) {
          headlines.push({
            title: headline,
            summary: headline,
            source: 'Market Analysis',
            publishedAt: new Date().toISOString(),
            sentiment: this.analyzeSentiment(headline),
            impact: this.assessImpact(headline),
            relevanceScore: 0.85
          });
        }
      }
    });

    const sentimentScore = this.calculateOverallSentiment(headlines);
    
    return {
      headlines: headlines.slice(0, 10),
      marketImpact: this.assessMarketImpact(content),
      sentimentScore,
      keyEvents: this.extractKeyEvents(content),
      tradingSignals: this.extractTradingSignals(content)
    };
  }

  private parseVolume(volumeStr: string): number {
    const multipliers: Record<string, number> = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000
    };
    
    const match = volumeStr.match(/^([\d.]+)([KMB])?$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2]?.toUpperCase();
    
    return unit ? value * multipliers[unit] : value;
  }

  private extractMarketCap(content: string): number {
    const match = content.match(/market\s*cap[:\s]*([\d.]+)\s*([KMBT])/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const multipliers: Record<string, number> = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000,
      'T': 1000000000000
    };
    
    return value * (multipliers[match[2].toUpperCase()] || 1);
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positive = ['surge', 'rally', 'gain', 'breakthrough', 'record', 'growth', 'bullish'];
    const negative = ['crash', 'plunge', 'fall', 'decline', 'concern', 'risk', 'bearish'];
    
    const lowerText = text.toLowerCase();
    const posCount = positive.filter(word => lowerText.includes(word)).length;
    const negCount = negative.filter(word => lowerText.includes(word)).length;
    
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  private assessImpact(text: string): 'high' | 'medium' | 'low' {
    const highImpactWords = ['breaking', 'major', 'significant', 'crash', 'surge', 'announcement'];
    const lowerText = text.toLowerCase();
    
    if (highImpactWords.some(word => lowerText.includes(word))) return 'high';
    if (text.length > 100) return 'medium';
    return 'low';
  }

  private calculateOverallSentiment(headlines: NewsItem[]): number {
    if (headlines.length === 0) return 0;
    
    const sentimentValues = {
      'positive': 1,
      'neutral': 0,
      'negative': -1
    };
    
    const sum = headlines.reduce((acc, item) => acc + sentimentValues[item.sentiment], 0);
    return sum / headlines.length;
  }

  private assessMarketImpact(content: string): string {
    if (content.includes('significant') || content.includes('major')) {
      return 'High market impact expected due to recent developments';
    }
    return 'Moderate market impact based on current news flow';
  }

  private extractKeyEvents(content: string): string[] {
    const events: string[] = [];
    const eventPatterns = [
      /earnings\s+report/i,
      /acquisition/i,
      /partnership/i,
      /regulatory/i,
      /product\s+launch/i
    ];
    
    eventPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        events.push(pattern.source.replace(/\\/g, '').replace(/i$/, ''));
      }
    });
    
    return events;
  }

  private extractTradingSignals(content: string): string[] {
    const signals: string[] = [];
    
    if (content.includes('buy') || content.includes('bullish')) {
      signals.push('Bullish sentiment detected');
    }
    if (content.includes('sell') || content.includes('bearish')) {
      signals.push('Bearish sentiment detected');
    }
    if (content.includes('support') || content.includes('resistance')) {
      signals.push('Key technical levels identified');
    }
    
    return signals;
  }
}

// Enhanced Claude Analysis Engine
export class ClaudeAnalysisEngine {
  async generatePredictions(
    symbol: string, 
    marketData: MarketData, 
    newsAnalysis: NewsAnalysis
  ): Promise<PredictionMetrics> {
    const prompt = `
    Analyze ${symbol} and provide detailed predictions:
    
    Current Market Data:
    - Price: $${marketData.price}
    - 24h Change: ${marketData.changePercent}%
    - Volume: ${marketData.volume}
    - Market Sentiment: ${marketData.sentiment}
    
    Recent News Impact:
    ${newsAnalysis.headlines.map(h => `- ${h.title} (${h.sentiment})`).join('\n')}
    
    Provide:
    1. Short-term prediction (1-7 days) with specific price target
    2. Long-term prediction (1-6 months) with price target
    3. Technical indicators assessment
    4. Risk metrics and stop-loss/take-profit levels
    5. Confidence levels for each prediction
    
    Be specific with numbers and reasoning.
    `;

    try {
      const response = await claude.invoke([
        new SystemMessage("You are an expert financial analyst. Provide specific, data-driven predictions."),
        new HumanMessage(prompt)
      ]);

      return this.parsePredictions(response.content as string, marketData.price);
    } catch (error) {
      console.error('Claude prediction error:', error);
      throw error;
    }
  }

  async compareAndValidate(
    symbol: string,
    perplexityData: string,
    claudePrediction: PredictionMetrics
  ): Promise<ComprehensiveAnalysis['aiConsensus']> {
    const prompt = `
    Compare these two analyses for ${symbol}:
    
    PERPLEXITY REAL-TIME DATA:
    ${perplexityData}
    
    CLAUDE PREDICTIONS:
    Short-term: ${claudePrediction.shortTerm.direction} to $${claudePrediction.shortTerm.targetPrice}
    Long-term: ${claudePrediction.longTerm.direction} to $${claudePrediction.longTerm.targetPrice}
    
    Provide:
    1. Areas of agreement and disagreement
    2. Combined confidence score (0-100%)
    3. Final synthesized recommendation
    `;

    const response = await claude.invoke([new HumanMessage(prompt)]);
    
    return this.parseConsensus(response.content as string);
  }

  private parsePredictions(content: string, currentPrice: number): PredictionMetrics {
    // Extract short-term prediction
    const shortTermMatch = content.match(/short[- ]?term.*?(\$?[\d,]+\.?\d*)/i);
    const shortTermPrice = shortTermMatch 
      ? parseFloat(shortTermMatch[1].replace(/[$,]/g, '')) 
      : currentPrice * 1.05;

    // Extract long-term prediction
    const longTermMatch = content.match(/long[- ]?term.*?(\$?[\d,]+\.?\d*)/i);
    const longTermPrice = longTermMatch 
      ? parseFloat(longTermMatch[1].replace(/[$,]/g, '')) 
      : currentPrice * 1.15;

    // Extract RSI
    const rsiMatch = content.match(/RSI[:\s]*(\d+)/i);
    const rsi = rsiMatch ? parseInt(rsiMatch[1]) : 50;

    // Extract support/resistance
    const supportMatch = content.match(/support[:\s]*\$?([\d,]+\.?\d*)/i);
    const resistanceMatch = content.match(/resistance[:\s]*\$?([\d,]+\.?\d*)/i);
    
    const support = supportMatch 
      ? parseFloat(supportMatch[1].replace(/,/g, '')) 
      : currentPrice * 0.95;
    
    const resistance = resistanceMatch 
      ? parseFloat(resistanceMatch[1].replace(/,/g, '')) 
      : currentPrice * 1.05;

    // Determine directions
    const shortTermDirection = shortTermPrice > currentPrice ? 'up' : shortTermPrice < currentPrice ? 'down' : 'sideways';
    const longTermDirection = longTermPrice > currentPrice ? 'up' : longTermPrice < currentPrice ? 'down' : 'sideways';

    // Calculate risk metrics
    const volatility = Math.abs(shortTermPrice - currentPrice) / currentPrice;
    const riskLevel = volatility > 0.1 ? 'high' : volatility > 0.05 ? 'medium' : 'low';

    return {
      shortTerm: {
        direction: shortTermDirection,
        targetPrice: shortTermPrice,
        confidence: this.extractConfidence(content, 'short'),
        timeframe: '1-7 days',
        reasoning: this.extractReasons(content, 'short')
      },
      longTerm: {
        direction: longTermDirection,
        targetPrice: longTermPrice,
        confidence: this.extractConfidence(content, 'long'),
        timeframe: '1-6 months',
        reasoning: this.extractReasons(content, 'long')
      },
      technicalIndicators: {
        rsi,
        macd: this.extractMACD(content),
        movingAverages: this.extractMA(content),
        support,
        resistance,
        trend: this.extractTrend(content)
      },
      riskMetrics: {
        volatility,
        riskLevel,
        stopLoss: support * 0.98,
        takeProfit: resistance * 1.02
      }
    };
  }

  private extractConfidence(content: string, term: 'short' | 'long'): number {
    const pattern = new RegExp(`${term}[- ]?term.*?confidence.*?(\\d+)%`, 'i');
    const match = content.match(pattern);
    
    if (match) {
      return parseInt(match[1]) / 100;
    }
    
    // Default confidence based on content sentiment
    return content.toLowerCase().includes('strong') ? 0.8 : 0.65;
  }

  private extractReasons(content: string, term: 'short' | 'long'): string[] {
    const reasons: string[] = [];
    const section = content.toLowerCase().indexOf(`${term}-term`);
    
    if (section !== -1) {
      const sectionText = content.substring(section, section + 500);
      const sentences = sectionText.split(/[.!]/);
      
      sentences.forEach(sentence => {
        if (sentence.includes('because') || sentence.includes('due to') || sentence.includes('based on')) {
          reasons.push(sentence.trim());
        }
      });
    }
    
    return reasons.slice(0, 3);
  }

  private extractMACD(content: string): string {
    if (content.toLowerCase().includes('macd') && content.toLowerCase().includes('bullish')) {
      return 'Bullish crossover';
    } else if (content.toLowerCase().includes('macd') && content.toLowerCase().includes('bearish')) {
      return 'Bearish crossover';
    }
    return 'Neutral';
  }

  private extractMA(content: string): string {
    if (content.includes('above') && content.includes('moving average')) {
      return 'Price above key MAs';
    } else if (content.includes('below') && content.includes('moving average')) {
      return 'Price below key MAs';
    }
    return 'Mixed MA signals';
  }

  private extractTrend(content: string): string {
    const trendWords = {
      uptrend: ['uptrend', 'bullish trend', 'rising', 'climbing'],
      downtrend: ['downtrend', 'bearish trend', 'falling', 'declining'],
      sideways: ['sideways', 'consolidation', 'range-bound', 'flat']
    };
    
    const lowerContent = content.toLowerCase();
    
    for (const [trend, words] of Object.entries(trendWords)) {
      if (words.some(word => lowerContent.includes(word))) {
        return trend;
      }
    }
    
    return 'neutral';
  }

  private parseConsensus(content: string): ComprehensiveAnalysis['aiConsensus'] {
    // Extract confidence
    const confidenceMatch = content.match(/confidence[:\s]*(\d+)%/i);
    const combinedConfidence = confidenceMatch 
      ? parseInt(confidenceMatch[1]) / 100 
      : 0.75;

    // Split views
    const perplexitySection = content.match(/perplexity[:\s]*(.*?)(?=claude|$)/is);
    const claudeSection = content.match(/claude[:\s]*(.*?)(?=combined|$)/is);

    return {
      perplexityView: perplexitySection ? perplexitySection[1].trim() : 'Real-time data analysis',
      claudeView: claudeSection ? claudeSection[1].trim() : 'Technical and fundamental analysis',
      combinedConfidence
    };
  }
}

// Main Financial Analyst System
export class UltimateFinancialAnalyst {
  private perplexityService: PerplexityMarketDataService;
  private claudeEngine: ClaudeAnalysisEngine;

  constructor() {
    this.perplexityService = new PerplexityMarketDataService();
    this.claudeEngine = new ClaudeAnalysisEngine();
  }

  async analyzeAsset(
    symbol: string,
    options: {
      includeNews?: boolean;
      deepAnalysis?: boolean;
    } = {}
  ): Promise<ComprehensiveAnalysis> {
    const { includeNews = true, deepAnalysis = true } = options;

    try {
      console.log(`🚀 Starting ultimate analysis for ${symbol}...`);

      // Step 1: Get real-time data from Perplexity
      console.log('📊 Fetching real-time market data...');
      const marketData = await this.perplexityService.fetchRealtimeData(symbol);

      // Step 2: Get latest news from Perplexity
      console.log('📰 Analyzing latest news...');
      const newsAnalysis = includeNews 
        ? await this.perplexityService.fetchLatestNews(symbol)
        : this.getEmptyNewsAnalysis();

      // Step 3: Generate predictions with Claude
      console.log('🤖 Generating AI predictions...');
      const predictions = await this.claudeEngine.generatePredictions(
        symbol,
        marketData,
        newsAnalysis
      );

      // Step 4: Create consensus between both AIs
      console.log('🔄 Building AI consensus...');
      const aiConsensus = deepAnalysis
        ? await this.claudeEngine.compareAndValidate(
            symbol,
            JSON.stringify({ marketData, newsAnalysis }),
            predictions
          )
        : this.getDefaultConsensus();

      // Step 5: Generate final recommendation
      const recommendation = this.generateRecommendation(
        marketData,
        newsAnalysis,
        predictions,
        aiConsensus
      );

      console.log('✅ Analysis complete!');

      return {
        asset: symbol,
        timestamp: new Date(),
        marketData,
        newsAnalysis,
        predictions,
        recommendation,
        aiConsensus
      };

    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Failed to analyze ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateRecommendation(
    marketData: MarketData,
    newsAnalysis: NewsAnalysis,
    predictions: PredictionMetrics,
    consensus: ComprehensiveAnalysis['aiConsensus']
  ): ComprehensiveAnalysis['recommendation'] {
    // Calculate recommendation based on multiple factors
    let score = 0;
    
    // Market sentiment
    if (marketData.sentiment === 'bullish') score += 2;
    else if (marketData.sentiment === 'bearish') score -= 2;
    
    // News sentiment
    if (newsAnalysis.sentimentScore > 0.3) score += 2;
    else if (newsAnalysis.sentimentScore < -0.3) score -= 2;
    
    // Predictions
    if (predictions.shortTerm.direction === 'up') score += 1;
    else if (predictions.shortTerm.direction === 'down') score -= 1;
    
    if (predictions.longTerm.direction === 'up') score += 2;
    else if (predictions.longTerm.direction === 'down') score -= 2;
    
    // Technical indicators
    if (predictions.technicalIndicators.rsi < 30) score += 1; // Oversold
    else if (predictions.technicalIndicators.rsi > 70) score -= 1; // Overbought
    
    // Determine action
    let action: ComprehensiveAnalysis['recommendation']['action'];
    if (score >= 4) action = 'strong_buy';
    else if (score >= 2) action = 'buy';
    else if (score <= -4) action = 'strong_sell';
    else if (score <= -2) action = 'sell';
    else action = 'hold';
    
    // Calculate entry/exit points
    const entryPoints = [
      marketData.price * 0.99,
      predictions.technicalIndicators.support,
      marketData.low24h
    ].sort((a, b) => a - b);
    
    const exitPoints = [
      predictions.shortTerm.targetPrice,
      predictions.technicalIndicators.resistance,
      marketData.high24h * 1.05
    ].sort((a, b) => b - a);

    return {
      action,
      confidence: consensus.combinedConfidence,
      reasoning: this.generateReasoning(action, marketData, predictions),
      entryPoints: entryPoints.slice(0, 2),
      exitPoints: exitPoints.slice(0, 2)
    };
  }

  private generateReasoning(
    action: string,
    marketData: MarketData,
    predictions: PredictionMetrics
  ): string {
    const reasons = [];
    
    if (action.includes('buy')) {
      reasons.push(`Strong ${predictions.shortTerm.direction} momentum expected`);
      if (predictions.technicalIndicators.rsi < 40) {
        reasons.push('RSI indicates oversold conditions');
      }
      if (marketData.sentiment === 'bullish') {
        reasons.push('Positive market sentiment');
      }
    } else if (action.includes('sell')) {
      reasons.push(`Bearish outlook with ${predictions.shortTerm.direction} pressure`);
      if (predictions.technicalIndicators.rsi > 60) {
        reasons.push('RSI indicates overbought conditions');
      }
      if (marketData.sentiment === 'bearish') {
        reasons.push('Negative market sentiment');
      }
    } else {
      reasons.push('Mixed signals suggest waiting for clearer direction');
      reasons.push(`Current price near fair value at $${marketData.price}`);
    }
    
    return reasons.join('. ');
  }

  private getEmptyNewsAnalysis(): NewsAnalysis {
    return {
      headlines: [],
      marketImpact: 'No recent news available',
      sentimentScore: 0,
      keyEvents: [],
      tradingSignals: []
    };
  }

  private getDefaultConsensus(): ComprehensiveAnalysis['aiConsensus'] {
    return {
      perplexityView: 'Real-time market data analyzed',
      claudeView: 'Technical analysis completed',
      combinedConfidence: 0.75
    };
  }

  // Streaming support for real-time updates
  async *streamAnalysis(
    symbol: string
  ): AsyncGenerator<Partial<ComprehensiveAnalysis>, void, unknown> {
    try {
      // Yield progress updates
      yield { asset: symbol, timestamp: new Date() };

      // Market data
      const marketData = await this.perplexityService.fetchRealtimeData(symbol);
      yield { marketData };

      // News analysis
      const newsAnalysis = await this.perplexityService.fetchLatestNews(symbol);
      yield { newsAnalysis };

      // Predictions
      const predictions = await this.claudeEngine.generatePredictions(
        symbol,
        marketData,
        newsAnalysis
      );
      yield { predictions };

      // Final analysis
      const fullAnalysis = await this.analyzeAsset(symbol);
      yield fullAnalysis;

    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ultimateAnalyst = new UltimateFinancialAnalyst();