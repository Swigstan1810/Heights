// lib/services/simplified-ai-orchestrator.ts
import { ultimateAnalyst } from '@/lib/enhanced-ai-system';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPerplexity } from '@langchain/community/chat_models/perplexity';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { 
  AIResponse, 
  ChatContext,
  MarketDataPoint,
  NewsItem,
  AnalysisResult,
} from '@/types/ai-types';
import { confidenceScoringService } from './confidence-scoring-service';
import {
  EnhancedAnalysis,
  TimeframeAnalysis,
  TradeSetup,
  ComprehensiveAnalysisResult
} from '@/types/ai-types';

export class SimplifiedAIOrchestrator {
  private static instance: SimplifiedAIOrchestrator;
  private claude: ChatAnthropic;
  private perplexity: ChatPerplexity;

  private constructor() {
    this.claude = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 4000,
    });
    
    this.perplexity = new ChatPerplexity({
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.2,
      maxTokens: 4000,
    });
  }

  static getInstance(): SimplifiedAIOrchestrator {
    if (!SimplifiedAIOrchestrator.instance) {
      SimplifiedAIOrchestrator.instance = new SimplifiedAIOrchestrator();
    }
    return SimplifiedAIOrchestrator.instance;
  }

  async processQuery(
    query: string, 
    context?: ChatContext,
    options: { 
      usePerplexity?: boolean;
      structured?: boolean;
    } = {}
  ): Promise<AIResponse> {
    const { usePerplexity = true, structured = true } = options;
    const startTime = Date.now();

    try {
      // Detect if query is about a specific asset
      const assetMatch = this.detectAsset(query);
      
      let response: AIResponse;
      
      if (assetMatch && structured) {
        // Use the ultimate analyst for asset-specific queries
        response = await this.processAssetQuery(query, assetMatch);
      } else {
        // Use combined AI approach for general queries
        response = await this.processGeneralQuery(query, context, usePerplexity);
      }
      
      // Ensure complete response
      if (response.type === 'text' || response.type === 'analysis') {
        response.content = await this.ensureCompleteResponse(
          response.content,
          query,
          context
        );
      }
      
      return response;
    } catch (error) {
      console.error('Query processing error:', error);
      return this.createErrorResponse(query, error);
    }
  }

  private async processAssetQuery(query: string, asset: string): Promise<AIResponse> {
    console.log(`🎯 Processing asset query for ${asset}`);
    const startTime = Date.now();
    try {
      // Get comprehensive analysis from ultimate analyst
      const analysis = await ultimateAnalyst.analyzeAsset(asset, {
        includeNews: true,
        deepAnalysis: true
      });

      // Format the response based on query intent
      const formattedResponse = await this.formatAssetResponse(query, analysis);

      // Convert to AIResponse format
      const marketData: MarketDataPoint = {
        symbol: analysis.asset,
        price: analysis.marketData.price,
        change: analysis.marketData.change24h,
        changePercent: analysis.marketData.changePercent,
        volume: analysis.marketData.volume,
        marketCap: analysis.marketData.marketCap,
        high24h: analysis.marketData.high24h,
        low24h: analysis.marketData.low24h,
        timestamp: analysis.marketData.timestamp,
        source: 'perplexity'
      };

      const newsItems: NewsItem[] = analysis.newsAnalysis.headlines.map(h => ({
        ...h,
        url: '#', // Perplexity doesn't provide URLs
      }));

      const technicalIndicators: AnalysisResult['technicalIndicators'] = {
        rsi: analysis.predictions.technicalIndicators.rsi,
        support: analysis.predictions.technicalIndicators.support,
        resistance: analysis.predictions.technicalIndicators.resistance,
      };
      // macd: expects { signal: string, value: number }
      const macdRaw = analysis.predictions.technicalIndicators.macd;
      if (macdRaw) {
        if (typeof macdRaw === 'object' && 'signal' in macdRaw && 'value' in macdRaw) {
          technicalIndicators.macd = macdRaw;
        } else if (typeof macdRaw === 'string') {
          technicalIndicators.macd = { signal: macdRaw, value: 0 };
        }
      }
      // sma: expects { sma20: number, sma50: number }
      const smaRaw = (analysis.predictions.technicalIndicators as any).sma;
      if (smaRaw && typeof smaRaw === 'object' && 'sma20' in smaRaw && 'sma50' in smaRaw) {
        (technicalIndicators as any).sma = smaRaw;
      } else if (typeof analysis.predictions.technicalIndicators.movingAverages === 'string') {
        const maStr = analysis.predictions.technicalIndicators.movingAverages;
        const match20 = maStr.match(/SMA20:(\d+(?:\.\d+)?)/);
        const match50 = maStr.match(/SMA50:(\d+(?:\.\d+)?)/);
        if (match20 && match50) {
          (technicalIndicators as any).sma = { sma20: parseFloat(match20[1]), sma50: parseFloat(match50[1]) };
        }
      }

      const analysisResult: AnalysisResult = {
        symbol: analysis.asset,
        recommendation: analysis.recommendation.action,
        confidence: analysis.recommendation.confidence,
        reasoning: analysis.recommendation.reasoning,
        technicalIndicators,
        priceTargets: {
          short: analysis.predictions.shortTerm.targetPrice,
          medium: (analysis.predictions.shortTerm.targetPrice + analysis.predictions.longTerm.targetPrice) / 2,
          long: analysis.predictions.longTerm.targetPrice
        },
        risks: [`Volatility: ${analysis.predictions.riskMetrics.volatility.toFixed(2)}%`, ...analysis.predictions.shortTerm.reasoning],
        opportunities: analysis.predictions.longTerm.reasoning,
        timeframe: '1-6 months',
        lastUpdated: new Date().toISOString()
      };

      return {
        id: this.generateId(),
        content: formattedResponse,
        type: 'analysis',
        metadata: {
          sources: ['claude', 'perplexity'],
          confidence: analysis.aiConsensus.combinedConfidence,
          dataFreshness: 'real-time',
          processingTime: Date.now() - startTime,
          classification: {
            intent: 'analysis',
            assetType: this.detectAssetType(asset),
            assetSymbol: asset,
            confidence: analysis.aiConsensus.combinedConfidence,
            suggestedServices: ['claude', 'perplexity'],
            parameters: {}
          }
        },
        marketData: [marketData],
        news: newsItems,
        analysis: analysisResult,
        suggestions: this.generateSuggestions(asset, analysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  private async processGeneralQuery(
    query: string, 
    context?: ChatContext,
    usePerplexity: boolean = true
  ): Promise<AIResponse> {
    console.log('💬 Processing general query');

    let perplexityResponse = '';
    let claudeResponse = '';

    // Get real-time context from Perplexity if enabled
    if (usePerplexity) {
      try {
        const perplexityResult = await this.perplexity.invoke([
          new SystemMessage("You are a helpful financial assistant. Provide current, factual information with complete analysis."),
          new HumanMessage(query)
        ]);
        perplexityResponse = perplexityResult.content as string;
      } catch (error) {
        console.error('Perplexity error:', error);
      }
    }

    // Get analysis from Claude with explicit completion instruction
    const claudePrompt = perplexityResponse 
      ? `Based on this current information:\n${perplexityResponse}\n\nUser query: ${query}\n\nProvide a comprehensive response. IMPORTANT: Complete your entire analysis without truncation.`
      : `${query}\n\nProvide a comprehensive response. IMPORTANT: Complete your entire analysis without truncation.`;

    const claudeResult = await this.claude.invoke([
      new SystemMessage(`You are an expert financial analyst. Provide clear, actionable insights. \nCRITICAL: Always complete your full response. Do not truncate or cut off mid-sentence.\nIf discussing multiple points, ensure all points are fully explained.`),
      new HumanMessage(claudePrompt)
    ]);
    claudeResponse = claudeResult.content as string;

    // Ensure we have the complete response
    if (claudeResponse.endsWith('...') || claudeResponse.endsWith('so...')) {
      // Response was truncated, request completion
      const completionResult = await this.claude.invoke([
        new SystemMessage("Continue and complete the previous analysis."),
        new HumanMessage(`Continue from: \"${claudeResponse.slice(-100)}\"\n\nComplete the analysis without repeating what was already said.`)
      ]);
      claudeResponse += ' ' + completionResult.content;
    }

    // Combine responses if both are available
    const finalResponse = perplexityResponse && usePerplexity
      ? this.combineResponses(claudeResponse, perplexityResponse)
      : claudeResponse;

    return {
      id: this.generateId(),
      content: finalResponse,
      type: 'text',
      metadata: {
        sources: usePerplexity ? ['claude', 'perplexity'] : ['claude'],
        confidence: 0.85,
        dataFreshness: usePerplexity ? 'real-time' : 'historical',
        processingTime: Date.now() - Date.now(),
        classification: {
          intent: 'explanation',
          assetType: 'stock',
          confidence: 0.8,
          suggestedServices: ['claude', 'perplexity'],
          parameters: {}
        }
      },
      suggestions: [
        'Ask about specific stocks or crypto',
        'Get market predictions',
        'Check latest financial news',
        'Analyze investment opportunities'
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Add this helper method to properly combine responses
  private combineResponses(claudeResponse: string, perplexityResponse: string): string {
    // Check if Claude's response is complete
    const isComplete = !claudeResponse.endsWith('...') && 
                      !claudeResponse.endsWith('so...') &&
                      (claudeResponse.includes('conclusion') || 
                       claudeResponse.includes('summary') ||
                       claudeResponse.split('\n').length > 10);

    if (isComplete) {
      // Add Perplexity's real-time data as a supplement
      return `${claudeResponse}\n\n**📊 Current Market Context:**\n${this.summarizePerplexity(perplexityResponse, true)}`;
    } else {
      // Claude's response was incomplete, use Perplexity to complete
      return `${claudeResponse}\n\n**📊 Additional Analysis:**\n${perplexityResponse}`;
    }
  }

  // Update the summarizePerplexity method to handle full responses
  private summarizePerplexity(response: string, fullContext: boolean = false): string {
    const lines = response.split('\n').filter(line => line.trim());
    
    if (fullContext) {
      // Return more complete context
      const keyPoints = lines.slice(0, 10).join('\n');
      return keyPoints;
    }
    
    // Original summary behavior
    const keyPoints = lines.slice(0, 3).join('\n');
    return keyPoints.length > 200 ? keyPoints.substring(0, 200) + '...' : keyPoints;
  }

  private detectAsset(query: string): string | null {
    // Common crypto symbols
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'DOT', 'LINK', 'ADA', 'DOGE'];
    
    // Common stock symbols
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD'];
    
    // Check for direct symbol mentions
    const upperQuery = query.toUpperCase();
    for (const symbol of [...cryptoSymbols, ...stockSymbols]) {
      if (upperQuery.includes(symbol)) {
        return symbol;
      }
    }

    // Check for company/crypto names
    const assetMappings: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'apple': 'AAPL',
      'google': 'GOOGL',
      'microsoft': 'MSFT',
      'tesla': 'TSLA',
      'amazon': 'AMZN',
      'meta': 'META',
      'nvidia': 'NVDA'
    };

    const lowerQuery = query.toLowerCase();
    for (const [name, symbol] of Object.entries(assetMappings)) {
      if (lowerQuery.includes(name)) {
        return symbol;
      }
    }

    return null;
  }

  private detectAssetType(asset: string): 'crypto' | 'stock' {
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'DOT', 'LINK', 'ADA', 'DOGE'];
    return cryptoSymbols.includes(asset.toUpperCase()) ? 'crypto' : 'stock';
  }

  private async formatAssetResponse(query: string, analysis: any): Promise<string> {
    const lowerQuery = query.toLowerCase();
    // Add confidence score to all responses
    const confidenceIntro = `\n💯 **Confidence Score: ${(analysis.aiConsensus?.combinedConfidence ? analysis.aiConsensus.combinedConfidence * 100 : analysis.enhancedAnalysis?.confidenceScore || 0).toFixed(0)}%**\n`;
    // Add this new section for enhanced metrics
    const enhancedMetrics = `
📊 **Enhanced Analysis Metrics:**
• Technical Alignment: ${analysis.enhancedAnalysis?.confidenceFactors.technicalAlignment ?? 'N/A'}%
• Fundamental Strength: ${analysis.enhancedAnalysis?.confidenceFactors.fundamentalStrength ?? 'N/A'}%
• Market Conditions: ${analysis.enhancedAnalysis?.confidenceFactors.marketConditions ?? 'N/A'}%
• News Sentiment: ${analysis.enhancedAnalysis?.confidenceFactors.newssentiment ?? 'N/A'}%

🎯 **Optimal Trade Setup:**
• Entry: $${analysis.tradeSetup?.entry?.toFixed(2) ?? 'N/A'}
• Stop Loss: $${analysis.tradeSetup?.stopLoss?.toFixed(2) ?? 'N/A'}
• Risk/Reward: ${analysis.tradeSetup?.riskRewardRatio?.toFixed(2) ?? 'N/A'}:1
• Position Size: ${analysis.tradeSetup?.portfolioPercentage?.toFixed(1) ?? 'N/A'}% of portfolio
• Max Loss: $${analysis.tradeSetup?.maxLoss?.toFixed(2) ?? 'N/A'}
• Expected Return: $${analysis.tradeSetup?.expectedReturn?.toFixed(2) ?? 'N/A'}
`;
    // Price query
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('worth')) {
      return confidenceIntro + enhancedMetrics + `**${analysis.asset} Current Price: $${analysis.marketData.price.toFixed(2)}**

📊 **Market Data:**
• 24h Change: ${analysis.marketData.changePercent >= 0 ? '+' : ''}${analysis.marketData.changePercent.toFixed(2)}%
• Volume: $${(analysis.marketData.volume / 1e6).toFixed(2)}M
• Market Sentiment: ${analysis.marketData.sentiment}

💡 **AI Recommendation:** ${analysis.recommendation.action.replace('_', ' ').toUpperCase()}
• Confidence: ${(analysis.recommendation.confidence * 100).toFixed(0)}%
• Entry Points: $${analysis.recommendation.entryPoints[0]?.toFixed(2) || 'N/A'}
• Target: $${analysis.predictions.shortTerm.targetPrice.toFixed(2)}`;
    }
    
    // Prediction query
    if (lowerQuery.includes('predict') || lowerQuery.includes('future') || lowerQuery.includes('forecast')) {
      return confidenceIntro + enhancedMetrics + `**${analysis.asset} Price Predictions:**

📈 **Short-term (1-7 days):**
• Direction: ${analysis.predictions.shortTerm.direction.toUpperCase()}
• Target: $${analysis.predictions.shortTerm.targetPrice.toFixed(2)}
• Confidence: ${(analysis.predictions.shortTerm.confidence * 100).toFixed(0)}%

📊 **Long-term (1-6 months):**
• Direction: ${analysis.predictions.longTerm.direction.toUpperCase()}
• Target: $${analysis.predictions.longTerm.targetPrice.toFixed(2)}
• Confidence: ${(analysis.predictions.longTerm.confidence * 100).toFixed(0)}%

⚠️ **Risk Level:** ${analysis.predictions.riskMetrics.riskLevel}
• Stop Loss: $${analysis.predictions.riskMetrics.stopLoss.toFixed(2)}
• Take Profit: $${analysis.predictions.riskMetrics.takeProfit.toFixed(2)}

${analysis.aiConsensus.claudeView}`;
    }
    
    // News query
    if (lowerQuery.includes('news') || lowerQuery.includes('latest') || lowerQuery.includes('happening')) {
      const newsItems = analysis.newsAnalysis.headlines.slice(0, 5);
      return confidenceIntro + enhancedMetrics + `**Latest ${analysis.asset} News:**

${newsItems.map((item: any, i: number) => 
  `${i + 1}. ${item.title}\n   • Sentiment: ${item.sentiment} | Impact: ${item.impact}`
).join('\n\n')}

📊 **Market Impact:** ${analysis.newsAnalysis.marketImpact}
📈 **Overall Sentiment Score:** ${analysis.newsAnalysis.sentimentScore.toFixed(2)}

${analysis.newsAnalysis.tradingSignals.length > 0 
  ? `\n💡 **Trading Signals:**\n${analysis.newsAnalysis.tradingSignals.map((s: string) => `• ${s}`).join('\n')}`
  : ''}`;
    }
    
    // Default comprehensive analysis
    return confidenceIntro + enhancedMetrics + `**${analysis.asset} Comprehensive Analysis**

💰 **Current Market Status:**
• Price: $${analysis.marketData.price.toFixed(2)} (${analysis.marketData.changePercent >= 0 ? '+' : ''}${analysis.marketData.changePercent.toFixed(2)}%)
• Volume: $${(analysis.marketData.volume / 1e6).toFixed(2)}M
• Market Cap: $${(analysis.marketData.marketCap / 1e9).toFixed(2)}B
• Sentiment: ${analysis.marketData.sentiment}

📈 **Price Predictions:**
• Short-term: $${analysis.predictions.shortTerm.targetPrice.toFixed(2)} (${analysis.predictions.shortTerm.direction})
• Long-term: $${analysis.predictions.longTerm.targetPrice.toFixed(2)} (${analysis.predictions.longTerm.direction})

📊 **Technical Analysis:**
• RSI: ${analysis.predictions.technicalIndicators.rsi}
• Support: $${analysis.predictions.technicalIndicators.support.toFixed(2)}
• Resistance: $${analysis.predictions.technicalIndicators.resistance.toFixed(2)}
• Trend: ${analysis.predictions.technicalIndicators.trend}

🎯 **AI Recommendation:** ${analysis.recommendation.action.replace('_', ' ').toUpperCase()}
• Confidence: ${(analysis.recommendation.confidence * 100).toFixed(0)}%
• ${analysis.recommendation.reasoning}

📰 **Recent News Sentiment:** ${analysis.newsAnalysis.sentimentScore > 0 ? 'Positive' : analysis.newsAnalysis.sentimentScore < 0 ? 'Negative' : 'Neutral'}

⚠️ **Risk Assessment:** ${analysis.predictions.riskMetrics.riskLevel}

*Analysis powered by Claude AI + Perplexity real-time data*`;
  }

  private generateSuggestions(asset: string, analysis: any): string[] {
    const suggestions = [
      `Set price alert for ${asset}`,
      `Compare ${asset} with similar assets`,
      `View ${asset} technical chart`,
      `Check ${asset} options chain`
    ];

    if (analysis.recommendation.action.includes('buy')) {
      suggestions.push(`Calculate position size for ${asset}`);
    }

    if (analysis.newsAnalysis.keyEvents.length > 0) {
      suggestions.push(`Track upcoming ${asset} events`);
    }

    return suggestions;
  }

  private createErrorResponse(query: string, error: any): AIResponse {
    return {
      id: this.generateId(),
      content: `I apologize, but I encountered an error while processing your query. ${error instanceof Error ? error.message : 'Please try again.'} 

You can try:
• Rephrasing your question
• Asking about specific stocks or cryptocurrencies
• Checking market news or predictions`,
      type: 'text',
      metadata: {
        sources: [],
        confidence: 0,
        dataFreshness: 'historical',
        processingTime: 0,
        classification: {
          intent: 'explanation',
          assetType: 'stock',
          confidence: 0,
          suggestedServices: ['claude', 'perplexity'],
          parameters: {}
        }
      },
      suggestions: [
        'Try asking about BTC or AAPL',
        'Get market predictions',
        'Check latest news'
      ],
      timestamp: new Date().toISOString()
    };
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Streaming support
  async *streamProcessQuery(
    query: string,
    context?: ChatContext
  ): AsyncGenerator<Partial<AIResponse>, void, unknown> {
    try {
      const assetMatch = this.detectAsset(query);
      
      if (assetMatch) {
        // Stream asset analysis
        yield { content: `Analyzing ${assetMatch}...` };
        
        for await (const update of ultimateAnalyst.streamAnalysis(assetMatch)) {
          yield {
            content: `Analyzing ${assetMatch}...`,
            marketData: update.marketData ? [{
              symbol: assetMatch,
              price: update.marketData.price,
              change: update.marketData.change24h,
              changePercent: update.marketData.changePercent,
              volume: update.marketData.volume,
              timestamp: update.marketData.timestamp,
              source: 'perplexity'
            }] : undefined
          };
        }
      }

      // Final response
      const finalResponse = await this.processQuery(query, context);
      yield finalResponse;

    } catch (error) {
      yield this.createErrorResponse(query, error);
    }
  }

  // --- Ensure Complete Response Logic ---
  async ensureCompleteResponse(
    partialResponse: string,
    originalQuery: string,
    context?: ChatContext
  ): Promise<string> {
    // Check if response appears truncated
    const truncationIndicators = [
      '...',
      'so...',
      'Here are so',
      'including:',
      'such as:',
      'follows:'
    ];
    
    const lastLine = partialResponse.split('\n').pop() || '';
    const isTruncated = truncationIndicators.some(indicator => 
      partialResponse.endsWith(indicator) || lastLine.endsWith(indicator)
    );
    
    if (!isTruncated) {
      return partialResponse;
    }
    
    console.log('Response appears truncated, requesting continuation...');
    
    // Request continuation
    const continuationPrompt = `
The previous response was cut off. Please continue from where it ended:
"${partialResponse.slice(-200)}"

Continue with the complete analysis without repeating what was already said. Include all remaining points and ensure the response is complete.
`;

    try {
      const continuation = await this.claude.invoke([
        new SystemMessage("Continue the previous analysis to completion."),
        new HumanMessage(continuationPrompt)
      ]);
      
      // Combine responses, removing any repeated content
      const fullResponse = this.mergeResponses(partialResponse, continuation.content as string);
      
      // Recursively check if we need another continuation
      if (fullResponse.length < partialResponse.length + 100) {
        // Continuation was too short, might still be truncated
        return this.ensureCompleteResponse(fullResponse, originalQuery, context);
      }
      
      return fullResponse;
    } catch (error) {
      console.error('Error getting continuation:', error);
      return partialResponse + '\n\n[Response continuation failed]';
    }
  }

  private mergeResponses(original: string, continuation: string): string {
    // Remove potential overlap between responses
    const originalWords = original.split(' ');
    const continuationWords = continuation.split(' ');
    
    // Find overlap point (last 10 words of original in continuation)
    let overlapIndex = -1;
    for (let i = Math.max(0, originalWords.length - 20); i < originalWords.length; i++) {
      const phrase = originalWords.slice(i, i + 5).join(' ');
      if (continuation.includes(phrase)) {
        overlapIndex = i;
        break;
      }
    }
    
    if (overlapIndex > 0) {
      // Found overlap, merge without duplication
      const trimmedOriginal = originalWords.slice(0, overlapIndex).join(' ');
      return trimmedOriginal + ' ' + continuation;
    }
    
    // No overlap found, just concatenate
    return original + ' ' + continuation;
  }

  // --- Add enhanceAnalysisWithConfidence method ---
  private async enhanceAnalysisWithConfidence(
    basicAnalysis: any,
    marketData: any
  ): Promise<ComprehensiveAnalysisResult> {
    // Calculate confidence scores
    const confidenceFactors = confidenceScoringService.calculateConfidenceScore(
      basicAnalysis.technicalIndicators,
      basicAnalysis.fundamentals,
      marketData,
      basicAnalysis.news
    );

    const overallConfidence = (
      confidenceFactors.technicalAlignment * 0.3 +
      confidenceFactors.fundamentalStrength * 0.3 +
      confidenceFactors.marketConditions * 0.2 +
      confidenceFactors.newssentiment * 0.2
    );

    // Multi-timeframe analysis
    const timeframeAnalysis = confidenceScoringService.analyzeTimeframes({
      currentPrice: marketData.price,
      priceHistory: marketData.priceHistory || []
    });

    // Trade setup calculation
    const tradeSetup = confidenceScoringService.calculateTradeSetup(
      basicAnalysis.symbol,
      marketData.price,
      {
        ...basicAnalysis,
        confidence: overallConfidence,
        trend: timeframeAnalysis.summary.primaryTrend,
        volatility: marketData.volatility || 0.02,
        resistance: basicAnalysis.technicalIndicators?.resistance,
        stopLoss: basicAnalysis.technicalIndicators?.support * 0.98
      },
      100000 // Default portfolio size, should come from user profile
    );

    // Generate AI prediction
    const prediction = confidenceScoringService.generatePrediction(
      {
        ...basicAnalysis,
        currentPrice: marketData.price,
        expectedReturn: (basicAnalysis.priceTargets.short - marketData.price) / marketData.price,
        confidence: overallConfidence,
        volatility: marketData.volatility || 0.02
      },
      '24h'
    );

    const enhancedAnalysis: EnhancedAnalysis = {
      ...basicAnalysis,
      confidenceScore: overallConfidence,
      confidenceFactors,
      confidenceBreakdown: `Technical: ${confidenceFactors.technicalAlignment}%, ` +
                          `Fundamental: ${confidenceFactors.fundamentalStrength}%, ` +
                          `Market: ${confidenceFactors.marketConditions}%, ` +
                          `News: ${confidenceFactors.newssentiment}%`
    };

    return {
      ...basicAnalysis,
      enhancedAnalysis,
      timeframeAnalysis,
      tradeSetup,
      prediction
    };
  }
}

// Export singleton
export const aiOrchestrator = SimplifiedAIOrchestrator.getInstance();