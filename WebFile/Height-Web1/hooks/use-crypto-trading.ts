
// hooks/use-crypto-trading.ts
"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface TradeParams {
  symbol: string;
  trade_type: 'buy' | 'sell';
  amount: number;
  wallet_address?: string;
}

interface UseCryptoTradingReturn {
  executeTrade: (params: TradeParams) => Promise<{ success: boolean; error?: string }>;
  isTrading: boolean;
}

export function useCryptoTrading(): UseCryptoTradingReturn {
  const { user } = useAuth();
  const [isTrading, setIsTrading] = useState(false);

  const executeTrade = useCallback(async (params: TradeParams) => {
    if (!user) {
      toast.error('Please log in to trade');
      return { success: false, error: 'Not authenticated' };
    }

    setIsTrading(true);
    try {
      const response = await fetch('/api/crypto/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Trade executed successfully');
        return { success: true };
      } else {
        toast.error(result.error || 'Trade failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Trade execution failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsTrading(false);
    }
  }, [user]);

  return {
    executeTrade,
    isTrading
  };
}
