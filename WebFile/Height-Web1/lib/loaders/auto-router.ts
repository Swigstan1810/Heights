// lib/loaders/auto-router.ts
import { ClassifiedQuery, QueryIntent, AssetType, ServiceProvider } from '@/types/ai-types';

export interface QueryClassification {
  intent: QueryIntent;
  assetType: AssetType;
  assetSymbol?: string;
  timeframe?: string;
  confidence: number;
  suggestedServices: ServiceProvider[];
  parameters: Record<string, any>;
}

export class AutoRouter {
  private static instance: AutoRouter;
  
  // Intent patterns
  private intentPatterns = {
    price: [
      /\b(price|cost|rate|trading at|current|now|today)\b/i,
      /\b(how much|what's|what is|current price)\b/i,
      /\$([\d,]+)/,
    ],
    explanation: [
      /\b(what is|tell me about|explain|description|about)\b/i,
      /\b(history|background|company|founded|overview)\b/i,
      /\b(how does|how it works|what does)\b/i,
    ],
    prediction: [
      /\b(future|predict|forecast|will|going to|expect)\b/i,
      /\b(tomorrow|next week|next month|2024|2025)\b/i,
      /\b(bull|bear|bullish|bearish|trend)\b/i,
    ],
    news: [
      /\b(news|latest|recent|update|headline)\b/i,
      /\b(happened|event|announcement|earnings)\b/i,
    ],
    analysis: [
      /\b(analyze|analysis|technical|fundamental)\b/i,
      /\b(should I buy|good investment|recommend)\b/i,
      /\b(pros|cons|risk|safe)\b/i,
    ],
    comparison: [
      /\b(vs|versus|compare|better|difference)\b/i,
      /\b(or|between|which)\b/i,
    ],
    portfolio: [
      /\b(portfolio|my|holdings|diversify)\b/i,
      /\b(allocate|allocation|spread)\b/i,
    ]
  };

  // Asset type patterns
  private assetPatterns = {
    crypto: [
      /\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|coin|token)\b/i,
      /\b(solana|sol|matic|polygon|doge|ada|dot|link)\b/i,
      /\b(defi|nft|blockchain|altcoin)\b/i,
    ],
    stock: [
      /\b(stock|share|equity|company|corporation)\b/i,
      /\b(apple|google|microsoft|tesla|amazon|meta|nvidia)\b/i,
      /\b(reliance|tcs|infosys|hdfc|icici|wipro)\b/i,
      /\b(nasdaq|dow|s&p|nifty|sensex)\b/i,
    ],
    mutualfund: [
      /\b(mutual fund|mf|fund|sip|systematic)\b/i,
      /\b(axis|hdfc|icici|sbi|fund)\b/i,
      /\b(large cap|mid cap|small cap|debt fund)\b/i,
    ],
    commodity: [
      /\b(gold|silver|oil|copper|crude|commodity)\b/i,
      /\b(wheat|corn|sugar|coffee|natural gas)\b/i,
    ],
    bond: [
      /\b(bond|treasury|government|corporate bond)\b/i,
      /\b(yield|fixed income|debt)\b/i,
    ],
    index: [
      /\b(index|nifty|sensex|dow|nasdaq|s&p)\b/i,
      /\b(market|indices|benchmark)\b/i,
    ]
  };

  // Company/Asset symbol mapping
  private symbolMappings = {
    // Crypto
    'bitcoin': 'BTC',
    'btc': 'BTC',
    'ethereum': 'ETH', 
    'eth': 'ETH',
    'solana': 'SOL',
    'sol': 'SOL',
    'polygon': 'MATIC',
    'matic': 'MATIC',
    
    // US Stocks
    'apple': 'AAPL',
    'tesla': 'TSLA',
    'google': 'GOOGL',
    'microsoft': 'MSFT',
    'amazon': 'AMZN',
    'meta': 'META',
    'nvidia': 'NVDA',
    
    // Indian Stocks
    'reliance': 'RELIANCE.NS',
    'tcs': 'TCS.NS',
    'infosys': 'INFY.NS',
    'hdfc': 'HDFCBANK.NS',
    'icici': 'ICICIBANK.NS',
    'wipro': 'WIPRO.NS',
    
    // Commodities
    'gold': 'GC=F',
    'silver': 'SI=F',
    'oil': 'CL=F',
    'crude': 'CL=F',
    
    // Indices
    'nifty': '^NSEI',
    'sensex': '^BSESN',
    'dow': '^DJI',
    'nasdaq': '^IXIC',
    's&p': '^GSPC',
  };

  public static getInstance(): AutoRouter {
    if (!AutoRouter.instance) {
      AutoRouter.instance = new AutoRouter();
    }
    return AutoRouter.instance;
  }

  classifyQuery(query: string): QueryClassification {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Detect intent
    const intent = this.detectIntent(normalizedQuery);
    
    // Detect asset type
    const assetType = this.detectAssetType(normalizedQuery);
    
    // Extract asset symbol
    const assetSymbol = this.extractAssetSymbol(normalizedQuery);
    
    // Extract timeframe
    const timeframe = this.extractTimeframe(normalizedQuery);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(intent, assetType, assetSymbol);
    
    // Suggest services based on classification
    const suggestedServices = this.suggestServices(intent, assetType);
    
    // Extract additional parameters
    const parameters = this.extractParameters(normalizedQuery, intent, assetType);

    return {
      intent,
      assetType,
      assetSymbol,
      timeframe,
      confidence,
      suggestedServices,
      parameters
    };
  }

  private detectIntent(query: string): QueryIntent {
    const intentScores: Record<string, number> = {};
    
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      intentScores[intentType] = score;
    }
    
