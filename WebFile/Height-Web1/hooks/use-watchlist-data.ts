// hooks/use-watchlist-data.ts
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
  high_24h: number;
  low_24h: number;
  exchange: string;
  sector: string;
  dividend_yield?: number;
  expense_ratio?: number;
  maturity_date?: string;
  last_updated: string;
  is_active: boolean;
  isFavorite?: boolean;
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
  created_at: string;
  updated_at: string;
  market_data?: MarketDataItem;
}

export interface DemoPortfolioItem {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  updated_at: string;
}

export interface DemoWalletBalance {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
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
  
  // Demo Portfolio
  demoPortfolio: DemoPortfolioItem[];
  demoWalletBalance: DemoWalletBalance | null;
  loadingDemoData: boolean;
  
  // Actions
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  removeFromWatchlist: (symbol: string, assetType: string) => Promise<boolean>;
  executeDemoTrade: (trade: {
    symbol: string;
    asset_type: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price: number;
  }) => Promise<boolean>;
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
  getPortfolioItem: (symbol: string, assetType: string) => DemoPortfolioItem | null;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercentage: (value: number) => string;
}

export function useWatchlistData(): UseWatchlistDataReturn {
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // State
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [demoPortfolio, setDemoPortfolio] = useState<DemoPortfolioItem[]>([]);
  const [demoWalletBalance, setDemoWalletBalance] = useState<DemoWalletBalance | null>(null);
  
  // Loading states
  const [loadingMarketData, setLoadingMarketData] = useState(true);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [loadingDemoData, setLoadingDemoData] = useState(true);
  
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
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('is_active', true)
        .order('volume_24h', { ascending: false });

      if (error) throw error;

      setMarketData(data || []);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoadingMarketData(false);
    }
  }, [supabase]);

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingWatchlist(true);
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with market data
      const enrichedWatchlist = (data || []).map(item => {
        const marketDataItem = marketData.find(
          md => md.symbol === item.symbol && md.asset_type === item.asset_type
        );
        return {
          ...item,
          market_data: marketDataItem
        };
      });

      setWatchlistItems(enrichedWatchlist);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  }, [user, supabase, marketData]);

  // Fetch demo portfolio and wallet
  const fetchDemoData = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingDemoData(true);
      
      const [portfolioResult, walletResult] = await Promise.all([
        supabase
          .from('demo_portfolio')
          .select('*')
          .eq('user_id', user.id)
          .gt('quantity', 0)
          .order('current_value', { ascending: false }),
        supabase
          .from('demo_wallet_balance')
          .select('*')
          .eq('user_id', user.id)
          .eq('currency', 'INR')
          .single()
      ]);

      if (portfolioResult.error && portfolioResult.error.code !== 'PGRST116') {
        throw portfolioResult.error;
      }

      setDemoPortfolio(portfolioResult.data || []);

      // Create wallet if doesn't exist
      if (walletResult.error && walletResult.error.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('demo_wallet_balance')
          .insert({
            user_id: user.id,
            balance: 1000000, // 10 lakh demo money
            currency: 'INR'
          })
          .select()
          .single();

        if (createError) throw createError;
        setDemoWalletBalance(newWallet);
      } else if (!walletResult.error) {
        setDemoWalletBalance(walletResult.data);
      }

    } catch (err) {
      console.error('Error fetching demo data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch demo data');
    } finally {
      setLoadingDemoData(false);
    }
  }, [user, supabase]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) {
      toast.error('Please login to add to watchlist');
      return false;
    }

    try {
      const { error } = await supabase
        .from('watchlist_items')
        .insert({
          ...item,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Item already in watchlist');
          return false;
        }
        throw error;
      }

      toast.success(`${item.name} added to watchlist`);
      await fetchWatchlist();
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error('Failed to add to watchlist');
      return false;
    }
  }, [user, supabase, fetchWatchlist]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (symbol: string, assetType: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .eq('asset_type', assetType);

      if (error) throw error;

      toast.success('Removed from watchlist');
      await fetchWatchlist();
      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error('Failed to remove from watchlist');
      return false;
    }
  }, [user, supabase, fetchWatchlist]);

  // Execute demo trade
  const executeDemoTrade = useCallback(async (trade: {
    symbol: string;
    asset_type: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price: number;
  }): Promise<boolean> => {
    if (!user || !demoWalletBalance) {
      toast.error('Demo wallet not available');
      return false;
    }

    try {
      const { symbol, asset_type, trade_type, quantity, price } = trade;
      const totalAmount = quantity * price;
      const fees = Math.max(10, totalAmount * 0.001); // 0.1% fee, min ₹10

      // Validate trade
      if (trade_type === 'buy' && (totalAmount + fees) > demoWalletBalance.balance) {
        toast.error('Insufficient balance');
        return false;
      }

      // Get current holding
      const existingHolding = demoPortfolio.find(
        p => p.symbol === symbol && p.asset_type === asset_type
      );

      if (trade_type === 'sell' && (!existingHolding || quantity > existingHolding.quantity)) {
        toast.error('Insufficient holdings');
        return false;
      }

      // Execute trade using API route
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_trade',
          symbol,
          asset_type,
          trade_type,
          quantity,
          price
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Trade execution failed');
      }

      toast.success(
        `Demo ${trade_type} order executed: ${quantity} ${symbol} at ₹${price.toFixed(2)}`
      );

      // Refresh data
      await Promise.all([fetchDemoData()]);
      return true;

    } catch (err) {
      console.error('Error executing demo trade:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to execute trade');
      return false;
    }
  }, [user, demoWalletBalance, demoPortfolio, fetchDemoData]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchMarketData(),
      fetchWatchlist(),
      fetchDemoData()
    ]);
  }, [fetchMarketData, fetchWatchlist, fetchDemoData]);

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
    if (selectedSectors.length > 0 && !selectedSectors.includes(item.sector)) {
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

  const getPortfolioItem = useCallback((symbol: string, assetType: string): DemoPortfolioItem | null => {
    return demoPortfolio.find(item => item.symbol === symbol && item.asset_type === assetType) || null;
  }, [demoPortfolio]);

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
      fetchDemoData();
    }
  }, [user, fetchWatchlist, fetchDemoData]);

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
    
    // Demo Portfolio
    demoPortfolio,
    demoWalletBalance,
    loadingDemoData,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    executeDemoTrade,
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
    getPortfolioItem,
    formatCurrency,
    formatPercentage
  };
}