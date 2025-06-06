// types/supabase.ts - Updated to match your actual database structure

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          user_message: string
          ai_response: string
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          user_message: string
          ai_response: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          user_message?: string
          ai_response?: string
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ai_errors: {
        Row: {
          id: string
          error: string
          context: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          error: string
          context?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          error?: string
          context?: Json | null
          created_at?: string | null
        }
      }
      ai_predictions: {
        Row: {
          id: string
          symbol: string
          timeframe: string
          prediction: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          symbol: string
          timeframe: string
          prediction: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          symbol?: string
          timeframe?: string
          prediction?: Json
          created_at?: string | null
        }
      }
      crypto_watchlist: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          added_at?: string
        }
      }
      market_analyses: {
        Row: {
          id: string
          symbol: string
          analysis: Json
          confidence: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          symbol: string
          analysis: Json
          confidence?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          symbol?: string
          analysis?: Json
          confidence?: number | null
          created_at?: string | null
        }
      }
      market_data_cache: {
        Row: {
          id: string
          symbol: string
          data_type: string
          data: Json
          expires_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          symbol: string
          data_type: string
          data: Json
          expires_at: string
          created_at?: string | null
        }
        Update: {
          id?: string
          symbol?: string
          data_type?: string
          data?: Json
          expires_at?: string
          created_at?: string | null
        }
      }
      news_preferences: {
        Row: {
          id: string
          user_id: string
          categories: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_holdings: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          asset_type: string
          quantity: number
          average_buy_price: number
          current_price: number
          total_invested: number
          current_value: number
          profit_loss: number
          profit_loss_percentage: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          asset_type: string
          quantity?: number
          average_buy_price?: number
          current_price?: number
          total_invested?: number
          current_value?: number
          profit_loss?: number
          profit_loss_percentage?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          asset_type?: string
          quantity?: number
          average_buy_price?: number
          current_price?: number
          total_invested?: number
          current_value?: number
          profit_loss?: number
          profit_loss_percentage?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      portfolio_orders: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          asset_type: string
          order_type: string
          quantity: number
          price: number
          total_amount: number
          status: string
          fees: number | null
          notes: string | null
          created_at: string | null
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          asset_type: string
          order_type: string
          quantity: number
          price: number
          total_amount: number
          status?: string
          fees?: number | null
          notes?: string | null
          created_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          asset_type?: string
          order_type?: string
          quantity?: number
          price?: number
          total_amount?: number
          status?: string
          fees?: number | null
          notes?: string | null
          created_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          kyc_completed: boolean | null
          created_at: string | null
          updated_at: string | null
          last_login_at: string | null
          last_login_ip: string | null
          login_attempts: number | null
          locked_until: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          auth_provider: string | null
          google_id: string | null
          google_avatar_url: string | null
          email_verified: boolean | null
          username: string | null
          bio: string | null
          phone_number: string | null
          location: string | null
          website: string | null
          timezone: string | null
          date_of_birth: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          kyc_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number | null
          locked_until?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          auth_provider?: string | null
          google_id?: string | null
          google_avatar_url?: string | null
          email_verified?: boolean | null
          username?: string | null
          bio?: string | null
          phone_number?: string | null
          location?: string | null
          website?: string | null
          timezone?: string | null
          date_of_birth?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          kyc_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number | null
          locked_until?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          auth_provider?: string | null
          google_id?: string | null
          google_avatar_url?: string | null
          email_verified?: boolean | null
          username?: string | null
          bio?: string | null
          phone_number?: string | null
          location?: string | null
          website?: string | null
          timezone?: string | null
          date_of_birth?: string | null
        }
      }
      trading_signals: {
        Row: {
          id: string
          symbol: string
          signal_type: string
          confidence: number
          reasoning: string | null
          price_at_signal: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          symbol: string
          signal_type: string
          confidence: number
          reasoning?: string | null
          price_at_signal?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          symbol?: string
          signal_type?: string
          confidence?: number
          reasoning?: string | null
          price_at_signal?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_symbols: string[] | null
          risk_tolerance: string | null
          ai_personality: string | null
          notifications_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          preferred_symbols?: string[] | null
          risk_tolerance?: string | null
          ai_personality?: string | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          preferred_symbols?: string[] | null
          risk_tolerance?: string | null
          ai_personality?: string | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      wallet_balance: {
        Row: {
          id: string
          user_id: string
          balance: number
          locked_balance: number
          currency: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          locked_balance?: number
          currency?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          locked_balance?: number
          currency?: string
          updated_at?: string | null
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          currency: string
          status: string
          payment_method: string | null
          transaction_hash: string | null
          notes: string | null
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          currency?: string
          status?: string
          payment_method?: string | null
          transaction_hash?: string | null
          notes?: string | null
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          currency?: string
          status?: string
          payment_method?: string | null
          transaction_hash?: string | null
          notes?: string | null
          created_at?: string | null
          completed_at?: string | null
        }
      }
    }
    Views: {
      portfolio_performance: {
        Row: {
          id: string | null
          user_id: string | null
          symbol: string | null
          name: string | null
          asset_type: string | null
          quantity: number | null
          average_buy_price: number | null
          current_price: number | null
          total_invested: number | null
          current_value: number | null
          profit_loss: number | null
          profit_loss_percentage: number | null
          created_at: string | null
          updated_at: string | null
          position_type: string | null
          pnl_status: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          symbol?: string | null
          name?: string | null
          asset_type?: string | null
          quantity?: number | null
          average_buy_price?: number | null
          current_price?: number | null
          total_invested?: number | null
          current_value?: number | null
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
          position_type?: string | null
          pnl_status?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          symbol?: string | null
          name?: string | null
          asset_type?: string | null
          quantity?: number | null
          average_buy_price?: number | null
          current_price?: number | null
          total_invested?: number | null
          current_value?: number | null
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
          position_type?: string | null
          pnl_status?: string | null
        }
      }
    }
    Functions: {
      get_portfolio_summary: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_value: number
          total_invested: number
          total_pnl: number
          total_pnl_percentage: number
          holdings_count: number
        }[]
      }
      update_portfolio_prices: {
        Args: {
          p_symbol: string
          p_current_price: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}