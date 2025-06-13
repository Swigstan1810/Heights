// lib/enhanced-ai-system.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPerplexity } from "@langchain/community/chat_models/perplexity";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Types for Financial Analysis
export interface FinancialAnalysisResult {
  asset: string;
  timestamp: Date;
  latestNews: NewsAnalysis;
  historicalPerformance: HistoricalAnalysis;
  technicalAnalysis: TechnicalIndicators;
  marketSentiment: SentimentAnalysis;
  predictions: PredictionAnalysis;
  recommendation: InvestmentRecommendation;
  metadata: AnalysisMetadata;
}

export interface NewsAnalysis {
  summary: string;
  headlines: NewsItem[];
  impactAssessment: string;
  keyEvents: string[];
}

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  summary: string;
  url?: string;
}

export interface HistoricalAnalysis {
  timeframe: string;
  priceRange: { low: number; high: number };
  volatility: number;
  majorEvents: HistoricalEvent[];
  trendAnalysis: string;
  performanceMetrics: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio?: number;
    maxDrawdown: number;
  };
}

export interface HistoricalEvent {
  date: Date;
  event: string;
  priceImpact: number;
  category: 'earnings' | 'news' | 'market' | 'regulatory' | 'technical';
}

export interface TechnicalIndicators {
  rsi: { value: number; signal: string };
  macd: { value: number; signal: number; histogram: number; trend: string };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  supportResistance: {
    support: number[];
    resistance: number[];
  };
  patterns: string[];
  volumeAnalysis: string;
  overallSignal: 'bullish' | 'bearish' | 'neutral';
}

export interface SentimentAnalysis {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  sources: {
    news: number;
    social: number;
    analyst: number;
    institutional: number;
  };
  reasoning: string;
}

export interface PredictionAnalysis {
  shortTerm: {
    timeframe: string;
    priceTarget: number;
    confidence: number;
    factors: string[];
  };
  longTerm: {
    timeframe: string;
    priceTarget: number;
    confidence: number;
    factors: string[];
  };
  risks: string[];
  opportunities: string[];
}

export interface InvestmentRecommendation {
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  reasoning: string;
  entryPoints: number[];
  exitPoints: number[];
  stopLoss: number;
  positionSize: string;
  timeHorizon: string;
  riskWarning: string;
}

export interface AnalysisMetadata {
  analyzedBy: string[];
  sources: string[];
  lastUpdated: Date;
  confidence: number;
  dataQuality: 'high' | 'medium' | 'low';
}

// Configuration for both AI models
export const AI_CONFIG = {
  claude: {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.3,
    maxTokens: 4000,
  },
  perplexity: {
    model: "llama-3.1-sonar-large-128k-online", // Best for real-time data
    temperature: 0.2,
    maxTokens: 4000,
  }
};

// Initialize AI models
export const claude = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  ...AI_CONFIG.claude
});

export const perplexity = new ChatPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  model: AI_CONFIG.perplexity.model,
  temperature: AI_CONFIG.perplexity.temperature,
  maxTokens: AI_CONFIG.perplexity.maxTokens,
});

// Enhanced Market Data Tool with Multiple Sources
export class EnhancedMarketDataTool extends Tool {
  name = "enhanced_market_data";
  description = "Fetch comprehensive market data from multiple sources including real-time prices, news, and social sentiment";

