// hooks/use-realtime-market-data.ts
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';

export interface MarketData {
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
  last_updated: string;
}

export interface PortfolioData {
  inr_balance: number;
  total_invested_inr: number;
  current_value_inr: number;
  total_pnl_inr: number;
  total_pnl_percentage: number;
  holdings_count: number;
}

interface UseRealtimeMarketDataReturn {
  markets: MarketData[];
  portfolio: PortfolioData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  initializeSystem: () => Promise<void>;
  isSystemInitialized: boolean;
}

export function useRealtimeMarketData(): UseRealtimeMarketDataReturn {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Fetch markets data
  const fetchMarkets = useCallback(async () => {
    try {
      const response = await fetch('/api/crypto/markets');
      const result = await response.json();
      
      if (result.success) {
        setMarkets(result.data || []);
        setIsSystemInitialized(result.data?.length > 0);
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch markets');
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      return [];
    }
  }, []);

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!user) return null;
    
    try {
      const response = await fetch('/api/crypto/portfolio?action=summary');
      const result = await response.json();
      
      if (result.success) {
        setPortfolio(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch portfolio');
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      return null;
    }
  }, [user]);

  // Initialize the crypto trading system
  const initializeSystem = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto/initialize', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setIsSystemInitialized(true);
        await Promise.all([fetchMarkets(), fetchPortfolio()]);
      } else {
        throw new Error(result.error || 'Failed to initialize system');
      }
    } catch (err) {
      console.error('Error initializing system:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize trading system');
    } finally {
      setLoading(false);
    }
  }, [fetchMarkets, fetchPortfolio]);

  // Sync prices (simulate real-time updates)
  const syncPrices = useCallback(async () => {
    try {
      await fetch('/api/crypto/sync-prices', { method: 'POST' });
    } catch (err) {
      console.error('Error syncing prices:', err);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchMarkets(), fetchPortfolio()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchMarkets, fetchPortfolio]);

  // Set up real-time subscriptions and intervals
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeData = async () => {
      setLoading(true);
      
      // First, try to fetch existing markets
      const existingMarkets = await fetchMarkets();
      
      // If no markets exist, initialize the system
      if (!existingMarkets || existingMarkets.length === 0) {
        await initializeSystem();
      } else {
        setIsSystemInitialized(true);
        if (user) {
          await fetchPortfolio();
        }
        setLoading(false);
      }
    };

    initializeData();

    // Set up real-time subscriptions for market data
    const marketSubscription = supabase
      .channel('crypto_markets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_markets'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setMarkets(prev => 
              prev.map(market => 
                market.symbol === payload.new.symbol 
                  ? { ...market, ...payload.new }
                  : market
              )
            );
          }
        }
      )
      .subscribe();

    // Set up subscription for user portfolio changes
    let portfolioSubscription: any = null;
    if (user) {
      portfolioSubscription = supabase
        .channel('user_portfolio_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crypto_trades',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh portfolio when trades are made
            fetchPortfolio();
          }
        )
        .subscribe();
    }

    // Set up periodic data refresh (every 30 seconds)
    updateIntervalRef.current = setInterval(() => {
      refreshData();
    }, 30000);

    // Set up price simulation (every 5 seconds)
    priceUpdateIntervalRef.current = setInterval(() => {
      syncPrices();
    }, 5000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
      marketSubscription?.unsubscribe();
      portfolioSubscription?.unsubscribe();
    };
  }, [user, fetchMarkets, fetchPortfolio, refreshData, syncPrices, initializeSystem, supabase]);

  return {
    markets,
    portfolio,
    loading,
    error,
    refreshData,
    initializeSystem,
    isSystemInitialized
  };
}
