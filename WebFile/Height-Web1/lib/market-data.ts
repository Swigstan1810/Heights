// lib/market-data.ts
import { supabase } from './supabase';

// Types for market data
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  timestamp: number;
}

export interface OrderBook {
  bids: Array<[number, number]>; // [price, quantity]
  asks: Array<[number, number]>; // [price, quantity]
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

// Coinbase WebSocket Feed Types
interface CoinbaseMessage {
  type: string;
  product_id?: string;
  time?: string;
  [key: string]: any;
}

interface CoinbaseTicker {
  type: 'ticker';
  product_id: string;
  price: string;
  open_24h: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: 'buy' | 'sell';
  time: string;
  trade_id: number;
  last_size: string;
}

// Symbol mapping utilities
export function toCoinbaseProductId(symbol: string): string {
  // App symbol: CRYPTO:BTC → Coinbase: BTC-USD
  if (symbol.startsWith('CRYPTO:')) {
    return symbol.replace('CRYPTO:', '') + '-USD';
  }
  // Add more mappings as needed
  return symbol;
}

export function toTradingViewSymbol(symbol: string): string {
  // App symbol: CRYPTO:BTC → TradingView: COINBASE:BTCUSD
  if (symbol.startsWith('CRYPTO:')) {
    return 'COINBASE:' + symbol.replace('CRYPTO:', '') + 'USD';
  }
  // Add more mappings as needed
  return symbol;
}

// WebSocket connection for real-time data
class MarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribedProducts: Set<string> = new Set();

  // Initialize WebSocket connection to Coinbase
  connect() {
    try {
      // Coinbase WebSocket Feed
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      this.ws.onopen = () => {
        console.log('Coinbase WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribeToAllProducts();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Reconnect logic
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectInterval = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  // Subscribe to symbol updates
  subscribe(symbol: string, callback: (data: MarketData) => void) {
    const productId = toCoinbaseProductId(symbol);
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.subscribeToProduct(symbol);
    }
    this.subscribers.get(symbol)?.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
          this.unsubscribeFromProduct(symbol);
        }
      }
    };
  }

  // Subscribe to Coinbase products
  private subscribeToProduct(symbol: string) {
    const productId = toCoinbaseProductId(symbol);
    this.subscribedProducts.add(productId);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'subscribe',
        product_ids: [productId],
        channels: ['ticker', 'level2', 'matches']
      };
      
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  private unsubscribeFromProduct(symbol: string) {
    const productId = toCoinbaseProductId(symbol);
    this.subscribedProducts.delete(productId);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        product_ids: [productId],
        channels: ['ticker', 'level2', 'matches']
      };
      
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  private subscribeToAllProducts() {
    if (this.subscribedProducts.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: 'subscribe',
        product_ids: Array.from(this.subscribedProducts),
        channels: ['ticker', 'level2', 'matches']
      };
      
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  // Handle incoming messages from Coinbase
  private handleMessage(data: string) {
    try {
      const message: CoinbaseMessage = JSON.parse(data);
      
      if (message.type === 'ticker' && message.product_id) {
        const ticker = message as CoinbaseTicker;
        const symbol = this.fromCoinbaseProductId(ticker.product_id);
        
        const price = parseFloat(ticker.price);
        const open24h = parseFloat(ticker.open_24h);
        const change24h = price - open24h;
        const change24hPercent = (change24h / open24h) * 100;
        
        const marketData: MarketData = {
          symbol: symbol,
          price: price,
          change24h: change24h,
          change24hPercent: change24hPercent,
          high24h: parseFloat(ticker.high_24h),
          low24h: parseFloat(ticker.low_24h),
          volume24h: parseFloat(ticker.volume_24h),
          timestamp: new Date(ticker.time).getTime()
        };

        // Notify all subscribers
        const callbacks = this.subscribers.get(symbol);
        callbacks?.forEach(callback => callback(marketData));
      }
    } catch (error) {
      console.error('Error parsing market data:', error);
    }
  }

  // Convert Coinbase product ID back to our symbol format
  private fromCoinbaseProductId(productId: string): string {
    // BTC-USD -> CRYPTO:BTC
    if (productId.endsWith('-USD')) {
      const crypto = productId.replace('-USD', '');
      return `CRYPTO:${crypto}`;
    }
    return productId;
  }

  // Get market data from REST API
  async getMarketData(symbol: string): Promise<MarketData | null> {
    const productId = toCoinbaseProductId(symbol);
    try {
      // Get ticker data
      const tickerResponse = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/ticker`
      );
      
      if (!tickerResponse.ok) {
        throw new Error('Failed to fetch ticker data');
      }
      
      const ticker = await tickerResponse.json();
      
      // Get 24hr stats
      const statsResponse = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/stats`
      );
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats data');
      }
      
      const stats = await statsResponse.json();
      
      const price = parseFloat(ticker.price);
      const open24h = parseFloat(stats.open);
      const change24h = price - open24h;
      const change24hPercent = (change24h / open24h) * 100;
      
      return {
        symbol: symbol,
        price: price,
        change24h: change24h,
        change24hPercent: change24hPercent,
        high24h: parseFloat(stats.high),
        low24h: parseFloat(stats.low),
        volume24h: parseFloat(stats.volume),
        timestamp: new Date(ticker.time).getTime()
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  // Get order book data from Coinbase
  async getOrderBook(symbol: string, level: number = 2): Promise<OrderBook | null> {
    try {
      const productId = toCoinbaseProductId(symbol);
      
      const response = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/book?level=${level}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch order book');
      }
      
      const data = await response.json();
      
      return {
        bids: data.bids.slice(0, 20).map((bid: string[]) => [
          parseFloat(bid[0]), // price
          parseFloat(bid[1])  // size
        ]),
        asks: data.asks.slice(0, 20).map((ask: string[]) => [
          parseFloat(ask[0]), // price
          parseFloat(ask[1])  // size
        ]),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching order book:', error);
      return null;
    }
  }

  // Get recent trades from Coinbase
  async getRecentTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
    try {
      const productId = toCoinbaseProductId(symbol);
      
      const response = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/trades?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      
      const trades = await response.json();
      
      return trades.map((trade: any) => ({
        id: trade.trade_id.toString(),
        symbol: symbol,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.size),
        side: trade.side as 'buy' | 'sell',
        timestamp: new Date(trade.time).getTime()
      }));
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      return [];
    }
  }

