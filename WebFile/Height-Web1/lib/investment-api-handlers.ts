// lib/investment-api-handlers.ts
import { tradingAgent } from './claude-api';

// Types
export interface InvestmentAnalysisRequest {
  query: string;
  symbols: string[];
  assetType?: string;
  analysisType?: 'quick' | 'comprehensive';
}

export interface InvestmentRecommendationRequest {
  query: string;
  assetType?: string;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon?: 'short' | 'medium' | 'long';
}

// API Configuration
const API_ENDPOINTS = {
  coinbase: 'https://api.exchange.coinbase.com',
  alphaVantage: 'https://www.alphavantage.co/query',
  polygon: 'https://api.polygon.io',
  twelveData: 'https://api.twelvedata.com',
  gnews: 'https://gnews.io/api/v4',
  benzinga: 'https://api.benzinga.com/api/v2'
};

// Multi-source data fetcher
export class InvestmentDataFetcher {
  // Fetch cryptocurrency data
  async fetchCryptoData(symbol: string) {
    const results = await Promise.allSettled([
      this.fetchCoinbaseData(symbol),
      this.fetchTwelveDataCrypto(symbol),
      this.fetchPolygonCrypto(symbol)
    ]);

    // Aggregate results from successful sources
    const data = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    return this.aggregateData(data, 'crypto', symbol);
  }

  // Fetch stock data
  async fetchStockData(symbol: string) {
    const results = await Promise.allSettled([
      this.fetchAlphaVantageStock(symbol),
      this.fetchPolygonStock(symbol),
      this.fetchTwelveDataStock(symbol),
      this.fetchBenzingaQuote(symbol)
    ]);

    const data = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    return this.aggregateData(data, 'stock', symbol);
  }

  // Fetch mutual fund data (India focus)
  async fetchMutualFundData(fundName: string) {
    try {
      // For Indian mutual funds, we'll use Alpha Vantage or local APIs
      const response = await fetch(`${API_ENDPOINTS.alphaVantage}?function=MUTUAL_FUND_DATA&symbol=${encodeURIComponent(fundName)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
      const data = await response.json();

      return {
        name: fundName,
        nav: data.nav || 0,
        aum: data.aum || 0,
        category: data.category || 'Unknown',
        performance: {
          '1Y': data.returns_1y || 0,
          '3Y': data.returns_3y || 0,
          '5Y': data.returns_5y || 0
        }
      };
    } catch (error) {
      console.error('Mutual fund data error:', error);
      return null;
    }
  }

  // Fetch bond data
  async fetchBondData(bondSymbol: string) {
    try {
      // Fetch from multiple sources for bonds
      const isTreasury = bondSymbol.includes('US') || bondSymbol.includes('IN');
      
      if (isTreasury) {
        // Government bonds
        const response = await fetch(`${API_ENDPOINTS.alphaVantage}?function=TREASURY_YIELD&interval=daily&maturity=${bondSymbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
        const data = await response.json();
        
        return {
          symbol: bondSymbol,
          yield: data.value || 0,
          maturity: bondSymbol,
          type: 'government',
          rating: 'AAA'
        };
      } else {
        // Corporate bonds - use general quote APIs
        return this.fetchStockData(bondSymbol);
      }
    } catch (error) {
      console.error('Bond data error:', error);
      return null;
    }
  }

  // Fetch commodity data
  async fetchCommodityData(commodity: string) {
    const commoditySymbols: Record<string, string> = {
      'GOLD': 'GC=F',
      'SILVER': 'SI=F',
      'CRUDE OIL': 'CL=F',
      'NATURAL GAS': 'NG=F',
      'WHEAT': 'ZW=F',
      'CORN': 'ZC=F'
    };

    const symbol = commoditySymbols[commodity.toUpperCase()] || commodity;
    
    try {
      // Fetch from multiple sources
      const results = await Promise.allSettled([
        this.fetchAlphaVantageStock(symbol),
        this.fetchTwelveDataCommodity(symbol),
        this.fetchPolygonStock(symbol)
      ]);

      const data = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => (r as PromiseFulfilledResult<any>).value);

      return this.aggregateData(data, 'commodity', commodity);
    } catch (error) {
      console.error('Commodity data error:', error);
      return null;
    }
  }

