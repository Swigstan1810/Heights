// hooks/use-market-data.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';

interface UseMarketDataOptions {
  symbols?: string[];
  autoConnect?: boolean;
  updateInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface MarketDataState {
  data: Map<string, MarketData>;
  loading: boolean;
  error: string | null;
  connectionStatus: string;
  lastUpdate: Date | null;
  isConnected: boolean;
  retryCount: number;
  fatalError: boolean;
}

interface MarketDataStats {
  totalSymbols: number;
  subscribedSymbols: string[];
  avgChange24h: number;
  lastUpdateTime: Date | null;
  connectionUptime: number;
}

export function useMarketData(options: UseMarketDataOptions = {}) {
  const {
    symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'AVAX'],
    autoConnect = true,
    updateInterval = 1000,
    retryAttempts = 3,
    retryDelay = 5000
  } = options;

  const [state, setState] = useState<MarketDataState>({
    data: new Map(),
    loading: true,
    error: null,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    isConnected: false,
    retryCount: 0,
    fatalError: false
  });

  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTime = useRef<Date | null>(null);
  const isUnmountedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Safe state update function
  const safeSetState = useCallback((updater: (prev: MarketDataState) => MarketDataState) => {
    if (!isUnmountedRef.current) {
      setState(updater);
    }
  }, []);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    if (isUnmountedRef.current) return;