  protected async _call(arg: string): Promise<string> {
    const { symbol, dataTypes = ['all'] } = JSON.parse(arg);
    const results: any = {};

    try {
      // Fetch from multiple sources in parallel
      const promises = [];

      if (dataTypes.includes('all') || dataTypes.includes('price')) {
        promises.push(
          this.fetchYahooFinance(symbol),
          this.fetchAlphaVantage(symbol),
          this.fetchPolygon(symbol),
          this.fetchTwelveData(symbol)
        );
      }

      if (dataTypes.includes('all') || dataTypes.includes('news')) {
        promises.push(
          this.fetchNewsAPI(symbol),
          this.fetchBenzinga(symbol),
          this.fetchMarketaux(symbol)
        );
      }

      if (dataTypes.includes('all') || dataTypes.includes('social')) {
        promises.push(
          this.fetchRedditSentiment(symbol),
          this.fetchStocktwits(symbol)
        );
      }

      const allResults = await Promise.allSettled(promises);
      
      // Process results
      allResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          Object.assign(results, result.value);
        }
      });

      return JSON.stringify(results, null, 2);
    } catch (error) {
      console.error('Enhanced market data error:', error);
      return JSON.stringify({ error: error instanceof Error ? error.message : String(error), symbol });
    }
  }

  private async fetchYahooFinance(symbol: string) {
    try {
      const response = await fetch(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,financialData,calendarEvents,recommendationTrend,upgradeDowngradeHistory,earnings,netSharePurchaseActivity,insiderHolders,earningsHistory,earningsTrend,industryTrend,indexTrend,sectorTrend`
      );
      const data = await response.json();
      
      if (data.quoteSummary?.result?.[0]) {
        const result = data.quoteSummary.result[0];
        return {
          yahoo: {
            price: result.price?.regularMarketPrice?.raw,
            dayChange: result.price?.regularMarketChange?.raw,
            dayChangePercent: result.price?.regularMarketChangePercent?.raw,
            volume: result.price?.regularMarketVolume?.raw,
            marketCap: result.price?.marketCap?.raw,
            fiftyTwoWeekHigh: result.summaryDetail?.fiftyTwoWeekHigh?.raw,
            fiftyTwoWeekLow: result.summaryDetail?.fiftyTwoWeekLow?.raw,
            avgVolume: result.summaryDetail?.averageVolume?.raw,
            beta: result.defaultKeyStatistics?.beta?.raw,
            pe: result.summaryDetail?.trailingPE?.raw,
            eps: result.defaultKeyStatistics?.trailingEps?.raw,
            recommendationTrend: result.recommendationTrend?.trend,
            earnings: result.earnings,
          }
        };
      }
    } catch (error) {
      console.error('Yahoo Finance error:', error);
      return null;
    }
  }

  private async fetchAlphaVantage(symbol: string) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) return null;
    
    try {
      const [quote, overview, sentiment] = await Promise.all([
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`),
        fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`),
        fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`)
      ]);

      const [quoteData, overviewData, sentimentData] = await Promise.all([
        quote.json(),
        overview.json(),
        sentiment.json()
      ]);

      return {
        alphaVantage: {
          quote: quoteData['Global Quote'],
          overview: overviewData,
          sentiment: sentimentData.feed?.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Alpha Vantage error:', error);
      return null;
    }
  }

  private async fetchPolygon(symbol: string) {
    if (!process.env.POLYGON_API_KEY) return null;
    
    try {
      const [ticker, news, snapshot] = await Promise.all([
        fetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${process.env.POLYGON_API_KEY}`),
        fetch(`https://api.polygon.io/v2/reference/news?ticker=${symbol}&limit=10&apiKey=${process.env.POLYGON_API_KEY}`),
        fetch(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${process.env.POLYGON_API_KEY}`)
      ]);

      const [tickerData, newsData, snapshotData] = await Promise.all([
        ticker.json(),
        news.json(),
        snapshot.json()
      ]);

      return {
        polygon: {
          ticker: tickerData.results,
          news: newsData.results,
          snapshot: snapshotData.ticker
        }
      };
    } catch (error) {
      console.error('Polygon error:', error);
      return null;
    }
  }

  private async fetchTwelveData(symbol: string) {
    if (!process.env.TWELVE_DATA_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
      );
      const data = await response.json();
      
      return {
        twelveData: data
      };
    } catch (error) {
      console.error('Twelve Data error:', error);
      return null;
    }
  }

  private async fetchNewsAPI(symbol: string) {
    if (!process.env.NEWS_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}`
      );
      const data = await response.json();
      
      return {
        newsApi: data.articles?.slice(0, 10)
      };
    } catch (error) {
      console.error('NewsAPI error:', error);
      return null;
    }
  }

  private async fetchBenzinga(symbol: string) {
    if (!process.env.BENZINGA_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://api.benzinga.com/api/v2/news?symbols=${symbol}&token=${process.env.BENZINGA_API_KEY}`
      );
      const data = await response.json();
      
      return {
        benzinga: data.slice(0, 10)
      };
    } catch (error) {
      console.error('Benzinga error:', error);
      return null;
    }
  }

  private async fetchMarketaux(symbol: string) {
    if (!process.env.MARKETAUX_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://api.marketaux.com/v1/news/all?symbols=${symbol}&filter_entities=true&api_token=${process.env.MARKETAUX_API_KEY}`
      );
      const data = await response.json();
      
      return {
        marketaux: data.data?.slice(0, 10)
      };
    } catch (error) {
      console.error('Marketaux error:', error);
      return null;
    }
  }

  private async fetchRedditSentiment(symbol: string) {
    // Implement Reddit API integration
    // This is a placeholder - you'd need Reddit API credentials
    return null;
  }

  private async fetchStocktwits(symbol: string) {
    try {
      const response = await fetch(
        `https://api.stocktwits.com/api/2/streams/symbol/${symbol}.json`
      );
      const data = await response.json();
      
      return {
        stocktwits: {
          messages: data.messages?.slice(0, 20),
          sentiment: data.sentiment
        }
      };
    } catch (error) {
      console.error('Stocktwits error:', error);
      return null;
    }
  }
}

