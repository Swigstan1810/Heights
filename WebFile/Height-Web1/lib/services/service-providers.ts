// services/service-providers.ts
import { ServiceResponse, MarketDataPoint, NewsItem, ServiceProvider } from '@/types/ai-types';

// Base Service Class
abstract class BaseService {
  protected apiKey: string;
  protected baseUrl: string;
  protected rateLimits: { requests: number; period: number };
  protected lastRequest: number = 0;
  protected requestCount: number = 0;
  protected resetTime: number = 0;

  constructor(apiKey: string, baseUrl: string, rateLimits: { requests: number; period: number }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.rateLimits = rateLimits;
  }

  protected async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + (this.rateLimits.period * 1000);
    }
    
    if (this.requestCount >= this.rateLimits.requests) {
      return false;
    }
    
    this.requestCount++;
    return true;
  }

  protected async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> {
    const canProceed = await this.checkRateLimit();
    
    if (!canProceed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        source: this.getServiceName(),
        timestamp: new Date().toISOString(),
        rateLimited: true
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        source: this.getServiceName(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: this.getServiceName(),
        timestamp: new Date().toISOString()
      };
    }
  }

  abstract getServiceName(): ServiceProvider;
}

// Coinbase Service
export class CoinbaseService extends BaseService {
  constructor() {
    super(
      process.env.COINBASE_API_KEY || '',
      'https://api.pro.coinbase.com',
      { requests: 10, period: 1 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'coinbase';
  }

  async getPrice(symbol: string): Promise<ServiceResponse<MarketDataPoint>> {
    const cryptoSymbol = symbol.replace('CRYPTO:', '');
    const productId = `${cryptoSymbol}-USD`;
    
    const [tickerResponse, statsResponse] = await Promise.all([
      this.makeRequest(`/products/${productId}/ticker`),
      this.makeRequest(`/products/${productId}/stats`)
    ]);

    if (!tickerResponse.success || !statsResponse.success) {
      return {
        success: false,
        error: 'Failed to fetch Coinbase data',
        source: 'coinbase',
        timestamp: new Date().toISOString()
      };
    }

    const ticker = typeof tickerResponse.data === 'object' && tickerResponse.data !== null ? tickerResponse.data as any : {};
    const stats = typeof statsResponse.data === 'object' && statsResponse.data !== null ? statsResponse.data as any : {};

    const marketData: MarketDataPoint = {
      symbol,
      price: parseFloat(ticker.price),
      change: parseFloat(ticker.price) - parseFloat(stats.open),
      changePercent: ((parseFloat(ticker.price) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100,
      volume: parseFloat(stats.volume),
      high24h: parseFloat(stats.high),
      low24h: parseFloat(stats.low),
      timestamp: new Date().toISOString(),
      source: 'coinbase'
    };

    return {
      success: true,
      data: marketData,
      source: 'coinbase',
      timestamp: new Date().toISOString()
    };
  }
}

// Alpha Vantage Service
export class AlphaVantageService extends BaseService {
  constructor() {
    super(
      process.env.ALPHA_VANTAGE_API_KEY || '',
      'https://www.alphavantage.co/query',
      { requests: 5, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'alpha_vantage';
  }

  async getPrice(symbol: string): Promise<ServiceResponse<MarketDataPoint>> {
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/, '');
    
    const response = await this.makeRequest(
      `?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || typeof response.data !== 'object' || !('Global Quote' in response.data)) {
      return {
        success: false,
        error: 'No data found for symbol',
        source: 'alpha_vantage',
        timestamp: new Date().toISOString()
      };
    }

    const quote = (response.data as any)['Global Quote'];
    
    const marketData: MarketDataPoint = {
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high24h: parseFloat(quote['03. high']),
      low24h: parseFloat(quote['04. low']),
      timestamp: new Date().toISOString(),
      source: 'alpha_vantage'
    };

    return {
      success: true,
      data: marketData,
      source: 'alpha_vantage',
      timestamp: new Date().toISOString()
    };
  }

  async getCompanyOverview(symbol: string): Promise<ServiceResponse<any>> {
    const response = await this.makeRequest(
      `?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`
    );

    return response;
  }

  async getNews(symbol: string): Promise<ServiceResponse<NewsItem[]>> {
    const response = await this.makeRequest(
      `?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || typeof response.data !== 'object' || !('feed' in response.data)) {
      return {
        success: false,
        error: 'No news data found',
        source: 'alpha_vantage',
        timestamp: new Date().toISOString()
      };
    }

    const newsItems: NewsItem[] = (response.data as any).feed.slice(0, 10).map((item: any) => ({
      title: item.title,
      summary: item.summary,
      url: item.url,
      publishedAt: item.time_published,
      source: item.source,
      sentiment: this.mapSentiment(item.overall_sentiment_score),
      relevanceScore: item.relevance_score || 0.5,
      image: item.banner_image
    }));

    return {
      success: true,
      data: newsItems,
      source: 'alpha_vantage',
      timestamp: new Date().toISOString()
    };
  }

  private mapSentiment(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }
}

// Polygon Service
export class PolygonService extends BaseService {
  constructor() {
    super(
      process.env.NEXT_PUBLIC_POLYGON_API_KEY || '',
      'https://api.polygon.io',
      { requests: 5, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'polygon';
  }

  async getPrice(symbol: string): Promise<ServiceResponse<MarketDataPoint>> {
    const response = await this.makeRequest(
      `/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || typeof response.data !== 'object' || !('results' in response.data) || !(response.data as any).results?.length) {
      return {
        success: false,
        error: 'No data found for symbol',
        source: 'polygon',
        timestamp: new Date().toISOString()
      };
    }

    const result = (response.data as any).results[0];
    
    const marketData: MarketDataPoint = {
      symbol,
      price: result.c, // Close price
      change: result.c - result.o, // Close - Open
      changePercent: ((result.c - result.o) / result.o) * 100,
      volume: result.v,
      high24h: result.h,
      low24h: result.l,
      timestamp: new Date(result.t).toISOString(),
      source: 'polygon'
    };

    return {
      success: true,
      data: marketData,
      source: 'polygon',
      timestamp: new Date().toISOString()
    };
  }

  async getNews(symbol: string): Promise<ServiceResponse<NewsItem[]>> {
    const response = await this.makeRequest(
      `/v2/reference/news?ticker=${symbol}&limit=10&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || typeof response.data !== 'object' || !('results' in response.data)) {
      return {
        success: false,
        error: 'No news data found',
        source: 'polygon',
        timestamp: new Date().toISOString()
      };
    }

    const newsItems: NewsItem[] = (response.data as any).results.map((item: any) => ({
      title: item.title,
      summary: item.description || item.title,
      url: item.article_url,
      publishedAt: item.published_utc,
      source: item.publisher?.name || 'Polygon',
      sentiment: 'neutral', // Polygon doesn't provide sentiment
      relevanceScore: 0.8,
      image: item.image_url
    }));

    return {
      success: true,
      data: newsItems,
      source: 'polygon',
      timestamp: new Date().toISOString()
    };
  }
}

// Benzinga Service
export class BenzingaService extends BaseService {
  constructor() {
    super(
      process.env.BENZINGA_API_KEY || '',
      'https://api.benzinga.com/api/v2',
      { requests: 10, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'benzinga';
  }

  async getNews(symbol: string): Promise<ServiceResponse<NewsItem[]>> {
    const response = await this.makeRequest(
      `/news?symbols=${symbol}&token=${this.apiKey}`
    );

    if (!response.success || !Array.isArray(response.data)) {
      return {
        success: false,
        error: 'No news data found',
        source: 'benzinga',
        timestamp: new Date().toISOString()
      };
    }

    const newsItems: NewsItem[] = response.data.slice(0, 10).map((item: any) => ({
      title: item.title,
      summary: item.teaser || item.body?.slice(0, 200) || '',
      url: item.url,
      publishedAt: item.created,
      source: 'Benzinga',
      sentiment: this.analyzeSentiment(item.title + ' ' + (item.teaser || '')),
      relevanceScore: 0.9,
      image: item.images?.[0]?.url
    }));

    return {
      success: true,
      data: newsItems,
      source: 'benzinga',
      timestamp: new Date().toISOString()
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally', 'breakthrough'];
    const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge', 'concern'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

// GNews Service
export class GNewsService extends BaseService {
  constructor() {
    super(
      process.env.GNEWS_API_KEY || '',
      'https://gnews.io/api/v4',
      { requests: 10, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'gnews';
  }

  async getNews(query: string): Promise<ServiceResponse<NewsItem[]>> {
    const response = await this.makeRequest(
      `/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=10&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || typeof response.data !== 'object' || !('articles' in response.data)) {
      return {
        success: false,
        error: 'No news data found',
        source: 'gnews',
        timestamp: new Date().toISOString()
      };
    }

    const newsItems: NewsItem[] = (response.data as any).articles.map((item: any) => ({
      title: item.title,
      summary: item.description || '',
      url: item.url,
      publishedAt: item.publishedAt,
      source: item.source?.name || 'GNews',
      sentiment: this.analyzeSentiment(item.title + ' ' + (item.description || '')),
      relevanceScore: this.calculateRelevance(item.title, query),
      image: item.image
    }));

    return {
      success: true,
      data: newsItems,
      source: 'gnews',
      timestamp: new Date().toISOString()
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally', 'breakthrough'];
    const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge', 'concern'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateRelevance(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (titleLower.includes(queryLower)) return 1.0;
    
    const queryWords = queryLower.split(' ');
    const matchCount = queryWords.filter(word => titleLower.includes(word)).length;
    
    return matchCount / queryWords.length;
  }
}

// Twelve Data Service
export class TwelveDataService extends BaseService {
  constructor() {
    super(
      process.env.TWELVE_DATA_API_KEY || '',
      'https://api.twelvedata.com',
      { requests: 8, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'twelve_data';
  }

  async getPrice(symbol: string): Promise<ServiceResponse<MarketDataPoint>> {
    const response = await this.makeRequest(
      `/quote?symbol=${symbol}&apikey=${this.apiKey}`
    );

    if (!response.success || response.data == null || (response.data as any).status === 'error') {
      return {
        success: false,
        error: (typeof response.data === 'object' && response.data && 'message' in response.data) ? (response.data as any).message : 'No data found for symbol',
        source: 'twelve_data',
        timestamp: new Date().toISOString()
      };
    }

    const data = response.data as any;
    
    const marketData: MarketDataPoint = {
      symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      volume: parseInt(data.volume) || 0,
      high24h: parseFloat(data.high),
      low24h: parseFloat(data.low),
      timestamp: new Date().toISOString(),
      source: 'twelve_data'
    };

    return {
      success: true,
      data: marketData,
      source: 'twelve_data',
      timestamp: new Date().toISOString()
    };
  }

  async getTimeSeries(symbol: string, interval: string = '1day'): Promise<ServiceResponse<any>> {
    const response = await this.makeRequest(
      `/time_series?symbol=${symbol}&interval=${interval}&apikey=${this.apiKey}`
    );

    return response;
  }
}

// Perplexity Service
export class PerplexityService extends BaseService {
  constructor() {
    super(
      process.env.PERPLEXITY_API_KEY || '',
      'https://api.perplexity.ai',
      { requests: 20, period: 60 }
    );
  }

  getServiceName(): ServiceProvider {
    return 'perplexity';
  }

  async searchAndAnalyze(query: string): Promise<ServiceResponse<string>> {
    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial research assistant. Provide accurate, up-to-date information with proper citations and sources.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        top_p: 0.9,
        search_domain_filter: ['finance.yahoo.com', 'bloomberg.com', 'reuters.com', 'marketwatch.com'],
        return_citations: true,
        search_recency_filter: 'week'
      })
    });

    if (!response.success || !(response.data as any)?.choices?.[0]?.message?.content) {
      return {
        success: false,
        error: 'Failed to get response from Perplexity',
        source: 'perplexity',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      data: (response.data as any).choices[0].message.content,
      source: 'perplexity',
      timestamp: new Date().toISOString()
    };
  }

  async getMarketNews(symbol: string): Promise<ServiceResponse<string>> {
    const query = `Latest news and analysis for ${symbol} stock. Include recent price movements, analyst opinions, and market sentiment. Focus on the last 24-48 hours.`;
    
    return this.searchAndAnalyze(query);
  }

  async getMarketPrediction(symbol: string): Promise<ServiceResponse<string>> {
    const query = `${symbol} price prediction and technical analysis. What are analysts saying about future price targets? Include support and resistance levels, recent trends, and fundamental analysis.`;
    
    return this.searchAndAnalyze(query);
  }
}

// Service Factory
export class ServiceFactory {
  private static instances: Map<ServiceProvider, any> = new Map();

  static getService(provider: ServiceProvider): any {
    if (!this.instances.has(provider)) {
      switch (provider) {
        case 'coinbase':
          this.instances.set(provider, new CoinbaseService());
          break;
        case 'alpha_vantage':
          this.instances.set(provider, new AlphaVantageService());
          break;
        case 'polygon':
          this.instances.set(provider, new PolygonService());
          break;
        case 'twelve_data':
          this.instances.set(provider, new TwelveDataService());
          break;
        case 'benzinga':
          this.instances.set(provider, new BenzingaService());
          break;
        case 'gnews':
          this.instances.set(provider, new GNewsService());
          break;
        case 'perplexity':
          this.instances.set(provider, new PerplexityService());
          break;
        default:
          throw new Error(`Service provider ${provider} not supported`);
      }
    }
    
    return this.instances.get(provider);
  }

  static async getMarketData(symbol: string, providers: ServiceProvider[]): Promise<ServiceResponse<MarketDataPoint>[]> {
    const promises = providers
      .filter(p => ['coinbase', 'alpha_vantage', 'polygon', 'twelve_data'].includes(p))
      .map(async (provider) => {
        try {
          const service = this.getService(provider);
          return await service.getPrice(symbol);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: provider,
            timestamp: new Date().toISOString()
          };
        }
      });

    return Promise.all(promises);
  }

  static async getNewsData(symbol: string, providers: ServiceProvider[]): Promise<ServiceResponse<NewsItem[]>[]> {
    const promises = providers
      .filter(p => ['alpha_vantage', 'polygon', 'benzinga', 'gnews'].includes(p))
      .map(async (provider) => {
        try {
          const service = this.getService(provider);
          return await service.getNews(symbol);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: provider,
            timestamp: new Date().toISOString()
          };
        }
      });

    return Promise.all(promises);
  }
}