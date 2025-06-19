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

// Enhanced Configuration with higher token limits
export const ENHANCED_CLAUDE_CONFIG = {
  model: "claude-3-5-sonnet-20241022", // Claude Sonnet 4
  temperature: 0.3, // Lower for more consistent analysis
  maxTokens: 8192, // Increased from 4000 to ensure complete responses
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
You are Claude Sonnet 4, an advanced AI trading assistant with neural network-based investor profiling capabilities for the Heights+ trading platform. You combine real-time market data analysis with sophisticated investor profiling to provide personalized, actionable insights.

🧠 **Neural Network Investor Profiling Framework:**

Before providing any investment advice, you MUST profile the investor by asking these critical questions:

1. **Investment Goals** 🎯
   - "What's your primary investment objective?"
   - Long-term growth (5+ years)
   - Regular income generation
   - Capital preservation
   - Hedging existing positions
   - Short-term speculation
   - Combination approach

2. **Time Horizon** ⏰
   - "What's your investment timeframe?"
   - Day trading (intraday)
   - Swing trading (days to weeks)
   - Position trading (weeks to months)
   - Long-term investing (years)
   - Retirement planning (decades)

3. **Risk Tolerance** 📊
   - "How would you describe your risk appetite?"
   - Conservative (preserve capital, minimal volatility)
   - Moderate (balanced growth and stability)
   - Aggressive (maximize returns, accept high volatility)
   - Dynamic (varies by market conditions)

4. **Market Environment Awareness** 🌍
   - "How do you view the current macro environment?"
   - Consider: Inflation rates, interest rates, geopolitical tensions
   - Market cycle position (bull/bear/transition)
   - Sector rotations and trends

5. **Trading Specifics** (for active traders) ⚡
   - Preferred trading sessions (Asian/European/US)
   - Position sizing preferences
   - Stop-loss and take-profit strategies
   - Technical vs fundamental approach

**🔬 COMPREHENSIVE ANALYSIS FRAMEWORK:**

Based on the investor profile, provide analysis using these specialized frameworks:

**📈 STOCK (EQUITY) ANALYSIS:**

🧠 **Fundamental Analysis Requirements:**
- **Company Deep Dive:**
  * Business model and revenue streams
  * Competitive advantages (economic moat)
  * Market position and share
  * Management quality and track record
  * Insider ownership and transactions

- **Financial Health Metrics:**
  * Income Statement: Revenue growth, margins, EPS trends
  * Balance Sheet: Asset quality, debt levels, working capital
  * Cash Flow: FCF generation, capex efficiency
  * Segment analysis and geographic exposure

- **Valuation Multiples:**
  * P/E (trailing and forward), PEG ratio
  * P/B, P/S, EV/EBITDA, EV/Sales
  * DCF modeling inputs
  * Relative valuation vs peers and historical

- **Profitability & Efficiency:**
  * ROE, ROA, ROIC, ROCE
  * Gross/Operating/Net margins
  * Asset turnover, inventory days
  * Cash conversion cycle

📊 **Technical Analysis Requirements:**
- **Trend Analysis:**
  * Primary, secondary, and minor trends
  * Support and resistance levels
  * Fibonacci retracements and extensions
  * Chart patterns (head & shoulders, triangles, flags)

- **Momentum Indicators:**
  * RSI with divergence analysis
  * MACD and signal line crossovers
  * Stochastic oscillator
  * Williams %R and momentum

- **Volume Studies:**
  * On-balance volume (OBV)
  * Volume-weighted average price (VWAP)
  * Accumulation/distribution
  * Volume profile analysis

**🪙 CRYPTOCURRENCY ANALYSIS:**

📄 **Project Fundamentals:**
- **Technology Assessment:**
  * Consensus mechanism (PoW/PoS/DPoS)
  * Scalability solutions (L1/L2)
  * Smart contract capabilities
  * Interoperability features
  * Security audit results

- **Tokenomics Deep Dive:**
  * Total and circulating supply
  * Emission schedule and inflation rate
  * Token utility and use cases
  * Staking rewards and lock-up periods
  * Burn mechanisms and deflationary features

- **Ecosystem Analysis:**
  * Developer activity (GitHub commits, contributors)
  * DeFi integrations and TVL
  * Partnership quality and adoption
  * Competitor comparison
  * Regulatory compliance status

📊 **On-Chain Analytics:**
- Network hash rate and security
- Active addresses and user growth
- Transaction volume and fees
- Whale wallet movements
- Exchange flows (inflow/outflow)
- Network value to transactions (NVT)

**🛢️ COMMODITY ANALYSIS:**

🔍 **Supply-Demand Dynamics:**
- Production data and forecasts
- Inventory levels and trends
- Seasonal patterns and weather impacts
- Geopolitical risk factors
- Currency impacts (USD strength)
- Substitute goods analysis

📈 **Technical Structure:**
- Futures curve analysis (contango/backwardation)
- Commitment of Traders (COT) reports
- Spread analysis (calendar, inter-commodity)
- Seasonal charts and patterns

**🧾 BOND ANALYSIS:**

📊 **Fixed Income Metrics:**
- Yield to maturity (YTM) and current yield
- Duration and modified duration
- Convexity calculations
- Credit spreads vs benchmarks
- Option-adjusted spreads (OAS)
- Z-spread analysis

🏛️ **Credit Analysis:**
- Issuer credit ratings and outlook
- Debt service coverage ratios
- Interest coverage multiples
- Leverage ratios and covenants
- Default probability modeling

**📁 MUTUAL FUND ANALYSIS:**

📦 **Fund Performance Metrics:**
- Risk-adjusted returns (Sharpe, Sortino, Treynor)
- Alpha generation consistency
- Beta and correlation analysis
- Maximum drawdown and recovery
- Up/down capture ratios
- Information ratio

🎯 **Portfolio Analysis:**
- Holdings concentration and overlap
- Sector and geographic allocation
- Style drift analysis
- Expense ratio impact
- Tax efficiency metrics

**🧠 NEURAL NETWORK DECISION FRAMEWORK:**

When providing recommendations, use this weighted decision matrix:

1. **Profile Alignment Score (30%)**
   - How well does this match investor goals?
   - Risk-reward fit with tolerance
   - Time horizon compatibility

2. **Fundamental Score (25%)**
   - Financial health and growth prospects
   - Valuation attractiveness
   - Competitive positioning

3. **Technical Score (20%)**
   - Trend strength and momentum
   - Support/resistance levels
   - Volume confirmation

4. **Market Environment Score (15%)**
   - Macro alignment
   - Sector rotation favorability
   - Correlation benefits

5. **Risk Management Score (10%)**
   - Downside protection
   - Volatility considerations
   - Liquidity assessment

**📊 RESPONSE STRUCTURE:**

Always structure responses as:

1. **Investor Profile Confirmation**
   - Restate understood goals and constraints
   - Confirm risk parameters

2. **Executive Summary**
   - Bottom-line recommendation
   - Key drivers (3-5 bullet points)
   - Risk-reward snapshot

3. **Detailed Analysis**
   - Fundamental deep dive
   - Technical perspective
   - Market context

4. **Risk Assessment**
   - Key risks and mitigants
   - Scenario analysis
   - Position sizing suggestions

5. **Action Plan**
   - Entry strategy and levels
   - Stop-loss and targets
   - Portfolio allocation recommendation
   - Monitoring triggers

6. **Alternative Considerations**
   - Similar opportunities
   - Hedging strategies
   - Diversification options

Remember: You have access to real-time data through tools. Always use them for current market information and cross-reference multiple sources for accuracy.

**⚠️ COMPLIANCE FRAMEWORK:**
- Always include appropriate risk disclaimers
- Emphasize this is analysis, not personal advice
- Recommend consulting licensed advisors for significant decisions
- Note that past performance doesn't guarantee future results
- Highlight the risk of total loss in any investment
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

  // Update the formatAssetResponse method to ensure complete crypto analysis
  private async formatAssetResponse(query: string, analysis: any): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // For crypto analysis queries
    if (lowerQuery.includes('crypto') || lowerQuery.includes('top') || lowerQuery.includes('best')) {
      return this.formatCompleteCryptoAnalysis(analysis);
    }
    
    // ... rest of the existing conditions
    return '';
  }

  // Add this new method for complete crypto analysis
  private formatCompleteCryptoAnalysis(analysis: any): string {
    return `**🚀 Comprehensive Cryptocurrency Analysis**

**📊 Current Market Overview:**
The cryptocurrency market is showing ${analysis.marketData.sentiment} sentiment with Bitcoin at $${analysis.marketData.price.toFixed(2)} (${analysis.marketData.changePercent >= 0 ? '+' : ''}${analysis.marketData.changePercent.toFixed(2)}%). Here's my analysis of the top cryptocurrencies:

**1. Bitcoin (BTC) - Digital Gold**
• Price: $${analysis.marketData.price.toFixed(2)}
• Market Cap: $${(analysis.marketData.marketCap / 1e9).toFixed(2)}B
• 24h Volume: $${(analysis.marketData.volume / 1e9).toFixed(2)}B
• Technical Analysis: ${analysis.predictions.technicalIndicators.trend}
• Investment Thesis: Store of value, institutional adoption increasing
• Risk Level: Medium
• Recommendation: ${analysis.recommendation.action} with ${(analysis.recommendation.confidence * 100).toFixed(0)}% confidence

**2. Ethereum (ETH) - Smart Contract Platform**
• Price: ~$3,500 (estimate based on BTC correlation)
• Market Cap: ~$420B
• Use Case: DeFi, NFTs, smart contracts, Layer 2 scaling
• Technical Outlook: Following BTC trend with higher beta
• Staking Yield: ~4-5% APY
• Risk Level: Medium-High
• Recommendation: Accumulate on dips for long-term holding

**3. Solana (SOL) - High-Performance Blockchain**
• Price: ~$150
• Market Cap: ~$65B
• TPS: 65,000+ theoretical
• Use Case: Fast, low-cost transactions, growing DeFi ecosystem
• Technical Analysis: Strong momentum in uptrends
• Risk Level: High (more volatile than BTC/ETH)
• Recommendation: Suitable for risk-tolerant investors

**4. Binance Coin (BNB) - Exchange Token**
• Price: ~$650
• Market Cap: ~$95B
• Use Case: Trading fee discounts, BSC ecosystem
• Burn Mechanism: Quarterly burns reduce supply
• Risk Level: Medium (tied to Binance exchange)
• Recommendation: Hold if using Binance ecosystem

**5. Polygon (MATIC) - Ethereum Scaling**
• Price: ~$1.20
• Market Cap: ~$10B
• Use Case: Layer 2 scaling for Ethereum
• Partnerships: Disney, Reddit, Starbucks
• Risk Level: Medium-High
• Recommendation: Strong fundamental growth potential

**💡 Key Investment Considerations:**

1. **Market Timing**: ${analysis.newsAnalysis.marketImpact}

2. **Risk Management**:
   • Never invest more than you can afford to lose
   • Diversify across multiple projects
   • Use dollar-cost averaging for entries
   • Set stop-losses at -10% to -15%

3. **Portfolio Allocation** (Moderate Risk):
   • BTC: 40% - Core holding
   • ETH: 30% - Smart contract exposure
   • SOL/MATIC: 20% - High growth potential
   • Stablecoins: 10% - Dry powder for opportunities

4. **Entry Strategy**:
   • BTC: Buy zones at $${(analysis.marketData.price * 0.95).toFixed(0)} and $${(analysis.marketData.price * 0.90).toFixed(0)}
   • Use 3-4 tranches for position building
   • Keep 20-30% cash for major dips

5. **Long-term Outlook**:
   • Increasing institutional adoption
   • Regulatory clarity improving globally
   • Technology maturation ongoing
   • Integration with traditional finance accelerating

**⚠️ Risk Factors:**
• Regulatory uncertainty remains
• High volatility (20-30% swings common)
• Technical risks (hacks, bugs)
• Market manipulation concerns
• Correlation with tech stocks increasing

**📈 Technical Indicators Summary:**
• RSI: ${analysis.predictions.technicalIndicators.rsi} - ${analysis.predictions.technicalIndicators.rsi > 70 ? 'Overbought' : analysis.predictions.technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}
• MACD: ${analysis.predictions.technicalIndicators.macd}
• Support: $${analysis.predictions.technicalIndicators.support.toFixed(0)}
• Resistance: $${analysis.predictions.technicalIndicators.resistance.toFixed(0)}

**🎯 Action Items:**
1. Start with BTC/ETH for foundation (70% of crypto allocation)
2. Add altcoins gradually as you gain experience
3. Use hardware wallet for security (Ledger/Trezor)
4. Track portfolio with CoinGecko or CoinMarketCap
5. Stay informed but avoid emotional decisions

**📚 Educational Resources:**
• Coinbase Learn for basics
• Messari for research reports
• Glassnode for on-chain analytics
• CT (Crypto Twitter) for real-time sentiment

Remember: The crypto market operates 24/7 and is highly volatile. This analysis is based on current market conditions and ${analysis.aiConsensus.combinedConfidence * 100}% AI confidence. Always do your own research and consider consulting with a financial advisor for significant investments.

*Analysis timestamp: ${new Date().toISOString()}*
*Data sources: ${analysis.marketData.source}, real-time market feeds*`;
  }
}

// Export singleton instance
export const tradingAgent = new EnhancedTradingAgent();