// Advanced Technical Analysis Tool
export class AdvancedTechnicalAnalysisTool extends Tool {
  name = "advanced_technical_analysis";
  description = "Perform comprehensive technical analysis with multiple indicators and pattern recognition";

  protected async _call(arg: string): Promise<string> {
    const { symbol, interval = '1d', period = 100 } = JSON.parse(arg);
    
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(symbol, interval, period);
      
      // Calculate all technical indicators
      const analysis = {
        symbol,
        interval,
        timestamp: new Date().toISOString(),
        indicators: {
          trend: this.calculateTrendIndicators(historicalData),
          momentum: this.calculateMomentumIndicators(historicalData),
          volatility: this.calculateVolatilityIndicators(historicalData),
          volume: this.calculateVolumeIndicators(historicalData),
        },
        patterns: this.detectPatterns(historicalData),
        fibonacci: this.calculateFibonacci(historicalData),
        pivotPoints: this.calculatePivotPoints(historicalData),
        signal: this.generateCompositeSignal(historicalData)
      };
      
      return JSON.stringify(analysis, null, 2);
    } catch (error) {
      console.error('Technical analysis error:', error);
      return JSON.stringify({ error: error instanceof Error ? error.message : String(error), symbol });
    }
  }

  private async fetchHistoricalData(symbol: string, interval: string, period: number) {
    // Implement fetching from multiple sources
    // This is a placeholder - integrate with real data sources
    return {
      dates: [],
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    };
  }

  private calculateTrendIndicators(data: any) {
    // Implement trend indicators calculation
    return {
      sma: this.calculateSMA(data.close, [20, 50, 200]),
      ema: this.calculateEMA(data.close, [12, 26, 50]),
      adx: this.calculateADX(data),
      ichimoku: this.calculateIchimoku(data),
      supertrend: this.calculateSupertrend(data)
    };
  }

  private calculateMomentumIndicators(data: any) {
    return {
      rsi: this.calculateRSI(data.close, 14),
      macd: this.calculateMACD(data.close),
      stochastic: this.calculateStochastic(data),
      williams: this.calculateWilliamsR(data),
      cci: this.calculateCCI(data),
      mfi: this.calculateMFI(data)
    };
  }

  private calculateVolatilityIndicators(data: any) {
    return {
      bollinger: this.calculateBollingerBands(data.close),
      atr: this.calculateATR(data),
      keltner: this.calculateKeltnerChannels(data),
      donchian: this.calculateDonchianChannels(data)
    };
  }

  private calculateVolumeIndicators(data: any) {
    return {
      obv: this.calculateOBV(data),
      vwap: this.calculateVWAP(data),
      volumeProfile: this.calculateVolumeProfile(data),
      accumulation: this.calculateAccumulationDistribution(data)
    };
  }

  private detectPatterns(data: any) {
    // Implement pattern detection algorithms
    return {
      candlestick: this.detectCandlestickPatterns(data),
      chart: this.detectChartPatterns(data),
      harmonic: this.detectHarmonicPatterns(data)
    };
  }

  // Implement all the calculation methods
  private calculateSMA(data: number[], periods: number[]) {
    return periods.map(period => {
      const sma = [];
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
      return { period, values: sma };
    });
  }

  private calculateEMA(data: number[], periods: number[]) {
    return periods.map(period => {
      const multiplier = 2 / (period + 1);
      const ema = [data[0]];
      
      for (let i = 1; i < data.length; i++) {
        ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
      }
      
      return { period, values: ema };
    });
  }

  private calculateRSI(data: number[], period: number = 14) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const rsi = [];
    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return {
      value: rsi[rsi.length - 1],
      values: rsi,
      overbought: rsi[rsi.length - 1] > 70,
      oversold: rsi[rsi.length - 1] < 30
    };
  }

  private calculateMACD(data: number[]) {
    const ema12 = this.calculateEMA(data, [12])[0].values;
    const ema26 = this.calculateEMA(data, [26])[0].values;
    
    const macd = [];
    const signal = [];
    const histogram = [];
    
    for (let i = 25; i < data.length; i++) {
      macd.push(ema12[i] - ema26[i]);
    }
    
    // Calculate signal line (9-period EMA of MACD)
    const signalEMA = this.calculateEMA(macd, [9])[0].values;
    
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signalEMA[i]);
    }
    
    return {
      macd: macd[macd.length - 1],
      signal: signalEMA[signalEMA.length - 1],
      histogram: histogram[histogram.length - 1],
      values: { macd, signal: signalEMA, histogram }
    };
  }

  // Add all other technical indicator calculations...
  private calculateADX(data: any) { return {}; }
  private calculateIchimoku(data: any) { return {}; }
  private calculateSupertrend(data: any) { return {}; }
  private calculateStochastic(data: any) { return {}; }
  private calculateWilliamsR(data: any) { return {}; }
  private calculateCCI(data: any) { return {}; }
  private calculateMFI(data: any) { return {}; }
  private calculateBollingerBands(data: number[]) { return {}; }
  private calculateATR(data: any) { return {}; }
  private calculateKeltnerChannels(data: any) { return {}; }
  private calculateDonchianChannels(data: any) { return {}; }
  private calculateOBV(data: any) { return {}; }
  private calculateVWAP(data: any) { return {}; }
  private calculateVolumeProfile(data: any) { return {}; }
  private calculateAccumulationDistribution(data: any) { return {}; }
  private detectCandlestickPatterns(data: any) { return []; }
  private detectChartPatterns(data: any) { return []; }
  private detectHarmonicPatterns(data: any) { return []; }
  private calculateFibonacci(data: any) { return {}; }
  private calculatePivotPoints(data: any) { return {}; }
  
  private generateCompositeSignal(data: any) {
    // Implement composite signal generation based on all indicators
    return {
      signal: 'neutral',
      strength: 0.5,
      confidence: 0.7
    };
  }
}

