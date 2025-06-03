// types/supabase.ts
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          kyc_completed: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          last_login_ip: string | null
          login_attempts: number
          locked_until: string | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          kyc_completed?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number
          locked_until?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          kyc_completed?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number
          locked_until?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
        }
      }
      kyc_details: {
        Row: {
          id: string
          user_id: string
          full_name: string
          date_of_birth: string
          pan_number: string
          aadhaar_number: string
          mobile_number: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          pincode: string
          bank_name: string
          account_number: string
          ifsc_code: string
          account_type: string
          income_bracket: string
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          date_of_birth: string
          pan_number: string
          aadhaar_number: string
          mobile_number: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          pincode: string
          bank_name: string
          account_number: string
          ifsc_code: string
          account_type: string
          income_bracket: string
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          date_of_birth?: string
          pan_number?: string
          aadhaar_number?: string
          mobile_number?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          pincode?: string
          bank_name?: string
          account_number?: string
          ifsc_code?: string
          account_type?: string
          income_bracket?: string
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          total_value: number
          type: 'market' | 'limit'
          status: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          total_value: number
          type: 'market' | 'limit'
          status?: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          side?: 'buy' | 'sell'
          quantity?: number
          price?: number
          total_value?: number
          type?: 'market' | 'limit'
          status?: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio: {
        Row: {
          id: string
          user_id: string
          symbol: string
          quantity: number
          average_price: number
          current_value: number | null
          profit_loss: number | null
          profit_loss_percent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          quantity: number
          average_price: number
          current_value?: number | null
          profit_loss?: number | null
          profit_loss_percent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          quantity?: number
          average_price?: number
          current_value?: number | null
          profit_loss?: number | null
          profit_loss_percent?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          symbol: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          added_at?: string
        }
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          target_price: number
          condition: 'above' | 'below'
          is_active: boolean
          triggered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          target_price: number
          condition: 'above' | 'below'
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          target_price?: number
          condition?: 'above' | 'below'
          is_active?: boolean
          triggered_at?: string | null
          created_at?: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          payment_method: string | null
          transaction_hash: string | null
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          transaction_hash?: string | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deposit' | 'withdrawal'
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          transaction_hash?: string | null
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      wallet_balance: {
        Row: {
          id: string
          user_id: string
          balance: number
          locked_balance: number
          currency: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          locked_balance?: number
          currency?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          locked_balance?: number
          currency?: string
          updated_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          asset_id: string
          symbol: string
          name: string
          category: string
          price: number | null
          change_24h: number | null
          change_24h_percent: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_id: string
          symbol: string
          name: string
          category: string
          price?: number | null
          change_24h?: number | null
          change_24h_percent?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_id?: string
          symbol?: string
          name?: string
          category?: string
          price?: number | null
          change_24h?: number | null
          change_24h_percent?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          expires_at: string
          last_activity: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at: string
          last_activity?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at?: string
          last_activity?: string
          is_active?: boolean
        }
      }
      security_audit_log: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      failed_login_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string | null
          attempt_time: string
          user_agent: string | null
        }
        Insert: {
          id?: string
          email: string
          ip_address?: string | null
          attempt_time?: string
          user_agent?: string | null
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string | null
          attempt_time?: string
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_security_event: {
        Args: {
          p_user_id: string | null
          p_event_type: string
          p_event_details: Json
          p_ip_address: string
          p_user_agent: string
        }
        Returns: void
      }
      update_last_login: {
        Args: {
          p_user_id: string
          p_ip_address: string
        }
        Returns: void
      }
      handle_failed_login: {
        Args: {
          p_email: string
          p_ip_address: string
          p_user_agent: string
        }
        Returns: number
      }
      is_account_locked: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      decrement_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: void
      }
      increment_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}