  // Individual API implementations
  private async fetchCoinbaseData(symbol: string) {
    try {
      const pair = `${symbol}-USD`;
      const [tickerRes, statsRes, candlesRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.coinbase}/products/${pair}/ticker`),
        fetch(`${API_ENDPOINTS.coinbase}/products/${pair}/stats`),
        fetch(`${API_ENDPOINTS.coinbase}/products/${pair}/candles?granularity=86400`)
      ]);

      if (!tickerRes.ok) return null;

      const [ticker, stats, candles] = await Promise.all([
        tickerRes.json(),
        statsRes.json(),
        candlesRes.json()
      ]);

      return {
        source: 'coinbase',
        symbol,
        price: parseFloat(ticker.price),
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask),
        volume: parseFloat(ticker.volume),
        high24h: parseFloat(stats.high),
        low24h: parseFloat(stats.low),
        open24h: parseFloat(stats.open),
        changePercent: ((parseFloat(ticker.price) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100,
        timestamp: new Date().toISOString(),
        candles: candles.slice(0, 30) // Last 30 days
      };
    } catch (error) {
      console.error('Coinbase API error:', error);
      return null;
    }
  }

  private async fetchAlphaVantageStock(symbol: string) {
    if (!process.env.ALPHA_VANTAGE_API_KEY) return null;

    try {
      const [quoteRes, overviewRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.alphaVantage}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`),
        fetch(`${API_ENDPOINTS.alphaVantage}?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`)
      ]);

      const [quoteData, overviewData] = await Promise.all([
        quoteRes.json(),
        overviewRes.json()
      ]);

      if (!quoteData['Global Quote']) return null;

      const quote = quoteData['Global Quote'];
      return {
        source: 'alphaVantage',
        symbol,
        price: parseFloat(quote['05. price'] || '0'),
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        volume: parseInt(quote['06. volume'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        previousClose: parseFloat(quote['08. previous close'] || '0'),
        marketCap: parseFloat(overviewData.MarketCapitalization || '0'),
        pe: parseFloat(overviewData.PERatio || '0'),
        eps: parseFloat(overviewData.EPS || '0'),
        dividend: parseFloat(overviewData.DividendYield || '0'),
        beta: parseFloat(overviewData.Beta || '0'),
        description: overviewData.Description,
        sector: overviewData.Sector,
        industry: overviewData.Industry,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  }

  private async fetchPolygonStock(symbol: string) {
    if (!process.env.NEXT_PUBLIC_POLYGON_API_KEY) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      const [tickerRes, detailsRes, newsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.polygon}/v2/aggs/ticker/${symbol}/prev?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`),
        fetch(`${API_ENDPOINTS.polygon}/v3/reference/tickers/${symbol}?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`),
        fetch(`${API_ENDPOINTS.polygon}/v2/reference/news?ticker=${symbol}&limit=5&apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`)
      ]);

      const [tickerData, detailsData, newsData] = await Promise.all([
        tickerRes.json(),
        detailsRes.json(),
        newsRes.json()
      ]);

      if (!tickerData.results?.[0]) return null;

      const result = tickerData.results[0];
      return {
        source: 'polygon',
        symbol,
        price: result.c,
        open: result.o,
        high: result.h,
        low: result.l,
        volume: result.v,
        changePercent: ((result.c - result.o) / result.o) * 100,
        marketCap: detailsData.results?.market_cap,
        name: detailsData.results?.name,
        description: detailsData.results?.description,
        news: newsData.results?.map((item: any) => ({
          title: item.title,
          url: item.article_url,
          summary: item.description,
          publishedAt: item.published_utc,
          source: item.publisher.name
        })),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  }

  private async fetchTwelveDataStock(symbol: string) {
    if (!process.env.TWELVE_DATA_API_KEY) return null;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.twelveData}/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
      );
      const data = await response.json();

      if (!data.price) return null;

      return {
        source: 'twelveData',
        symbol,
        price: parseFloat(data.price),
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        volume: parseInt(data.volume),
        changePercent: parseFloat(data.percent_change),
        previousClose: parseFloat(data.previous_close),
        exchange: data.exchange,
        currency: data.currency,
        timestamp: data.datetime
      };
    } catch (error) {
      console.error('Twelve Data API error:', error);
      return null;
    }
  }

  private async fetchTwelveDataCrypto(symbol: string) {
    if (!process.env.TWELVE_DATA_API_KEY) return null;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.twelveData}/quote?symbol=${symbol}/USD&apikey=${process.env.TWELVE_DATA_API_KEY}`
      );
      const data = await response.json();

      if (!data.price) return null;

      return {
        source: 'twelveData',
        symbol,
        price: parseFloat(data.price),
        timestamp: data.datetime
      };
    } catch (error) {
      console.error('Twelve Data Crypto API error:', error);
      return null;
    }
  }

  private async fetchPolygonCrypto(symbol: string) {
    if (!process.env.NEXT_PUBLIC_POLYGON_API_KEY) return null;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.polygon}/v2/aggs/ticker/X:${symbol}USD/prev?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`
      );
      const data = await response.json();

      if (!data.results?.[0]) return null;

      const result = data.results[0];
      return {
        source: 'polygon',
        symbol,
        price: result.c,
        volume: result.v,
        timestamp: new Date(result.t).toISOString()
      };
    } catch (error) {
      console.error('Polygon Crypto API error:', error);
      return null;
    }
  }

  private async fetchTwelveDataCommodity(symbol: string) {
    if (!process.env.TWELVE_DATA_API_KEY) return null;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.twelveData}/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
      );
      const data = await response.json();

      if (!data.price) return null;

      return {
        source: 'twelveData',
        symbol,
        price: parseFloat(data.price),
        changePercent: parseFloat(data.percent_change),
        timestamp: data.datetime
      };
    } catch (error) {
      console.error('Twelve Data Commodity API error:', error);
      return null;
    }
  }

  private async fetchBenzingaQuote(symbol: string) {
    if (!process.env.BENZINGA_API_KEY) return null;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.benzinga}/quote?symbols=${symbol}&token=${process.env.BENZINGA_API_KEY}`
      );
      const data = await response.json();

      if (!data.quotes?.[symbol]) return null;

      const quote = data.quotes[symbol];
      return {
        source: 'benzinga',
        symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        marketCap: quote.marketCap,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Benzinga API error:', error);
      return null;
    }
  }

  // Aggregate data from multiple sources
  private aggregateData(sources: any[], assetType: string, symbol: string) {
    if (sources.length === 0) return null;

    // Calculate consensus price
    const prices = sources.map(s => s.price).filter(p => p);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Get the most complete data source
    const primarySource = sources.reduce((best, current) => {
      const currentKeys = Object.keys(current).length;
      const bestKeys = Object.keys(best).length;
      return currentKeys > bestKeys ? current : best;
    }, sources[0]);

    // Merge all news
    const allNews = sources
      .filter(s => s.news)
      .flatMap(s => s.news)
      .slice(0, 10);

    return {
      symbol,
      name: primarySource.name || symbol,
      type: assetType,
      price: avgPrice,
      change24h: primarySource.change || (avgPrice - (primarySource.previousClose || primarySource.open24h || avgPrice)),
      changePercent: primarySource.changePercent || 0,
      volume: primarySource.volume || 0,
      marketCap: primarySource.marketCap,
      high24h: primarySource.high || primarySource.high24h,
      low24h: primarySource.low || primarySource.low24h,
      lastUpdated: new Date().toISOString(),
      sources: sources.map(s => s.source),
      metadata: {
        ...primarySource,
        news: allNews,
        priceConsensus: {
          average: avgPrice,
          min: Math.min(...prices),
          max: Math.max(...prices),
          sourceCount: prices.length
        }
      }
    };
  }
}

