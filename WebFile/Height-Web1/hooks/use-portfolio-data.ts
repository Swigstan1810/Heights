
// hooks/use-portfolio-data.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface CryptoHolding {
  symbol: string;
  balance: number;
  average_buy_price: number;
  current_price_inr: number;
  current_value_inr: number;
  pnl_inr: number;
  pnl_percentage: number;
}

interface TradeRecord {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price_inr: number;
  total_inr: number;
  brokerage_fee: number;
  status: string;
  created_at: string;
}

interface UsePortfolioDataReturn {
  holdings: CryptoHolding[];
  transactions: TradeRecord[];
  loading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataReturn {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/crypto/portfolio?action=holdings');
      const result = await response.json();
      
      if (result.success) {
        setHoldings(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch holdings');
      }
    } catch (err) {
      console.error('Error fetching holdings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/crypto/portfolio?action=transactions');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    }
  }, [user]);

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchHoldings(), fetchTransactions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh portfolio');
    } finally {
      setLoading(false);
    }
  }, [fetchHoldings, fetchTransactions]);

  useEffect(() => {
    if (user) {
      refreshPortfolio();
    }
  }, [user, refreshPortfolio]);

  return {
    holdings,
    transactions,
    loading,
    error,
    refreshPortfolio
  };
}