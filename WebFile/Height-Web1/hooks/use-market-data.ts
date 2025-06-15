// hooks/use-market-data.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';

interface UseMarketDataOptions {
  symbols?: string[];
  autoConnect?: boolean;
  updateInterval?: number;
}

interface MarketDataState {
  data: Map<string, MarketData>;
  loading: boolean;
  error: string | null;
  connectionStatus: string;
  lastUpdate: Date | null;
  isConnected: boolean;
}

export function useMarketData(options: UseMarketDataOptions = {}) {
  const {
    symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'LINK', 'AVAX'],
    autoConnect = true,
    updateInterval = 1000
  } = options;

  const [state, setState] = useState<MarketDataState>({
    data: new Map(),
    loading: true,
    error: null,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    isConnected: false
  });

  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    const status = coinbaseRealtimeService.getConnectionState();
    setState(prev => ({
      ...prev,
      connectionStatus: status,
      isConnected: status === 'connected'
    }));
  }, []);

  // Subscribe to a symbol
  const subscribe = useCallback((symbol: string) => {
    if (subscriptionsRef.current.has(symbol)) {
      return; // Already subscribed
    }

    const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (marketData) => {
      setState(prev => ({
        ...prev,
        data: new Map(prev.data).set(symbol, marketData),
        lastUpdate: new Date(),
        loading: false,
        error: null
      }));
    });

    subscriptionsRef.current.set(symbol, unsubscribe);
  }, []);

  // Unsubscribe from a symbol
  const unsubscribe = useCallback((symbol: string) => {
    const unsubscribeFn = subscriptionsRef.current.get(symbol);
    if (unsubscribeFn) {
      unsubscribeFn();
      subscriptionsRef.current.delete(symbol);
      
      setState(prev => {
        const newData = new Map(prev.data);
        newData.delete(symbol);
        return { ...prev, data: newData };
      });
    }
  }, []);

  // Subscribe to multiple symbols
  const subscribeToSymbols = useCallback((symbolList: string[]) => {
    symbolList.forEach(symbol => subscribe(symbol));
  }, [subscribe]);

  // Get market data for a specific symbol
  const getMarketData = useCallback(async (symbol: string): Promise<MarketData | null> => {
    try {
      const data = await coinbaseRealtimeService.getMarketData(symbol);
      if (data) {
        setState(prev => ({
          ...prev,
          data: new Map(prev.data).set(symbol, data),
          lastUpdate: new Date(),
          error: null
        }));
      }
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch market data'
      }));
      return null;
    }
  }, []);

  // Refresh all subscribed symbols
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const symbolList = Array.from(subscriptionsRef.current.keys());
      const promises = symbolList.map(symbol => getMarketData(symbol));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error refreshing market data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh market data'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [getMarketData]);

  // Clear all subscriptions
  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribeFn => unsubscribeFn());
    subscriptionsRef.current.clear();
    setState(prev => ({
      ...prev,
      data: new Map(),
      lastUpdate: null
    }));
  }, []);

  // Get data for a specific symbol
  const getSymbolData = useCallback((symbol: string): MarketData | null => {
    return state.data.get(symbol) || null;
  }, [state.data]);

  // Get all data as array
  const getAllData = useCallback((): MarketData[] => {
    return Array.from(state.data.values());
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

  // Initialize subscriptions
  useEffect(() => {
    if (autoConnect && symbols.length > 0) {
      // Load initial data
      Promise.all(symbols.map(symbol => getMarketData(symbol)))
        .then(() => {
          setState(prev => ({ ...prev, loading: false }));
        })
        .catch(error => {
          console.error('Error loading initial data:', error);
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load initial data'
          }));
        });

      // Subscribe to real-time updates
      subscribeToSymbols(symbols);
    }
  }, [autoConnect, symbols, getMarketData, subscribeToSymbols]);

  // Monitor connection status
  useEffect(() => {
    if (autoConnect) {
      updateConnectionStatus();
      statusIntervalRef.current = setInterval(updateConnectionStatus, updateInterval);
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [autoConnect, updateInterval, updateConnectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSubscriptions();
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [clearSubscriptions]);

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
    
    // Getters
    getSymbolData,
    getAllData,
    getTopGainers,
    getTopLosers,
    getByVolume,
    
    // Computed
    totalSymbols: state.data.size,
    subscribedSymbols: Array.from(subscriptionsRef.current.keys()),
    avgChange24h: getAllData().length > 0 
      ? getAllData().reduce((sum, data) => sum + data.change24hPercent, 0) / getAllData().length 
      : 0
  };
}

// Hook for single symbol
export function useSymbolData(symbol: string) {
  const { getSymbolData, subscribe, unsubscribe, loading, error, isConnected } = useMarketData({
    symbols: [symbol],
    autoConnect: true
  });

  return {
    data: getSymbolData(symbol),
    loading,
    error,
    isConnected,
    subscribe: () => subscribe(symbol),
    unsubscribe: () => unsubscribe(symbol)
  };
}

// Hook for portfolio tracking
export function usePortfolioData(symbols: string[]) {
  const marketData = useMarketData({ symbols, autoConnect: true });
  
  const calculatePortfolioValue = useCallback((holdings: Record<string, number>) => {
    let totalValue = 0;
    let totalChange24h = 0;
    
    Object.entries(holdings).forEach(([symbol, quantity]) => {
      const data = marketData.getSymbolData(symbol);
      if (data) {
        const value = data.price * quantity;
        const change = (data.price * data.change24hPercent / 100) * quantity;
        totalValue += value;
        totalChange24h += change;
      }
    });
    
    const totalChange24hPercent = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;
    
    return {
      totalValue,
      totalChange24h,
      totalChange24hPercent
    };
  }, [marketData]);

  return {
    ...marketData,
    calculatePortfolioValue
  };
}