    // Return highest scoring intent, default to 'explanation'
    const topIntent = Object.entries(intentScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return (topIntent?.[1] > 0 ? topIntent[0] : 'explanation') as QueryIntent;
  }

  private detectAssetType(query: string): AssetType {
    const assetScores: Record<string, number> = {};
    
    for (const [assetType, patterns] of Object.entries(this.assetPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          score += 1;
        }
      }
      assetScores[assetType] = score;
    }
    
    // Return highest scoring asset type, default to 'stock'
    const topAsset = Object.entries(assetScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return (topAsset?.[1] > 0 ? topAsset[0] : 'stock') as AssetType;
  }

  private extractAssetSymbol(query: string): string | undefined {
    // Direct symbol matches
    for (const [name, symbol] of Object.entries(this.symbolMappings)) {
      if (new RegExp(`\\b${name}\\b`, 'i').test(query)) {
        return symbol;
      }
    }
    
    // Pattern-based extraction for stock symbols
    const symbolPattern = /\b([A-Z]{1,5})\b/g;
    const matches = query.toUpperCase().match(symbolPattern);
    
    if (matches) {
      // Filter out common English words that might match
      const filtered = matches.filter(match => 
        !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BUT', 'HIS', 'HAS', 'HOW'].includes(match)
      );
      return filtered[0];
    }
    
    return undefined;
  }

  private extractTimeframe(query: string): string | undefined {
    const timeframes = {
      'today': '1d',
      'this week': '1w', 
      'next week': '1w',
      'this month': '1m',
      'next month': '1m',
      'this year': '1y',
      'next year': '1y',
      '2024': '1y',
      '2025': '1y',
      'short term': '1m',
      'long term': '1y',
      'intraday': '1d',
      'daily': '1d',
      'weekly': '1w',
      'monthly': '1m',
      'yearly': '1y'
    };
    
    for (const [phrase, timeframe] of Object.entries(timeframes)) {
      if (new RegExp(`\\b${phrase}\\b`, 'i').test(query)) {
        return timeframe;
      }
    }
    
    return undefined;
  }

  private calculateConfidence(
    intent: QueryIntent, 
    assetType: AssetType, 
    assetSymbol?: string
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Intent detection confidence
    if (intent !== 'explanation') confidence += 0.2;
    
    // Asset type detection confidence  
    if (assetType !== 'stock') confidence += 0.1;
    
    // Symbol extraction confidence
    if (assetSymbol) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private suggestServices(intent: QueryIntent, assetType: AssetType): ServiceProvider[] {
    const services: ServiceProvider[] = [];
    
    // Always include Claude for reasoning
    services.push('claude');
    
    // Add services based on intent
    switch (intent) {
      case 'news':
        services.push('perplexity', 'benzinga', 'gnews');
        break;
      case 'prediction':
        services.push('perplexity', 'claude');
        break;
      case 'analysis':
        services.push('claude', 'perplexity');
        break;
      case 'price':
        // Add market data services based on asset type
        if (assetType === 'crypto') {
          services.push('coinbase', 'polygon');
        } else if (assetType === 'stock') {
          services.push('alpha_vantage', 'polygon', 'twelve_data');
        } else if (assetType === 'mutualfund') {
          services.push('alpha_vantage');
        }
        break;
    }
    
    // Remove duplicates
    return [...new Set(services)];
  }

  private extractParameters(
    query: string, 
    intent: QueryIntent, 
    assetType: AssetType
  ): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract price ranges
    const priceMatch = query.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      params.targetPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Extract comparison mentions
    const vsMatch = query.match(/\b(\w+)\s+(?:vs|versus|or)\s+(\w+)\b/i);
    if (vsMatch) {
      params.comparison = {
        asset1: vsMatch[1],
        asset2: vsMatch[2]
      };
    }
    
    // Extract action intentions
    if (/\b(buy|purchase|invest)\b/i.test(query)) {
      params.action = 'buy';
    } else if (/\b(sell|exit|liquidate)\b/i.test(query)) {
      params.action = 'sell';
    }
    
    // Extract risk tolerance
    if (/\b(safe|conservative|low risk)\b/i.test(query)) {
      params.riskTolerance = 'low';
    } else if (/\b(aggressive|high risk|risky)\b/i.test(query)) {
      params.riskTolerance = 'high';
    }
    
    return params;
  }

  // Helper method to get processing strategy
  getProcessingStrategy(classification: QueryClassification): {
    primaryService: ServiceProvider;
    fallbackServices: ServiceProvider[];
    requiresData: boolean;
    requiresAnalysis: boolean;
  } {
    const { intent, assetType, suggestedServices } = classification;
    
    let primaryService: ServiceProvider = 'claude';
    let requiresData = false;
    let requiresAnalysis = false;
    
    // Determine primary service based on intent
    switch (intent) {
      case 'price':
        requiresData = true;
        if (assetType === 'crypto') {
          primaryService = 'coinbase';
        } else {
          primaryService = 'alpha_vantage';
        }
        break;
        
      case 'news':
        primaryService = 'perplexity';
        break;
        
      case 'prediction':
      case 'analysis':
        requiresAnalysis = true;
        requiresData = true;
        primaryService = 'claude';
        break;
        
      default:
        primaryService = 'claude';
    }
    
    const fallbackServices = suggestedServices.filter(s => s !== primaryService);
    
    return {
      primaryService,
      fallbackServices,
      requiresData,
      requiresAnalysis
    };
  }
}

// Export singleton
export const autoRouter = AutoRouter.getInstance();