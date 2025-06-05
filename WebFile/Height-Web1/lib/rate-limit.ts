// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function ratelimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    limit: (token: string) => {
      const tokenCount = (tokenCache.get(token) as number) || 0;
      const maxRequests = 60; // requests per interval
      
      if (tokenCount === 0) {
        tokenCache.set(token, 1);
      } else {
        tokenCache.set(token, tokenCount + 1);
      }

      const currentUsage = tokenCache.get(token) as number;
      const isAllowed = currentUsage <= maxRequests;

      return {
        success: isAllowed,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - currentUsage),
        reset: new Date(Date.now() + (options?.interval || 60000)),
      };
    },
  };
}

// lib/market-data-enhanced.ts
export interface EnhancedMarketData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  marketCap?: number;
  high24h: number;
  low24h: number;
  timestamp: string;
  technicalIndicators?: {
    rsi: number;
    macd: number;
    sma20: number;
    sma50: number;
    bb_upper: number;
    bb_lower: number;
  };
  news?: NewsItem[];
  sentiment?: {
    score: number;
    label: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
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

export class EnhancedMarketDataService {
  private cache = new Map<string, { data: EnhancedMarketData; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private subscribers = new Map<string, Set<(data: EnhancedMarketData) => void>>();

  constructor() {
    // Start real-time data polling
    this.startRealTimeUpdates();
  }

  async getMarketData(symbol: string): Promise<EnhancedMarketData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Fetch from multiple sources in parallel
      const [priceData, newsData, technicalData] = await Promise.allSettled([
        this.fetchPriceData(symbol),
        this.fetchNewsData(symbol),
        this.fetchTechnicalData(symbol)
      ]);

      const marketData: EnhancedMarketData = {
        symbol,
        price: 0,
        change24h: 0,
        change24hPercent: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0,
        timestamp: new Date().toISOString(),
      };

      // Merge price data
      if (priceData.status === 'fulfilled' && priceData.value) {
        Object.assign(marketData, priceData.value);
      }

      // Merge news data
      if (newsData.status === 'fulfilled' && newsData.value) {
        marketData.news = newsData.value;
        marketData.sentiment = this.calculateSentiment(newsData.value);
      }

      // Merge technical data
      if (technicalData.status === 'fulfilled' && technicalData.value) {
        marketData.technicalIndicators = technicalData.value;
      }

      // Cache the result
      this.cache.set(symbol, { data: marketData, timestamp: Date.now() });

      // Notify subscribers
      this.notifySubscribers(symbol, marketData);

      return marketData;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchPriceData(symbol: string): Promise<Partial<EnhancedMarketData> | null> {
    try {
      // Try Coinbase first for crypto
      if (symbol.startsWith('CRYPTO:')) {
        const cryptoSymbol = symbol.replace('CRYPTO:', '');
        const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${cryptoSymbol}`);
        const data = await response.json();
        
        if (data.data?.rates?.USD) {
          const price = parseFloat(data.data.rates.USD);
          return {
            price,
            change24h: 0, // Coinbase doesn't provide 24h change in this endpoint
            change24hPercent: 0,
            volume24h: 0,
            high24h: price,
            low24h: price,
          };
        }
      }

      // Try Yahoo Finance for stocks
      if (!symbol.startsWith('CRYPTO:')) {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
        const data = await response.json();
        
        if (data.chart?.result?.[0]?.meta) {
          const meta = data.chart.result[0].meta;
          return {
            price: meta.regularMarketPrice,
            change24h: meta.regularMarketPrice - meta.previousClose,
            change24hPercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
            volume24h: meta.regularMarketVolume,
            high24h: meta.regularMarketDayHigh,
            low24h: meta.regularMarketDayLow,
            marketCap: meta.marketCap,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching price data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchNewsData(symbol: string): Promise<NewsItem[] | null> {
    try {
      const newsApiKey = process.env.NEWS_API_KEY;
      if (!newsApiKey) return null;

      const query = symbol.replace('CRYPTO:', '');
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`
      );
      
      const data = await response.json();
      
      return data.articles?.map((article: any) => ({
        title: article.title,
        summary: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        relevanceScore: this.calculateRelevance(article.title, query)
      })) || [];
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchTechnicalData(symbol: string): Promise<any | null> {
    try {
      // This would integrate with technical analysis services
      // For now, return simulated data
      return {
        rsi: 45 + Math.random() * 30,
        macd: -0.5 + Math.random(),
        sma20: 100 + Math.random() * 20,
        sma50: 98 + Math.random() * 25,
        bb_upper: 110 + Math.random() * 10,
        bb_lower: 90 + Math.random() * 10,
      };
    } catch (error) {
      console.error(`Error fetching technical data for ${symbol}:`, error);
      return null;
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['rise', 'bull', 'gain', 'surge', 'rally', 'breakthrough', 'adoption'];
    const negativeWords = ['fall', 'bear', 'drop', 'crash', 'decline', 'dump', 'regulation'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateSentiment(news: NewsItem[]): { score: number; label: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
    if (news.length === 0) {
      return { score: 0, label: 'neutral', confidence: 0 };
    }

    const sentimentScores = news.map(item => {
      switch (item.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });

    const averageScore = sentimentScores.reduce((sum: number, score) => sum + score, 0) / sentimentScores.length;
    const confidence = Math.min(1, news.length / 10); // Higher confidence with more news items

    let label: 'bullish' | 'bearish' | 'neutral';
    if (averageScore > 0.2) label = 'bullish';
    else if (averageScore < -0.2) label = 'bearish';
    else label = 'neutral';

    return { score: averageScore, label, confidence };
  }

  private calculateRelevance(title: string, symbol: string): number {
    const lowerTitle = title.toLowerCase();
    const lowerSymbol = symbol.toLowerCase();
    
    if (lowerTitle.includes(lowerSymbol)) return 1.0;
    if (lowerTitle.includes('crypto') || lowerTitle.includes('bitcoin') || lowerTitle.includes('ethereum')) return 0.8;
    if (lowerTitle.includes('market') || lowerTitle.includes('trading')) return 0.6;
    return 0.4;
  }

  subscribe(symbol: string, callback: (data: EnhancedMarketData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(symbol)?.delete(callback);
      if (this.subscribers.get(symbol)?.size === 0) {
        this.subscribers.delete(symbol);
      }
    };
  }

  private notifySubscribers(symbol: string, data: EnhancedMarketData): void {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  private startRealTimeUpdates(): void {
    // Update popular symbols every 30 seconds
    const popularSymbols = ['CRYPTO:BTC', 'CRYPTO:ETH', 'AAPL', 'MSFT', 'GOOGL'];
    
    setInterval(() => {
      popularSymbols.forEach(symbol => {
        if (this.subscribers.has(symbol)) {
          this.getMarketData(symbol); // This will trigger updates for subscribers
        }
      });
    }, 30000);
  }
}

// Export singleton instance
export const enhancedMarketDataService = new EnhancedMarketDataService();