// News fetcher
export class InvestmentNewsFetcher {
  async fetchNews(symbols: string[], assetTypes?: string[]) {
    const results = await Promise.allSettled([
      this.fetchGNewsData(symbols),
      this.fetchBenzingaNews(symbols),
      this.fetchPolygonNews(symbols)
    ]);

    const allNews = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => (r as PromiseFulfilledResult<any>).value)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);

    return this.analyzeNewsSentiment(allNews);
  }

  private async fetchGNewsData(symbols: string[]) {
    if (!process.env.GNEWS_API_KEY) return [];

    try {
      const query = symbols.join(' OR ');
      const response = await fetch(
        `${API_ENDPOINTS.gnews}/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=10&apikey=${process.env.GNEWS_API_KEY}`
      );
      const data = await response.json();

      return data.articles?.map((article: any) => ({
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        image: article.image
      })) || [];
    } catch (error) {
      console.error('GNews API error:', error);
      return [];
    }
  }

  private async fetchBenzingaNews(symbols: string[]) {
    if (!process.env.BENZINGA_API_KEY) return [];

    try {
      const response = await fetch(
        `${API_ENDPOINTS.benzinga}/news?symbols=${symbols.join(',')}&token=${process.env.BENZINGA_API_KEY}`
      );
      const data = await response.json();

      return data.map((item: any) => ({
        title: item.title,
        summary: item.teaser,
        url: item.url,
        source: 'Benzinga',
        publishedAt: item.created,
        tags: item.tags,
        stocks: item.stocks
      }));
    } catch (error) {
      console.error('Benzinga News API error:', error);
      return [];
    }
  }

  private async fetchPolygonNews(symbols: string[]) {
    if (!process.env.NEXT_PUBLIC_POLYGON_API_KEY) return [];

    try {
      const newsPromises = symbols.map(symbol =>
        fetch(`${API_ENDPOINTS.polygon}/v2/reference/news?ticker=${symbol}&limit=5&apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY}`)
          .then(res => res.json())
      );

      const results = await Promise.allSettled(newsPromises);
      const allNews = results
        .filter(r => r.status === 'fulfilled' && r.value.results)
        .flatMap(r => (r as PromiseFulfilledResult<any>).value.results);

      return allNews.map((item: any) => ({
        title: item.title,
        summary: item.description,
        url: item.article_url,
        source: item.publisher.name,
        publishedAt: item.published_utc,
        tickers: item.tickers
      }));
    } catch (error) {
      console.error('Polygon News API error:', error);
      return [];
    }
  }

  private analyzeNewsSentiment(news: any[]) {
    const positiveWords = [
      'gain', 'rise', 'surge', 'rally', 'bull', 'positive', 'growth',
      'profit', 'up', 'high', 'strong', 'boost', 'advance', 'soar',
      'breakthrough', 'success', 'win', 'beat', 'exceed', 'outperform'
    ];

    const negativeWords = [
      'fall', 'drop', 'decline', 'bear', 'negative', 'crash', 'plunge',
      'loss', 'down', 'low', 'weak', 'tumble', 'slump', 'dive', 'collapse',
      'crisis', 'fail', 'miss', 'underperform', 'concern', 'worry'
    ];

    return news.map(item => {
      const text = `${item.title} ${item.summary || ''}`.toLowerCase();
      const positiveCount = positiveWords.filter(word => text.includes(word)).length;
      const negativeCount = negativeWords.filter(word => text.includes(word)).length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveCount > negativeCount * 1.5) sentiment = 'positive';
      else if (negativeCount > positiveCount * 1.5) sentiment = 'negative';

      const relevance = this.calculateRelevance(text);

      return {
        ...item,
        sentiment,
        relevance,
        sentimentScore: (positiveCount - negativeCount) / (positiveCount + negativeCount + 1)
      };
    });
  }

  private calculateRelevance(text: string): number {
    const importantTerms = [
      'breaking', 'urgent', 'major', 'significant', 'announce',
      'report', 'earnings', 'merger', 'acquisition', 'regulation',
      'lawsuit', 'investigation', 'forecast', 'guidance', 'upgrade',
      'downgrade', 'analyst', 'target', 'price'
    ];

    const matchCount = importantTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;

    return Math.min(1, 0.5 + (matchCount * 0.1));
  }
}