    try {
      const status = coinbaseRealtimeService.getConnectionState();
      const isReady = coinbaseRealtimeService.isReady();
      
      safeSetState(prev => ({
        ...prev,
        connectionStatus: status,
        isConnected: status === 'connected' && isReady
      }));

      // Set connection start time when first connected
      if (status === 'connected' && !connectionStartTime.current) {
        connectionStartTime.current = new Date();
      } else if (status === 'disconnected') {
        connectionStartTime.current = null;
      }
    } catch (error) {
      console.error('[useMarketData] Error updating connection status:', error);
      safeSetState(prev => ({
        ...prev,
        connectionStatus: 'error',
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection status error'
      }));
    }
  }, [safeSetState]);

  // Subscribe to a symbol with error handling
  const subscribe = useCallback((symbol: string) => {
    if (isUnmountedRef.current || subscriptionsRef.current.has(symbol)) {
      return; // Already subscribed or component unmounted
    }

    try {
      const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (marketData) => {
        if (isUnmountedRef.current) return;

        try {
          safeSetState(prev => ({
            ...prev,
            data: new Map(prev.data).set(symbol, marketData),
            lastUpdate: new Date(),
            loading: false,
            error: null,
            retryCount: 0 // Reset retry count on successful update
          }));
        } catch (error) {
          console.error(`[useMarketData] Error updating data for ${symbol}:`, error);
        }
      });

      subscriptionsRef.current.set(symbol, unsubscribe);
      console.log(`[useMarketData] Subscribed to ${symbol}`);
    } catch (error) {
      console.error(`[useMarketData] Error subscribing to ${symbol}:`, error);
      safeSetState(prev => ({
        ...prev,
        error: `Failed to subscribe to ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [safeSetState]);

  // Unsubscribe from a symbol
  const unsubscribe = useCallback((symbol: string) => {
    if (isUnmountedRef.current) return;

    try {
      const unsubscribeFn = subscriptionsRef.current.get(symbol);
      if (unsubscribeFn) {
        unsubscribeFn();
        subscriptionsRef.current.delete(symbol);
        
        safeSetState(prev => {
          const newData = new Map(prev.data);
          newData.delete(symbol);
          return { ...prev, data: newData };
        });
        
        console.log(`[useMarketData] Unsubscribed from ${symbol}`);
      }
    } catch (error) {
      console.error(`[useMarketData] Error unsubscribing from ${symbol}:`, error);
    }
  }, [safeSetState]);

  // Subscribe to multiple symbols
  const subscribeToSymbols = useCallback((symbolList: string[]) => {
    if (isUnmountedRef.current) return;

    const validSymbols = symbolList.filter(symbol => 
      symbol && typeof symbol === 'string' && symbol.trim().length > 0
    );

    if (validSymbols.length === 0) {
      console.warn('[useMarketData] No valid symbols provided for subscription');
      return;
    }

    console.log(`[useMarketData] Subscribing to ${validSymbols.length} symbols:`, validSymbols);
    
    validSymbols.forEach(symbol => {
      // Add small delay between subscriptions to avoid overwhelming the service
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          subscribe(symbol.trim().toUpperCase());
        }
      }, Math.random() * 1000); // Random delay up to 1 second
    });
  }, [subscribe]);

  // Get market data for a specific symbol with retry logic
  const getMarketData = useCallback(async (symbol: string): Promise<MarketData | null> => {
    if (isUnmountedRef.current || !symbol) return null;

    try {
      safeSetState(prev => ({ ...prev, error: null }));
      
      const data = await coinbaseRealtimeService.getMarketData(symbol);
      
      if (data && !isUnmountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          data: new Map(prev.data).set(symbol, data),
          lastUpdate: new Date(),
          error: null
        }));
      }
      
      return data;
    } catch (error) {
      console.error(`[useMarketData] Error fetching market data for ${symbol}:`, error);
      
      if (!isUnmountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          error: `Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
      
      return null;
    }
  }, [safeSetState]);

  // Refresh all subscribed symbols with retry logic
  const refresh = useCallback(async () => {
    if (isUnmountedRef.current) return;

    safeSetState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const symbolList = Array.from(subscriptionsRef.current.keys());
      
      if (symbolList.length === 0) {
        safeSetState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log(`[useMarketData] Refreshing data for ${symbolList.length} symbols`);

      // Fetch data for all symbols with proper error handling
      const promises = symbolList.map(async (symbol) => {
        try {
          return await getMarketData(symbol);
        } catch (error) {
          console.error(`[useMarketData] Error refreshing ${symbol}:`, error);
          return null;
        }
      });

      await Promise.allSettled(promises);
      
      if (!isUnmountedRef.current) {
        safeSetState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('[useMarketData] Error during refresh:', error);
      
      if (!isUnmountedRef.current) {
        safeSetState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to refresh market data'
        }));
      }
    }
  }, [getMarketData, safeSetState]);

  // Retry connection with exponential backoff
  const retryConnection = useCallback(() => {
    if (isUnmountedRef.current || state.retryCount >= retryAttempts) {
      return;
    }

    const delay = retryDelay * Math.pow(2, state.retryCount); // Exponential backoff
    
    console.log(`[useMarketData] Retrying connection in ${delay}ms (attempt ${state.retryCount + 1}/${retryAttempts})`);
    
    retryTimeoutRef.current = setTimeout(async () => {
      if (isUnmountedRef.current) return;

      try {
        safeSetState(prev => ({ 
          ...prev, 
          retryCount: prev.retryCount + 1,
          error: null 
        }));

        // Check if service is ready
        if (coinbaseRealtimeService.isReady()) {
          // Re-subscribe to symbols
          const symbolList = Array.from(subscriptionsRef.current.keys());
          if (symbolList.length > 0) {
            subscribeToSymbols(symbolList);
          }
        } else {
          // Service not ready, try again
          retryConnection();
        }
      } catch (error) {
        console.error('[useMarketData] Retry failed:', error);
        if (!isUnmountedRef.current) {
          retryConnection(); // Try again
        }
      }
    }, delay);
  }, [state.retryCount, retryAttempts, retryDelay, safeSetState, subscribeToSymbols]);

  // Clear all subscriptions
  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribeFn => {
      try {
        unsubscribeFn();
      } catch (error) {
        console.error('[useMarketData] Error during cleanup:', error);
      }
    });
    subscriptionsRef.current.clear();
    
    if (!isUnmountedRef.current) {
      safeSetState(prev => ({
        ...prev,
        data: new Map(),
        lastUpdate: null
      }));
    }
  }, [safeSetState]);

  // Get data for a specific symbol
  const getSymbolData = useCallback((symbol: string): MarketData | null => {
    if (!symbol) return null;
    return state.data.get(symbol.toUpperCase()) || null;
  }, [state.data]);

  // Get all data as array
  const getAllData = useCallback((): MarketData[] => {
    return Array.from(state.data.values()).filter(data => data && typeof data === 'object');
  }, [state.data]);

  // Get top gainers
  const getTopGainers = useCallback((limit = 5): MarketData[] => {
    return getAllData()
      .filter(data => data.change24hPercent > 0)
      .sort((a, b) => b.change24hPercent - a.change24hPercent)
      .slice(0, limit);
  }, [getAllData]);

  // Get top losers
  const getTopLosers = useCallback((limit = 5): MarketData[] => {
    return getAllData()
      .filter(data => data.change24hPercent < 0)
      .sort((a, b) => a.change24hPercent - b.change24hPercent)
      .slice(0, limit);
  }, [getAllData]);

  // Get by volume
  const getByVolume = useCallback((limit = 5): MarketData[] => {
    return getAllData()
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
  }, [getAllData]);

  // Get statistics
  const getStats = useCallback((): MarketDataStats => {
    const allData = getAllData();
    const connectionUptime = connectionStartTime.current 
      ? Date.now() - connectionStartTime.current.getTime() 
      : 0;

    return {
      totalSymbols: state.data.size,
      subscribedSymbols: Array.from(subscriptionsRef.current.keys()),
      avgChange24h: allData.length > 0 
        ? allData.reduce((sum, data) => sum + data.change24hPercent, 0) / allData.length 
        : 0,
      lastUpdateTime: state.lastUpdate,
      connectionUptime
    };
  }, [getAllData, state.data.size, state.lastUpdate]);

  // Initialize subscriptions
  useEffect(() => {
    if (autoConnect && symbols.length > 0 && !isUnmountedRef.current) {
      console.log('[useMarketData] Initializing with symbols:', symbols);
      
      // Wait for service to be ready
      const checkReady = () => {
        if (isUnmountedRef.current) return;
        
        if (coinbaseRealtimeService.isReady()) {
          subscribeToSymbols(symbols);
          safeSetState(prev => ({ ...prev, loading: false }));
        } else {
          // Service not ready, wait and check again
          setTimeout(checkReady, 1000);
        }
      };

      checkReady();
    }
  }, [autoConnect, symbols, subscribeToSymbols, safeSetState]);

  // Monitor connection status
  useEffect(() => {
    if (autoConnect) {
      updateConnectionStatus();
      statusIntervalRef.current = setInterval(updateConnectionStatus, updateInterval);

      // Set up retry logic for failed connections
      const connectionCheckInterval = setInterval(() => {
        if (isUnmountedRef.current) return;

        const status = coinbaseRealtimeService.getConnectionState();
        if (status === 'closed' || status === 'unknown') {
          retryConnection();
        }
      }, retryDelay);

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
        clearInterval(connectionCheckInterval);
      };
    }
  }, [autoConnect, updateInterval, updateConnectionStatus, retryConnection, retryDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      clearSubscriptions();
    };
  }, [clearSubscriptions]);

  // Add a function to force cleanup and set fatalError
  const handleFatalError = useCallback((err: any) => {
    if (!isUnmountedRef.current) {
      clearSubscriptions();
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      setState(prev => ({ ...prev, fatalError: true, error: err instanceof Error ? err.message : 'Fatal error' }));
    }
  }, [clearSubscriptions]);

  // At the top of the hook, if fatalError is set, return a minimal object:
  if (state.fatalError) {
    return {
      ...state,
      data: new Map(),
      loading: false,
      error: state.error || 'Fatal error in market data',
      isConnected: false,
      getAllData: () => [],
      getSymbolData: () => null,
      getTopGainers: () => [],
      getTopLosers: () => [],
      getByVolume: () => [],
      getStats: () => ({
        totalSymbols: 0,
        subscribedSymbols: [],
        avgChange24h: 0,
        lastUpdateTime: null,
        connectionUptime: 0
      }),
      subscribe: () => {},
      unsubscribe: () => {},
      getMarketData: () => []
    };
  }

  return {
    // State
    ...state,
    
    // Actions
    subscribe,
    unsubscribe,
    subscribeToSymbols,
    refresh,
    clearSubscriptions,
    getMarketData,
    retryConnection,
    
    // Getters
    getSymbolData,
    getAllData,
    getTopGainers,
    getTopLosers,
    getByVolume,
    getStats,
    
    // Computed values
    totalSymbols: state.data.size,
    subscribedSymbols: Array.from(subscriptionsRef.current.keys()),
    avgChange24h: getAllData().length > 0 
      ? getAllData().reduce((sum, data) => sum + data.change24hPercent, 0) / getAllData().length 
      : 0,
    
    // Service info
    isServiceReady: coinbaseRealtimeService.isReady(),
    validProducts: coinbaseRealtimeService.getValidProducts(),
    popularPairs: coinbaseRealtimeService.getPopularPairs()
  };
}

