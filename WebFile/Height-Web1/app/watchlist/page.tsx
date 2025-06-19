// app/watchlist/page.tsx - Replace the existing Coming Soon page
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
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Activity,
  PieChart,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWatchlistData } from '@/hooks/use-watchlist-data';
import { MarketDataCard } from '@/components/watchlist/market-data-card';
import { TradingModal } from '@/components/watchlist/trading-modal';
import { ChartModal } from '@/components/watchlist/chart-modal';

export default function WatchlistPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  
  const {
    // Data
    filteredMarketData,
    watchlistItems,
    demoPortfolio,
    demoWalletBalance,
    loadingMarketData,
    loadingWatchlist,
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
  } = useWatchlistData();

  const [activeTab, setActiveTab] = useState('all');
  const [showBalances, setShowBalances] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    } else if (activeTab === 'portfolio') {
      const portfolioSymbols = new Set(demoPortfolio.map(p => `${p.symbol}_${p.asset_type}`));
      data = data.filter(item => portfolioSymbols.has(`${item.symbol}_${item.asset_type}`));
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
    crypto: filteredMarketData.filter(item => item.asset_type === 'crypto').length,
    mutual_fund: filteredMarketData.filter(item => item.asset_type === 'mutual_fund').length,
    commodity: filteredMarketData.filter(item => item.asset_type === 'commodity').length,
    bond: filteredMarketData.filter(item => item.asset_type === 'bond').length,
    watchlist: watchlistItems.length,
    portfolio: demoPortfolio.length
  };

  // Portfolio summary
  const portfolioSummary = {
    totalValue: demoPortfolio.reduce((sum, item) => sum + item.current_value, 0),
    totalInvested: demoPortfolio.reduce((sum, item) => sum + item.total_invested, 0),
    totalPnL: demoPortfolio.reduce((sum, item) => sum + item.profit_loss, 0),
    totalPnLPercentage: demoPortfolio.length > 0 
      ? (demoPortfolio.reduce((sum, item) => sum + item.profit_loss_percentage, 0) / demoPortfolio.length)
      : 0
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

  const handleAddToWatchlist = async (item) => {
    const success = await addToWatchlist({
      symbol: item.symbol,
      name: item.name,
      asset_type: item.asset_type,
      exchange: item.exchange,
      sector: item.sector,
      market_cap: item.market_cap
    });
    if (success) {
      // Refresh watchlist tab count
      setActiveTab(prev => prev);
    }
  };

  const handleRemoveFromWatchlist = async (item) => {
    await removeFromWatchlist(item.symbol, item.asset_type);
  };

  const handleTrade = (item) => {
    setSelectedItem(item);
    setTradingModalOpen(true);
  };

  const handleViewChart = (item) => {
    setSelectedItem(item);
    setChartModalOpen(true);
  };

  const isInWatchlist = (item) => {
    return watchlistItems.some(w => w.symbol === item.symbol && w.asset_type === item.asset_type);
  };

  // Loading state
  if (!isInitialized || loadingMarketData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 border border-border/50 p-6 md:p-8">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Investment Watchlist
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Sparkles className="h-4 w-4" />
                        Track and trade stocks, crypto, mutual funds, commodities & bonds
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Portfolio Summary */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <PieChart className="h-4 w-4 text-purple-500" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {showBalances ? formatCurrency(portfolioSummary.totalValue) : '••••••'}
                      </div>
                      <div className={`text-xs ${portfolioSummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {showBalances ? `${portfolioSummary.totalPnL >= 0 ? '+' : ''}${portfolioSummary.totalPnLPercentage.toFixed(2)}%` : '••••'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo Balance */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-sm">
                      {showBalances ? formatCurrency(demoWalletBalance?.balance || 0) : '••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalances(!showBalances)}
                      className="h-6 w-6 p-0"
                    >
                      {showBalances ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks, crypto, mutual funds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>

              {/* Asset Type Filter */}
              <Select 
                value={selectedAssetTypes.length === 1 ? selectedAssetTypes[0] : 'all_types'} 
                onValueChange={(value) => setSelectedAssetTypes(value === 'all_types' ? [] : [value])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All Types</SelectItem>
                  <SelectItem value="stock">Stocks</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
                  <SelectItem value="commodity">Commodities</SelectItem>
                  <SelectItem value="bond">Bonds</SelectItem>
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select 
                value={selectedSectors.length === 1 ? selectedSectors[0] : 'all_sectors'} 
                onValueChange={(value) => setSelectedSectors(value === 'all_sectors' ? [] : [value])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sectors">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/50 h-14 min-w-fit">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">All</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Stocks</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.stock}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="crypto" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
                <Coins className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Crypto</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.crypto}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mutual_fund" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
                <Banknote className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">MFs</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.mutual_fund}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="commodity" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600">
                <Gem className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Commodities</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.commodity}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="bond" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Bonds</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.bond}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600">
                <Star className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Watchlist</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.watchlist}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
                <PieChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Portfolio</span>
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {assetTypeCounts.portfolio}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-6">
            {displayData.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold mx-auto mb-4">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'watchlist' 
                      ? 'Your watchlist is empty. Add assets to track them here.'
                      : activeTab === 'portfolio'
                      ? 'Your portfolio is empty. Start trading to see your holdings.'
                      : 'No assets match your search criteria. Try adjusting your filters.'
                    }
                  </p>
                  {(activeTab === 'watchlist' || activeTab === 'portfolio') && (
                    <Button onClick={() => setActiveTab('all')}>
                      Browse All Assets
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayData.map((item, index) => (
                  <MarketDataCard
                    key={`${item.symbol}_${item.asset_type}`}
                    item={item}
                    portfolioItem={getPortfolioItem(item.symbol, item.asset_type)}
                    isInWatchlist={isInWatchlist(item)}
                    onAddToWatchlist={() => handleAddToWatchlist(item)}
                    onRemoveFromWatchlist={() => handleRemoveFromWatchlist(item)}
                    onBuy={() => handleTrade(item)}
                    onSell={() => handleTrade(item)}
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

      {/* Trading Modal */}
      <TradingModal
        isOpen={tradingModalOpen}
        onClose={() => setTradingModalOpen(false)}
        item={selectedItem}
        portfolioItem={selectedItem ? getPortfolioItem(selectedItem.symbol, selectedItem.asset_type) : null}
        walletBalance={demoWalletBalance}
        onTrade={executeDemoTrade}
        formatCurrency={formatCurrency}
      />

      {/* Chart Modal */}
      <ChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        item={selectedItem}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </main>
  );
}// app/watchlist/page.tsx
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
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Activity,
  PieChart,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWatchlistData } from '@/hooks/use-watchlist-data';
import { MarketDataCard } from '@/components/watchlist/market-data-card';
import { TradingModal } from '@/components/watchlist/trading-modal';
import { ChartModal } from '@/components/watchlist/chart-modal';

export default function WatchlistPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  
  const {
    // Data
    filteredMarketData,
    watchlistItems,
    demoPortfolio,
    demoWalletBalance,
    loadingMarketData,
    loadingWatchlist,
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
  } = useWatchlistData();

  const [activeTab, setActiveTab] = useState('all');
  const [showBalances, setShowBalances] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    } else if (activeTab === 'portfolio') {
      const portfolioSymbols = new Set(demoPortfolio.map(p => `${p.symbol}_${p.asset_type}`));
      data = data.filter(item => portfolioSymbols.has(`${item.symbol}_${item.asset_type}`));
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
    crypto: filteredMarketData.filter(item => item.asset_type === 'crypto').length,
    mutual_fund: filteredMarketData.filter(item => item.asset_type === 'mutual_fund').length,
    commodity: filteredMarketData.filter(item => item.asset_type === 'commodity').length,
    bond: filteredMarketData.filter(item => item.asset_type === 'bond').length,
    watchlist: watchlistItems.length,
    portfolio: demoPortfolio.length
  };

  // Portfolio summary
  const portfolioSummary = {
    totalValue: demoPortfolio.reduce((sum, item) => sum + item.current_value, 0),
    totalInvested: demoPortfolio.reduce((sum, item) => sum + item.total_invested, 0),
    totalPnL: demoPortfolio.reduce((sum, item) => sum + item.profit_loss, 0),
    totalPnLPercentage: demoPortfolio.length > 0 
      ? (demoPortfolio.reduce((sum, item) => sum + item.profit_loss_percentage, 0) / demoPortfolio.length)
      : 0
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

  const handleAddToWatchlist = async (item) => {
    const success = await addToWatchlist({
      symbol: item.symbol,
      name: item.name,
      asset_type: item.asset_type,
      exchange: item.exchange,
      sector: item.sector,
      market_cap: item.market_cap
    });
    if (success) {
      // Refresh watchlist tab count
      setActiveTab(prev => prev);
    }
  };

  const handleRemoveFromWatchlist = async (item) => {
    await removeFromWatchlist(item.symbol, item.asset_type);
  };

  const handleTrade = (item) => {
    setSelectedItem(item);
    setTradingModalOpen(true);
  };

  const handleViewChart = (item) => {
    setSelectedItem(item);
    setChartModalOpen(true);
  };

  const isInWatchlist = (item) => {
    return watchlistItems.some(w => w.symbol === item.symbol && w.asset_type === item.asset_type);
  };

  // Loading state
  if (!isInitialized || loadingMarketData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 border border-border/50 p-6 md:p-8">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Investment Watchlist
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Sparkles className="h-4 w-4" />
                        Track and trade stocks, crypto, mutual funds, commodities & bonds
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Portfolio Summary */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <PieChart className="h-4 w-4 text-purple-500" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {showBalances ? formatCurrency(portfolioSummary.totalValue) : '••••••'}
                      </div>
                      <div className={`text-xs ${portfolioSummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {showBalances ? `${portfolioSummary.totalPnL >= 0 ? '+' : ''}${portfolioSummary.totalPnLPercentage.toFixed(2)}%` : '••••'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo Balance */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-sm">
                      {showBalances ? formatCurrency(demoWalletBalance?.balance || 0) : '••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalances(!showBalances)}
                      className="h-6 w-6 p-0"
                    >
                      {showBalances ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks, crypto, mutual funds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>

              {/* Asset Type Filter */}
              <Select 
                value={selectedAssetTypes.length === 1 ? selectedAssetTypes[0] : ''} 
                onValueChange={(value) => setSelectedAssetTypes(value ? [value] : [])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="stock">Stocks</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
                  <SelectItem value="commodity">Commodities</SelectItem>
                  <SelectItem value="bond">Bonds</SelectItem>
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select 
                value={selectedSectors.length === 1 ? selectedSectors[0] : ''} 
                onValueChange={(value) => setSelectedSectors(value ? [value] : [])}
              >
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48 bg-background/50">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-muted/50 h-14">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">All</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Stocks</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.stock}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
              <Coins className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Crypto</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.crypto}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mutual_fund" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
              <Banknote className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">MFs</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.mutual_fund}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="commodity" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600">
              <Gem className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Commodities</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.commodity}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="bond" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Bonds</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.bond}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600">
              <Star className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Watchlist</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.watchlist}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
              <PieChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Portfolio</span>
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {assetTypeCounts.portfolio}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-6">
            {displayData.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold mx-auto mb-4">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'watchlist' 
                      ? 'Your watchlist is empty. Add assets to track them here.'
                      : activeTab === 'portfolio'
                      ? 'Your portfolio is empty. Start trading to see your holdings.'
                      : 'No assets match your search criteria. Try adjusting your filters.'
                    }
                  </p>
                  {(activeTab === 'watchlist' || activeTab === 'portfolio') && (
                    <Button onClick={() => setActiveTab('all')}>
                      Browse All Assets
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayData.map((item, index) => (
                  <MarketDataCard
                    key={`${item.symbol}_${item.asset_type}`}
                    item={item}
                    portfolioItem={getPortfolioItem(item.symbol, item.asset_type)}
                    isInWatchlist={isInWatchlist(item)}
                    onAddToWatchlist={() => handleAddToWatchlist(item)}
                    onRemoveFromWatchlist={() => handleRemoveFromWatchlist(item)}
                    onBuy={() => handleTrade(item)}
                    onSell={() => handleTrade(item)}
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

      {/* Trading Modal */}
      <TradingModal
        isOpen={tradingModalOpen}
        onClose={() => setTradingModalOpen(false)}
        item={selectedItem}
        portfolioItem={selectedItem ? getPortfolioItem(selectedItem.symbol, selectedItem.asset_type) : null}
        walletBalance={demoWalletBalance}
        onTrade={executeDemoTrade}
        formatCurrency={formatCurrency}
      />

      {/* Chart Modal */}
      <ChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        item={selectedItem}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </main>
  );
}