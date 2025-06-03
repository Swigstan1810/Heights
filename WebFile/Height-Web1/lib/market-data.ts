// lib/market-data.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

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

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  timestamp: number;
  side: 'buy' | 'sell';
}

class MarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map();
  private marketDataCache: Map<string, MarketData> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private supabase = createClientComponentClient<Database>();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Connect to Coinbase WebSocket
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

      this.ws.onopen = () => {
        console.log('Connected to Coinbase WebSocket');
        this.isConnecting = false;
        
        // Clear reconnect interval if exists
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }

        // Subscribe to channels
        const symbols = Array.from(this.subscribers.keys());
        if (symbols.length > 0) {
          this.subscribeToSymbols(symbols);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        
        // Attempt to reconnect
        if (!this.reconnectInterval) {
          this.reconnectInterval = setInterval(() => {
            console.log('Attempting to reconnect...');
            this.connect();
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private subscribeToSymbols(symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Convert our symbols to Coinbase format
    const productIds = symbols.map(symbol => {
      const [type, ticker] = symbol.split(':');
      if (type === 'CRYPTO') {
        return `${ticker}-USD`;
      }
      return null;
    }).filter(Boolean);

    if (productIds.length === 0) return;

    const subscribeMessage = {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['ticker', 'level2_50', 'matches']
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private handleMessage(data: any) {
    if (data.type === 'ticker') {
      const symbol = `CRYPTO:${data.product_id.split('-')[0]}`;
      const marketData: MarketData = {
        symbol,
        price: parseFloat(data.price),
        change24h: parseFloat(data.price) - parseFloat(data.open_24h),
        change24hPercent: ((parseFloat(data.price) - parseFloat(data.open_24h)) / parseFloat(data.open_24h)) * 100,
        high24h: parseFloat(data.high_24h),
        low24h: parseFloat(data.low_24h),
        volume24h: parseFloat(data.volume_24h) * parseFloat(data.price),
        timestamp: new Date(data.time).getTime()
      };

      this.marketDataCache.set(symbol, marketData);
      this.notifySubscribers(symbol, marketData);
      
      // Update database with latest price
      this.updateDatabasePrice(symbol, marketData);
    }
  }

  private async updateDatabasePrice(symbol: string, data: MarketData, userId?: string) {
    try {
      // Update watchlist prices only if userId is provided
      if (userId) {
        await this.supabase
          .from('watchlist')
          .update({
            price: data.price,
            change_24h: data.change24h,
            change_24h_percent: data.change24hPercent
          })
          .eq('symbol', symbol)
          .eq('user_id', userId);
      }

      // Update portfolio current values
      const { data: portfolioItems } = await this.supabase
        .from('portfolio')
        .select('*')
        .eq('symbol', symbol);

      if (portfolioItems && portfolioItems.length > 0) {
        for (const item of portfolioItems) {
          const currentValue = item.quantity * data.price;
          const profitLoss = currentValue - (item.quantity * item.average_price);
          const profitLossPercent = ((currentValue - (item.quantity * item.average_price)) / (item.quantity * item.average_price)) * 100;

          await this.supabase
            .from('portfolio')
            .update({
              current_value: currentValue,
              profit_loss: profitLoss,
              profit_loss_percent: profitLossPercent
            })
            .eq('id', item.id);
        }
      }
    } catch (error) {
      console.error('Error updating database prices:', error);
    }
  }

  private notifySubscribers(symbol: string, data: MarketData) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    // Add subscriber
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // If WebSocket is connected, subscribe to this symbol
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeToSymbols([symbol]);
    }

    // If we have cached data, send it immediately
    const cachedData = this.marketDataCache.get(symbol);
    if (cachedData) {
      callback(cachedData);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  async getMarketData(symbol: string): Promise<MarketData | null> {
    // Check cache first
    const cached = this.marketDataCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 5000) {
      return cached;
    }

    // For crypto, fetch from Coinbase REST API
    if (symbol.startsWith('CRYPTO:')) {
      const ticker = symbol.split(':')[1];
      try {
        const [tickerRes, statsRes] = await Promise.all([
          fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${ticker}`),
          fetch(`https://api.pro.coinbase.com/products/${ticker}-USD/stats`)
        ]);

        if (tickerRes.ok && statsRes.ok) {
          const tickerData = await tickerRes.json();
          const statsData = await statsRes.json();
          
          const price = parseFloat(tickerData.data.rates.USD);
          const open = parseFloat(statsData.open);
          
          const marketData: MarketData = {
            symbol,
            price,
            change24h: price - open,
            change24hPercent: ((price - open) / open) * 100,
            high24h: parseFloat(statsData.high),
            low24h: parseFloat(statsData.low),
            volume24h: parseFloat(statsData.volume) * price,
            timestamp: Date.now()
          };

          this.marketDataCache.set(symbol, marketData);
          return marketData;
        }
      } catch (error) {
        console.error(`Error fetching market data for ${symbol}:`, error);
      }
    }

    return null;
  }

  async getOrderBook(symbol: string): Promise<OrderBook | null> {
    if (symbol.startsWith('CRYPTO:')) {
      const ticker = symbol.split(':')[1];
      try {
        const response = await fetch(`https://api.pro.coinbase.com/products/${ticker}-USD/book?level=2`);
        if (response.ok) {
          const data = await response.json();
          return {
            bids: data.bids.map((bid: string[]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
            asks: data.asks.map((ask: string[]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.error(`Error fetching order book for ${symbol}:`, error);
      }
    }
    return null;
  }

  async getRecentTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
    if (symbol.startsWith('CRYPTO:')) {
      const ticker = symbol.split(':')[1];
      try {
        const response = await fetch(`https://api.pro.coinbase.com/products/${ticker}-USD/trades?limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          return data.map((trade: any) => ({
            id: trade.trade_id.toString(),
            price: parseFloat(trade.price),
            quantity: parseFloat(trade.size),
            timestamp: new Date(trade.time).getTime(),
            side: trade.side
          }));
        }
      } catch (error) {
        console.error(`Error fetching recent trades for ${symbol}:`, error);
      }
    }
    return [];
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.marketDataCache.clear();
  }
}

export const marketDataService = new MarketDataService();

// Order placement function
export async function placeOrder(order: {
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
}) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // Get current market price if market order
    let executionPrice = order.price;
    if (order.type === 'market') {
      const marketData = await marketDataService.getMarketData(order.symbol);
      if (!marketData) {
        throw new Error('Unable to fetch market price');
      }
      executionPrice = marketData.price;
    }
    
    if (!executionPrice) {
      throw new Error('Price is required');
    }
    
    // Calculate total value
    const totalValue = executionPrice * order.quantity;
    
    // Check wallet balance for buy orders
    if (order.side === 'buy') {
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('user_id', order.userId)
        .single();
      
      if (walletError || !walletData) {
        throw new Error('Unable to fetch wallet balance');
      }
      
      if (walletData.balance < totalValue) {
        throw new Error('Insufficient balance');
      }
    }
    
    // Check portfolio for sell orders
    if (order.side === 'sell') {
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('quantity')
        .eq('user_id', order.userId)
        .eq('symbol', order.symbol)
        .single();
      
      if (portfolioError || !portfolioData || portfolioData.quantity < order.quantity) {
        throw new Error('Insufficient holdings');
      }
    }
    
    // Create the trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: order.userId,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        price: executionPrice,
        total_value: totalValue,
        status: 'pending',
      })
      .select()
      .single();
    
    if (tradeError || !trade) {
      throw new Error('Failed to create trade');
    }
    
    // Execute the trade (in a real system, this would be sent to an exchange)
    // For now, we'll simulate immediate execution
    
    // Update wallet balance
    if (order.side === 'buy') {
      await supabase.rpc('decrement_wallet_balance', {
        p_user_id: order.userId,
        p_amount: totalValue
      });
    } else {
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: order.userId,
        p_amount: totalValue
      });
    }
    
    // Update portfolio
    if (order.side === 'buy') {
      // Check if user already has this asset
      const { data: existingPosition } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', order.userId)
        .eq('symbol', order.symbol)
        .single();
      
      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + order.quantity;
        const newTotalCost = (existingPosition.average_price * existingPosition.quantity) + totalValue;
        const newAveragePrice = newTotalCost / newQuantity;
        
        await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            average_price: newAveragePrice,
          })
          .eq('id', existingPosition.id);
      } else {
        // Create new position
        await supabase
          .from('portfolio')
          .insert({
            user_id: order.userId,
            symbol: order.symbol,
            quantity: order.quantity,
            average_price: executionPrice,
          });
      }
    } else {
      // Update portfolio for sell
      const { data: position } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', order.userId)
        .eq('symbol', order.symbol)
        .single();
      
      if (position) {
        const newQuantity = position.quantity - order.quantity;
        
        if (newQuantity > 0) {
          await supabase
            .from('portfolio')
            .update({ quantity: newQuantity })
            .eq('id', position.id);
        } else {
          // Remove position if quantity is 0
          await supabase
            .from('portfolio')
            .delete()
            .eq('id', position.id);
        }
      }
    }
    
    // Update trade status to completed
    await supabase
      .from('trades')
      .update({
        status: 'completed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', trade.id);
    
    // Log the trade in audit log
    await supabase.rpc('log_security_event', {
      p_user_id: order.userId,
      p_event_type: 'trade_executed',
      p_event_details: {
        trade_id: trade.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: executionPrice,
        total_value: totalValue,
      },
      p_ip_address: 'system',
      p_user_agent: 'trading-engine'
    });
    
    return {
      success: true,
      trade: {
        ...trade,
        executed_at: new Date().toISOString(),
        status: 'completed' as const,
      },
    };
    
  } catch (error) {
    console.error('Error placing order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to place order',
    };
  }
}