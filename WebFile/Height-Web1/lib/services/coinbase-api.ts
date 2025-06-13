// lib/services/coinbase-api.ts
import crypto from 'crypto';

interface CoinbaseProduct {
  id: string;
  base_currency: string;
  quote_currency: string;
  base_min_size: string;
  base_max_size: string;
  quote_increment: string;
  base_increment: string;
  display_name: string;
  min_market_funds: string;
  max_market_funds: string;
  margin_enabled: boolean;
  fx_stablecoin: boolean;
  max_slippage_percentage: string;
  post_only: boolean;
  limit_only: boolean;
  cancel_only: boolean;
  trading_disabled: boolean;
  status: string;
  status_message: string;
  auction_mode: boolean;
}

interface CoinbaseTicker {
  product_id: string;
  price: string;
  size: string;
  time: string;
  bid: string;
  ask: string;
  volume: string;
  trade_id: number;
  last_size: string;
}

interface CoinbaseStats {
  open: string;
  high: string;
  low: string;
  volume: string;
  last: string;
  volume_30day: string;
}

class CoinbaseAPI {
  private baseUrl = 'https://api.exchange.coinbase.com';
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;

  constructor() {
    // These should be in your environment variables
    this.apiKey = process.env.COINBASE_API_KEY || '';
    this.apiSecret = process.env.COINBASE_API_SECRET || '';
    this.passphrase = process.env.COINBASE_PASSPHRASE || '';
  }

  // Generate signature for authenticated requests
  private generateSignature(
    method: string,
    requestPath: string,
    body: string,
    timestamp: string
  ): string {
    const message = timestamp + method + requestPath + body;
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    const signature = hmac.update(message).digest('base64');
    return signature;
  }

  // Make authenticated request
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const timestamp = (Date.now() / 1000).toFixed(3);
    const requestPath = endpoint;
    const bodyStr = body ? JSON.stringify(body) : '';

    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Heights-Trading-App'
    };

    // Add authentication headers if API key is available
    if (this.apiKey && this.apiSecret) {
      const signature = this.generateSignature(method, requestPath, bodyStr, timestamp);
      headers['CB-ACCESS-KEY'] = this.apiKey;
      headers['CB-ACCESS-SIGN'] = signature;
      headers['CB-ACCESS-TIMESTAMP'] = timestamp;
      headers['CB-ACCESS-PASSPHRASE'] = this.passphrase;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: bodyStr || undefined
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Coinbase API Error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Coinbase API request failed:', error);
      throw error;
    }
  }

  // Get all available products (trading pairs)
  async getAllProducts(): Promise<CoinbaseProduct[]> {
    try {
      // This endpoint doesn't require authentication
      const response = await fetch(`${this.baseUrl}/products`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Coinbase products:', error);
      throw error;
    }
  }

  // Get ticker data for a specific product
  async getTicker(productId: string): Promise<CoinbaseTicker> {
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}/ticker`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticker: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching ticker:', error);
      throw error;
    }
  }

  // Get 24hr stats for a product
  async get24hrStats(productId: string): Promise<CoinbaseStats> {
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Get multiple tickers at once
  async getMultipleTickers(productIds: string[]): Promise<Map<string, CoinbaseTicker>> {
    const tickers = new Map<string, CoinbaseTicker>();
    
    // Batch requests to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const promises = batch.map(id => 
        this.getTicker(id).catch(err => {
          console.error(`Failed to fetch ticker for ${id}:`, err);
          return null;
        })
      );
      
      const results = await Promise.all(promises);
      results.forEach((ticker, index) => {
        if (ticker) {
          tickers.set(batch[index], ticker);
        }
      });
      
      // Small delay to respect rate limits
      if (i + batchSize < productIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return tickers;
  }

  // Get all USD trading pairs with their current prices
  async getAllUSDPairs(): Promise<Array<{
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
  }>> {
    try {
      // Get all products
      const products = await this.getAllProducts();
      
      // Filter for USD pairs that are actively trading
      const usdPairs = products.filter(p => 
        p.quote_currency === 'USD' && 
        !p.trading_disabled && 
        p.status === 'online'
      );

      // Get tickers for all USD pairs
      const productIds = usdPairs.map(p => p.id);
      const tickers = await this.getMultipleTickers(productIds);

      // Combine product and ticker data
      const pairsWithPrices = await Promise.all(
        usdPairs.map(async (product) => {
          const ticker = tickers.get(product.id);
          if (!ticker) return null;

          try {
            const stats = await this.get24hrStats(product.id);
            const price = parseFloat(ticker.price);
            const open = parseFloat(stats.open);
            const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

            return {
              id: product.id,
              symbol: product.base_currency,
              name: product.display_name,
              price: price,
              change24h: change24h,
              volume24h: parseFloat(stats.volume) * price,
              high24h: parseFloat(stats.high),
              low24h: parseFloat(stats.low)
            };
          } catch (err) {
            console.error(`Failed to get stats for ${product.id}:`, err);
            return null;
          }
        })
      );

      return pairsWithPrices.filter(p => p !== null) as any[];
    } catch (error) {
      console.error('Error fetching all USD pairs:', error);
      throw error;
    }
  }

  // Place a market order (requires authentication)
  async placeMarketOrder(params: {
    side: 'buy' | 'sell';
    productId: string;
    size?: string; // For sell orders
    funds?: string; // For buy orders (USD amount)
  }) {
    if (!this.apiKey) {
      throw new Error('API authentication required for placing orders');
    }

    const order = {
      type: 'market',
      side: params.side,
      product_id: params.productId,
      ...(params.side === 'buy' ? { funds: params.funds } : { size: params.size })
    };

    return await this.makeRequest('POST', '/orders', order);
  }

  // Get account balance (requires authentication)
  async getAccounts() {
    if (!this.apiKey) {
      throw new Error('API authentication required for account access');
    }

    return await this.makeRequest('GET', '/accounts');
  }
}

export const coinbaseAPI = new CoinbaseAPI();