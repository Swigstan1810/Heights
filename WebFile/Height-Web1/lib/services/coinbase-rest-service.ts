// lib/services/coinbase-rest-service.ts
export interface MarketData {
  symbol: string;
  productId: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
  source: 'coinbase';
}

interface ProductCache {
  products: any[];
  timestamp: number;
  isValid: boolean;
}

interface RequestConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
}

class CoinbaseRestService {
  private productCache: ProductCache | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = 'https://api.exchange.coinbase.com';
  private readonly DEFAULT_CONFIG: RequestConfig = {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000
  };
  
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests

  // Rate limiting
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Safe HTTP request with retry logic
  private async makeRequest(
    url: string, 
    config: Partial<RequestConfig> = {}
  ): Promise<any> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.retries; attempt++) {
      try {
        await this.enforceRateLimit();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Heights-Trading-App'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited, wait longer before retry
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.warn(`[Coinbase REST] Rate limited, waiting ${waitTime}ms before retry ${attempt}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          if (response.status === 404) {
            // Product not found, don't retry
            console.warn(`[Coinbase REST] Product not found: ${url}`);
            return null;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        
        if (!text || text.trim() === '') {
          throw new Error('Empty response from Coinbase API');
        }

        try {
          return JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${finalConfig.timeout}ms`);
        }

        console.error(`[Coinbase REST] Attempt ${attempt} failed:`, lastError.message);

        // Don't retry on certain errors
        if (lastError.message.includes('Product not found') || 
            lastError.message.includes('Invalid JSON')) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < finalConfig.retries) {
          const delay = finalConfig.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  // Validate and sanitize response data
  private validateTickerData(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           typeof data.price === 'string' && 
           !isNaN(parseFloat(data.price)) &&
           parseFloat(data.price) > 0;
  }

  // Safe float parsing with validation
  private safeParseFloat(value: string | number | undefined, fallback = 0): number {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
      return fallback;
    }
    
    return parsed;
  }

  // Get and cache Coinbase products
  private async getCoinbaseProducts(): Promise<any[]> {
    const now = Date.now();
    
    // Return cached products if valid and not expired
    if (this.productCache && 
        this.productCache.isValid && 
        (now - this.productCache.timestamp) < this.CACHE_DURATION) {
      return this.productCache.products;
    }

    try {
      console.log('[Coinbase REST] Fetching products from API...');
      
      const products = await this.makeRequest(`${this.BASE_URL}/products`, {
        timeout: 15000, // Longer timeout for products endpoint
        retries: 2
      });

      if (!Array.isArray(products)) {
        throw new Error('Invalid products response - expected array');
      }

      // Filter and validate products
      const validProducts = products.filter(product => 
        product && 
        typeof product === 'object' &&
        product.id && 
        product.quote_currency === 'USD' &&
        product.status === 'online' &&
        !product.trading_disabled &&
        !product.post_only &&
        !product.cancel_only
      );

      this.productCache = {
        products: validProducts,
        timestamp: now,
        isValid: true
      };

      console.log(`[Coinbase REST] Cached ${validProducts.length} valid products`);
      return validProducts;

    } catch (error) {
      console.error('[Coinbase REST] Error fetching products:', error);
      
      // Return cached products if available, even if expired
      if (this.productCache && this.productCache.products.length > 0) {
        console.warn('[Coinbase REST] Using expired cache due to API error');
        return this.productCache.products;
      }
      
      // Mark cache as invalid
      if (this.productCache) {
        this.productCache.isValid = false;
      }
      
      throw error;
    }
  }

  // Validate symbol format
  private validateSymbol(symbol: string): boolean {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }
    
    const cleanSymbol = symbol.trim().toUpperCase();
    
    // Check format: 1-10 characters, alphanumeric only
    if (!/^[A-Z0-9]{1,10}$/.test(cleanSymbol)) {
      return false;
    }
    
    // Exclude obvious non-crypto symbols
    const excludedPatterns = [
      /^\d+$/, // Pure numbers
      /^[A-Z]{1}$/, // Single letters
    ];
    
    return !excludedPatterns.some(pattern => pattern.test(cleanSymbol));
  }

  // Check if product exists on Coinbase
  private async isValidProduct(symbol: string): Promise<boolean> {
    try {
      const products = await this.getCoinbaseProducts();
      const productId = `${symbol.toUpperCase()}-USD`;
      return products.some(product => product.id === productId);
    } catch (error) {
      console.error(`[Coinbase REST] Error checking product validity for ${symbol}:`, error);
      return false;
    }
  }

  // Main function to get market data
  public async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      // Validate symbol format
      if (!this.validateSymbol(symbol)) {
        console.warn(`[Coinbase REST] Invalid symbol format: ${symbol}`);
        return null;
      }

      const cleanSymbol = symbol.trim().toUpperCase();
      const productId = `${cleanSymbol}-USD`;

      // Check if product exists on Coinbase
      const isValid = await this.isValidProduct(cleanSymbol);
      if (!isValid) {
        console.warn(`[Coinbase REST] Product ${productId} not available on Coinbase`);
        return null;
      }

      console.log(`[Coinbase REST] Fetching market data for ${productId}`);

      // Fetch ticker data
      const ticker = await this.makeRequest(`${this.BASE_URL}/products/${productId}/ticker`);

      if (!ticker) {
        console.warn(`[Coinbase REST] No ticker data received for ${productId}`);
        return null;
      }

      // Validate ticker data
      if (!this.validateTickerData(ticker)) {
        console.error(`[Coinbase REST] Invalid ticker data for ${productId}:`, ticker);
        return null;
      }

      const price = this.safeParseFloat(ticker.price);
      
      if (price === 0) {
        console.warn(`[Coinbase REST] Invalid price (0) for ${productId}`);
        return null;
      }

      // Calculate 24h change
      const open24h = this.safeParseFloat(ticker.open, price);
      const change24h = price - open24h;
      const change24hPercent = open24h > 0 ? (change24h / open24h) * 100 : 0;

      // Create market data object
      const marketData: MarketData = {
        symbol: cleanSymbol,
        productId,
        price,
        change24h,
        change24hPercent,
        volume24h: this.safeParseFloat(ticker.volume),
        high24h: this.safeParseFloat(ticker.high, price),
        low24h: this.safeParseFloat(ticker.low, price),
        timestamp: new Date(),
        source: 'coinbase',
      };

      console.log(`[Coinbase REST] Successfully fetched data for ${productId}: $${price.toFixed(2)}`);
      return marketData;

    } catch (error) {
      if (error instanceof Error) {
        // Don't log 404 errors as they're expected for non-crypto symbols
        if (!error.message.includes('404') && !error.message.includes('Product not found')) {
          console.error(`[Coinbase REST] Error fetching market data for ${symbol}:`, error.message);
        }
      }
      return null;
    }
  }

  // Batch fetch market data for multiple symbols
  public async getMultipleMarketData(symbols: string[]): Promise<Map<string, MarketData>> {
    const results = new Map<string, MarketData>();
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      console.warn('[Coinbase REST] No symbols provided for batch fetch');
      return results;
    }

    const validSymbols = symbols.filter(symbol => this.validateSymbol(symbol));
    
    if (validSymbols.length === 0) {
      console.warn('[Coinbase REST] No valid symbols provided');
      return results;
    }

    console.log(`[Coinbase REST] Batch fetching data for ${validSymbols.length} symbols`);

    // Process symbols in smaller batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < validSymbols.length; i += batchSize) {
      batches.push(validSymbols.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[Coinbase REST] Processing batch ${batchIndex + 1}/${batches.length}`);
      
      const promises = batch.map(async (symbol) => {
        try {
          const data = await this.getMarketData(symbol);
          return { symbol: symbol.toUpperCase(), data };
        } catch (error) {
          console.error(`[Coinbase REST] Error in batch for ${symbol}:`, error);
          return { symbol: symbol.toUpperCase(), data: null };
        }
      });

      try {
        const batchResults = await Promise.allSettled(promises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data) {
            results.set(result.value.symbol, result.value.data);
          }
        });

        // Add delay between batches (except for the last one)
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`[Coinbase REST] Batch ${batchIndex + 1} failed:`, error);
      }
    }

    console.log(`[Coinbase REST] Batch complete: ${results.size}/${validSymbols.length} successful`);
    return results;
  }

  // Get available trading pairs
  public async getAvailablePairs(): Promise<string[]> {
    try {
      const products = await this.getCoinbaseProducts();
      return products.map(product => product.base_currency).sort();
    } catch (error) {
      console.error('[Coinbase REST] Error fetching available pairs:', error);
      return [];
    }
  }

  // Health check
  public async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.makeRequest(`${this.BASE_URL}/products/BTC-USD/ticker`, {
        timeout: 5000,
        retries: 1
      });
      
      return {
        isHealthy: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get service statistics
  public getStats(): {
    requestCount: number;
    cacheStatus: 'valid' | 'invalid' | 'empty';
    cacheAge: number;
    cachedProducts: number;
  } {
    return {
      requestCount: this.requestCount,
      cacheStatus: !this.productCache ? 'empty' : 
                   this.productCache.isValid ? 'valid' : 'invalid',
      cacheAge: this.productCache ? Date.now() - this.productCache.timestamp : 0,
      cachedProducts: this.productCache ? this.productCache.products.length : 0
    };
  }

  // Clear cache
  public clearCache(): void {
    this.productCache = null;
    console.log('[Coinbase REST] Cache cleared');
  }
}

// Export singleton instance and function
const coinbaseRestService = new CoinbaseRestService();

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  return coinbaseRestService.getMarketData(symbol);
}

export async function getMultipleMarketData(symbols: string[]): Promise<Map<string, MarketData>> {
  return coinbaseRestService.getMultipleMarketData(symbols);
}

export async function getAvailablePairs(): Promise<string[]> {
  return coinbaseRestService.getAvailablePairs();
}

export async function healthCheck(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> {
  return coinbaseRestService.healthCheck();
}

export { coinbaseRestService };