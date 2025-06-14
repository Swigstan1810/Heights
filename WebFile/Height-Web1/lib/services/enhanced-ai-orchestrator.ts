// services/enhanced-ai-orchestrator.ts
import { autoRouter } from '@/lib/loaders/auto-router';
import { ServiceFactory, PerplexityService } from './service-providers';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { 
  ClassifiedQuery, 
  AIResponse, 
  MarketDataPoint, 
  NewsItem, 
  AnalysisResult,
  ServiceProvider,
  ChatContext,
  ProcessingStrategy
} from '@/types/ai-types';

export class EnhancedAIOrchestrator {
  private static instance: EnhancedAIOrchestrator;
  private claude: ChatAnthropic;
  private perplexity: PerplexityService;

  private constructor() {
    this.claude = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 4000,
    });
    
    this.perplexity = ServiceFactory.getService('perplexity');
  }

  static getInstance(): EnhancedAIOrchestrator {
    if (!EnhancedAIOrchestrator.instance) {
      EnhancedAIOrchestrator.instance = new EnhancedAIOrchestrator();
    }
    return EnhancedAIOrchestrator.instance;
  }

  async processQuery(
    query: string, 
    context?: ChatContext,
    options: { useCache?: boolean; maxRetries?: number } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const { useCache = true, maxRetries = 3 } = options;

    try {
      // Step 1: Classify the query
      const classification = autoRouter.classifyQuery(query);
      console.log('🔍 Query classified:', classification);

      // Step 2: Get processing strategy
      const strategy = autoRouter.getProcessingStrategy(classification);
      console.log('📋 Processing strategy:', strategy);

      // Step 3: Execute strategy with fallbacks
      const fullStrategy: ProcessingStrategy = {
        ...strategy,
        maxRetries: (strategy as any).maxRetries ?? 3,
        timeout: (strategy as any).timeout ?? 10000
      };
      let response = await this.executeStrategy(query, classification, fullStrategy, context);
      
      // Step 4: If primary strategy fails, try fallbacks
      if (!response && strategy.fallbackServices.length > 0) {
        console.log('🔄 Trying fallback services...');
        for (const fallbackService of strategy.fallbackServices) {
          const fallbackStrategy: ProcessingStrategy = {
            ...strategy,
            primaryService: fallbackService,
            fallbackServices: [],
            maxRetries: (strategy as any).maxRetries ?? 3,
            timeout: (strategy as any).timeout ?? 10000
          };
          response = await this.executeStrategy(query, classification, fallbackStrategy, context);
          if (response) break;
        }
      }

      // Step 5: Final fallback to Claude if all else fails
      if (!response) {
        console.log('🤖 Using final Claude fallback...');
        response = await this.claudeFallback(query, classification);
      }

      // Step 6: Enhance response with metadata
      response.metadata.processingTime = Date.now() - startTime;
      response.metadata.classification = classification;

      return response;

    } catch (error) {
      console.error('❌ Error processing query:', error);
      return this.createErrorResponse(query, null, error);
    }
  }

  private async executeStrategy(
    query: string,
    classification: ClassifiedQuery,
    strategy: ProcessingStrategy,
    context?: ChatContext
  ): Promise<AIResponse | null> {
    
    let marketData: MarketDataPoint[] = [];
    let newsData: NewsItem[] = [];
    let analysisData: AnalysisResult | undefined;

    try {
      // Gather required data in parallel
      const dataPromises: Promise<any>[] = [];

      if (strategy.requiresData && classification.assetSymbol) {
        // Market data
        const marketDataProviders = strategy.fallbackServices.filter(s => 
          ['coinbase', 'alpha_vantage', 'polygon', 'twelve_data'].includes(s)
        );
        
        if (marketDataProviders.length > 0) {
          dataPromises.push(
            ServiceFactory.getMarketData(classification.assetSymbol, marketDataProviders)
              .then(responses => {
                marketData = responses
                  .filter(r => r.success && r.data)
                  .map(r => r.data!)
                  .slice(0, 3); // Limit to 3 sources
              })
              .catch(() => [])
          );
        }

        // News data
        const newsProviders = strategy.fallbackServices.filter(s => 
          ['alpha_vantage', 'polygon', 'benzinga', 'gnews'].includes(s)
        );
        
        if (newsProviders.length > 0) {
          dataPromises.push(
            ServiceFactory.getNewsData(classification.assetSymbol, newsProviders)
              .then(responses => {
                newsData = responses
                  .filter(r => r.success && r.data)
                  .flatMap(r => r.data!)
                  .slice(0, 10); // Limit to 10 news items
              })
              .catch(() => [])
          );
        }
      }

      // Wait for data gathering
      await Promise.all(dataPromises);

      // Process based on primary service
      switch (strategy.primaryService) {
        case 'claude':
          return await this.processWithClaude(query, classification, { marketData, newsData }, context);
          
        case 'perplexity':
          return await this.processWithPerplexity(query, classification, { marketData, newsData });
          
        case 'coinbase':
        case 'alpha_vantage':
        case 'polygon':
        case 'twelve_data':
          return await this.processDataQuery(query, classification, marketData);
          
        case 'benzinga':
        case 'gnews':
          return await this.processNewsQuery(query, classification, newsData);
          
        default:
          return null;
      }

    } catch (error) {
      console.error(`❌ Strategy execution failed for ${strategy.primaryService}:`, error);
      return null;
    }
  }

  private async processWithClaude(
    query: string,
    classification: ClassifiedQuery,
    data: { marketData: MarketDataPoint[]; newsData: NewsItem[] },
    context?: ChatContext
  ): Promise<AIResponse> {
    
    const systemPrompt = this.buildClaudeSystemPrompt(classification, data);
    const enhancedQuery = this.buildEnhancedQuery(query, classification, data, context);

    const response = await this.claude.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(enhancedQuery)
    ]);

    // Check if analysis is needed
    let analysis: AnalysisResult | undefined;
    if (classification.intent === 'analysis' && classification.assetSymbol) {
      analysis = await this.generateAnalysis(classification.assetSymbol, data, response.content as string);
    }

    return {
      id: this.generateId(),
      content: response.content as string,
      type: this.mapIntentToType(classification.intent),
      metadata: {
        sources: ['claude', ...this.getDataSources(data)],
        confidence: classification.confidence,
        dataFreshness: this.assessDataFreshness(data),
        processingTime: 0, // Will be set later
        classification
      },
      marketData: data.marketData.length > 0 ? data.marketData : undefined,
      news: data.newsData.length > 0 ? data.newsData : undefined,
      analysis,
      suggestions: this.generateSuggestions(classification, response.content as string),
      timestamp: new Date().toISOString()
    };
  }

  private async processWithPerplexity(
    query: string,
    classification: ClassifiedQuery,
    data: { marketData: MarketDataPoint[]; newsData: NewsItem[] }
  ): Promise<AIResponse> {
    
    const enhancedQuery = this.buildPerplexityQuery(query, classification);
    const response = await this.perplexity.searchAndAnalyze(enhancedQuery);

    if (!response.success) {
      throw new Error(`Perplexity failed: ${response.error}`);
    }

    return {
      id: this.generateId(),
      content: response.data!,
      type: this.mapIntentToType(classification.intent),
      metadata: {
        sources: ['perplexity', ...this.getDataSources(data)],
        confidence: Math.min(classification.confidence + 0.1, 1.0), // Perplexity adds real-time boost
        dataFreshness: 'real-time',
        processingTime: 0,
        classification
      },
      marketData: data.marketData.length > 0 ? data.marketData : undefined,
      news: data.newsData.length > 0 ? data.newsData : undefined,
      suggestions: this.generateSuggestions(classification, response.data!),
      timestamp: new Date().toISOString()
    };
  }

  private async processDataQuery(
    query: string,
    classification: ClassifiedQuery,
    marketData: MarketDataPoint[]
  ): Promise<AIResponse> {
    
    if (marketData.length === 0) {
      throw new Error('No market data available');
    }

    // Use Claude to interpret the data
    const dataAnalysis = await this.analyzeMarketData(query, classification, marketData);

    return {
      id: this.generateId(),
      content: dataAnalysis,
      type: 'data',
      metadata: {
        sources: this.getDataSources({ marketData, newsData: [] }),
        confidence: 0.9, // High confidence for real data
        dataFreshness: 'real-time',
        processingTime: 0,
        classification
      },
      marketData,
      suggestions: this.generateDataSuggestions(classification, marketData),
      timestamp: new Date().toISOString()
    };
  }

  private async processNewsQuery(
    query: string,
    classification: ClassifiedQuery,
    newsData: NewsItem[]
  ): Promise<AIResponse> {
    
    if (newsData.length === 0) {
      throw new Error('No news data available');
    }

    // Use Claude to summarize and analyze news
    const newsAnalysis = await this.analyzeNews(query, classification, newsData);

    return {
      id: this.generateId(),
      content: newsAnalysis,
      type: 'news',
      metadata: {
        sources: this.getDataSources({ marketData: [], newsData }),
        confidence: 0.8,
        dataFreshness: 'recent',
        processingTime: 0,
        classification
      },
      news: newsData,
      suggestions: this.generateNewsSuggestions(classification, newsData),
      timestamp: new Date().toISOString()
    };
  }

  private async claudeFallback(
    query: string,
    classification: ClassifiedQuery
  ): Promise<AIResponse> {
    
    const fallbackPrompt = `
You are a helpful financial assistant. The user asked: "${query}"

Provide a helpful response based on your knowledge, but acknowledge that you don't have access to real-time data. 
Offer to help with general information and suggest that the user check current market data from reliable sources.

Be specific about what information you can and cannot provide without real-time data access.
`;

    const response = await this.claude.invoke([
      new SystemMessage(fallbackPrompt),
      new HumanMessage(query)
    ]);

    return {
      id: this.generateId(),
      content: response.content as string,
      type: 'text',
      metadata: {
        sources: ['claude'],
        confidence: 0.6, // Lower confidence for fallback
        dataFreshness: 'historical',
        processingTime: 0,
        classification
      },
      suggestions: [
        'Check real-time market data',
        'Look up recent news',
        'Consult financial advisors',
        'Use multiple data sources'
      ],
      timestamp: new Date().toISOString()
    };
  }

  private buildClaudeSystemPrompt(
    classification: ClassifiedQuery,
    data: { marketData: MarketDataPoint[]; newsData: NewsItem[] }
  ): string {
    return `You are Claude, an expert financial assistant for Heights trading platform.

QUERY CLASSIFICATION:
- Intent: ${classification.intent}
- Asset Type: ${classification.assetType}
- Asset Symbol: ${classification.assetSymbol || 'Not specified'}
- Confidence: ${(classification.confidence * 100).toFixed(1)}%

AVAILABLE DATA:
- Market Data: ${data.marketData.length} sources
- News Data: ${data.newsData.length} articles

INSTRUCTIONS:
1. Provide accurate, actionable financial insights
2. Use the provided real-time data when available
3. Be specific with numbers, prices, and percentages
4. Include appropriate risk disclaimers
5. Suggest next steps for the user
6. Format responses clearly with sections

TONE: Professional but accessible, confident but cautious about predictions.

DISCLAIMER: Always remind users that this is educational information and not personalized financial advice.`;
  }

  private buildEnhancedQuery(
    query: string,
    classification: ClassifiedQuery,
    data: { marketData: MarketDataPoint[]; newsData: NewsItem[] },
    context?: ChatContext
  ): string {
    let enhancedQuery = `User Query: "${query}"\n\n`;

    // Add context if available
    if (context?.messageHistory?.length) {
      enhancedQuery += `Previous Context: User has been asking about ${context.messageHistory.slice(-2).map(m => m.metadata.classification.assetSymbol).filter(s => s).join(', ')}\n\n`;
    }

    // Add market data
    if (data.marketData.length > 0) {
      enhancedQuery += `REAL-TIME MARKET DATA:\n`;
      data.marketData.forEach(md => {
        enhancedQuery += `${md.symbol}: $${md.price.toFixed(2)} (${md.changePercent >= 0 ? '+' : ''}${md.changePercent.toFixed(2)}%) - Source: ${md.source}\n`;
      });
      enhancedQuery += '\n';
    }

    // Add news data
    if (data.newsData.length > 0) {
      enhancedQuery += `RECENT NEWS:\n`;
      data.newsData.slice(0, 5).forEach(news => {
        enhancedQuery += `• ${news.title} (${news.sentiment}) - ${news.source}\n`;
      });
      enhancedQuery += '\n';
    }

    enhancedQuery += `Please provide a comprehensive response addressing the user's query with the available data.`;

    return enhancedQuery;
  }

  private buildPerplexityQuery(query: string, classification: ClassifiedQuery): string {
    const timeContext = classification.timeframe ? ` for ${classification.timeframe}` : ' recently';
    const assetContext = classification.assetSymbol ? ` for ${classification.assetSymbol}` : '';
    
    return `${query}${assetContext}${timeContext}. Please provide current market data, recent news, and expert analysis. Include specific prices, percentages, and sources.`;
  }

  // Helper methods
  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapIntentToType(intent: string): AIResponse['type'] {
    const mapping: Record<string, AIResponse['type']> = {
      'analysis': 'analysis',
      'comparison': 'comparison',
      'news': 'news',
      'price': 'data',
      'prediction': 'analysis'
    };
    return mapping[intent] || 'text';
  }

  private getDataSources(data: { marketData: MarketDataPoint[]; newsData: NewsItem[] }): ServiceProvider[] {
    const sources: ServiceProvider[] = [];
    
    data.marketData.forEach(md => {
      if (!sources.includes(md.source)) {
        sources.push(md.source);
      }
    });
    
    // Add news source mappings
    data.newsData.forEach(news => {
      if (news.source.toLowerCase().includes('benzinga')) {
        if (!sources.includes('benzinga')) sources.push('benzinga');
      } else if (news.source.toLowerCase().includes('polygon')) {
        if (!sources.includes('polygon')) sources.push('polygon');
      }
    });
    
    return sources;
  }

  private assessDataFreshness(data: { marketData: MarketDataPoint[]; newsData: NewsItem[] }): 'real-time' | 'recent' | 'historical' {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Check market data freshness
    const hasRecentMarketData = data.marketData.some(md => 
      new Date(md.timestamp).getTime() > fiveMinutesAgo
    );
    
    // Check news data freshness  
    const hasRecentNews = data.newsData.some(news => 
      new Date(news.publishedAt).getTime() > oneHourAgo
    );
    
    if (hasRecentMarketData) return 'real-time';
    if (hasRecentNews) return 'recent';
    return 'historical';
  }

  private generateSuggestions(classification: ClassifiedQuery, response: string): string[] {
    const suggestions = [];
    
    if (classification.assetSymbol) {
      suggestions.push(`Get technical analysis for ${classification.assetSymbol}`);
      suggestions.push(`Compare ${classification.assetSymbol} with similar assets`);
      suggestions.push(`Check ${classification.assetSymbol} news and events`);
    }
    
    switch (classification.intent) {
      case 'price':
        suggestions.push('Set up price alerts', 'View historical performance');
        break;
      case 'analysis':
        suggestions.push('Get risk assessment', 'Check analyst ratings');
        break;
      case 'news':
        suggestions.push('Set up news alerts', 'Check market sentiment');
        break;
    }
    
    return suggestions;
  }

  private generateDataSuggestions(classification: ClassifiedQuery, marketData: MarketDataPoint[]): string[] {
    const suggestions = ['View detailed chart', 'Set price alerts'];
    
    if (marketData.length > 1) {
      suggestions.push('Compare data sources');
    }
    
    return suggestions;
  }

  private generateNewsSuggestions(classification: ClassifiedQuery, newsData: NewsItem[]): string[] {
    return [
      'Read full articles',
      'Set up news alerts',
      'Check market impact analysis',
      'View related stocks'
    ];
  }

  private async analyzeMarketData(
    query: string,
    classification: ClassifiedQuery,
    marketData: MarketDataPoint[]
  ): Promise<string> {
    const dataContext = marketData.map(md => 
      `${md.symbol}: ${md.price.toFixed(2)} (${md.changePercent >= 0 ? '+' : ''}${md.changePercent.toFixed(2)}%) - ${md.source}`
    ).join('\n');

    const prompt = `Analyze this market data and answer the user's query: "${query}"

MARKET DATA:
${dataContext}

Provide a clear, informative response that:
1. Directly answers the user's question
2. Highlights key data points
3. Compares data from different sources if available
4. Suggests what this data means for investors
5. Includes appropriate disclaimers`;

    const response = await this.claude.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }

  private async analyzeNews(
    query: string,
    classification: ClassifiedQuery,
    newsData: NewsItem[]
  ): Promise<string> {
    const newsContext = newsData.slice(0, 5).map(news => 
      `• ${news.title} (${news.sentiment}) - ${news.source} - ${new Date(news.publishedAt).toLocaleDateString()}`
    ).join('\n');

    const prompt = `Analyze this news data and answer the user's query: "${query}"

RECENT NEWS:
${newsContext}

Provide a comprehensive news analysis that:
1. Summarizes the key news themes
2. Identifies sentiment trends
3. Explains potential market impact
4. Highlights the most important developments
5. Suggests how investors should interpret this news`;

    const response = await this.claude.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }

  private async generateAnalysis(
    symbol: string,
    data: { marketData: MarketDataPoint[]; newsData: NewsItem[] },
    claudeResponse: string
  ): Promise<AnalysisResult> {
    // Extract recommendation from Claude's response
    const recommendation = this.extractRecommendation(claudeResponse);
    const confidence = this.extractConfidence(claudeResponse);
    
    // Calculate technical indicators if market data is available
    const technicalIndicators = data.marketData.length > 0 ? 
      this.calculateBasicTechnicals(data.marketData[0]) : undefined;

    return {
      symbol,
      recommendation,
      confidence,
      reasoning: this.extractReasoning(claudeResponse),
      technicalIndicators,
      priceTargets: this.extractPriceTargets(claudeResponse),
      risks: this.extractRisks(claudeResponse),
      opportunities: this.extractOpportunities(claudeResponse),
      timeframe: '1-3 months',
      lastUpdated: new Date().toISOString()
    };
  }

  private extractRecommendation(text: string): AnalysisResult['recommendation'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('strong buy') || lowerText.includes('strongly recommend buying')) {
      return 'strong_buy';
    } else if (lowerText.includes('buy') || lowerText.includes('recommend')) {
      return 'buy';
    } else if (lowerText.includes('strong sell') || lowerText.includes('strongly recommend selling')) {
      return 'strong_sell';
    } else if (lowerText.includes('sell')) {
      return 'sell';
    } else {
      return 'hold';
    }
  }

  private extractConfidence(text: string): number {
    // Look for confidence percentages in the text
    const confidenceMatch = text.match(/(\d+(?:\.\d+)?)%?\s*confident/i);
    if (confidenceMatch) {
      const value = parseFloat(confidenceMatch[1]);
      return value > 1 ? value / 100 : value;
    }
    
    // Default confidence based on recommendation strength
    const recommendation = this.extractRecommendation(text);
    switch (recommendation) {
      case 'strong_buy':
      case 'strong_sell':
        return 0.85;
      case 'buy':
      case 'sell':
        return 0.75;
      default:
        return 0.65;
    }
  }

  private extractReasoning(text: string): string {
    // Extract the main reasoning - typically the first paragraph or section
    const sentences = text.split(/[.!?]+/);
    return sentences.slice(0, 3).join('. ').trim() + '.';
  }

  private extractPriceTargets(text: string): AnalysisResult['priceTargets'] {
    const priceMatches = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatches && priceMatches.length >= 2) {
      const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, ''))).sort((a, b) => a - b);
      return {
        short: prices[0],
        medium: prices[Math.floor(prices.length / 2)],
        long: prices[prices.length - 1]
      };
    }
    return undefined;
  }

  private extractRisks(text: string): string[] {
    const risks = [];
    const riskSection = text.match(/risks?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/i);
    if (riskSection) {
      const riskText = riskSection[1];
      const riskItems = riskText.split(/[•\-\n]/).filter(item => item.trim().length > 10);
      risks.push(...riskItems.map(item => item.trim()).slice(0, 3));
    }
    
    // Default risks if none found
    if (risks.length === 0) {
      risks.push('Market volatility', 'Economic uncertainty', 'Company-specific risks');
    }
    
    return risks;
  }

  private extractOpportunities(text: string): string[] {
    const opportunities = [];
    const oppSection = text.match(/opportunities?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/i);
    if (oppSection) {
      const oppText = oppSection[1];
      const oppItems = oppText.split(/[•\-\n]/).filter(item => item.trim().length > 10);
      opportunities.push(...oppItems.map(item => item.trim()).slice(0, 3));
    }
    
    // Default opportunities if none found
    if (opportunities.length === 0) {
      opportunities.push('Growth potential', 'Market expansion', 'Technology advancement');
    }
    
    return opportunities;
  }

  private calculateBasicTechnicals(marketData: MarketDataPoint): AnalysisResult['technicalIndicators'] {
    // Basic technical analysis based on single data point
    // In a real implementation, you'd need historical data for proper technical analysis
    
    const price = marketData.price;
    const changePercent = marketData.changePercent;
    
    // Simulated RSI based on recent performance
    let rsi = 50; // Neutral
    if (changePercent > 5) rsi = 70; // Overbought territory
    else if (changePercent < -5) rsi = 30; // Oversold territory
    else rsi = 50 + (changePercent * 2); // Rough approximation
    
    // Simulated support/resistance based on high/low
    const support = marketData.low24h || price * 0.95;
    const resistance = marketData.high24h || price * 1.05;
    
    return {
      rsi,
      support,
      resistance,
      sma: {
        sma20: price * 0.98, // Approximation
        sma50: price * 0.96,
      }
    };
  }

  private createErrorResponse(
    query: string,
    classification: ClassifiedQuery | null,
    error: any
  ): AIResponse {
    return {
      id: this.generateId(),
      content: `I apologize, but I encountered an error while processing your query: "${query}". ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try rephrasing your question or try again later.`,
      type: 'text',
      metadata: {
        sources: [],
        confidence: 0,
        dataFreshness: 'historical',
        processingTime: 0,
        classification: classification || {
          intent: 'explanation',
          assetType: 'stock',
          confidence: 0,
          suggestedServices: [],
          parameters: {}
        }
      },
      suggestions: [
        'Try rephrasing your question',
        'Check your internet connection',
        'Contact support if the issue persists'
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Streaming support for real-time responses
  async *streamProcessQuery(
    query: string,
    context?: ChatContext
  ): AsyncGenerator<Partial<AIResponse>, void, unknown> {
    try {
      // Step 1: Yield initial classification
      const classification = autoRouter.classifyQuery(query);
      yield {
        id: this.generateId(),
        metadata: {
          classification,
          sources: [],
          confidence: classification.confidence,
          dataFreshness: 'historical',
          processingTime: 0
        }
      };

      // Step 2: Yield data gathering status
      const strategy = autoRouter.getProcessingStrategy(classification);
      yield {
        content: 'Gathering market data and news...',
        metadata: {
          sources: Array.isArray((strategy as any).suggestedServices) ? (strategy as any).suggestedServices : [],
          confidence: classification.confidence,
          dataFreshness: 'historical',
          processingTime: 0,
          classification
        }
      };

      // Step 3: Process and yield final result
      const finalResponse = await this.processQuery(query, context);
      yield finalResponse;

    } catch (error) {
      yield this.createErrorResponse(query, null, error);
    }
  }
}

// Export singleton instance
export const aiOrchestrator = EnhancedAIOrchestrator.getInstance();