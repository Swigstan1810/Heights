// app/watchlist/page.tsx - Modern watchlist-only version
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Coins,
  Banknote,
  Gem,
  Shield,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart3,
  Eye,
  Sparkles,
  Activity,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWatchlistData, MarketDataItem } from '@/hooks/use-watchlist-data';
import { WatchlistCard } from '@/components/watchlist/watchlist-card';
import { ModernChartModal } from '@/components/watchlist/modern-chart-modal';
import { useTheme } from 'next-themes';

export default function WatchlistPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const { theme: systemTheme } = useTheme();
  const chartTheme = systemTheme === 'dark' ? 'dark' : 'light';
  
  const {
    // Data
    filteredMarketData,
    watchlistItems,
    loadingMarketData,
    loadingWatchlist,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
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
    formatCurrency,
    formatPercentage,
    isInWatchlist
  } = useWatchlistData();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MarketDataItem | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login?redirectTo=/watchlist');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Filter data by active tab
  const getFilteredData = () => {
    let data = filteredMarketData;
    
    if (activeTab === 'watchlist') {
      const watchlistSymbols = new Set(watchlistItems.map(w => `${w.symbol}_${w.asset_type}`));
      data = data.filter(item => watchlistSymbols.has(`${item.symbol}_${item.asset_type}`));
    } else if (activeTab !== 'all') {
      data = data.filter(item => item.asset_type === activeTab);
    }
    
    return data;
  };

  const displayData = getFilteredData();

  // Asset type counts
  const assetTypeCounts = {
    all: filteredMarketData.length,
    stock: filteredMarketData.filter(item => item.asset_type === 'stock').length,
    mutual_fund: filteredMarketData.filter(item => item.asset_type === 'mutual_fund').length,
    commodity: filteredMarketData.filter(item => item.asset_type === 'commodity').length,
    bond: filteredMarketData.filter(item => item.asset_type === 'bond').length,
    watchlist: watchlistItems.length
  };

  // Get unique sectors for filter
  const uniqueSectors = [...new Set(filteredMarketData.map(item => item.sector).filter(Boolean))];

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      toast.success('Data refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddToWatchlist = async (item: MarketDataItem) => {
    const success = await addToWatchlist({
      symbol: item.symbol,
      name: item.name,
      asset_type: item.asset_type,
      exchange: item.exchange,
      sector: item.sector,
      market_cap: item.market_cap,
      notes: '',
      tags: []
    });
    if (success) {
      setActiveTab(prev => prev);
    }
  };

  const handleRemoveFromWatchlist = async (item: MarketDataItem) => {
    await removeFromWatchlist(item.symbol, item.asset_type);
  };

  const handleViewChart = (item: MarketDataItem) => {
    setSelectedItem(item);
    setChartModalOpen(true);
  };

  // Loading state
  if (!isInitialized || loadingMarketData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 pb-16">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-50/10 to-indigo-500/10 border border-border/50 p-6 md:p-8">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl">
                    <BookmarkPlus className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Investment Watchlist
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2 text-lg">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      Track and analyze financial instruments with advanced charts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="flex items-center gap-1 bg-background/60 backdrop-blur-sm rounded-lg p-1 border border-border/20">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Error Alert */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <Card className="mb-6 border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search stocks, crypto, mutual funds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>

              {/* Asset Type Filter */}
              <Select 
                value={selectedAssetTypes.length === 1 ? selectedAssetTypes[0] : 'all'} 
                onValueChange={(value) => setSelectedAssetTypes(value === 'all' ? [] : [value])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-white/50 border-gray-200">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stock">Stocks</SelectItem>
                  <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
                  <SelectItem value="commodity">Commodities</SelectItem>
                  <SelectItem value="bond">Bonds</SelectItem>
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select 
                value={selectedSectors.length === 1 ? selectedSectors[0] : 'all'} 
                onValueChange={(value) => setSelectedSectors(value === 'all' ? [] : [value])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-white/50 border-gray-200">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48 bg-white/50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume_desc">Volume (High to Low)</SelectItem>
                  <SelectItem value="volume_asc">Volume (Low to High)</SelectItem>
                  <SelectItem value="change_desc">Change % (High to Low)</SelectItem>
                  <SelectItem value="change_asc">Change % (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="name_asc">Name (A to Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z to A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto bg-muted/50 h-14 rounded-xl border-0 shadow-lg p-1 gap-1 min-w-max">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all px-4 whitespace-nowrap">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>All</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 whitespace-nowrap">
                <Building2 className="h-4 w-4 mr-2" />
                <span>Stocks</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.stock}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mutual_fund" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 whitespace-nowrap">
                <Banknote className="h-4 w-4 mr-2" />
                <span>Mutual Funds</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.mutual_fund}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="commodity" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 whitespace-nowrap">
                <Gem className="h-4 w-4 mr-2" />
                <span>Commodities</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.commodity}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="bond" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 whitespace-nowrap">
                <Shield className="h-4 w-4 mr-2" />
                <span>Bonds</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.bond}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg px-4 whitespace-nowrap">
                <Star className="h-4 w-4 mr-2" />
                <span>Watchlist</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white/20 text-current">
                  {assetTypeCounts.watchlist}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-6">
            {displayData.length === 0 ? (
              <Card className="border-2 border-dashed border-muted-foreground/30 bg-background/50">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold mx-auto mb-6">
                    <BarChart3 className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">No Assets Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {activeTab === 'watchlist' 
                      ? 'Your watchlist is empty. Start adding assets to track them here.'
                      : 'No assets match your search criteria. Try adjusting your filters.'
                    }
                  </p>
                  {activeTab === 'watchlist' && (
                    <Button 
                      onClick={() => setActiveTab('all')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Browse All Assets
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {displayData.map((item, index) => (
                  <WatchlistCard
                    key={`${item.symbol}_${item.asset_type}`}
                    item={item}
                    isInWatchlist={isInWatchlist(item.symbol, item.asset_type)}
                    onAddToWatchlist={() => handleAddToWatchlist(item)}
                    onRemoveFromWatchlist={() => handleRemoveFromWatchlist(item)}
                    onViewChart={() => handleViewChart(item)}
                    formatCurrency={formatCurrency}
                    formatPercentage={formatPercentage}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chart Modal */}
      <ModernChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        item={selectedItem}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
        theme={chartTheme}
      />
    </main>
  );
}