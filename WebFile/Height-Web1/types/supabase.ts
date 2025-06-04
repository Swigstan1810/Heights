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
          username: string | null
          bio: string | null
          avatar_url: string | null
          google_avatar_url: string | null
          phone_number: string | null
          date_of_birth: string | null
          location: string | null
          website: string | null
          timezone: string | null
          auth_provider: string
          google_id: string | null
          email_verified: boolean
          kyc_completed: boolean
          two_factor_enabled: boolean
          two_factor_secret: string | null
          last_login_at: string | null
          last_login_ip: string | null
          login_attempts: number
          locked_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          google_avatar_url?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          location?: string | null
          website?: string | null
          timezone?: string | null
          auth_provider?: string
          google_id?: string | null
          email_verified?: boolean
          kyc_completed?: boolean
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number
          locked_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          google_avatar_url?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          location?: string | null
          website?: string | null
          timezone?: string | null
          auth_provider?: string
          google_id?: string | null
          email_verified?: boolean
          kyc_completed?: boolean
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          login_attempts?: number
          locked_until?: string | null
          created_at?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      merge_google_account: {
        Args: {
          p_user_id: string
          p_google_id: string
          p_google_avatar_url: string | null
        }
        Returns: undefined
      }
      update_wallet_after_trade: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
        }
        Returns: undefined
      }
      check_oauth_rate_limit: {
        Args: {
          p_identifier: string
          p_provider: string
        }
        Returns: boolean
      }
      cleanup_oauth_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initialize_user_data: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_user_id: string | null
          p_event_type: string
          p_event_details: Json
          p_ip_address: string
          p_user_agent: string
        }
        Returns: undefined
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
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: boolean
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_portfolio_after_trade: {
        Args: {
          p_user_id: string
          p_symbol: string
          p_quantity: number
          p_price: number
          p_side: string
        }
        Returns: undefined
      }
      update_last_login: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      handle_failed_login: {
        Args: {
          p_email: string
          p_ip_address: string
          p_user_agent: string
        }
        Returns: undefined
      }
      get_kyc_status: {
        Args: {
          p_user_id: string
        }
        Returns: {
          kyc_completed: boolean
          email_verified: boolean
        }
      }
      mask_pan: {
        Args: {
          p_pan: string
        }
        Returns: string
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