  // Get available trading pairs from Coinbase
  async getAvailableProducts(): Promise<string[]> {
    try {
      const response = await fetch('https://api.exchange.coinbase.com/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const products = await response.json();
      
      // Filter for USD pairs and convert to our format
      return products
        .filter((product: any) => 
          product.quote_currency === 'USD' && 
          product.status === 'online' &&
          !product.trading_disabled
        )
        .map((product: any) => `CRYPTO:${product.base_currency}`);
    } catch (error) {
      console.error('Error fetching available products:', error);
      return [];
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.subscribedProducts.clear();
  }
}

// Create singleton instance
export const marketDataService = new MarketDataService();

// Trading functions
export async function placeOrder(order: {
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number; // For limit orders
  type: 'market' | 'limit';
}) {
  try {
    // Get current market price if market order
    let executionPrice = order.price;
    if (order.type === 'market') {
      const marketData = await marketDataService.getMarketData(order.symbol);
      if (!marketData) throw new Error('Unable to fetch market price');
      executionPrice = marketData.price;
    }

    // Calculate total value
    const totalValue = executionPrice! * order.quantity;

    // Record the trade in database
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: order.userId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: executionPrice,
        total_value: totalValue,
        type: order.type,
        status: 'completed', // For demo, all orders complete instantly
        executed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's portfolio
    await updatePortfolio(order.userId, order.symbol, order.side, order.quantity, executionPrice!);

    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
}

// Update user's portfolio after trade
async function updatePortfolio(
  userId: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number
) {
  // Check if user already has this asset
  const { data: existing } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (existing) {
    // Update existing position
    const newQuantity = side === 'buy' 
      ? existing.quantity + quantity 
      : existing.quantity - quantity;
    
    const newAvgPrice = side === 'buy'
      ? ((existing.quantity * existing.average_price) + (quantity * price)) / (existing.quantity + quantity)
      : existing.average_price; // Keep same avg price for sells

    if (newQuantity > 0) {
      await supabase
        .from('portfolio')
        .update({
          quantity: newQuantity,
          average_price: newAvgPrice,
          current_value: newQuantity * price,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Remove position if quantity is 0
      await supabase
        .from('portfolio')
        .delete()
        .eq('id', existing.id);
    }
  } else if (side === 'buy') {
    // Create new position
    await supabase
      .from('portfolio')
      .insert({
        user_id: userId,
        symbol: symbol,
        quantity: quantity,
        average_price: price,
        current_value: quantity * price
      });
  }
}

// Get user's trading history
export async function getTradingHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get user's portfolio
export async function getUserPortfolio(userId: string) {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}