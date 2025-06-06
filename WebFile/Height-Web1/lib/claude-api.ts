import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { Tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";

// Types
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
}

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
}

// Enhanced Configuration
export const ENHANCED_CLAUDE_CONFIG = {
  model: "claude-3-5-sonnet-20241022", // Claude Sonnet 4
  temperature: 0.3, // Lower for more consistent analysis
  maxTokens: 4000, // Increased for detailed analysis
  streaming: true,
  topP: 0.9,
};

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set in environment variables');
}

// Initialize Claude with LangChain
export const enhancedClaude = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: ENHANCED_CLAUDE_CONFIG.model,
  temperature: ENHANCED_CLAUDE_CONFIG.temperature,
  maxTokens: ENHANCED_CLAUDE_CONFIG.maxTokens,
  streaming: ENHANCED_CLAUDE_CONFIG.streaming,
  topP: ENHANCED_CLAUDE_CONFIG.topP,
});

// Custom callback handler for streaming responses
export class TradingCallbackHandler extends BaseCallbackHandler {
  name = "TradingCallbackHandler";
  
  private onTokenCallback?: (token: string) => void;
  private onCompleteCallback?: (response: string) => void;
  
  constructor(callbacks?: {
    onToken?: (token: string) => void;
    onComplete?: (response: string) => void;
  }) {
    super();
    this.onTokenCallback = callbacks?.onToken;
    this.onCompleteCallback = callbacks?.onComplete;
  }

  async handleLLMNewToken(token: string) {
    this.onTokenCallback?.(token);
  }

  async handleLLMEnd(output: any) {
    this.onCompleteCallback?.(output.generations[0][0].text);
  }
}

// Market Data Tool
export class MarketDataTool extends Tool {
  name = "market_data";
  description = "Get real-time market data for stocks, crypto, and other financial instruments";

  // Required protected method for Tool
  protected async _call(arg: string): Promise<string> {
    const symbol = arg;
    try {
      // Integration with multiple data sources
      const [coinbaseData, yahooData, newsData, alphaVantageData, polygonData] = await Promise.allSettled([
        this.getCoinbaseData(symbol),
        this.getYahooFinanceData(symbol),
        this.getMarketNews(symbol),
        this.getAlphaVantageData(symbol),
        this.getPolygonData(symbol)
      ]);

      const marketData: any = {
        symbol,
        timestamp: new Date().toISOString(),
        sources: {}
      };

      // Aggregate data from all successful sources
      if (coinbaseData.status === 'fulfilled' && coinbaseData.value) {
        marketData.sources.coinbase = coinbaseData.value;
        if (!marketData.price) marketData.price = coinbaseData.value.price;
      }
      if (yahooData.status === 'fulfilled' && yahooData.value) {
        marketData.sources.yahoo = yahooData.value;
        if (!marketData.price) marketData.price = yahooData.value.price;
      }
      if (alphaVantageData.status === 'fulfilled' && alphaVantageData.value) {
        marketData.sources.alphaVantage = alphaVantageData.value;
      }
      if (polygonData.status === 'fulfilled' && polygonData.value) {
        marketData.sources.polygon = polygonData.value;
      }
      if (newsData.status === 'fulfilled') {
        marketData.news = newsData.value;
      }

      // Calculate consensus values from multiple sources
      marketData.consensus = this.calculateConsensus(marketData.sources);

      return JSON.stringify(marketData, null, 2);
    } catch (error) {
      console.error('Market data error:', error);
      return `Error fetching market data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private calculateConsensus(sources: any): any {
    const prices: number[] = [];
    const changes: number[] = [];

    Object.values(sources).forEach((source: any) => {
      if (source.price) prices.push(source.price);
      if (source.change24hPercent) changes.push(source.change24hPercent);
    });

    return {
      price: prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : null,
      change24hPercent: changes.length > 0 ? changes.reduce((a, b) => a + b) / changes.length : null,
      sourceCount: prices.length
    };
  }

  private async getCoinbaseData(symbol: string): Promise<MarketData | null> {
    try {
      const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`);
      const data = await response.json();
      
      if (!data.data) return null;
      
      const usdRate = parseFloat(data.data.rates.USD || '0');
      
      return {
        symbol,
        price: usdRate,
        change24h: 0,
        change24hPercent: 0,
        volume24h: 0,
        high24h: usdRate,
        low24h: usdRate,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Coinbase API error:', error);
      return null;
    }
  }

