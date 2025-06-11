// lib/coinbase-service.ts
class CoinbaseWebSocketService {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Set<(data: any) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
  
    constructor() {
      this.connect();
    }
  
    connect() {
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
          
          // Subscribe to all active channels
          this.resubscribeAll();
        };
  
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[Coinbase] Error parsing message:', error);
          }
        };
  
        this.ws.onclose = () => {
          console.log('[Coinbase] WebSocket closed');
          this.isConnecting = false;
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
  
    private scheduleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
          console.log(`[Coinbase] Reconnecting... (attempt ${this.reconnectAttempts})`);
          this.connect();
        }, delay);
      }
    }
  
    private resubscribeAll() {
      const productIds = Array.from(this.subscribers.keys());
      if (productIds.length > 0) {
        this.subscribeToProducts(productIds);
      }
    }
  
    private subscribeToProducts(productIds: string[]) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const subscribeMessage = {
          type: 'subscribe',
          product_ids: productIds,
          channels: ['ticker']
        };
        
        this.ws.send(JSON.stringify(subscribeMessage));
        console.log('[Coinbase] Subscribed to:', productIds);
      }
    }
  
    private handleMessage(data: any) {
      if (data.type === 'ticker' && data.product_id) {
        const callbacks = this.subscribers.get(data.product_id);
        if (callbacks) {
          const formattedData = {
            symbol: data.product_id,
            price: parseFloat(data.price),
            change24h: parseFloat(data.price) - parseFloat(data.open_24h),
            change24hPercent: ((parseFloat(data.price) - parseFloat(data.open_24h)) / parseFloat(data.open_24h)) * 100,
            volume24h: parseFloat(data.volume_24h),
            high24h: parseFloat(data.high_24h),
            low24h: parseFloat(data.low_24h),
            timestamp: new Date(data.time)
          };
  
          callbacks.forEach(callback => callback(formattedData));
        }
      }
    }
  
    subscribe(productId: string, callback: (data: any) => void): () => void {
      if (!this.subscribers.has(productId)) {
        this.subscribers.set(productId, new Set());
        
        // Subscribe to the new product
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.subscribeToProducts([productId]);
        }
      }
      
      this.subscribers.get(productId)!.add(callback);
      
      // Return unsubscribe function
      return () => {
        const callbacks = this.subscribers.get(productId);
        if (callbacks) {
          callbacks.delete(callback);
          
          if (callbacks.size === 0) {
            this.subscribers.delete(productId);
            this.unsubscribeFromProduct(productId);
          }
        }
      };
    }
  
    private unsubscribeFromProduct(productId: string) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
          type: 'unsubscribe',
          product_ids: [productId],
          channels: ['ticker']
        };
        
        this.ws.send(JSON.stringify(unsubscribeMessage));
        console.log('[Coinbase] Unsubscribed from:', productId);
      }
    }
  
    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.subscribers.clear();
      this.isConnecting = false;
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
  }
  
  // Create singleton instance
  let coinbaseService: CoinbaseWebSocketService | null = null;
  
  export function getCoinbaseService(): CoinbaseWebSocketService {
    if (typeof window !== 'undefined' && !coinbaseService) {
      coinbaseService = new CoinbaseWebSocketService();
    }
    return coinbaseService!;
  }
  
  // Helper function to map crypto symbols to Coinbase product IDs
  export function getCoinbaseProductId(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'BTC': 'BTC-USD',
      'ETH': 'ETH-USD',
      'LTC': 'LTC-USD',
      'BCH': 'BCH-USD',
      'ETC': 'ETC-USD',
      'XLM': 'XLM-USD',
      'LINK': 'LINK-USD',
      'DOT': 'DOT-USD',
      'UNI': 'UNI-USD',
      'AAVE': 'AAVE-USD',
      'COMP': 'COMP-USD',
      'MKR': 'MKR-USD',
      'ZRX': 'ZRX-USD',
      'BAT': 'BAT-USD',
      'REP': 'REP-USD',
      'ZEC': 'ZEC-USD',
      'DASH': 'DASH-USD',
      'XTZ': 'XTZ-USD',
      'ATOM': 'ATOM-USD',
      'ADA': 'ADA-USD',
      'ALGO': 'ALGO-USD',
      'BAND': 'BAND-USD',
      'CVC': 'CVC-USD',
      'DNT': 'DNT-USD',
      'LOOM': 'LOOM-USD',
      'MANA': 'MANA-USD',
      'NMR': 'NMR-USD',
      'OMG': 'OMG-USD',
      'OXT': 'OXT-USD',
      'CGLD': 'CGLD-USD',
      'GRT': 'GRT-USD',
      'NKN': 'NKN-USD',
      'STORJ': 'STORJ-USD',
      'SUSHI': 'SUSHI-USD',
      'SKL': 'SKL-USD',
      'SNX': 'SNX-USD',
      'MATIC': 'MATIC-USD',
      'SOL': 'SOL-USD',
      'AVAX': 'AVAX-USD'
    };
    
    return mapping[symbol] || null;
  }
  
  export default getCoinbaseService;