// Financial Analysis Prompt Template
export const FINANCIAL_ANALYSIS_PROMPT = `You are an expert financial analyst AI system. Analyze the provided asset using comprehensive market data and provide detailed insights.

Asset: {asset}
Timeframe: {timeframe}
Current Market Data: {marketData}
Technical Analysis: {technicalData}
News and Sentiment: {newsData}

Provide a comprehensive analysis following this EXACT structure:

1. **LATEST NEWS SUMMARY**
   - Summarize the most recent and relevant news headlines
   - Highlight news that could impact price or sentiment
   - Identify any breaking news or upcoming events
   - Assess the overall news tone and its market implications

2. **HISTORICAL PERFORMANCE OVERVIEW**
   - Review price trends over the specified timeframe
   - Identify key inflection points, rallies, and corrections
   - Analyze causes of major price movements
   - Compare performance to relevant benchmarks
   - Calculate key performance metrics (returns, volatility, Sharpe ratio)

3. **TECHNICAL ANALYSIS**
   - Report on all major technical indicators:
     * RSI: Current value and interpretation
     * MACD: Signal line crossovers and divergences
     * Moving Averages: SMA/EMA positions and trends
     * Support/Resistance: Key price levels
     * Volume Analysis: Trends and anomalies
   - Identify chart patterns and their implications
   - Note if the asset is overbought, oversold, or neutral
   - Provide Fibonacci retracement levels if applicable

4. **CURRENT MARKET SENTIMENT**
   - Assess overall sentiment (bullish/bearish/neutral) with percentage confidence
   - Analyze sentiment from multiple sources:
     * News sentiment analysis
     * Social media trends
     * Analyst ratings and price targets
     * Institutional positioning
   - Identify any sentiment divergences

5. **SHORT-TERM AND LONG-TERM PREDICTIONS**
   - SHORT-TERM (Next {shortTermPeriod}):
     * Price target with confidence level
     * Key factors driving the prediction
     * Potential catalysts
     * Risk factors
   
   - LONG-TERM (Next {longTermPeriod}):
     * Price target with confidence level
     * Fundamental drivers
     * Industry/sector trends
     * Macro factors

6. **INVESTMENT RECOMMENDATION**
   - Clear action: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
   - Detailed reasoning based on all analysis
   - Entry points and price targets
   - Stop-loss levels
   - Position sizing recommendations
   - Time horizon for the recommendation
   - Key risks and mitigation strategies

Include confidence levels (0-100%) for all predictions and assessments.
Provide specific price levels, percentages, and dates where applicable.
End with appropriate risk disclaimers.`;

