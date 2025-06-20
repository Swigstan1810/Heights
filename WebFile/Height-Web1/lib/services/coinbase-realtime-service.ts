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

  // Popular trading pairs on Coinbase
  private readonly POPULAR_PAIRS = [
    'BTC-USD', 'ETH-USD', 'LTC-USD', 'BCH-USD', 'SOL-USD',
    'MATIC-USD', 'LINK-USD', 'AVAX-USD', 'DOT-USD', 'ADA-USD',
    'UNI-USD', 'AAVE-USD', 'SUSHI-USD', 'COMP-USD', 'MKR-USD'
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
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
        
        // Subscribe to popular pairs by default
        this.subscribeToProducts(this.POPULAR_PAIRS);
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
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
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
      const subscription = {
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'] // Only subscribe to public ticker channel
      };

      this.ws.send(JSON.stringify(subscription));
      productIds.forEach(id => this.subscribedProducts.add(id));
      console.log('[Coinbase] Subscribed to products:', productIds);
    }
  }

  private unsubscribeFromProducts(productIds: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscription = {
        type: 'unsubscribe',
        product_ids: productIds,
        channels: ['ticker'] // Only unsubscribe from public ticker channel
      };

      this.ws.send(JSON.stringify(unsubscription));
      productIds.forEach(id => this.subscribedProducts.delete(id));
      console.log('[Coinbase] Unsubscribed from products:', productIds);
    }
  }

  private handleMessage(data: any): void {
    this.lastHeartbeat = Date.now();

    if (data.type === 'ticker') {
      this.handleTickerData(data as CoinbaseTickerData);
    } else if (data.type === 'subscriptions') {
      console.log('[Coinbase] Subscription confirmed:', data);
    } else if (data.type === 'error') {
      console.error('[Coinbase] WebSocket error:', data);
    }
  }

  private async handleTickerData(ticker: CoinbaseTickerData): Promise<void> {
    try {
      const symbol = ticker.product_id.replace('-USD', '');
      const price = parseFloat(ticker.price);
      const open24h = parseFloat(ticker.open_24h);
      const change24h = price - open24h;
      const change24hPercent = open24h > 0 ? (change24h / open24h) * 100 : 0;

      const marketData: MarketData = {
        symbol,
        productId: ticker.product_id,
        price,
        change24h,
        change24hPercent,
        volume24h: parseFloat(ticker.volume_24h),
        high24h: parseFloat(ticker.high_24h),
        low24h: parseFloat(ticker.low_24h),
        timestamp: new Date(ticker.time),
        source: 'coinbase'
      };

      // Only update crypto_markets table
      await this.supabase
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
          coinbase_product_id: ticker.product_id,
          websocket_active: true,
          last_websocket_update: marketData.timestamp.toISOString(),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'symbol'
        });

      // Notify subscribers
      const callbacks = this.subscriptions.get(ticker.product_id);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(marketData);
          } catch (error) {
            console.error('[Coinbase] Error in subscription callback:', error);
          }
        });
      }

      // Also notify symbol-based subscriptions
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

    } catch (error) {
      console.error('[Coinbase] Error handling ticker data:', error);
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
    // Convert symbol to product ID if needed
    const productId = productIdOrSymbol.includes('-') 
      ? productIdOrSymbol 
      : `${productIdOrSymbol.toUpperCase()}-USD`;

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
    return await this.fetchFromRestAPI(symbol);
  }

  private async fetchFromRestAPI(symbol: string): Promise<MarketData | null> {
    try {
      const productId = `${symbol.toUpperCase()}-USD`;

      // Use cached products if available and not expired
      let products: any[] = [];
      const now = Date.now();
      if (
        this.productCache &&
        now - this.productCache.timestamp < this.PRODUCT_CACHE_DURATION
      ) {
        products = this.productCache.products;
      } else {
        const productsResponse = await fetch('https://api.exchange.coinbase.com/products');
        products = await productsResponse.json();
        this.productCache = { products, timestamp: now };
      }

      const validProduct = products.find((p: any) => p.id === productId);
      if (!validProduct) {
        console.error(`[Coinbase] Product ${productId} not found on Coinbase`);
        return null;
      }

      const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`);
      if (!response.ok) {
        console.error(`[Coinbase] REST API error: HTTP ${response.status} for ${productId}`);
        return null;
      }

      const ticker = await response.json();
      const price = parseFloat(ticker.price);
      const open24h = parseFloat(ticker.open || ticker.price);
      const change24h = price - open24h;

      return {
        symbol: symbol.toUpperCase(),
        productId,
        price,
        change24h,
        change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
        volume24h: parseFloat(ticker.volume || '0'),
        high24h: parseFloat(ticker.high || ticker.price),
        low24h: parseFloat(ticker.low || ticker.price),
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

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
    this.subscribedProducts.clear();
    this.isConnecting = false;
  }

  // Get popular trading pairs
  getPopularPairs(): string[] {
    return [...this.POPULAR_PAIRS];
  }

  // Get all available products from Coinbase
  async getAvailableProducts(): Promise<any[]> {
    try {
      const response = await fetch('https://api.exchange.coinbase.com/products');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const products = await response.json();
      return products.filter((p: any) => 
        p.quote_currency === 'USD' && 
        p.status === 'online' && 
        !p.trading_disabled
      );
    } catch (error) {
      console.error('[Coinbase] Error fetching products:', error);
      return [];
    }
  }

  /**
   * Gets market data for a single symbol on-demand.
   * This method connects, subscribes, waits for the first ticker message,
   * and then disconnects. It's useful for one-off requests without
   * maintaining a persistent connection.
   */
  public async getMarketDataForSymbol(symbol: string): Promise<MarketData | null> {
    const productId = `${symbol.toUpperCase()}-USD`;

    // Immediately return null for non-crypto symbols to avoid errors.
    // A more robust implementation would check against a list of known products.
    if (symbol.length > 5 || !/^[A-Z0-9]+$/.test(symbol)) {
        console.warn(`[Realtime] Invalid or non-crypto symbol format: ${symbol}`);
        return null;
    }

    return new Promise((resolve, reject) => {
      let tempWs: WebSocket | null = null;
      const timeout = setTimeout(() => {
        if (tempWs) {
          tempWs.close();
        }
        console.error(`[Realtime] Timeout fetching data for ${productId}`);
        reject(new Error(`Timeout fetching data for ${productId}`));
      }, 10000); // 10-second timeout

      try {
        tempWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');

        tempWs.onopen = () => {
          console.log(`[Realtime] Temporary WebSocket connected for ${productId}`);
          const subscription = {
            type: 'subscribe',
            product_ids: [productId],
            channels: ['ticker'],
          };
          tempWs?.send(JSON.stringify(subscription));
        };

        tempWs.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker' && data.product_id === productId) {
            clearTimeout(timeout);
            const price = parseFloat(data.price);
            const open24h = parseFloat(data.open_24h);
            const change24h = price - open24h;
            
            const marketData: MarketData = {
              symbol: symbol.toUpperCase(),
              productId,
              price,
              change24h,
              change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
              volume24h: parseFloat(data.volume_24h),
              high24h: parseFloat(data.high_24h),
              low24h: parseFloat(data.low_24h),
              timestamp: new Date(data.time),
              source: 'coinbase',
            };
            
            tempWs?.close();
            resolve(marketData);
          }
        };

        tempWs.onclose = () => {
          console.log(`[Realtime] Temporary WebSocket for ${productId} closed.`);
        };

        tempWs.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`[Realtime] Temporary WebSocket error for ${productId}:`, error);
          tempWs?.close();
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