// Technical Analysis
export class TechnicalAnalyzer {
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const macdValues = [];
    
    for (let i = 26; i < prices.length; i++) {
      macdValues.push(ema12[i] - ema26[i]);
    }
    
    const signalLine = this.calculateEMA(macdValues, 9);
    const signal = signalLine[signalLine.length - 1];
    
    return {
      value: macdLine,
      signal,
      histogram: macdLine - signal
    };
  }

  calculateEMA(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [data[0]];

    for (let i = 1; i < data.length; i++) {
      ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }

    return ema;
  }

  calculateSMA(data: number[], period: number): number[] {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  findSupportResistance(prices: number[]): { support: number; resistance: number } {
    const sorted = [...prices].sort((a, b) => a - b);
    const support = sorted[Math.floor(sorted.length * 0.1)];
    const resistance = sorted[Math.floor(sorted.length * 0.9)];
    
    return { support, resistance };
  }

  analyzeTrend(prices: number[]): { 
    trend: 'up' | 'down' | 'sideways';
    strength: number;
    momentum: number;
  } {
    if (prices.length < 10) return { trend: 'sideways', strength: 0, momentum: 0 };

    const recentPrices = prices.slice(-10);
    const oldPrices = prices.slice(-20, -10);

    const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const oldAvg = oldPrices.reduce((sum, p) => sum + p, 0) / oldPrices.length;

    const changePercent = ((recentAvg - oldAvg) / oldAvg) * 100;
    const momentum = changePercent / 10; // Normalize to -1 to 1

    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    if (changePercent > 2) trend = 'up';
    else if (changePercent < -2) trend = 'down';

    return {
      trend,
      strength: Math.abs(changePercent) / 10,
      momentum: Math.max(-1, Math.min(1, momentum))
    };
  }
}

// Main analysis orchestrator
export class InvestmentAnalyzer {
  private dataFetcher = new InvestmentDataFetcher();
  private newsFetcher = new InvestmentNewsFetcher();
  private technicalAnalyzer = new TechnicalAnalyzer();