// Main Financial Analysis Agent
export class FinancialAnalysisAgent {
  private marketDataTool: EnhancedMarketDataTool;
  private technicalAnalysisTool: AdvancedTechnicalAnalysisTool;
  private claudeChain: RunnableSequence;
  private perplexityChain: RunnableSequence;

  constructor() {
    this.marketDataTool = new EnhancedMarketDataTool();
    this.technicalAnalysisTool = new AdvancedTechnicalAnalysisTool();
    
    // Create analysis chains for both models
    const promptTemplate = PromptTemplate.fromTemplate(FINANCIAL_ANALYSIS_PROMPT);
    
    this.claudeChain = RunnableSequence.from([
      promptTemplate,
      claude,
      new StringOutputParser()
    ]);
    
    this.perplexityChain = RunnableSequence.from([
      promptTemplate,
      perplexity,
      new StringOutputParser()
    ]);
  }

  async analyzeAsset(
    asset: string, 
    timeframe: string = '1 year',
    options: {
      usePerplexity?: boolean;
      useClaude?: boolean;
      shortTermPeriod?: string;
      longTermPeriod?: string;
    } = {}
  ): Promise<FinancialAnalysisResult> {
    const {
      usePerplexity = true,
      useClaude = true,
      shortTermPeriod = '1 week',
      longTermPeriod = '6 months'
    } = options;

    try {
      // 1. Gather all market data in parallel
      console.log(`🔍 Analyzing ${asset}...`);
      
      const [marketData, technicalData] = await Promise.all([
        this.marketDataTool.invoke(JSON.stringify({ 
          symbol: asset, 
          dataTypes: ['all'] 
        })),
        this.technicalAnalysisTool.invoke(JSON.stringify({ 
          symbol: asset,
          interval: '1d',
          period: 365
        }))
      ]);

      // 2. Get news and real-time data from Perplexity (it's better for current events)
      let perplexityAnalysis = '';
      if (usePerplexity) {
        console.log('🌐 Fetching real-time data with Perplexity...');
        const perplexityPrompt = `
          Get the latest news and real-time information for ${asset}.
          Focus on:
          1. Breaking news from the last 24-48 hours
          2. Current market sentiment
          3. Recent analyst updates
          4. Social media trends
          5. Any upcoming events or catalysts
          
          Provide specific, factual, and timely information.
        `;
        
        const perplexityResult = await perplexity.invoke([
          new HumanMessage(perplexityPrompt)
        ]);
        perplexityAnalysis = perplexityResult.content as string;
      }

      // 3. Combine all data for comprehensive analysis
      const combinedData = {
        marketData: JSON.parse(marketData),
        technicalData: JSON.parse(technicalData),
        newsData: perplexityAnalysis,
        realTimeContext: new Date().toISOString()
      };

      // 4. Get comprehensive analysis from Claude
      let claudeAnalysis = '';
      if (useClaude) {
        console.log('🤖 Performing deep analysis with Claude...');
        claudeAnalysis = await this.claudeChain.invoke({
          asset,
          timeframe,
          marketData: JSON.stringify(combinedData.marketData, null, 2),
          technicalData: JSON.stringify(combinedData.technicalData, null, 2),
          newsData: perplexityAnalysis || 'No news data available',
          shortTermPeriod,
          longTermPeriod
        });
      }

      // 5. If both models are used, synthesize the results
      let finalAnalysis = claudeAnalysis;
      if (usePerplexity && useClaude) {
        console.log('🔄 Synthesizing insights from both models...');
        const synthesisPrompt = `
          Synthesize these two analyses into a single, comprehensive report:
          
          PERPLEXITY REAL-TIME INSIGHTS:
          ${perplexityAnalysis}
          
          CLAUDE DEEP ANALYSIS:
          ${claudeAnalysis}
          
          Create a unified analysis that combines the real-time insights from Perplexity
          with the deep analytical capabilities of Claude. Ensure no contradictions and
          highlight where both models agree or disagree.
        `;
        
        const synthesisResult = await claude.invoke([
          new HumanMessage(synthesisPrompt)
        ]);
        finalAnalysis = synthesisResult.content as string;
      }

      // 6. Parse and structure the final analysis
      const structuredResult = this.parseAnalysisResult(
        finalAnalysis,
        asset,
        combinedData
      );

      console.log('✅ Analysis complete!');
      return structuredResult;

    } catch (error) {
      console.error('Financial analysis error:', error);
      throw new Error(`Failed to analyze ${asset}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseAnalysisResult(
    analysisText: string,
    asset: string,
    rawData: any
  ): FinancialAnalysisResult {
    // Parse the structured analysis text into the FinancialAnalysisResult format
    // This is a simplified parser - you might want to use more sophisticated parsing
    
    const sections = analysisText.split(/\d+\.\s*\*\*[A-Z\s]+\*\*/);
    
    return {
      asset,
      timestamp: new Date(),
      latestNews: this.parseNewsSection(sections[1] || '', rawData),
      historicalPerformance: this.parseHistoricalSection(sections[2] || '', rawData),
      technicalAnalysis: this.parseTechnicalSection(sections[3] || '', rawData),
      marketSentiment: this.parseSentimentSection(sections[4] || '', rawData),
      predictions: this.parsePredictionsSection(sections[5] || '', rawData),
      recommendation: this.parseRecommendationSection(sections[6] || '', rawData),
      metadata: {
        analyzedBy: ['claude-3.5-sonnet', 'perplexity-llama-3.1'],
        sources: this.extractSources(rawData),
        lastUpdated: new Date(),
        confidence: this.calculateOverallConfidence(analysisText),
        dataQuality: this.assessDataQuality(rawData)
      }
    };
  }

  // Implement all the parsing methods
  private parseNewsSection(text: string, data: any): NewsAnalysis {
    // Extract news items and sentiment from the analysis text
    return {
      summary: this.extractSummary(text),
      headlines: this.extractHeadlines(text, data),
      impactAssessment: this.extractImpactAssessment(text),
      keyEvents: this.extractKeyEvents(text)
    };
  }

  private parseHistoricalSection(text: string, data: any): HistoricalAnalysis {
    return {
      timeframe: this.extractTimeframe(text),
      priceRange: this.extractPriceRange(text, data),
      volatility: this.extractVolatility(text, data),
      majorEvents: this.extractMajorEvents(text),
      trendAnalysis: this.extractTrendAnalysis(text),
      performanceMetrics: this.extractPerformanceMetrics(text, data)
    };
  }

  private parseTechnicalSection(text: string, data: any): TechnicalIndicators {
    return {
      rsi: this.extractRSI(text, data),
      macd: this.extractMACD(text, data),
      movingAverages: this.extractMovingAverages(text, data),
      supportResistance: this.extractSupportResistance(text, data),
      patterns: this.extractPatterns(text),
      volumeAnalysis: this.extractVolumeAnalysis(text),
      overallSignal: this.extractOverallSignal(text)
    };
  }

  private parseSentimentSection(text: string, data: any): SentimentAnalysis {
    return {
      overall: this.extractOverallSentiment(text),
      confidence: this.extractSentimentConfidence(text),
      sources: this.extractSentimentSources(text),
      reasoning: this.extractSentimentReasoning(text)
    };
  }

  private parsePredictionsSection(text: string, data: any): PredictionAnalysis {
    return {
      shortTerm: this.extractShortTermPrediction(text, data),
      longTerm: this.extractLongTermPrediction(text, data),
      risks: this.extractRisks(text),
      opportunities: this.extractOpportunities(text)
    };
  }

  private parseRecommendationSection(text: string, data: any): InvestmentRecommendation {
    return {
      action: this.extractRecommendationAction(text),
      reasoning: this.extractRecommendationReasoning(text),
      entryPoints: this.extractEntryPoints(text, data),
      exitPoints: this.extractExitPoints(text, data),
      stopLoss: this.extractStopLoss(text, data),
      positionSize: this.extractPositionSize(text),
      timeHorizon: this.extractTimeHorizon(text),
      riskWarning: this.extractRiskWarning(text)
    };
  }

  // Implement extraction helper methods
  private extractSummary(text: string): string {
    const summaryMatch = text.match(/summary[:\s]+(.*?)(?=\n\n|\n-|$)/i);
    return summaryMatch ? summaryMatch[1].trim() : text.slice(0, 200);
  }

  private extractHeadlines(text: string, data: any): NewsItem[] {
    // Extract from both text and raw data
    const headlines: NewsItem[] = [];
    
    // Parse from text
    const bulletPoints = text.match(/[-•]\s*(.+)/g) || [];
    bulletPoints.forEach(point => {
      headlines.push({
        title: point.replace(/[-•]\s*/, ''),
        source: 'Analysis',
        publishedAt: new Date(),
        sentiment: this.analyzeSentiment(point),
        relevance: 0.8,
        summary: point
      });
    });
    
    // Add from raw data if available
    if (data.marketData?.newsApi) {
      data.marketData.newsApi.slice(0, 5).forEach((article: any) => {
        headlines.push({
          title: article.title,
          source: article.source.name,
          publishedAt: new Date(article.publishedAt),
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
          relevance: this.calculateRelevance(article.title, data.asset),
          summary: article.description,
          url: article.url
        });
      });
    }
    
    return headlines;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally', 'breakthrough', 'record'];
    const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge', 'concern', 'risk'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateRelevance(text: string, asset: string): number {
    const lowerText = text.toLowerCase();
    const assetLower = asset.toLowerCase();
    
    if (lowerText.includes(assetLower)) return 1.0;
    if (lowerText.includes('market') || lowerText.includes('stock')) return 0.7;
    return 0.5;
  }

  // Implement all other extraction methods...
  private extractImpactAssessment(text: string): string { return ''; }
  private extractKeyEvents(text: string): string[] { return []; }
  private extractTimeframe(text: string): string { return ''; }
  private extractPriceRange(text: string, data: any): any { return { low: 0, high: 0 }; }
  private extractVolatility(text: string, data: any): number { return 0; }
  private extractMajorEvents(text: string): HistoricalEvent[] { return []; }
  private extractTrendAnalysis(text: string): string { return ''; }
  private extractPerformanceMetrics(text: string, data: any): any { return {}; }
  private extractRSI(text: string, data: any): any { return { value: 50, signal: 'neutral' }; }
  private extractMACD(text: string, data: any): any { return {}; }
  private extractMovingAverages(text: string, data: any): any { return {}; }
  private extractSupportResistance(text: string, data: any): any { return { support: [], resistance: [] }; }
  private extractPatterns(text: string): string[] { return []; }
  private extractVolumeAnalysis(text: string): string { return ''; }
  private extractOverallSignal(text: string): 'bullish' | 'bearish' | 'neutral' { return 'neutral'; }
  private extractOverallSentiment(text: string): 'bullish' | 'bearish' | 'neutral' { return 'neutral'; }
  private extractSentimentConfidence(text: string): number { return 0.7; }
  private extractSentimentSources(text: string): any { return {}; }
  private extractSentimentReasoning(text: string): string { return ''; }
  private extractShortTermPrediction(text: string, data: any): any { return {}; }
  private extractLongTermPrediction(text: string, data: any): any { return {}; }
  private extractRisks(text: string): string[] { return []; }
  private extractOpportunities(text: string): string[] { return []; }
  private extractRecommendationAction(text: string): any { return 'hold'; }
  private extractRecommendationReasoning(text: string): string { return ''; }
  private extractEntryPoints(text: string, data: any): number[] { return []; }
  private extractExitPoints(text: string, data: any): number[] { return []; }
  private extractStopLoss(text: string, data: any): number { return 0; }
  private extractPositionSize(text: string): string { return ''; }
  private extractTimeHorizon(text: string): string { return ''; }
  private extractRiskWarning(text: string): string { return 'All investments carry risk. Past performance is not indicative of future results.'; }
  private extractSources(data: any): string[] { return Object.keys(data.marketData || {}); }
  private calculateOverallConfidence(text: string): number { return 0.75; }
  private assessDataQuality(data: any): 'high' | 'medium' | 'low' { return 'high'; }

  // Streaming analysis for real-time updates
  async *streamAnalysis(
    asset: string,
    timeframe: string = '1 year',
    options: any = {}
  ): AsyncGenerator<Partial<FinancialAnalysisResult>, void, unknown> {
    try {
      // Stream updates as data comes in
      yield { asset, timestamp: new Date(), metadata: { analyzedBy: [], sources: [], lastUpdated: new Date(), confidence: 0, dataQuality: 'low' } };

      // Get market data
      const marketData = await this.marketDataTool.invoke(JSON.stringify({ symbol: asset }));
      yield { asset, timestamp: new Date() };

      // Get technical analysis
      const technicalData = await this.technicalAnalysisTool.invoke(JSON.stringify({ symbol: asset }));
      yield { asset, timestamp: new Date() };

      // Get news from Perplexity
      if (options.usePerplexity) {
        const perplexityResult = await perplexity.invoke([
          new HumanMessage(`Get latest news for ${asset}`)
        ]);
        yield { asset, timestamp: new Date() };
      }

      // Final comprehensive analysis
      const finalResult = await this.analyzeAsset(asset, timeframe, options);
      yield finalResult;

    } catch (error) {
      console.error('Streaming analysis error:', error);
      throw error;
    }
  }
}

// Export configured instance
export const financialAnalyst = new FinancialAnalysisAgent();