// lib/market-data.ts - Fixed version with proper error handling
import { EventEmitter } from 'events';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
  source: 'coinbase' | 'mock' | 'websocket';
}

class MarketDataService extends EventEmitter {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<(data: MarketData) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastDataCache: Map<string, MarketData> = new Map();
  
  // Mock data generator for when API is not available
  private generateMockData(symbol: string): MarketData {
    const basePrice = this.getBasePrice(symbol);
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * basePrice * volatility;
    
    return {
      symbol,
      price: basePrice + change,
      change24h: change,
      change24hPercent: (change / basePrice) * 100,
      high24h: basePrice + Math.abs(change) * 1.5,
      low24h: basePrice - Math.abs(change) * 1.5,
      volume24h: Math.random() * 1000000000,
      timestamp: Date.now(),
      source: 'mock'
    };
  }
  
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'CRYPTO:BTC': 45000,
      'CRYPTO:ETH': 3000,
      'CRYPTO:SOL': 100,
      'CRYPTO:MATIC': 0.8,
      'CRYPTO:LINK': 15,
      'CRYPTO:AVAX': 35,
      'CRYPTO:ADA': 0.5,
      'CRYPTO:DOT': 7
    };
    return prices[symbol] || 100;
  }
  
  async connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      // Check if we have Coinbase credentials
      const apiKey = process.env.NEXT_PUBLIC_COINBASE_API_KEY;
      
      if (!apiKey) {
        console.log('[MarketData] No Coinbase API key found, using mock data');
        this.startMockDataGenerator();
        this.isConnecting = false;
        return;
      }
      
      // Connect to Coinbase WebSocket
      this.connectWebSocket();
    } catch (error) {
      console.error('[MarketData] Connection error:', error);
      this.startMockDataGenerator();
    } finally {
      this.isConnecting = false;
    }
  }
  
  private connectWebSocket() {
    try {
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.ws.onopen = () => {
        console.log('[MarketData] WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to all tracked symbols
        const symbols = Array.from(this.subscriptions.keys()).map(symbol => {
          const pair = symbol.replace('CRYPTO:', '') + '-USD';
          return pair;
        });
        
        if (symbols.length > 0) {
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            channels: ['ticker'],
            product_ids: symbols
          }));
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ticker' && data.product_id) {
            const symbol = 'CRYPTO:' + data.product_id.replace('-USD', '');
            const marketData: MarketData = {
              symbol,
              price: parseFloat(data.price),
              change24h: parseFloat(data.price) - parseFloat(data.open_24h || data.price),
              change24hPercent: ((parseFloat(data.price) - parseFloat(data.open_24h || data.price)) / parseFloat(data.open_24h || data.price)) * 100,
              high24h: parseFloat(data.high_24h || data.price),
              low24h: parseFloat(data.low_24h || data.price),
              volume24h: parseFloat(data.volume_24h || '0'),
              timestamp: Date.now(),
              source: 'websocket'
            };
            
            this.lastDataCache.set(symbol, marketData);
            this.notifySubscribers(symbol, marketData);
          }
        } catch (error) {
          console.error('[MarketData] Error parsing message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[MarketData] WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('[MarketData] WebSocket closed');
        this.handleReconnect();
      };
      
    } catch (error) {
      console.error('[MarketData] WebSocket creation error:', error);
      this.startMockDataGenerator();
    }
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`[MarketData] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.log('[MarketData] Max reconnect attempts reached, falling back to mock data');
      this.startMockDataGenerator();
    }
  }
  
  private mockDataInterval: NodeJS.Timeout | null = null;
  
  private startMockDataGenerator() {
    if (this.mockDataInterval) return;
    
    console.log('[MarketData] Starting mock data generator');
    
    // Generate initial data
    this.subscriptions.forEach((_, symbol) => {
      const data = this.generateMockData(symbol);
      this.lastDataCache.set(symbol, data);
      this.notifySubscribers(symbol, data);
    });
    
    // Update every 2 seconds
    this.mockDataInterval = setInterval(() => {
      this.subscriptions.forEach((_, symbol) => {
        const data = this.generateMockData(symbol);
        this.lastDataCache.set(symbol, data);
        this.notifySubscribers(symbol, data);
      });
    }, 2000);
  }
  
  private notifySubscribers(symbol: string, data: MarketData) {
    const callbacks = this.subscriptions.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[MarketData] Subscriber callback error:', error);
        }
      });
    }
  }
  
  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
      
      // If WebSocket is connected, subscribe to this symbol
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pair = symbol.replace('CRYPTO:', '') + '-USD';
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['ticker'],
          product_ids: [pair]
        }));
      }
    }
    
    this.subscriptions.get(symbol)!.add(callback);
    
    // Send cached data if available
    const cachedData = this.lastDataCache.get(symbol);
    if (cachedData) {
      callback(cachedData);
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(symbol);
          
          // Unsubscribe from WebSocket if connected
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const pair = symbol.replace('CRYPTO:', '') + '-USD';
            this.ws.send(JSON.stringify({
              type: 'unsubscribe',
              channels: ['ticker'],
              product_ids: [pair]
            }));
          }
        }
      }
    };
  }
  
  async getMarketData(symbol: string): Promise<MarketData | null> {
    // Return cached data if available
    const cached = this.lastDataCache.get(symbol);
    if (cached) {
      return cached;
    }
    
    // Try to fetch from API if available
    try {
      const apiKey = process.env.NEXT_PUBLIC_COINBASE_API_KEY;
      
      if (apiKey) {
        return await this.fetchCoinbaseData(symbol);
      }
    } catch (error) {
      console.error('[MarketData] API fetch error:', error);
    }
    
    // Return mock data as fallback
    return this.generateMockData(symbol);
  }
  
  private async fetchCoinbaseData(symbol: string): Promise<MarketData> {
    // For now, return mock data
    // In production, implement proper Coinbase API calls
    return this.generateMockData(symbol);
  }
  
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.lastDataCache.clear();
    this.isConnecting = false;
  }
}

export const marketDataService = new MarketDataService();