  async analyzeAsset(symbol: string, assetType: string) {
    try {
      // Fetch data based on asset type
      let assetData;
      switch (assetType) {
        case 'crypto':
          assetData = await this.dataFetcher.fetchCryptoData(symbol);
          break;
        case 'stock':
          assetData = await this.dataFetcher.fetchStockData(symbol);
          break;
        case 'mutualfund':
          assetData = await this.dataFetcher.fetchMutualFundData(symbol);
          break;
        case 'bond':
          assetData = await this.dataFetcher.fetchBondData(symbol);
          break;
        case 'commodity':
          assetData = await this.dataFetcher.fetchCommodityData(symbol);
          break;
        default:
          // Try to auto-detect
          assetData = await this.autoDetectAndFetch(symbol);
      }

      if (!assetData) {
        throw new Error(`Unable to fetch data for ${symbol}`);
      }

      // Fetch news
      const news = await this.newsFetcher.fetchNews([symbol]);

      // Perform technical analysis if we have price history
      let technicalIndicators;
      if ('metadata' in assetData && (assetData.metadata?.candles || assetData.metadata?.priceHistory)) {
        const prices = (assetData.metadata.candles || assetData.metadata.priceHistory)
          .map((c: any) => c.close || c[1])
          .filter((p: any) => p);

        if (prices.length > 0) {
          const { support, resistance } = this.technicalAnalyzer.findSupportResistance(prices);
          const rsi = this.technicalAnalyzer.calculateRSI(prices);
          const macd = this.technicalAnalyzer.calculateMACD(prices);
          const trend = this.technicalAnalyzer.analyzeTrend(prices);

          technicalIndicators = {
            rsi,
            macd,
            support,
            resistance,
            trend,
            sma20: this.technicalAnalyzer.calculateSMA(prices, 20).slice(-1)[0],
            sma50: this.technicalAnalyzer.calculateSMA(prices, 50).slice(-1)[0]
          };
        }
      }

      // Generate AI-powered analysis using Claude
      const aiAnalysis = await this.generateAIAnalysis({
        assetData,
        news,
        technicalIndicators
      });

      return {
        asset: assetData,
        news: news.slice(0, 5),
        technicalIndicators,
        ...aiAnalysis
      };
    } catch (error) {
      console.error('Asset analysis error:', error);
      throw error;
    }
  }

  private async autoDetectAndFetch(symbol: string) {
    // Try crypto first (common pattern: 3-4 uppercase letters)
    if (/^[A-Z]{3,4}$/.test(symbol)) {
      const cryptoData = await this.dataFetcher.fetchCryptoData(symbol);
      if (cryptoData) return cryptoData;
    }

    // Try stock
    const stockData = await this.dataFetcher.fetchStockData(symbol);
    if (stockData) return stockData;

    // Try commodity
    const commodityData = await this.dataFetcher.fetchCommodityData(symbol);
    return commodityData;
  }

  private async generateAIAnalysis(data: any) {
    try {
      const context = `
Asset: ${data.assetData.symbol} (${data.assetData.name})
Type: ${data.assetData.type}
Current Price: $${data.assetData.price}
24h Change: ${data.assetData.changePercent}%
Volume: $${(data.assetData.volume / 1e6).toFixed(2)}M
Market Cap: ${data.assetData.marketCap ? `$${(data.assetData.marketCap / 1e9).toFixed(2)}B` : 'N/A'}

Technical Indicators:
${data.technicalIndicators ? `
- RSI: ${data.technicalIndicators.rsi?.toFixed(0)}
- MACD: ${data.technicalIndicators.macd?.value.toFixed(2)}
- Support: $${data.technicalIndicators.support?.toFixed(2)}
- Resistance: $${data.technicalIndicators.resistance?.toFixed(2)}
- Trend: ${data.technicalIndicators.trend?.trend} (strength: ${(data.technicalIndicators.trend?.strength * 100).toFixed(0)}%)
` : 'Not available'}

Recent News Sentiment:
${data.news.slice(0, 3).map((n: any) => `- ${n.sentiment}: ${n.title}`).join('\n')}

Provide a comprehensive investment analysis including:
1. Overview and current market position
2. Technical analysis insights
3. Fundamental analysis (if applicable)
4. Price predictions (24h, 7d, 30d) with confidence levels
5. Investment recommendation (buy/sell/hold) with reasoning
6. Risk assessment
`;

      const aiResponse = await tradingAgent.analyzeMarket(
        data.assetData.symbol,
        'comprehensive',
        { marketData: [data.assetData], newsData: data.news }
      );

      // Parse AI response and structure it
      return this.parseAIResponse(aiResponse, data);
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to rule-based analysis
      return this.generateRuleBasedAnalysis(data);
    }
  }

