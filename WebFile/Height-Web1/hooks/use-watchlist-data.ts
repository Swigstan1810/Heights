// hooks/use-watchlist-data.ts - Watchlist-only version
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export interface MarketDataItem {
  id: string;
  symbol: string;
  name: string;
  asset_type: 'stock' | 'mutual_fund' | 'commodity' | 'bond' | 'crypto';
  price: number;
  price_inr: number;
  change_24h: number;
  change_24h_percent: number;
  volume_24h: number;
  market_cap: number;
  high_24h?: number;
  low_24h?: number;
  exchange: string;
  sector: string;
  dividend_yield?: number;
  expense_ratio?: number;
  maturity_date?: string;
  last_updated: string;
  is_active: boolean;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  asset_type: 'stock' | 'mutual_fund' | 'commodity' | 'bond' | 'crypto';
  exchange: string;
  sector: string;
  market_cap: number;
  notes?: string;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UseWatchlistDataReturn {
  // Market Data
  marketData: MarketDataItem[];
  filteredMarketData: MarketDataItem[];
  loadingMarketData: boolean;
  
  // Watchlist
  watchlistItems: WatchlistItem[];
  loadingWatchlist: boolean;
  
  // Actions
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>) => Promise<boolean>;
  removeFromWatchlist: (symbol: string, assetType: string) => Promise<boolean>;
  updateWatchlistItem: (id: string, updates: { notes?: string; tags?: string[]; sort_order?: number }) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAssetTypes: string[];
  setSelectedAssetTypes: (types: string[]) => void;
  selectedSectors: string[];
  setSelectedSectors: (sectors: string[]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  // Utils
  error: string | null;
  getMarketDataBySymbol: (symbol: string, assetType: string) => MarketDataItem | null;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercentage: (value: number) => string;
  isInWatchlist: (symbol: string, assetType: string) => boolean;
}

export function useWatchlistData(): UseWatchlistDataReturn {
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // State
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  
  // Loading states
  const [loadingMarketData, setLoadingMarketData] = useState(true);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('volume_desc');
  
  const [error, setError] = useState<string | null>(null);

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      setLoadingMarketData(true);
      setError(null);
      
      const response = await fetch('/api/watchlist?action=market_data');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch market data');
      }

      // Transform the data to ensure proper types
      const transformedData = (result.data || []).map((item: any) => ({
        ...item,
        price: parseFloat(item.price) || 0,
        price_inr: parseFloat(item.price_inr) || parseFloat(item.price) || 0,
        change_24h: parseFloat(item.change_24h) || 0,
        change_24h_percent: parseFloat(item.change_24h_percent) || 0,
        volume_24h: parseFloat(item.volume_24h) || 0,
        market_cap: parseFloat(item.market_cap) || 0,
        high_24h: item.high_24h ? parseFloat(item.high_24h) : undefined,
        low_24h: item.low_24h ? parseFloat(item.low_24h) : undefined,
        dividend_yield: item.dividend_yield ? parseFloat(item.dividend_yield) : undefined,
        expense_ratio: item.expense_ratio ? parseFloat(item.expense_ratio) : undefined,
      }));

      setMarketData(transformedData);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoadingMarketData(false);
    }
  }, []);

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlistItems([]);
      setLoadingWatchlist(false);
      return;
    }

    try {
      setLoadingWatchlist(true);
      setError(null);
      
      const response = await fetch('/api/watchlist?action=watchlist');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch watchlist');
      }

      // Transform the data to ensure proper types
      const transformedWatchlist = (result.data || []).map((item: any) => ({
        ...item,
        market_cap: parseFloat(item.market_cap) || 0,
        tags: Array.isArray(item.tags) ? item.tags : [],
        sort_order: parseInt(item.sort_order) || 0,
      }));

      setWatchlistItems(transformedWatchlist);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  }, [user]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to add to watchlist');
      return false;
    }

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_to_watchlist',
          ...item
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add to watchlist');
      }

      toast.success(`${item.name} added to watchlist`);
      await fetchWatchlist();
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add to watchlist');
      return false;
    }
  }, [user, fetchWatchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (symbol: string, assetType: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_from_watchlist',
          symbol,
          asset_type: assetType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove from watchlist');
      }

      toast.success('Removed from watchlist');
      await fetchWatchlist();
      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error('Failed to remove from watchlist');
      return false;
    }
  }, [user, fetchWatchlist]);

  // Update watchlist item
  const updateWatchlistItem = useCallback(async (id: string, updates: { notes?: string; tags?: string[]; sort_order?: number }): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_watchlist_item',
          id,
          ...updates
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update watchlist item');
      }

      await fetchWatchlist();
      return true;
    } catch (err) {
      console.error('Error updating watchlist item:', err);
      toast.error('Failed to update watchlist item');
      return false;
    }
  }, [user, fetchWatchlist]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchMarketData(),
      fetchWatchlist()
    ]);
  }, [fetchMarketData, fetchWatchlist]);

  // Filter market data
  const filteredMarketData = marketData.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) && 
          !item.symbol.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Asset type filter
    if (selectedAssetTypes.length > 0 && !selectedAssetTypes.includes(item.asset_type)) {
      return false;
    }

    // Sector filter
    if (selectedSectors.length > 0 && item.sector && !selectedSectors.includes(item.sector)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'change_asc':
        return a.change_24h_percent - b.change_24h_percent;
      case 'change_desc':
        return b.change_24h_percent - a.change_24h_percent;
      case 'volume_asc':
        return a.volume_24h - b.volume_24h;
      case 'volume_desc':
      default:
        return b.volume_24h - a.volume_24h;
    }
  });

  // Utility functions
  const getMarketDataBySymbol = useCallback((symbol: string, assetType: string): MarketDataItem | null => {
    return marketData.find(item => item.symbol === symbol && item.asset_type === assetType) || null;
  }, [marketData]);

  const isInWatchlist = useCallback((symbol: string, assetType: string): boolean => {
    return watchlistItems.some(item => item.symbol === symbol && item.asset_type === assetType);
  }, [watchlistItems]);

  const formatCurrency = useCallback((value: number, currency = 'INR'): string => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Initial data load
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setWatchlistItems([]);
      setLoadingWatchlist(false);
    }
  }, [user, fetchWatchlist]);

  // Auto-refresh market data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return {
    // Market Data
    marketData,
    filteredMarketData,
    loadingMarketData,
    
    // Watchlist
    watchlistItems,
    loadingWatchlist,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    refreshData,
    
    // Filters
    searchQuery,
    setSearchQuery,
    selectedAssetTypes,
    setSelectedAssetTypes,
    selectedSectors,
    setSelectedSectors,
    sortBy,
    setSortBy,
    
    // Utils
    error,
    getMarketDataBySymbol,
    formatCurrency,
    formatPercentage,
    isInWatchlist
  };
}