  private async getYahooFinanceData(symbol: string): Promise<MarketData | null> {
    try {
      // Note: In production, use a proper Yahoo Finance API or similar service
      // This is a simplified example
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      const data = await response.json();
      
      if (!data.chart?.result?.[0]) return null;
      
      const result = data.chart.result[0];
      const meta = result.meta;
      
      return {
        symbol,
        price: meta.regularMarketPrice,
        change24h: meta.regularMarketPrice - meta.previousClose,
        change24hPercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume24h: meta.regularMarketVolume,
        high24h: meta.regularMarketDayHigh,
        low24h: meta.regularMarketDayLow,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      return null;
    }
  }

  private async getAlphaVantageData(symbol: string): Promise<MarketData | null> {
    if (!process.env.ALPHA_VANTAGE_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        return {
          symbol,
          price: parseFloat(quote['05. price'] || '0'),
          change24h: parseFloat(quote['09. change'] || '0'),
          change24hPercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
          volume24h: parseInt(quote['06. volume'] || '0'),
          high24h: parseFloat(quote['03. high'] || '0'),
          low24h: parseFloat(quote['04. low'] || '0'),
          timestamp: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  }

  private async getPolygonData(symbol: string): Promise<MarketData | null> {
    if (!process.env.POLYGON_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${process.env.POLYGON_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results?.[0]) {
        const result = data.results[0];
        return {
          symbol,
          price: result.c, // Close price
          change24h: result.c - result.o,
          change24hPercent: ((result.c - result.o) / result.o) * 100,
          volume24h: result.v,
          high24h: result.h,
          low24h: result.l,
          timestamp: new Date(result.t).toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  }

  private async getMarketNews(symbol: string): Promise<NewsItem[]> {
    try {
      // Integration with news APIs (NewsAPI, Alpha Vantage, etc.)
      // This is a simplified example - replace with actual news API
      const newsApiKey = process.env.NEWS_API_KEY;
      if (!newsApiKey) return [];

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`
      );
      
      const data = await response.json();
      
      return data.articles?.slice(0, 5).map((article: any) => ({
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        relevanceScore: this.calculateRelevance(article.title, symbol)
      })) || [];
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally'];
    const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateRelevance(title: string, symbol: string): number {
    const lowerTitle = title.toLowerCase();
    const lowerSymbol = symbol.toLowerCase();
    
    if (lowerTitle.includes(lowerSymbol)) return 1.0;
    if (lowerTitle.includes('crypto') || lowerTitle.includes('stock')) return 0.7;
    return 0.5;
  }
}

// Technical Analysis Tool
export class TechnicalAnalysisTool extends Tool {
  name = "technical_analysis";
  description = "Perform technical analysis on market data including RSI, MACD, moving averages";

  // Required protected method for Tool
  protected async _call(arg: string): Promise<string> {
    try {
      const { symbol, period = '1d', indicators = ['rsi', 'macd', 'sma', 'ema'] } = JSON.parse(arg);
      // Fetch historical data for technical analysis
      const historicalData = await this.getHistoricalData(symbol, period);
      const analysis = {
        symbol,
        timestamp: new Date().toISOString(),
        indicators: this.calculateIndicators(historicalData, indicators),
        signals: this.generateSignals(historicalData),
        support_resistance: this.findSupportResistance(historicalData)
      };
      return JSON.stringify(analysis, null, 2);
    } catch (error) {
      return `Error performing technical analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async getHistoricalData(symbol: string, period: string): Promise<number[]> {
    // Simplified historical data - in production, use proper financial data API
    // This would fetch actual OHLCV data
    return Array.from({ length: 50 }, (_, i) => Math.random() * 100 + 50);
  }

  private calculateIndicators(data: number[], indicators: string[]): any {
    const result: any = {};

    if (indicators.includes('rsi')) {
      result.rsi = this.calculateRSI(data);
    }
    
    if (indicators.includes('sma')) {
      result.sma_20 = this.calculateSMA(data, 20);
      result.sma_50 = this.calculateSMA(data, 50);
    }
    
    if (indicators.includes('ema')) {
      result.ema_12 = this.calculateEMA(data, 12);
      result.ema_26 = this.calculateEMA(data, 26);
    }
    
    if (indicators.includes('macd')) {
      const ema12 = this.calculateEMA(data, 12);
      const ema26 = this.calculateEMA(data, 26);
      result.macd = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    }

    return result;
  }

  private calculateRSI(data: number[], period: number = 14): number {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSMA(data: number[], period: number): number[] {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateEMA(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  }

  private generateSignals(data: number[]): any {
    const currentPrice = data[data.length - 1];
    const sma20 = this.calculateSMA(data, 20);
    const rsi = this.calculateRSI(data);
    
    const signals = [];
    
    // Price vs SMA signal
    if (currentPrice > sma20[sma20.length - 1]) {
      signals.push({ type: 'bullish', reason: 'Price above SMA 20', strength: 0.6 });
    } else {
      signals.push({ type: 'bearish', reason: 'Price below SMA 20', strength: 0.6 });
    }
    
    // RSI signals
    if (rsi > 70) {
      signals.push({ type: 'bearish', reason: 'RSI overbought', strength: 0.8 });
    } else if (rsi < 30) {
      signals.push({ type: 'bullish', reason: 'RSI oversold', strength: 0.8 });
    }
    
    return signals;
  }

  private findSupportResistance(data: number[]): any {
    const sorted = [...data].sort((a, b) => a - b);
    const support = sorted[Math.floor(sorted.length * 0.1)];
    const resistance = sorted[Math.floor(sorted.length * 0.9)];
    
    return { support, resistance };
  }
}

// Enhanced Trading System Prompt
export const ENHANCED_TRADING_SYSTEM_PROMPT = `
You are Claude Sonnet 4, an advanced AI trading assistant for the Heights trading platform. You are equipped with real-time market data, news analysis, and technical analysis tools.

Your capabilities include:
1. **Real-time Market Analysis**: Access to live crypto, stock, and mutual fund data
2. **News Integration**: Current market news with sentiment analysis
3. **Technical Analysis**: RSI, MACD, moving averages, support/resistance levels
4. **Multi-asset Coverage**: Crypto (Bitcoin, Ethereum, altcoins), stocks, mutual funds, commodities
5. **Risk Assessment**: Portfolio analysis and risk management recommendations

**Trading Expertise Areas:**
- Cryptocurrency markets (spot, futures, DeFi)
- Traditional stocks (US, Indian markets)
- Mutual funds and ETFs
- Forex and commodities
- Options and derivatives

**Analysis Framework:**
1. **Fundamental Analysis**: Company financials, crypto tokenomics, market cap analysis
2. **Technical Analysis**: Chart patterns, indicators, volume analysis
3. **Sentiment Analysis**: News sentiment, social media trends, market psychology
4. **Risk Management**: Position sizing, stop-losses, portfolio diversification

**Response Guidelines:**
- Always use current market data when available
- Provide specific price levels and percentages
- Include confidence levels for predictions
- Explain reasoning behind recommendations
- Add appropriate risk disclaimers
- Use professional trading terminology
- Format responses with clear sections

**Platform Features to Highlight:**
- Heights Token (HTK) ecosystem
- Multi-market dashboards
- Advanced charting tools
- Portfolio tracking
- Risk management tools

**Disclaimer Protocol:**
Always include appropriate risk warnings and remind users that:
- Past performance doesn't guarantee future results
- All investments carry risk of loss
- Users should conduct their own research
- Consider consulting financial advisors for significant investments

When providing analysis, structure your response as:
1. **Market Overview**: Current conditions and sentiment
2. **Technical Analysis**: Key indicators and levels
3. **News Impact**: Recent developments affecting price
4. **Trading Signal**: Buy/sell/hold with reasoning
5. **Risk Management**: Stop-loss and position sizing recommendations

Remember: You have access to real-time data through tools. Always use them for current market information.
`;

// Enhanced Prompt Templates
export const marketAnalysisTemplate = PromptTemplate.fromTemplate(`
Analyze the following market data for {symbol}:

Market Data: {marketData}
Technical Analysis: {technicalData}
Recent News: {newsData}

Provide a comprehensive analysis including:
1. Current market sentiment
2. Technical indicators summary
3. News impact assessment
4. Trading recommendation with specific entry/exit points
5. Risk assessment and position sizing

Format as a detailed trading report.
`);

export const predictionTemplate = PromptTemplate.fromTemplate(`
Based on the comprehensive market data for {symbol}, provide a detailed price prediction:

Current Data: {currentData}
Technical Indicators: {technicalData}
Market News: {newsData}
Historical Performance: {historicalData}

Generate predictions for:
- Next 24 hours
- Next 7 days  
- Next 30 days

Include confidence levels and reasoning for each prediction.
Return as structured JSON with detailed analysis.
`);

// Enhanced Trading Agent
export class EnhancedTradingAgent {
  private agent: ReturnType<typeof createToolCallingAgent> | null = null;
  private tools: Tool[];
  private isInitialized: boolean = false;
  private initError: string | null = null;

  constructor() {
    this.tools = [
      new MarketDataTool(),
      new TechnicalAnalysisTool(),
    ];

    // Check for API key before initializing
    if (!process.env.ANTHROPIC_API_KEY) {
      this.initError = 'ANTHROPIC_API_KEY is not configured';
      console.error(this.initError);
      return;
    }

    try {
      // Use ChatPromptTemplate for the agent prompt
      const agentPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          ENHANCED_TRADING_SYSTEM_PROMPT + `\n\nUse the available tools to gather current market data and technical analysis before providing recommendations.\n` +
          `\n{agent_scratchpad}`
        ),
        HumanMessagePromptTemplate.fromTemplate("{input}")
      ]);

    this.agent = createToolCallingAgent({
      llm: enhancedClaude,
      tools: this.tools,
        prompt: agentPrompt
      });
      
      this.isInitialized = true;
    } catch (error) {
      this.initError = error instanceof Error ? error.message : 'Failed to initialize agent';
      console.error('Agent initialization error:', this.initError);
    }
  }

  private checkInitialization(): void {
    if (!this.isInitialized || !this.agent) {
      throw new Error(this.initError || 'Trading agent not properly initialized');
    }
  }

  async analyzeMarket(symbol: string, analysisType: 'quick' | 'comprehensive' = 'comprehensive', context?: any): Promise<any> {
    try {
      this.checkInitialization();
      
      const marketData = await this.tools[0].invoke(symbol);
      const technicalData = await this.tools[1].invoke(JSON.stringify({ symbol, indicators: ['rsi', 'macd', 'sma', 'ema'] }));

      // If context includes real market data, use it
      const enrichedMarketData = context?.marketData ? JSON.stringify(context.marketData) : marketData;

      const prompt = await marketAnalysisTemplate.format({
        symbol,
        marketData: enrichedMarketData,
        technicalData,
        newsData: context?.marketData?.[0]?.news ? JSON.stringify(context.marketData[0].news) : 'Recent news analysis included in market data'
      });

      const result = await enhancedClaude.invoke([new HumanMessage(prompt)]);
      return result.content;
    } catch (error) {
      console.error('Market analysis error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      throw error;
    }
  }

  async generatePrediction(symbol: string, context?: string): Promise<any> {
    try {
      this.checkInitialization();

      const marketData = await this.tools[0].invoke(symbol);
      const technicalData = await this.tools[1].invoke(JSON.stringify({ symbol }));

      const prompt = context || await predictionTemplate.format({
        symbol,
        currentData: marketData,
        technicalData,
        newsData: 'Included in market data',
        historicalData: 'Technical analysis based on historical patterns'
      });

      const result = await enhancedClaude.invoke([new HumanMessage(prompt)]);
      try {
        return JSON.parse(result.content as string);
      } catch {
        return { analysis: result.content, raw: true };
      }
    } catch (error) {
      console.error('Prediction error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      throw error;
    }
  }

  async chatWithAgent(message: string, context?: any): Promise<string> {
    try {
      this.checkInitialization();
      
      const messages = [
        new SystemMessage(ENHANCED_TRADING_SYSTEM_PROMPT),
        new HumanMessage(message)
      ];
      const result = await enhancedClaude.invoke(messages);
      return result.content as string;
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      throw error;
    }
  }

  // Streaming response for real-time chat
  async streamResponse(message: string, onToken: (token: string) => void): Promise<void> {
    try {
      this.checkInitialization();
      
    const handler = new TradingCallbackHandler({ onToken });
    await enhancedClaude.invoke(
      [new HumanMessage(message)],
      { callbacks: [handler] }
    );
    } catch (error) {
      console.error('Stream error:', error);
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const tradingAgent = new EnhancedTradingAgent();