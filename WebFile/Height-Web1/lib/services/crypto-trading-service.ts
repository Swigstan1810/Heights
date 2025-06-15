// lib/services/crypto-trading-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

// Types
export interface CryptoMarket {
  symbol: string;
  name: string;
  price_usd: number;
  price_inr: number;
  change_24h: number;
  change_24h_percent: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  coinbase_product_id: string;
  last_updated: string;
}

export interface TradeOrder {
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price_usd: number;
  price_inr: number;
  total_inr: number;
  brokerage_fee: number;
  net_amount: number;
}

export interface UserBalance {
  symbol: string;
  balance: number;
  current_value_inr: number;
  pnl_inr: number;
  pnl_percentage: number;
}

export interface PortfolioSummary {
  total_invested_inr: number;
  current_value_inr: number;
  total_pnl_inr: number;
  total_pnl_percentage: number;
  holdings_count: number;
  inr_balance: number;
}

class CryptoTradingService {
  private supabase = createClientComponentClient();
  private wsConnection: WebSocket | null = null;
  private marketDataCallbacks: Map<string, Set<(data: CryptoMarket) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUsdInrRate = 83.25; // Mock rate - in production, fetch from API

  constructor() {
    this.initializeWebSocket();
    this.startPriceUpdateInterval();
  }

  // Initialize WebSocket connection to Coinbase
  private initializeWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      this.wsConnection = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.wsConnection.onopen = () => {
        console.log('[CryptoTradingService] WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribeToMarkets();
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMarketData(data);
        } catch (error) {
          console.error('[CryptoTradingService] Error parsing message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('[CryptoTradingService] WebSocket closed');
        this.handleReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('[CryptoTradingService] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[CryptoTradingService] Failed to create WebSocket:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`[CryptoTradingService] Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    }
  }

  // Subscribe to major crypto markets
  private subscribeToMarkets() {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) return;

    const productIds = [
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD',
      'LINK-USD', 'MATIC-USD', 'AVAX-USD', 'UNI-USD', 'AAVE-USD'
    ];

    const subscribeMessage = {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['ticker']
    };

    this.wsConnection.send(JSON.stringify(subscribeMessage));
    console.log('[CryptoTradingService] Subscribed to markets:', productIds);
  }

  // Handle incoming market data
  private async handleMarketData(data: any) {
    if (data.type === 'ticker' && data.product_id) {
      const symbol = data.product_id.replace('-USD', '');
      const priceUsd = parseFloat(data.price);
      const priceInr = priceUsd * this.currentUsdInrRate;
      
      const marketData: CryptoMarket = {
        symbol,
        name: this.getCryptoName(symbol),
        price_usd: priceUsd,
        price_inr: priceInr,
        change_24h: parseFloat(data.price) - parseFloat(data.open_24h || data.price),
        change_24h_percent: ((parseFloat(data.price) - parseFloat(data.open_24h || data.price)) / parseFloat(data.open_24h || data.price)) * 100,
        volume_24h: parseFloat(data.volume_24h || '0') * priceUsd,
        market_cap: 0, // Would need additional API call
        high_24h: parseFloat(data.high_24h || data.price),
        low_24h: parseFloat(data.low_24h || data.price),
        coinbase_product_id: data.product_id,
        last_updated: new Date().toISOString()
      };

      // Update database
      await this.updateMarketData(marketData);

      // Notify subscribers
      const callbacks = this.marketDataCallbacks.get(symbol);
      if (callbacks) {
        callbacks.forEach(callback => callback(marketData));
      }
    }
  }

  // Update market data in database
  private async updateMarketData(marketData: CryptoMarket) {
    try {
      const { error } = await this.supabase
        .from('crypto_markets')
        .upsert({
          symbol: marketData.symbol,
          name: marketData.name,
          price_usd: marketData.price_usd,
          price_inr: marketData.price_inr,
          change_24h: marketData.change_24h,
          change_24h_percent: marketData.change_24h_percent,
          volume_24h: marketData.volume_24h,
          market_cap: marketData.market_cap,
          high_24h: marketData.high_24h,
          low_24h: marketData.low_24h,
          coinbase_product_id: marketData.coinbase_product_id,
          last_updated: marketData.last_updated
        }, {
          onConflict: 'symbol'
        });

      if (error) {
        console.error('[CryptoTradingService] Error updating market data:', error);
      }
    } catch (error) {
      console.error('[CryptoTradingService] Database error:', error);
    }
  }

  // Get crypto name from symbol
  private getCryptoName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'UNI': 'Uniswap',
      'AAVE': 'Aave'
    };
    return names[symbol] || symbol;
  }

  // Public API methods