// Hook for single symbol
export function useSymbolData(symbol: string, options: Omit<UseMarketDataOptions, 'symbols'> = {}) {
  const marketData = useMarketData({
    ...options,
    symbols: symbol ? [symbol] : [],
    autoConnect: true
  });

  return {
    data: marketData.getSymbolData(symbol),
    loading: marketData.loading,
    error: marketData.error,
    isConnected: marketData.isConnected,
    lastUpdate: marketData.lastUpdate,
    subscribe: () => marketData.subscribe(symbol),
    unsubscribe: () => marketData.unsubscribe(symbol),
    refresh: () => marketData.getMarketData(symbol)
  };
}

// Hook for portfolio tracking
export function usePortfolioData(symbols: string[], options: UseMarketDataOptions = {}) {
  const marketData = useMarketData({ 
    ...options, 
    symbols, 
    autoConnect: true 
  });
  
  const calculatePortfolioValue = useCallback((holdings: Record<string, number>) => {
    let totalValue = 0;
    let totalChange24h = 0;
    let validHoldings = 0;
    
    Object.entries(holdings).forEach(([symbol, quantity]) => {
      if (quantity <= 0) return;
      
      const data = marketData.getSymbolData(symbol);
      if (data && data.price > 0) {
        const value = data.price * quantity;
        const change = (data.price * data.change24hPercent / 100) * quantity;
        totalValue += value;
        totalChange24h += change;
        validHoldings++;
      }
    });
    
    const totalChange24hPercent = totalValue > 0 && totalChange24h !== 0
      ? (totalChange24h / (totalValue - totalChange24h)) * 100 
      : 0;
    
    return {
      totalValue,
      totalChange24h,
      totalChange24hPercent,
      validHoldings,
      totalHoldings: Object.keys(holdings).length
    };
  }, [marketData]);

  return {
    ...marketData,
    calculatePortfolioValue
  };
}