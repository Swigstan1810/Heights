// lib/services/coinbase-realtime-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface CoinbaseTickerData {
  type: string;
  sequence: number;
  product_id: string;
  price: string;
  open_24h: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: string;
  time: string;
  trade_id: number;
  last_size: string;
}

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

type SubscriptionCallback = (data: MarketData) => void;

class CoinbaseRealtimeService {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<SubscriptionCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private subscribedProducts = new Set<string>();
  private supabase = createClientComponentClient();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = Date.now();
  private productCache: { products: any[]; timestamp: number } | null = null;
  private PRODUCT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;
  private validProducts = new Set<string>();

  // Popular trading pairs that are verified to exist on Coinbase
  private readonly POPULAR_PAIRS = [
    'BTC-USD', 'ETH-USD', 'LTC-USD', 'BCH-USD', 'SOL-USD',
    'MATIC-USD', 'LINK-USD', 'AVAX-USD', 'DOT-USD', 'ADA-USD'
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeService();
    }
  }

  private async initializeService(): Promise<void> {
    try {
      // First validate which products actually exist
      await this.validateProducts();
      // Then connect to WebSocket
      await this.connect();
      this.isInitialized = true;
    } catch (error) {
      console.error('[Coinbase] Service initialization failed:', error);
      this.isInitialized = false;
    }
  }

  private async validateProducts(): Promise<void> {
    try {
      const now = Date.now();
      
      // Use cache if available and not expired
      if (this.productCache && (now - this.productCache.timestamp) < this.PRODUCT_CACHE_DURATION) {
        this.updateValidProducts(this.productCache.products);
        return;
      }

      console.log('[Coinbase] Fetching available products...');
      const response = await fetch('https://api.exchange.coinbase.com/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const products = await response.json();
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid products response');
      }

      this.productCache = { products, timestamp: now };
      this.updateValidProducts(products);
      
      console.log(`[Coinbase] Validated ${this.validProducts.size} products`);
    } catch (error) {
      console.error('[Coinbase] Product validation failed:', error);
      // Use popular pairs as fallback
      this.POPULAR_PAIRS.forEach(pair => this.validProducts.add(pair));
    }
  }

  private updateValidProducts(products: any[]): void {
    this.validProducts.clear();
    
    products.forEach(product => {
      if (
        product &&
        typeof product === 'object' &&
        product.id &&
        product.quote_currency === 'USD' &&
        product.status === 'online' &&
        !product.trading_disabled
      ) {
        this.validProducts.add(product.id);
      }
    });
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.ws.onopen = () => {
        console.log('[Coinbase] WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Subscribe to validated popular pairs
        const validPairs = this.POPULAR_PAIRS.filter(pair => this.validProducts.has(pair));
        if (validPairs.length > 0) {
          this.subscribeToProducts(validPairs);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[Coinbase] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[Coinbase] WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Coinbase] WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('[Coinbase] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`[Coinbase] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('[Coinbase] Max reconnect attempts reached');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('[Coinbase] Error sending ping:', error);
        }
        
        // Check if we received a heartbeat recently
        if (Date.now() - this.lastHeartbeat > 60000) { // 1 minute timeout
          console.warn('[Coinbase] Heartbeat timeout, reconnecting...');
          this.disconnect();
          this.connect();
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private subscribeToProducts(productIds: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Only subscribe to validated products
      const validProductIds = productIds.filter(id => this.validProducts.has(id));
      
      if (validProductIds.length === 0) {
        console.warn('[Coinbase] No valid products to subscribe to');
        return;
      }

      const subscription = {
        type: 'subscribe',
        product_ids: validProductIds,
        channels: ['ticker']
      };

      try {
        this.ws.send(JSON.stringify(subscription));
        validProductIds.forEach(id => this.subscribedProducts.add(id));
        console.log('[Coinbase] Subscribed to products:', validProductIds);
      } catch (error) {
        console.error('[Coinbase] Error subscribing to products:', error);
      }
    }
  }

  private unsubscribeFromProducts(productIds: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscription = {
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['ticker']
      };

      try {
        this.ws.send(JSON.stringify(unsubscription));
        productIds.forEach(id => this.subscribedProducts.delete(id));
        console.log('[Coinbase] Unsubscribed from products:', productIds);
      } catch (error) {
        console.error('[Coinbase] Error unsubscribing from products:', error);
      }
    }
  }

  private handleMessage(data: any): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    this.lastHeartbeat = Date.now();

    try {
      if (data.type === 'ticker') {
        this.handleTickerData(data as CoinbaseTickerData);
      } else if (data.type === 'subscriptions') {
        console.log('[Coinbase] Subscription confirmed:', data);
      } else if (data.type === 'error') {
        console.error('[Coinbase] WebSocket error:', data);
      }
    } catch (error) {
      console.error('[Coinbase] Error handling message:', error);
    }
  }

  private async handleTickerData(ticker: CoinbaseTickerData): Promise<void> {
    try {
      if (!ticker || !ticker.product_id || !ticker.price) {
        console.warn('[Coinbase] Invalid ticker data received');
        return;
      }

      const symbol = ticker.product_id.replace('-USD', '');
      const price = this.safeParseFloat(ticker.price);
      const open24h = this.safeParseFloat(ticker.open_24h);
      
      if (price === 0) {
        console.warn(`[Coinbase] Invalid price for ${symbol}`);
        return;
      }

      const change24h = price - open24h;
      const change24hPercent = open24h > 0 ? (change24h / open24h) * 100 : 0;

      const marketData: MarketData = {
        symbol,
        productId: ticker.product_id,
        price,
        change24h,
        change24hPercent,
        volume24h: this.safeParseFloat(ticker.volume_24h),
        high24h: this.safeParseFloat(ticker.high_24h, price),
        low24h: this.safeParseFloat(ticker.low_24h, price),
        timestamp: new Date(ticker.time || Date.now()),
        source: 'coinbase'
      };

      // Store in database (if table exists)
      await this.updateDatabase(marketData);

      // Notify subscribers
      this.notifySubscribers(ticker.product_id, symbol, marketData);

    } catch (error) {
      console.error('[Coinbase] Error handling ticker data:', error);
    }
  }

  private safeParseFloat(value: string | number | undefined, fallback = 0): number {
    if (value === undefined || value === null) return fallback;
    
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  private async updateDatabase(marketData: MarketData): Promise<void> {
    try {
      // Check if crypto_markets table exists before attempting to insert
      const { error } = await this.supabase
        .from('crypto_markets')
        .upsert({
          symbol: marketData.symbol,
          name: this.getSymbolName(marketData.symbol),
          price_usd: marketData.price,
          price_inr: marketData.price * 83, // Approximate USD to INR conversion
          change_24h: marketData.change24h,
          change_24h_percent: marketData.change24hPercent,
          volume_24h: marketData.volume24h,
          high_24h: marketData.high24h,
          low_24h: marketData.low24h,
          coinbase_product_id: marketData.productId,
          websocket_active: true,
          last_websocket_update: marketData.timestamp.toISOString(),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'symbol'
        });

      if (error) {
        // Don't log database errors as they might be expected (table doesn't exist, etc.)
        console.debug('[Coinbase] Database update skipped:', error.message);
      }
    } catch (error) {
      console.debug('[Coinbase] Database operation failed:', error);
    }
  }

  private notifySubscribers(productId: string, symbol: string, marketData: MarketData): void {
    // Notify product ID subscribers
    const callbacks = this.subscriptions.get(productId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(marketData);
        } catch (error) {
          console.error('[Coinbase] Error in subscription callback:', error);
        }
      });
    }

    // Notify symbol subscribers
    const symbolCallbacks = this.subscriptions.get(symbol);
    if (symbolCallbacks) {
      symbolCallbacks.forEach(callback => {
        try {
          callback(marketData);
        } catch (error) {
          console.error('[Coinbase] Error in symbol subscription callback:', error);
        }
      });
    }
  }

  private getSymbolName(symbol: string): string {
    const names: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'LTC': 'Litecoin',
      'BCH': 'Bitcoin Cash',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'AVAX': 'Avalanche',
      'DOT': 'Polkadot',
      'ADA': 'Cardano',
      'UNI': 'Uniswap',
      'AAVE': 'Aave',
      'SUSHI': 'SushiSwap',
      'COMP': 'Compound',
      'MKR': 'Maker'
    };
    return names[symbol] || symbol;
  }

  // Public API methods
  subscribe(productIdOrSymbol: string, callback: SubscriptionCallback): () => void {
    if (!this.isInitialized) {
      console.warn('[Coinbase] Service not initialized, cannot subscribe');
      return () => {};
    }

    // Convert symbol to product ID if needed
    const productId = productIdOrSymbol.includes('-') 
      ? productIdOrSymbol 
      : `${productIdOrSymbol.toUpperCase()}-USD`;

    // Check if product is valid
    if (!this.validProducts.has(productId)) {
      console.warn(`[Coinbase] Product ${productId} not available`);
      return () => {};
    }

    if (!this.subscriptions.has(productIdOrSymbol)) {
      this.subscriptions.set(productIdOrSymbol, new Set());
    }

    this.subscriptions.get(productIdOrSymbol)!.add(callback);

    // Subscribe to the product if not already subscribed
    if (!this.subscribedProducts.has(productId)) {
      this.subscribeToProducts([productId]);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(productIdOrSymbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(productIdOrSymbol);
          // Unsubscribe from product if no more listeners
          this.unsubscribeFromProducts([productId]);
        }
      }
    };
  }

  async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      return await this.fetchFromRestAPI(symbol);
    } catch (error) {
      console.error(`[Coinbase] Error getting market data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromRestAPI(symbol: string): Promise<MarketData | null> {
    try {
      const productId = `${symbol.toUpperCase()}-USD`;

      // Check if product is valid before making request
      if (!this.validProducts.has(productId)) {
        console.warn(`[Coinbase] Product ${productId} not available`);
        return null;
      }

      const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`);
      
      if (!response.ok) {
        console.error(`[Coinbase] REST API error: HTTP ${response.status} for ${productId}`);
        return null;
      }

      const ticker = await response.json();
      
      if (!ticker || typeof ticker !== 'object') {
        console.error(`[Coinbase] Invalid ticker response for ${productId}`);
        return null;
      }

      const price = this.safeParseFloat(ticker.price);
      const open24h = this.safeParseFloat(ticker.open, price);
      const change24h = price - open24h;

      return {
        symbol: symbol.toUpperCase(),
        productId,
        price,
        change24h,
        change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
        volume24h: this.safeParseFloat(ticker.volume),
        high24h: this.safeParseFloat(ticker.high, price),
        low24h: this.safeParseFloat(ticker.low, price),
        timestamp: new Date(),
        source: 'coinbase',
      };
    } catch (error) {
      console.error('[Coinbase] REST API error:', error);
      return null;
    }
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  getSubscribedProducts(): string[] {
    return Array.from(this.subscribedProducts);
  }

  getValidProducts(): string[] {
    return Array.from(this.validProducts);
  }

  isReady(): boolean {
    return this.isInitialized && this.validProducts.size > 0;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        console.error('[Coinbase] Error closing WebSocket:', error);
      }
      this.ws = null;
    }

    this.subscriptions.clear();
    this.subscribedProducts.clear();
    this.isConnecting = false;
    this.isInitialized = false;
  }

  // Get popular trading pairs
  getPopularPairs(): string[] {
    return [...this.POPULAR_PAIRS].filter(pair => this.validProducts.has(pair));
  }

  // Get all available products from Coinbase
  async getAvailableProducts(): Promise<any[]> {
    try {
      if (this.productCache && (Date.now() - this.productCache.timestamp) < this.PRODUCT_CACHE_DURATION) {
        return this.productCache.products.filter((p: any) => 
          p && p.quote_currency === 'USD' && p.status === 'online' && !p.trading_disabled
        );
      }

      const response = await fetch('https://api.exchange.coinbase.com/products');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const products = await response.json();
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid products response');
      }

      this.productCache = { products, timestamp: Date.now() };
      
      return products.filter((p: any) => 
        p && p.quote_currency === 'USD' && p.status === 'online' && !p.trading_disabled
      );
    } catch (error) {
      console.error('[Coinbase] Error fetching products:', error);
      return [];
    }
  }

  /**
   * Gets market data for a single symbol on-demand.
   */
  public async getMarketDataForSymbol(symbol: string): Promise<MarketData | null> {
    if (!symbol || typeof symbol !== 'string') {
      console.warn('[Coinbase] Invalid symbol provided');
      return null;
    }

    const productId = `${symbol.toUpperCase()}-USD`;

    // Validate symbol format
    if (symbol.length > 10 || !/^[A-Z0-9]+$/.test(symbol.toUpperCase())) {
      console.warn(`[Coinbase] Invalid symbol format: ${symbol}`);
      return null;
    }

    // Check if product is valid
    if (!this.validProducts.has(productId)) {
      console.warn(`[Coinbase] Product ${productId} not available on Coinbase`);
      return null;
    }

    return new Promise((resolve, reject) => {
      let tempWs: WebSocket | null = null;
      const timeout = setTimeout(() => {
        if (tempWs) {
          try {
            tempWs.close();
          } catch (error) {
            console.error('[Coinbase] Error closing temporary WebSocket:', error);
          }
        }
        console.error(`[Coinbase] Timeout fetching data for ${productId}`);
        reject(new Error(`Timeout fetching data for ${productId}`));
      }, 10000); // 10-second timeout

      try {
        tempWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

        tempWs.onopen = () => {
          console.log(`[Coinbase] Temporary WebSocket connected for ${productId}`);
          const subscription = {
            type: 'subscribe',
            product_ids: [productId],
            channels: ['ticker'],
          };
          
          try {
            tempWs?.send(JSON.stringify(subscription));
          } catch (error) {
            clearTimeout(timeout);
            console.error(`[Coinbase] Error sending subscription for ${productId}:`, error);
            tempWs?.close();
            reject(error);
          }
        };

        tempWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ticker' && data.product_id === productId) {
              clearTimeout(timeout);
              
              const price = this.safeParseFloat(data.price);
              const open24h = this.safeParseFloat(data.open_24h);
              const change24h = price - open24h;
              
              const marketData: MarketData = {
                symbol: symbol.toUpperCase(),
                productId,
                price,
                change24h,
                change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
                volume24h: this.safeParseFloat(data.volume_24h),
                high24h: this.safeParseFloat(data.high_24h, price),
                low24h: this.safeParseFloat(data.low_24h, price),
                timestamp: new Date(data.time || Date.now()),
                source: 'coinbase',
              };
              
              try {
                tempWs?.close();
              } catch (error) {
                console.error('[Coinbase] Error closing temporary WebSocket:', error);
              }
              resolve(marketData);
            }
          } catch (error) {
            clearTimeout(timeout);
            console.error(`[Coinbase] Error parsing message for ${productId}:`, error);
            try {
              tempWs?.close();
            } catch (closeError) {
              console.error('[Coinbase] Error closing temporary WebSocket:', closeError);
            }
            reject(error);
          }
        };

        tempWs.onclose = () => {
          console.log(`[Coinbase] Temporary WebSocket for ${productId} closed.`);
        };

        tempWs.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`[Coinbase] Temporary WebSocket error for ${productId}:`, error);
          try {
            tempWs?.close();
          } catch (closeError) {
            console.error('[Coinbase] Error closing temporary WebSocket:', closeError);
          }
          reject(error);
        };
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

// Export a singleton instance of the service
export const coinbaseRealtimeService = new CoinbaseRealtimeService();
export default coinbaseRealtimeService;