  private parseAIResponse(aiResponse: string, data: any) {
    // Extract key information from AI response
    const overview = this.extractSection(aiResponse, 'overview') || 
      `${data.assetData.name} is currently trading at ${data.assetData.price} with a ${data.assetData.changePercent}% change in the last 24 hours.`;

    const technicalBackground = this.extractSection(aiResponse, 'technical') ||
      this.generateTechnicalSummary(data.technicalIndicators);

    const predictions: any[] = this.extractPredictions(aiResponse) || 
      this.generateDefaultPredictions(data);

    const recommendation = this.extractRecommendation(aiResponse) ||
      this.generateDefaultRecommendation(data);

    return {
      overview,
      technicalBackground,
      predictions,
      recommendation
    };
  }

  private extractSection(text: string, section: string): string | null {
    const patterns: Record<string, RegExp> = {
      overview: /(?:overview|summary|position):\s*(.+?)(?:\n\n|\n(?=[A-Z])|$)/i,
      technical: /(?:technical\s*analysis|indicators):\s*(.+?)(?:\n\n|\n(?=[A-Z])|$)/i,
      fundamental: /(?:fundamental|fundamentals):\s*(.+?)(?:\n\n|\n(?=[A-Z])|$)/i
    };

    const match = text.match(patterns[section]);
    return match ? match[1].trim() : null;
  }

  private extractPredictions(text: string): any[] | null {
    const predictions: any[] = [];
    const timeframes = ['24h', '24 hours', '1 day', '7d', '7 days', '1 week', '30d', '30 days', '1 month'];
    
    for (const timeframe of timeframes) {
      const pattern = new RegExp(`${timeframe}[^\\$]*\\$([\\d,\\.]+)`, 'i');
      const match = text.match(pattern);
      
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        predictions.push({
          timeframe: timeframe.replace(/\s*(hours?|days?|weeks?|months?)/, '').replace(' ', ''),
          price,
          confidence: 0.7 + Math.random() * 0.2,
          direction: price > (predictions[0]?.price || 0) ? 'up' : 'down',
          reasoning: 'Based on technical analysis and market trends'
        });
      }
    }

