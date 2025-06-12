// lib/services/coinbase-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CoinbaseConfig {
  apiKey: string;
  apiSecret: string;
}

interface BuyOrderParams {
  amount: number;
  currency: string;
  walletAddress: string;
  userId: string;
}

interface SellOrderParams {
  size: number;
  currency: string;
  walletAddress: string;
  userId: string;
}

class CoinbaseService {
  private supabase = createClientComponentClient();

  // Simulate Coinbase API integration (replace with actual API calls)
  async createBuyOrder({ amount, currency, walletAddress, userId }: BuyOrderParams) {
    try {
      // Log transaction to database
      const { data: transaction, error: txError } = await this.supabase
        .from('crypto_transactions')
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          transaction_type: 'buy',
          currency_pair: currency,
          amount,
          price: await this.getCurrentPrice(currency),
          total_value: amount,
          status: 'pending',
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'coinbase_api'
          }
        })
        .select()
        .single();

      if (txError) throw txError;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update transaction status
      const { error: updateError } = await this.supabase
        .from('crypto_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          coinbase_order_id: `CB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      return {
        success: true,
        orderId: transaction.id,
        message: 'Buy order placed successfully'
      };
    } catch (error) {
      console.error('Buy order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place buy order'
      };
    }
  }

  async createSellOrder({ size, currency, walletAddress, userId }: SellOrderParams) {
    try {
      const price = await this.getCurrentPrice(currency);
      const totalValue = size * price;

      // Log transaction to database
      const { data: transaction, error: txError } = await this.supabase
        .from('crypto_transactions')
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          transaction_type: 'sell',
          currency_pair: currency,
          amount: size,
          price,
          total_value: totalValue,
          status: 'pending',
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'coinbase_api'
          }
        })
        .select()
        .single();

      if (txError) throw txError;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update transaction status
      const { error: updateError } = await this.supabase
        .from('crypto_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          coinbase_order_id: `CB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      return {
        success: true,
        orderId: transaction.id,
        message: 'Sell order placed successfully'
      };
    } catch (error) {
      console.error('Sell order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to place sell order'
      };
    }
  }

  async getCurrentPrice(currency: string): Promise<number> {
    try {
      // Get from cache first
      const { data: cached } = await this.supabase
        .from('market_data_cache')
        .select('price')
        .eq('symbol', currency.split('-')[0])
        .single();

      if (cached) return Number(cached.price);

      // Fallback to API call
      const symbol = currency.split('-')[0].toLowerCase();
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
      );
      const data = await response.json();
      return data[symbol]?.usd || 0;
    } catch (error) {
      console.error('Error fetching price:', error);
      return 0;
    }
  }

  async getTransactionHistory(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch history' };
    }
  }
}

export const coinbaseService = new CoinbaseService();