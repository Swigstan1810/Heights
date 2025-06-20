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

interface RateLimitInfo {
  requests: number;
  resetTime: number;
}

class CoinbaseAPI {
  private baseUrl = 'https://api.exchange.coinbase.com';
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;
  private rateLimits = new Map<string, RateLimitInfo>();
  private maxRequestsPerSecond = 5; // Reduced from 10 to be more conservative
  private isAuthenticated = false;
  private validProductsCache: Set<string> = new Set();
  private productsCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Known working USD pairs to reduce API calls
  private readonly KNOWN_WORKING_PAIRS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'MATIC-USD', 'LINK-USD',
    'AVAX-USD', 'DOT-USD', 'ADA-USD', 'UNI-USD', 'AAVE-USD',
    'ATOM-USD', 'ALGO-USD', 'XTZ-USD', 'COMP-USD', 'MKR-USD'
  ];

  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY || '';
    this.apiSecret = process.env.COINBASE_API_SECRET || '';
    this.passphrase = process.env.COINBASE_PASSPHRASE || '';
    
    this.isAuthenticated = !!(this.apiKey && this.apiSecret && this.passphrase);
    
    if (!this.isAuthenticated) {
      console.warn('[Coinbase API] Authentication credentials not provided - using public endpoints only');
    }
  }

  // Enhanced rate limiting
  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.rateLimits.get(endpoint);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(endpoint, {
        requests: 1,
        resetTime: now + 1000
      });
      return true;
    }
    
    if (limit.requests >= this.maxRequestsPerSecond) {
      console.warn(`[Coinbase API] Rate limit hit for ${endpoint}`);
      return false;
    }
    
    limit.requests++;
    return true;
  }

  // Generate signature for authenticated requests
  private generateSignature(
    method: string,
    requestPath: string,
    body: string,
    timestamp: string
  ): string {
    try {
      const message = timestamp + method + requestPath + body;
      const hmac = crypto.createHmac('sha256', this.apiSecret);
      const signature = hmac.update(message).digest('base64');
      return signature;
    } catch (error) {
      console.error('[Coinbase API] Error generating signature:', error);
      throw new Error('Failed to generate API signature');
    }
  }

  // Safe JSON parsing
  private safeJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('[Coinbase API] JSON parse error:', error);
      throw new Error('Invalid JSON response from Coinbase API');
    }
  }

  // Enhanced response validation
  private validateTickerResponse(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Check for essential price field
    if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
      return false;
    }
    
    return true;
  }

  // Improved request method with better error handling
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    retries = 2
  ): Promise<any> {
    // Check rate limits
    if (!await this.checkRateLimit(endpoint)) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!await this.checkRateLimit(endpoint)) {
        throw new Error('Rate limit exceeded for endpoint: ' + endpoint);
      }
    }

    const timestamp = (Date.now() / 1000).toFixed(3);
    const requestPath = endpoint;
    const bodyStr = body ? JSON.stringify(body) : '';

    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Heights-Trading-App/1.0'
    };

    // Add authentication headers if available
    if (this.isAuthenticated) {
      try {
        const signature = this.generateSignature(method, requestPath, bodyStr, timestamp);
        headers['CB-ACCESS-KEY'] = this.apiKey;
        headers['CB-ACCESS-SIGN'] = signature;
        headers['CB-ACCESS-TIMESTAMP'] = timestamp;
        headers['CB-ACCESS-PASSPHRASE'] = this.passphrase;
      } catch (error) {
        console.error('[Coinbase API] Authentication error:', error);
        // Continue without auth for public endpoints
      }
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers,
          body: bodyStr || undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle specific HTTP errors
          if (response.status === 404) {
            console.warn(`[Coinbase API] Resource not found: ${endpoint}`);
            return null;
          }
          
          if (response.status === 429) {
            console.warn(`[Coinbase API] Rate limited: ${endpoint}`);
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
              continue;
            }
          }

          let errorMessage = `Coinbase API Error: ${response.status} - ${response.statusText}`;
          
          try {
            const errorJson = this.safeJsonParse(errorText);
            if (errorJson.message) {
              errorMessage += ` - ${errorJson.message}`;
            }
          } catch {
            if (errorText) {
              errorMessage += ` - ${errorText.substring(0, 100)}`;
            }
          }
          
          throw new Error(errorMessage);
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          if (attempt < retries) {
            console.warn(`[Coinbase API] Empty response, retrying... ${attempt + 1}/${retries + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error('Empty response from Coinbase API');
        }

        return this.safeJsonParse(responseText);

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < retries) {
            console.warn(`[Coinbase API] Request timeout, retrying... ${attempt + 1}/${retries + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error('Coinbase API request timed out');
        }

        if (attempt === retries) {
          console.error('[Coinbase API] Request failed after all retries:', error);
          throw error;
        }

        console.warn(`[Coinbase API] Attempt ${attempt + 1} failed, retrying...`, error instanceof Error ? error.message : error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw new Error('All retry attempts failed');
  }

  // Get all available products with better filtering
  async getAllProducts(): Promise<CoinbaseProduct[]> {
    try {
      const response = await this.makeRequest('GET', '/products');
      
      if (!Array.isArray(response)) {
        throw new Error('Invalid products response - expected array');
      }

      // Filter and validate products more carefully
      const validProducts = response.filter((product: any) => {
        return product && 
               typeof product === 'object' &&
               product.id && 
               product.base_currency &&
               product.quote_currency &&
               product.status === 'online' &&
               !product.trading_disabled &&
               !product.post_only &&
               !product.cancel_only;
      });

      // Cache valid product IDs
      this.validProductsCache.clear();
      validProducts.forEach(product => {
        this.validProductsCache.add(product.id);
      });
      this.productsCacheTime = Date.now();

      console.log(`[Coinbase API] Cached ${validProducts.length} valid products`);
      return validProducts;

    } catch (error) {
      console.error('[Coinbase API] Error fetching products:', error);
      throw error;
    }
  }

  // Check if product is valid
  private async isValidProduct(productId: string): Promise<boolean> {
    // Use cache if available and fresh
    if (this.validProductsCache.size > 0 && 
        (Date.now() - this.productsCacheTime) < this.CACHE_DURATION) {
      return this.validProductsCache.has(productId);
    }

    // Check if it's a known working pair
    if (this.KNOWN_WORKING_PAIRS.includes(productId)) {
      return true;
    }

    // Refresh cache
    try {
      await this.getAllProducts();
      return this.validProductsCache.has(productId);
    } catch (error) {
      console.error('[Coinbase API] Error validating product:', error);
      // Fallback to known working pairs
      return this.KNOWN_WORKING_PAIRS.includes(productId);
    }
  }

  // Enhanced ticker fetching with better validation and error handling
  async getTicker(productId: string): Promise<CoinbaseTicker | null> {
    if (!productId || typeof productId !== 'string') {
      console.warn('[Coinbase API] Invalid product ID provided');
      return null;
    }

    // Validate product exists before making request
    if (!await this.isValidProduct(productId)) {
      console.warn(`[Coinbase API] Product ${productId} is not valid or trading disabled`);
      return null;
    }

    try {
      const ticker = await this.makeRequest('GET', `/products/${productId}/ticker`);

      if (!ticker) {
        console.warn(`[Coinbase API] No ticker data for ${productId}`);
        return null;
      }

      // Enhanced validation
      if (!this.validateTickerResponse(ticker)) {
        console.warn(`[Coinbase API] Invalid ticker response for ${productId}:`, 
          JSON.stringify(ticker).substring(0, 100));
        return null;
      }

      // Add product_id to response if missing
      if (!ticker.product_id) {
        ticker.product_id = productId;
      }

      return ticker as CoinbaseTicker;

    } catch (error) {
      // Don't log 404s as errors - they're expected for invalid products
      if (error instanceof Error && error.message.includes('404')) {
        console.debug(`[Coinbase API] Product ${productId} not found (404)`);
      } else {
        console.error(`[Coinbase API] Error fetching ticker for ${productId}:`, error);
      }
      return null;
    }
  }

  // Enhanced stats fetching
  async get24hrStats(productId: string): Promise<CoinbaseStats | null> {
    if (!productId || typeof productId !== 'string') {
      return null;
    }

    if (!await this.isValidProduct(productId)) {
      return null;
    }

    try {
      const stats = await this.makeRequest('GET', `/products/${productId}/stats`);

      if (!stats || typeof stats !== 'object') {
        return null;
      }

      // Validate essential fields
      if (!stats.open || !stats.high || !stats.low || !stats.volume) {
        console.warn(`[Coinbase API] Incomplete stats data for ${productId}`);
        return null;
      }

      return stats as CoinbaseStats;

    } catch (error) {
      if (!(error instanceof Error && error.message.includes('404'))) {
        console.error(`[Coinbase API] Error fetching stats for ${productId}:`, error);
      }
      return null;
    }
  }

  // Improved batch ticker fetching
  async getMultipleTickers(productIds: string[]): Promise<Map<string, CoinbaseTicker>> {
    const tickers = new Map<string, CoinbaseTicker>();
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return tickers;
    }

    // Filter valid product IDs
    const validProductIds = productIds.filter(id => 
      id && typeof id === 'string' && id.trim().length > 0
    );

    if (validProductIds.length === 0) {
      return tickers;
    }

    console.log(`[Coinbase API] Fetching tickers for ${validProductIds.length} products`);

    // Reduced batch size and increased delays for better reliability
    const batchSize = 3;
    const batchDelay = 500; // 500ms between batches
    
    for (let i = 0; i < validProductIds.length; i += batchSize) {
      const batch = validProductIds.slice(i, i + batchSize);
      
      console.log(`[Coinbase API] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(validProductIds.length/batchSize)}: ${batch.join(', ')}`);
      
      const promises = batch.map(async (id) => {
        try {
          // Add small random delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
          const ticker = await this.getTicker(id);
          return { id, ticker };
        } catch (err) {
          console.warn(`[Coinbase API] Failed to fetch ticker for ${id}:`, err instanceof Error ? err.message : err);
          return { id, ticker: null };
        }
      });
      
      try {
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.ticker) {
            tickers.set(batch[index], result.value.ticker);
          }
        });
        
        // Add delay between batches
        if (i + batchSize < validProductIds.length) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`[Coinbase API] Batch processing failed:`, error);
      }
    }
    
    console.log(`[Coinbase API] Successfully fetched ${tickers.size}/${validProductIds.length} tickers`);
    return tickers;
  }

  // Enhanced USD pairs fetching with better error handling
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
      console.log('[Coinbase API] Fetching USD pairs...');
      
      // Start with known working pairs to ensure we have some data
      let usdPairs: CoinbaseProduct[] = [];
      
      try {
        const products = await this.getAllProducts();
        
        // Filter for active USD pairs
        usdPairs = products.filter(p => 
          p.quote_currency === 'USD' && 
          !p.trading_disabled && 
          p.status === 'online' &&
          !p.post_only &&
          !p.limit_only &&
          !p.cancel_only
        );

        console.log(`[Coinbase API] Found ${usdPairs.length} USD pairs from API`);
      } catch (error) {
        console.warn('[Coinbase API] Failed to fetch products, using known pairs:', error);
        
        // Fallback to known working pairs
        usdPairs = this.KNOWN_WORKING_PAIRS.map(id => ({
          id,
          base_currency: id.split('-')[0],
          quote_currency: 'USD',
          display_name: `${id.split('-')[0]}/USD`,
          status: 'online',
          trading_disabled: false,
          post_only: false,
          limit_only: false,
          cancel_only: false
        } as CoinbaseProduct));
      }

      if (usdPairs.length === 0) {
        console.warn('[Coinbase API] No USD pairs found');
        return [];
      }

      // Prioritize major pairs and limit to avoid rate limits
      const majorPairs = usdPairs
        .filter(p => this.KNOWN_WORKING_PAIRS.includes(p.id))
        .concat(usdPairs.filter(p => !this.KNOWN_WORKING_PAIRS.includes(p.id)))
        .slice(0, 20); // Limit to 20 pairs to avoid rate limits

      console.log(`[Coinbase API] Processing ${majorPairs.length} priority USD pairs`);

      // Get tickers for selected pairs
      const productIds = majorPairs.map(p => p.id);
      const tickers = await this.getMultipleTickers(productIds);

      // Combine product and ticker data
      const pairsWithPrices: Array<{
        id: string;
        symbol: string;
        name: string;
        price: number;
        change24h: number;
        volume24h: number;
        high24h: number;
        low24h: number;
      }> = [];

      for (const product of majorPairs) {
        const ticker = tickers.get(product.id);
        if (!ticker) {
          console.debug(`[Coinbase API] No ticker data for ${product.id}`);
          continue;
        }

        try {
          // Get stats with timeout
          const statsPromise = this.get24hrStats(product.id);
          const timeoutPromise = new Promise<CoinbaseStats | null>((resolve) => {
            setTimeout(() => resolve(null), 3000); // 3 second timeout
          });
          
          const stats = await Promise.race([statsPromise, timeoutPromise]);
          
          const price = this.safeParseFloat(ticker.price);
          if (price <= 0) {
            console.warn(`[Coinbase API] Invalid price for ${product.id}: ${price}`);
            continue;
          }

          const open = stats ? this.safeParseFloat(stats.open, price) : price;
          const change24h = price - open;

          pairsWithPrices.push({
            id: product.id,
            symbol: product.base_currency,
            name: product.display_name || `${product.base_currency}/USD`,
            price: price,
            change24h: change24h,
            volume24h: stats ? this.safeParseFloat(stats.volume) * price : this.safeParseFloat(ticker.volume) * price,
            high24h: stats ? this.safeParseFloat(stats.high, price) : price,
            low24h: stats ? this.safeParseFloat(stats.low, price) : price
          });
          
        } catch (err) {
          console.warn(`[Coinbase API] Failed to process ${product.id}:`, err instanceof Error ? err.message : err);
          continue;
        }
      }

      console.log(`[Coinbase API] Successfully processed ${pairsWithPrices.length} USD pairs`);
      
      // Sort by volume descending
      return pairsWithPrices.sort((a, b) => b.volume24h - a.volume24h);

    } catch (error) {
      console.error('[Coinbase API] Error fetching USD pairs:', error);
      
      // Return empty array instead of throwing
      return [];
    }
  }

  // Safe float parsing
  private safeParseFloat(value: string | number | undefined, fallback = 0): number {
    if (value === undefined || value === null || value === '') return fallback;
    
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
  }

  // Place a market order (requires authentication)
  async placeMarketOrder(params: {
    side: 'buy' | 'sell';
    productId: string;
    size?: string;
    funds?: string;
  }) {
    if (!this.isAuthenticated) {
      throw new Error('API authentication required for placing orders');
    }

    if (!params.productId || !params.side) {
      throw new Error('Missing required order parameters');
    }

    if (params.side === 'buy' && !params.funds) {
      throw new Error('Funds required for buy orders');
    }

    if (params.side === 'sell' && !params.size) {
      throw new Error('Size required for sell orders');
    }

    try {
      const order = {
        type: 'market',
        side: params.side,
        product_id: params.productId,
        ...(params.side === 'buy' ? { funds: params.funds } : { size: params.size })
      };

      const result = await this.makeRequest('POST', '/orders', order);
      
      if (!result || !result.id) {
        throw new Error('Invalid order response from Coinbase');
      }

      return result;

    } catch (error) {
      console.error('[Coinbase API] Order placement failed:', error);
      throw error;
    }
  }

  // Get account balance (requires authentication)
  async getAccounts() {
    if (!this.isAuthenticated) {
      throw new Error('API authentication required for account access');
    }

    try {
      const accounts = await this.makeRequest('GET', '/accounts');
      
      if (!Array.isArray(accounts)) {
        throw new Error('Invalid accounts response from Coinbase');
      }

      return accounts;

    } catch (error) {
      console.error('[Coinbase API] Error fetching accounts:', error);
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Use a known working pair for health check
      const ticker = await this.getTicker('BTC-USD');
      return ticker !== null && typeof ticker.price === "string" && parseFloat(ticker.price) > 0;
    } catch (error) {
      console.error('[Coinbase API] Health check failed:', error);
      return false;
    }
  }

  // Get service status
  getStatus(): {
    isAuthenticated: boolean;
    canTrade: boolean;
    canAccessPublicData: boolean;
    validProductsCount: number;
  } {
    return {
      isAuthenticated: this.isAuthenticated,
      canTrade: this.isAuthenticated,
      canAccessPublicData: true,
      validProductsCount: this.validProductsCache.size
    };
  }
}

export const coinbaseAPI = new CoinbaseAPI();