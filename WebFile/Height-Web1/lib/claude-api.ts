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
      // Fetch from Perplexity-powered API
      const response = await fetch(`/api/market/perplexity?symbols=${symbol}`);
      if (!response.ok) throw new Error('Perplexity API error');
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Perplexity market data error:', error);
      return `Error fetching market data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
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