    return predictions.length > 0 ? predictions : null;
  }

  private extractRecommendation(text: string): any | null {
    const actionMatch = text.match(/(?:recommend|recommendation|action):\s*(\w+)/i);
    const action = actionMatch ? actionMatch[1].toLowerCase() : null;

    if (!action || !['buy', 'sell', 'hold'].includes(action)) return null;

    const confidenceMatch = text.match(/(?:confidence|certainty):\s*(\d+)%/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.75;

    const riskMatch = text.match(/(?:risk|risk level):\s*(\w+)/i);
    const riskLevel = riskMatch ? riskMatch[1].toLowerCase() : 'medium';

    return {
      action,
      confidence,
      reasoning: this.extractReasoningFromText(text),
      riskLevel: ['low', 'medium', 'high'].includes(riskLevel) ? riskLevel : 'medium'
    };
  }

  private extractReasoningFromText(text: string): string {
    const reasoningMatch = text.match(/(?:because|due to|reasoning|reason):\s*(.+?)(?:\n|$)/i);
    return reasoningMatch ? reasoningMatch[1].trim() : 'Based on comprehensive market analysis';
  }

  private generateTechnicalSummary(indicators: any): string {
    if (!indicators) return 'Technical indicators are not available for this asset.';

    const parts = [];

    if (indicators.rsi) {
      const rsiStatus = indicators.rsi > 70 ? 'overbought' : indicators.rsi < 30 ? 'oversold' : 'neutral';
      parts.push(`RSI at ${indicators.rsi.toFixed(0)} indicates ${rsiStatus} conditions`);
    }

    if (indicators.trend) {
      parts.push(`The asset is in a ${indicators.trend.trend}trend with ${(indicators.trend.strength * 100).toFixed(0)}% strength`);
    }

    if (indicators.support && indicators.resistance) {
      parts.push(`Key support at ${indicators.support.toFixed(2)} and resistance at ${indicators.resistance.toFixed(2)}`);
    }

    return parts.join('. ') + '.';
  }

  private generateDefaultPredictions(data: any): any[] {
    const currentPrice = data.assetData.price;
    const volatility = Math.abs(data.assetData.changePercent) / 100;
    const trend = data.technicalIndicators?.trend?.trend || 'sideways';
    const momentum = data.technicalIndicators?.trend?.momentum || 0;

    const predictions: any[] = [
      {
        timeframe: '24h',
        price: currentPrice * (1 + (momentum * 0.01 + (Math.random() - 0.5) * volatility * 0.5)),
        confidence: 0.65 + Math.random() * 0.15,
        direction: momentum > 0 ? 'up' : momentum < 0 ? 'down' : 'neutral',
        reasoning: 'Based on current momentum and volatility patterns'
      },
      {
        timeframe: '7d',
        price: currentPrice * (1 + (momentum * 0.03 + (Math.random() - 0.5) * volatility)),
        confidence: 0.55 + Math.random() * 0.15,
        direction: trend,
        reasoning: 'Following established trend patterns'
      },
      {
        timeframe: '30d',
        price: currentPrice * (1 + (momentum * 0.05 + (Math.random() - 0.5) * volatility * 1.5)),
        confidence: 0.45 + Math.random() * 0.15,
        direction: trend,
        reasoning: 'Long-term projection based on historical patterns'
      }
    ];

    return predictions;
  }

  private generateDefaultRecommendation(data: any): any {
    const rsi = data.technicalIndicators?.rsi;
    const trend = data.technicalIndicators?.trend;
    const sentimentScore = this.calculateSentimentScore(data.news);

    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0.6;
    let reasoning = '';

    if (rsi && rsi < 30 && trend?.trend === 'up' && sentimentScore > 0.3) {
      action = 'buy';
      confidence = 0.75;
      reasoning = 'Oversold conditions with positive trend and sentiment';
    } else if (rsi && rsi > 70 && trend?.trend === 'down' && sentimentScore < -0.3) {
      action = 'sell';
      confidence = 0.75;
      reasoning = 'Overbought conditions with negative trend and sentiment';
    } else if (trend?.trend === 'up' && sentimentScore > 0) {
      action = 'buy';
      confidence = 0.65;
      reasoning = 'Positive trend alignment with market sentiment';
    } else if (trend?.trend === 'down' && sentimentScore < 0) {
      action = 'sell';
      confidence = 0.65;
      reasoning = 'Negative trend confirmed by market sentiment';
    } else {
      reasoning = 'Mixed signals suggest waiting for clearer direction';
    }

    const riskLevel = Math.abs(data.assetData.changePercent) > 5 ? 'high' :
                     Math.abs(data.assetData.changePercent) > 2 ? 'medium' : 'low';

    return { action, confidence, reasoning, riskLevel };
  }

  private calculateSentimentScore(news: any[]): number {
    if (!news || news.length === 0) return 0;

    const sentimentValues: number[] = news.map(n => 
      n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0
    );

    return sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  }

  private generateRuleBasedAnalysis(data: any) {
    return {
      overview: this.generateOverview(data),
      technicalBackground: this.generateTechnicalSummary(data.technicalIndicators),
      predictions: this.generateDefaultPredictions(data),
      recommendation: this.generateDefaultRecommendation(data)
    };
  }

  private generateOverview(data: any): string {
    const { assetData, news } = data;
    const sentimentScore = this.calculateSentimentScore(news);
    const sentimentText = sentimentScore > 0.3 ? 'positive' : sentimentScore < -0.3 ? 'negative' : 'mixed';

    return `${assetData.name} (${assetData.symbol}) is currently trading at ${assetData.price.toFixed(2)}, ` +
           `showing a ${assetData.changePercent >= 0 ? '+' : ''}${assetData.changePercent.toFixed(2)}% change in the last 24 hours. ` +
           `Trading volume stands at ${(assetData.volume / 1e6).toFixed(2)}M` +
           (assetData.marketCap ? `, with a market cap of ${(assetData.marketCap / 1e9).toFixed(2)}B. ` : '. ') +
           `Recent news sentiment appears ${sentimentText}, ` +
           `${sentimentScore > 0 ? 'supporting bullish momentum' : sentimentScore < 0 ? 'indicating bearish pressure' : 'suggesting market uncertainty'}.`;
  }

  async getInvestmentRecommendations(request: InvestmentRecommendationRequest) {
    try {
      // Determine which assets to analyze
      const assetTypes = request.assetType === 'all' ? 
        ['crypto', 'stock', 'commodity'] : [request.assetType];

      const recommendations = [];

      for (const type of assetTypes) {
        const topAssets = await this.getTopAssetsByType(type || '', request.riskProfile);
        
        for (const asset of topAssets.slice(0, 3)) {
          try {
            const analysis = await this.analyzeAsset(asset.symbol || '', type || '');
            if (analysis.recommendation.action === 'buy') {
              recommendations.push({
                ...analysis,
                score: this.calculateRecommendationScore(analysis, request)
              });
            }
          } catch (error) {
            console.error(`Error analyzing ${asset.symbol}:`, error);
          }
        }
      }

      // Sort by score and return top recommendations
      recommendations.sort((a, b) => b.score - a.score);

      return {
        recommendations: recommendations.slice(0, 5),
        summary: this.generateRecommendationSummary(recommendations, request)
      };
    } catch (error) {
      console.error('Recommendation generation error:', error);
      throw error;
    }
  }

  private async getTopAssetsByType(type: string, riskProfile?: string) {
    // This would typically fetch from a database or API
    // For now, return popular assets by type
    const topAssets: Record<string, any[]> = {
      crypto: [
        { symbol: 'BTC', name: 'Bitcoin', risk: 'medium' },
        { symbol: 'ETH', name: 'Ethereum', risk: 'medium' },
        { symbol: 'SOL', name: 'Solana', risk: 'high' },
        { symbol: 'MATIC', name: 'Polygon', risk: 'high' },
        { symbol: 'USDC', name: 'USD Coin', risk: 'low' }
      ],
      stock: [
        { symbol: 'AAPL', name: 'Apple', risk: 'low' },
        { symbol: 'MSFT', name: 'Microsoft', risk: 'low' },
        { symbol: 'GOOGL', name: 'Google', risk: 'medium' },
        { symbol: 'TSLA', name: 'Tesla', risk: 'high' },
        { symbol: 'NVDA', name: 'NVIDIA', risk: 'high' }
      ],
      commodity: [
        { symbol: 'GOLD', name: 'Gold', risk: 'low' },
        { symbol: 'SILVER', name: 'Silver', risk: 'medium' },
        { symbol: 'CL', name: 'Crude Oil', risk: 'high' }
      ]
    };

    let assets = topAssets[type] || [];

    // Filter by risk profile if specified
    if (riskProfile && riskProfile !== 'moderate') {
      assets = assets.filter(a => {
        if (riskProfile === 'conservative') return a.risk === 'low';
        if (riskProfile === 'aggressive') return a.risk === 'high';
        return true;
      });
    }

    return assets;
  }

  private calculateRecommendationScore(analysis: any, request: InvestmentRecommendationRequest): number {
    let score = 0;

    // Base score from recommendation confidence
    score += analysis.recommendation.confidence * 40;

    // Adjust for risk profile match
    const riskMatch = this.matchRiskProfile(analysis.recommendation.riskLevel, request.riskProfile);
    score += riskMatch * 20;

    // Technical indicators score
    if (analysis.technicalIndicators) {
      const rsi = analysis.technicalIndicators.rsi;
      if (rsi && rsi > 30 && rsi < 70) score += 10;
      if (analysis.technicalIndicators.trend?.trend === 'up') score += 15;
    }

    // News sentiment score
    const sentimentScore = this.calculateSentimentScore(analysis.news);
    score += sentimentScore * 10;

    // Recent performance
    if (analysis.asset.changePercent > 0 && analysis.asset.changePercent < 10) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private matchRiskProfile(riskLevel: string, profile?: string): number {
    if (!profile || profile === 'moderate') return 0.5;

    const matches: Record<string, Record<string, number>> = {
      conservative: { low: 1, medium: 0.3, high: 0 },
      moderate: { low: 0.5, medium: 1, high: 0.5 },
      aggressive: { low: 0, medium: 0.5, high: 1 }
    };

    return matches[profile]?.[riskLevel] || 0.5;
  }

  private generateRecommendationSummary(recommendations: any[], request: InvestmentRecommendationRequest): string {
    if (recommendations.length === 0) {
      return 'No strong buy recommendations found based on current market conditions. Consider holding existing positions or waiting for better opportunities.';
    }

    const topRec = recommendations[0];
    const summary = `Based on your ${request.riskProfile || 'moderate'} risk profile, ` +
      `I recommend ${topRec.asset.name} (${topRec.asset.symbol}) as the top opportunity. ` +
      `Currently trading at ${topRec.asset.price.toFixed(2)}, ` +
      `it shows ${topRec.recommendation.reasoning.toLowerCase()}. ` +
      `${recommendations.length > 1 ? `Other strong candidates include ${recommendations.slice(1, 3).map(r => r.asset.symbol).join(' and ')}.` : ''} ` +
      `Always remember to diversify your portfolio and invest only what you can afford to lose.`;

    return summary;
  }
}

// Export singleton instances
export const investmentDataFetcher = new InvestmentDataFetcher();
export const investmentNewsFetcher = new InvestmentNewsFetcher();
export const technicalAnalyzer = new TechnicalAnalyzer();
export const investmentAnalyzer = new InvestmentAnalyzer();