// hooks/use-price-sync.ts
import { useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export const usePriceSync = (userId?: string) => {
  const supabase = createClientComponentClient<Database>();

  const syncPrices = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch latest crypto prices
      const response = await fetch('/api/crypto/sync-prices', {
        method: 'POST'
      });

      if (response.ok) {
        // Prices updated, portfolio values will auto-update via trigger
        console.log('Prices synced successfully');
      }
    } catch (error) {
      console.error('Price sync error:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial sync
    syncPrices();

    // Sync every 30 seconds
    const interval = setInterval(syncPrices, 30000);

    // Set up real-time subscription for market updates
    const subscription = supabase
      .channel('market-prices')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'crypto_markets'
        }, 
        (payload) => {
          console.log('Market price updated:', payload);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [userId, syncPrices, supabase]);

  return { syncPrices };
};