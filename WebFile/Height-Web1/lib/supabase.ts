// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Heights project configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jeuyvgzqjrpfenmuibkw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  kyc_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_value: number;
  type: 'market' | 'limit';
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  currency: string;
  updated_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
}

// Helper functions for database operations
export const db = {
  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Wallet operations
  async getWalletBalance(userId: string) {
    const { data, error } = await supabase
      .from('wallet_balance')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  },

  async updateWalletBalance(userId: string, balance: number, lockedBalance?: number) {
    const { data, error } = await supabase
      .from('wallet_balance')
      .update({
        balance,
        locked_balance: lockedBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Portfolio operations
  async getPortfolio(userId: string) {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async updatePortfolioItem(userId: string, symbol: string, updates: Partial<Portfolio>) {
    const { data, error } = await supabase
      .from('portfolio')
      .update(updates)
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .select()
      .single();
    
    return { data, error };
  },

  // Trade operations
  async createTrade(trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
    
    return { data, error };
  },

  async getTrades(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  // Watchlist operations
  async getWatchlist(userId: string) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    
    return { data, error };
  },

  async addToWatchlist(userId: string, symbol: string) {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ user_id: userId, symbol })
      .select()
      .single();
    
    return { data, error };
  },

  async removeFromWatchlist(userId: string, symbol: string) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol);
    
    return { error };
  },

  // Price alerts
  async getPriceAlerts(userId: string) {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'created_at' | 'triggered_at'>) {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert(alert)
      .select()
      .single();
    
    return { data, error };
  },

  async deactivatePriceAlert(alertId: string) {
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: false })
      .eq('id', alertId);
    
    return { error };
  },
};