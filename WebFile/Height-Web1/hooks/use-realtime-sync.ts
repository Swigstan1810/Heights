"use client";

import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export function useRealtimeSync() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const refreshAllData = useCallback(() => {
    const event = new CustomEvent('syncAllData', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    if (!user) return;

    const portfolioSubscription = supabase
      .channel('global-portfolio-sync')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolio_holdings',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Portfolio holding changed:', payload);
          refreshAllData();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'wallet_balance',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Wallet balance changed:', payload);
          refreshAllData();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_trades',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New trade executed:', payload);
          refreshAllData();
          if (payload.eventType === 'INSERT') {
            toast.success(`Trade executed: ${payload.new.trade_type} ${payload.new.symbol}`);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crypto_markets'
        },
        (payload) => {
          setTimeout(refreshAllData, 1000);
        }
      )
      .subscribe();

    return () => {
      portfolioSubscription.unsubscribe();
    };
  }, [user, supabase, refreshAllData]);

  return { refreshAllData };
}