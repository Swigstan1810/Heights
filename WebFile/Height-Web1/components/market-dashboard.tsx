"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Star,
  StarOff,
  RefreshCw,
  Activity,
  BarChart3,
  LineChart,
  DollarSign,
  Volume2,
  Eye,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { marketDataService, type MarketData } from '@/lib/market-data';

interface AssetData extends MarketData {
  marketCap?: number;
  isWatched?: boolean;
  category: 'crypto' | 'stock' | 'forex' | 'commodity';
  exchange: string;
}

const ASSET_CATEGORIES = {
  crypto: { label: 'Cryptocurrency', icon: '₿' },
  stock: { label: 'Stocks', icon: '📈' },
  forex: { label: 'Forex', icon: '💱' },
  commodity: { label: 'Commodities', icon: '🥇' }
};

const POPULAR_ASSETS = [
  // Crypto
  { symbol: 'CRYPTO:BTC', name: 'Bitcoin', category: 'crypto', exchange: 'Coinbase' },
  { symbol: 'CRYPTO:ETH', name: 'Ethereum', category: 'crypto', exchange: 'Coinbase' },
  { symbol: 'CRYPTO:SOL', name: 'Solana', category: 'crypto', exchange: 'Coinbase' },
  { symbol: 'CRYPTO:MATIC', name: 'Polygon', category: 'crypto', exchange: 'Coinbase' },
  { symbol: 'CRYPTO:AVAX', name: 'Avalanche', category: 'crypto', exchange: 'Coinbase' },
  
  // Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stock', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', exchange: 'NASDAQ' },
  
  // Indian Stocks
  { symbol: 'NSE:RELIANCE', name: 'Reliance Industries', category: 'stock', exchange: 'NSE' },
  { symbol: 'NSE:TCS', name: 'Tata Consultancy Services', category: 'stock', exchange: 'NSE' },
  { symbol: 'NSE:INFY', name: 'Infosys Limited', category: 'stock', exchange: 'NSE' },
  { symbol: 'NSE:HDFCBANK', name: 'HDFC Bank', category: 'stock', exchange: 'NSE' },
];

export default function MarketDashboard() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Map<string, AssetData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | keyof typeof ASSET_CATEGORIES>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'volume'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize market data
  useEffect(() => {
    const initializeMarketData = async () => {
      setLoading(true);
      
      // Connect to market data service
      marketDataService.connect();
      
      // Subscribe to all popular assets
      const unsubscribes = POPULAR_ASSETS.map(asset => {
        return marketDataService.subscribe(asset.symbol, (data: MarketData) => {
          setAssets(prev => {
            const newAssets = new Map(prev);
            const existingAsset = newAssets.get(asset.symbol);
            
            newAssets.set(asset.symbol, {
              ...data,
              category: asset.category as 'crypto' | 'stock' | 'forex' | 'commodity',
              exchange: asset.exchange,
              isWatched: watchlist.has(asset.symbol),
              marketCap: data.price * data.volume24h * 0.1 // Rough estimate
            });
            
            return newAssets;
          });
          setLastUpdate(new Date());
        });
      });
      
      setLoading(false);
      
      return () => {
        unsubscribes.forEach(unsub => unsub());
        marketDataService.disconnect();
      };
    };
    
    initializeMarketData();
  }, [watchlist]);

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let filtered = Array.from(assets.values());
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.symbol.toLowerCase().includes(query) ||
        POPULAR_ASSETS.find(a => a.symbol === asset.symbol)?.name.toLowerCase().includes(query)
      );
    }
    
    // Sort assets
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'name':
          const aName = POPULAR_ASSETS.find(asset => asset.symbol === a.symbol)?.name || '';
          const bName = POPULAR_ASSETS.find(asset => asset.symbol === b.symbol)?.name || '';
          return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.change24hPercent;
          bValue = b.change24hPercent;
          break;
        case 'volume':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  }, [assets, selectedCategory, searchQuery, sortBy, sortOrder]);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(symbol)) {
        newWatchlist.delete(symbol);
      } else {
        newWatchlist.add(symbol);
      }
      return newWatchlist;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setLastUpdate(new Date());
    // Trigger refresh of market data
    marketDataService.disconnect();
    marketDataService.connect();
  }, []);

  // Market overview stats
  const marketStats = useMemo(() => {
    const allAssets = Array.from(assets.values());
    const gainers = allAssets.filter(asset => asset.change24hPercent > 0).length;
    const losers = allAssets.filter(asset => asset.change24hPercent < 0).length;
    const totalVolume = allAssets.reduce((sum, asset) => sum + asset.volume24h, 0);
    const avgChange = allAssets.length > 0 
      ? allAssets.reduce((sum, asset) => sum + asset.change24hPercent, 0) / allAssets.length 
      : 0;

    return { gainers, losers, totalVolume, avgChange };
  }, [assets]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">{assets.size}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gainers</p>
                  <p className="text-2xl font-bold text-green-500">{marketStats.gainers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Losers</p>
                  <p className="text-2xl font-bold text-red-500">{marketStats.losers}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Change</p>
                  <p className={`text-2xl font-bold ${
                    marketStats.avgChange >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Market Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Live Market Data</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {Object.entries(ASSET_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground">Asset</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">24h Change</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">24h Volume</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Market Cap</th>
                  <th className="text-center p-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAssets.map((asset, index) => {
                    const assetInfo = POPULAR_ASSETS.find(a => a.symbol === asset.symbol);
                    return (
                      <motion.tr
                        key={asset.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {ASSET_CATEGORIES[asset.category]?.icon || '📊'}
                            </div>
                            <div>
                              <p className="font-medium">{assetInfo?.name || asset.symbol}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                                <Badge variant="outline" className="text-xs">
                                  {asset.exchange}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="text-right p-2">
                          <p className="font-medium">
                            ${asset.price.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: asset.price < 1 ? 6 : 2 
                            })}
                          </p>
                        </td>
                        
                        <td className="text-right p-2">
                          <div className={`flex items-center justify-end gap-1 ${
                            asset.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {asset.change24hPercent >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${asset.change24h.toFixed(2)}
                          </p>
                        </td>
                        
                        <td className="text-right p-2">
                          <p className="font-medium">
                            ${(asset.volume24h / 1000000).toFixed(2)}M
                          </p>
                        </td>
                        
                        <td className="text-right p-2">
                          <p className="font-medium">
                            {asset.marketCap 
                              ? `$${(asset.marketCap / 1000000000).toFixed(2)}B`
                              : 'N/A'
                            }
                          </p>
                        </td>
                        
                        <td className="text-center p-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWatchlist(asset.symbol)}
                              className="h-8 w-8 p-0"
                            >
                              {watchlist.has(asset.symbol) ? (
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/trade?symbol=${asset.symbol}`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <LineChart className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No assets found</p>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}