  // Subscribe to market updates
  subscribeToMarket(symbol: string, callback: (data: CryptoMarket) => void): () => void {
    if (!this.marketDataCallbacks.has(symbol)) {
      this.marketDataCallbacks.set(symbol, new Set());
    }
    
    this.marketDataCallbacks.get(symbol)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.marketDataCallbacks.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.marketDataCallbacks.delete(symbol);
        }
      }
    };
  }

  // Get all markets
  async getAllMarkets(): Promise<CryptoMarket[]> {
    try {
      const { data, error } = await this.supabase
        .from('crypto_markets')
        .select('*')
        .eq('is_active', true)
        .order('volume_24h', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching markets:', error);
      return [];
    }
  }

  // Get specific market
  async getMarket(symbol: string): Promise<CryptoMarket | null> {
    try {
      const { data, error } = await this.supabase
        .from('crypto_markets')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching market:', error);
      return null;
    }
  }

  // Calculate brokerage fee
  calculateBrokerageFee(amountInr: number): number {
    // ₹50 per ₹50,000 = 0.1% with min ₹10 and max ₹1000
    return Math.max(10, Math.min(1000, amountInr * 0.001));
  }

  // Place buy order
  async placeBuyOrder(
    userId: string,
    symbol: string,
    amountInr: number,
    walletAddress?: string
  ): Promise<{ success: boolean; trade?: any; error?: string }> {
    try {
      // Get current market price
      const market = await this.getMarket(symbol);
      if (!market) {
        return { success: false, error: 'Market not found' };
      }

      // Check user INR balance
      const { data: wallet } = await this.supabase
        .from('user_inr_wallet')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const quantity = amountInr / market.price_inr;
      const brokerageFee = this.calculateBrokerageFee(amountInr);
      const netAmount = amountInr + brokerageFee;

      if (!wallet || wallet.balance < netAmount) {
        return { success: false, error: 'Insufficient INR balance' };
      }

      // Create trade record
      const { data: trade, error } = await this.supabase
        .from('crypto_trades')
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          symbol,
          trade_type: 'buy',
          quantity,
          price_usd: market.price_usd,
          price_inr: market.price_inr,
          total_usd: quantity * market.price_usd,
          total_inr: amountInr,
          brokerage_fee: brokerageFee,
          net_amount: netAmount,
          usd_inr_rate: this.currentUsdInrRate,
          status: 'completed',
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[CryptoTradingService] Error creating trade:', error);
        return { success: false, error: 'Failed to create trade' };
      }

      toast.success(`Successfully bought ${quantity.toFixed(6)} ${symbol}`);
      return { success: true, trade };
    } catch (error) {
      console.error('[CryptoTradingService] Buy order error:', error);
      return { success: false, error: 'Trade execution failed' };
    }
  }

  // Place sell order
  async placeSellOrder(
    userId: string,
    symbol: string,
    quantity: number,
    walletAddress?: string
  ): Promise<{ success: boolean; trade?: any; error?: string }> {
    try {
      // Get current market price
      const market = await this.getMarket(symbol);
      if (!market) {
        return { success: false, error: 'Market not found' };
      }

      // Check user crypto balance
      const { data: balance } = await this.supabase
        .from('user_crypto_balances')
        .select('balance')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .single();

      if (!balance || balance.balance < quantity) {
        return { success: false, error: 'Insufficient crypto balance' };
      }

      const totalInr = quantity * market.price_inr;
      const brokerageFee = this.calculateBrokerageFee(totalInr);
      const netAmount = totalInr - brokerageFee;

      // Create trade record
      const { data: trade, error } = await this.supabase
        .from('crypto_trades')
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          symbol,
          trade_type: 'sell',
          quantity,
          price_usd: market.price_usd,
          price_inr: market.price_inr,
          total_usd: quantity * market.price_usd,
          total_inr: totalInr,
          brokerage_fee: brokerageFee,
          net_amount: netAmount,
          usd_inr_rate: this.currentUsdInrRate,
          status: 'completed',
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[CryptoTradingService] Error creating trade:', error);
        return { success: false, error: 'Failed to create trade' };
      }

      toast.success(`Successfully sold ${quantity.toFixed(6)} ${symbol}`);
      return { success: true, trade };
    } catch (error) {
      console.error('[CryptoTradingService] Sell order error:', error);
      return { success: false, error: 'Trade execution failed' };
    }
  }

  // Get user portfolio summary
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_portfolio_summary', { p_user_id: userId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching portfolio summary:', error);
      return null;
    }
  }

  // Get user crypto holdings
  async getUserHoldings(userId: string): Promise<UserBalance[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_crypto_holdings', { p_user_id: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching holdings:', error);
      return [];
    }
  }

  // Get user trade history
  async getTradeHistory(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('crypto_trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching trade history:', error);
      return [];
    }
  }

  // Initialize user wallet
  async initializeUserWallet(userId: string): Promise<void> {
    try {
      await this.supabase.rpc('initialize_user_wallets', { p_user_id: userId });
    } catch (error) {
      console.error('[CryptoTradingService] Error initializing wallet:', error);
    }
  }

  // Get INR wallet balance
  async getInrBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_inr_wallet')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.balance || 0;
    } catch (error) {
      console.error('[CryptoTradingService] Error fetching INR balance:', error);
      return 0;
    }
  }

  // Start periodic price updates for database
  private startPriceUpdateInterval() {
    // Update prices every 10 seconds for database records
    setInterval(async () => {
      try {
        const markets = await this.getAllMarkets();
        for (const market of markets) {
          // Store price history for charts
          await this.supabase
            .from('crypto_price_history')
            .insert({
              symbol: market.symbol,
              price_usd: market.price_usd,
              price_inr: market.price_inr,
              volume: market.volume_24h,
              timestamp: new Date().toISOString(),
              interval_type: '1m'
            });
        }
      } catch (error) {
        console.error('[CryptoTradingService] Error storing price history:', error);
      }
    }, 10000);
  }

  // Cleanup
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.marketDataCallbacks.clear();
  }
}

export const cryptoTradingService = new CryptoTradingService();