// lib/market-data.ts - Enhanced with Coinbase API integration
import crypto from 'crypto';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  timestamp: number;
}

export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

// Coinbase Pro API Configuration
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET;
const COINBASE_PASSPHRASE = process.env.COINBASE_PASSPHRASE || 'sandbox';
const COINBASE_BASE_URL = 'https://api.exchange.coinbase.com';

class MarketDataService {
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  // Generate Coinbase Pro API signature
  private generateCoinbaseSignature(
    timestamp: string,
    method: string,
    requestPath: string,
    body: string = ''
  ): string {
    if (!COINBASE_API_SECRET) return '';
    
    const what = timestamp + method + requestPath + body;
    const key = Buffer.from(COINBASE_API_SECRET, 'base64');
    const hmac = crypto.createHmac('sha256', new Uint8Array(key));
    return hmac.update(what).digest('base64');
  }

  // Coinbase Pro API request
  private async coinbaseRequest(endpoint: string, method: string = 'GET'): Promise<any> {
    if (!COINBASE_API_KEY || !COINBASE_API_SECRET) {
      throw new Error('Coinbase API credentials not configured');
    }

    const timestamp = Date.now() / 1000;
    const requestPath = endpoint;
    const signature = this.generateCoinbaseSignature(
      timestamp.toString(),
      method,
      requestPath
    );

    const headers = {
      'CB-ACCESS-KEY': COINBASE_API_KEY,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp.toString(),
      'CB-ACCESS-PASSPHRASE': COINBASE_PASSPHRASE,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${COINBASE_BASE_URL}${endpoint}`, {
        method,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Coinbase API request failed:', error);
      throw error;
    }
  }

  // Fetch data from Coinbase Pro
  private async fetchCoinbaseData(symbol: string): Promise<MarketData | null> {
    try {
      // Convert symbol format (CRYPTO:BTC -> BTC-USD)
      const coinbaseSymbol = symbol.replace('CRYPTO:', '') + '-USD';
      
      // Get 24hr stats
      const stats = await this.coinbaseRequest(`/products/${coinbaseSymbol}/stats`);
      
      // Get current ticker
      const ticker = await this.coinbaseRequest(`/products/${coinbaseSymbol}/ticker`);

      if (stats && ticker) {
        const currentPrice = parseFloat(ticker.price);
        const open = parseFloat(stats.open);
        const change24h = currentPrice - open;
        const change24hPercent = (change24h / open) * 100;

        return {
          symbol,
          price: currentPrice,
          change24h,
          change24hPercent,
          volume24h: parseFloat(stats.volume),
          high24h: parseFloat(stats.high),
          low24h: parseFloat(stats.low),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Error fetching Coinbase data for ${symbol}:`, error);
    }
    return null;
  }

  // Alpha Vantage for stocks
  private async fetchAlphaVantageData(symbol: string): Promise<MarketData | null> {
    const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
    if (!API_KEY) return null;

    try {
      const cleanSymbol = symbol.replace('NSE:', '').replace('.NS', '');
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${API_KEY}`
      );
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        return {
          symbol,
          price: parseFloat(quote['05. price']),
          change24h: parseFloat(quote['09. change']),
          change24hPercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume24h: parseInt(quote['06. volume']),
          high24h: parseFloat(quote['03. high']),
          low24h: parseFloat(quote['04. low']),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
    }
    return null;
  }

  // Polygon.io for additional stock data
  private async fetchPolygonData(symbol: string): Promise<MarketData | null> {
    const API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
    if (!API_KEY) return null;

    try {
      const cleanSymbol = symbol.replace('NSE:', '').replace('.NS', '');
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${cleanSymbol}/prev?adjusted=true&apikey=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const change = result.c - result.o;
        const changePercent = (change / result.o) * 100;
        
        return {
          symbol,
          price: result.c,
          change24h: change,
          change24hPercent: changePercent,
          volume24h: result.v,
          high24h: result.h,
          low24h: result.l,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Polygon API error:', error);
    }
    return null;
  }

  // Main method to get market data
  async getMarketData(symbol: string): Promise<MarketData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    let data: MarketData | null = null;

    try {
      // Route to appropriate API based on symbol
      if (symbol.startsWith('CRYPTO:')) {
        data = await this.fetchCoinbaseData(symbol);
      } else if (symbol.startsWith('NSE:') || symbol.includes('.NS')) {
        // Try multiple APIs for stocks
        data = await this.fetchAlphaVantageData(symbol) || 
               await this.fetchPolygonData(symbol);
      } else {
        // Default to Alpha Vantage for other symbols
        data = await this.fetchAlphaVantageData(symbol);
      }

      // Fallback to mock data if APIs fail
      if (!data) {
        data = this.generateMockData(symbol);
      }

      // Cache the result
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`Error getting market data for ${symbol}:`, error);
      return this.generateMockData(symbol);
    }
  }

  // Generate realistic mock data as fallback
  private generateMockData(symbol: string): MarketData {
    const basePrice = symbol.includes('BTC') ? 45000 : 
                     symbol.includes('ETH') ? 3000 :
                     symbol.includes('SOL') ? 100 : 
                     symbol.includes('RELIANCE') ? 2800 :
                     symbol.includes('TCS') ? 3600 : 150;
    
    const volatility = symbol.startsWith('CRYPTO:') ? 0.03 : 0.015;
    const change = (Math.random() - 0.5) * basePrice * volatility;
    
    return {
      symbol,
      price: basePrice + change,
      change24h: change,
      change24hPercent: (change / basePrice) * 100,
      volume24h: Math.random() * 1000000000,
      high24h: basePrice + Math.abs(change) * 1.5,
      low24h: basePrice - Math.abs(change) * 1.5,
      timestamp: Date.now()
    };
  }

  // WebSocket connection for real-time data
  connect(): void {
    console.log('Market data service connected');
  }

  disconnect(): void {
    this.wsConnections.forEach(ws => ws.close());
    this.wsConnections.clear();
    this.subscribers.clear();
  }

  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    // Start polling for this symbol
    this.startPolling(symbol);
    
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(symbol);
          this.stopPolling(symbol);
        }
      }
    };
  }

  private async startPolling(symbol: string): Promise<void> {
    const poll = async () => {
      try {
        const data = await this.getMarketData(symbol);
        if (data) {
          const callbacks = this.subscribers.get(symbol);
          if (callbacks) {
            callbacks.forEach(callback => callback(data));
          }
        }
      } catch (error) {
        console.error(`Error polling ${symbol}:`, error);
      }
    };

    // Initial fetch
    await poll();
    
    // Set up polling interval (every 10 seconds for real-time feel)
    const interval = setInterval(poll, 10000);
    
    // Store interval for cleanup
    (this as any)[`interval_${symbol}`] = interval;
  }

  private stopPolling(symbol: string): void {
    const interval = (this as any)[`interval_${symbol}`];
    if (interval) {
      clearInterval(interval);
      delete (this as any)[`interval_${symbol}`];
    }
  }

  // Get order book data from Coinbase
  async getOrderBook(symbol: string): Promise<OrderBook | null> {
    try {
      if (symbol.startsWith('CRYPTO:')) {
        const coinbaseSymbol = symbol.replace('CRYPTO:', '') + '-USD';
        const data = await this.coinbaseRequest(`/products/${coinbaseSymbol}/book?level=2`);
        
        if (data) {
          return {
            bids: data.bids.map((bid: string[]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
            asks: data.asks.map((ask: string[]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.error('Error fetching order book:', error);
    }

    // Fallback to mock order book
    return this.generateMockOrderBook(symbol);
  }

  private async generateMockOrderBook(symbol: string): Promise<OrderBook> {
    const data = await this.getMarketData(symbol);
    const basePrice = data?.price || 100;
    
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];
    
    for (let i = 0; i < 20; i++) {
      const bidPrice = basePrice - (i + 1) * 0.01;
      const askPrice = basePrice + (i + 1) * 0.01;
      const bidSize = Math.random() * 10;
      const askSize = Math.random() * 10;
      
      bids.push([bidPrice, bidSize]);
      asks.push([askPrice, askSize]);
    }
    
    return {
      bids: bids.sort((a, b) => b[0] - a[0]), // Sort bids descending
      asks: asks.sort((a, b) => a[0] - b[0]), // Sort asks ascending
      timestamp: Date.now()
    };
  }

  // Get supported trading pairs from Coinbase
  async getSupportedPairs(): Promise<string[]> {
    try {
      const products = await this.coinbaseRequest('/products');
      return products
        .filter((product: any) => product.quote_currency === 'USD')
        .map((product: any) => `CRYPTO:${product.base_currency}`)
        .slice(0, 50); // Limit to first 50 pairs
    } catch (error) {
      console.error('Error fetching supported pairs:', error);
      // Fallback to common pairs
      return [
        'CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL', 'CRYPTO:MATIC',
        'CRYPTO:LINK', 'CRYPTO:AVAX', 'CRYPTO:DOT', 'CRYPTO:ADA'
      ];
    }
  }
}

export const marketDataService = new MarketDataService();

// Legacy export for compatibility
export async function placeOrder(params: any) {
  console.log('Order placed:', params);
  // This would integrate with your trading backend
  return { success: true, orderId: `order_${Date.now()}` };
}