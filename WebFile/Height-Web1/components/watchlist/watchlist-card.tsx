// components/watchlist/watchlist-card.tsx - Updated with theme support and consistent styling
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Building2,
  Coins,
  Banknote,
  Gem,
  Shield,
  ExternalLink,
  Activity,
  Eye,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketDataItem } from '@/hooks/use-watchlist-data';

interface WatchlistCardProps {
  item: MarketDataItem;
  isInWatchlist: boolean;
  onAddToWatchlist: () => void;
  onRemoveFromWatchlist: () => void;
  onViewChart: () => void;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
  index?: number;
  showBalances?: boolean;
}

export function WatchlistCard({
  item,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onViewChart,
  formatCurrency,
  formatPercentage,
  index = 0,
  showBalances = true
}: WatchlistCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'stock':
        return <Building2 className="h-5 w-5" />;
      case 'crypto':
        return <Bitcoin className="h-5 w-5" />;
      case 'mutual_fund':
        return <Banknote className="h-5 w-5" />;
      case 'commodity':
        return <Gem className="h-5 w-5" />;
      case 'bond':
        return <Shield className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getAssetTypeGradient = (assetType: string) => {
    switch (assetType) {
      case 'stock':
        return 'from-blue-500 to-indigo-600';
      case 'crypto':
        return 'from-orange-500 to-amber-600';
      case 'mutual_fund':
        return 'from-purple-500 to-violet-600';
      case 'commodity':
        return 'from-yellow-500 to-orange-600';
      case 'bond':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getAssetTypeBadgeColor = (assetType: string) => {
    switch (assetType) {
      case 'stock':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800';
      case 'crypto':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800';
      case 'mutual_fund':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800';
      case 'commodity':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'bond':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
    }
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (change < 0) return 'text-red-500 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e12) return `₹${(volume / 1e12).toFixed(2)}T`;
    if (volume >= 1e9) return `₹${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `₹${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `₹${(volume / 1e3).toFixed(2)}K`;
    return `₹${volume.toFixed(0)}`;
  };

  // Safe price calculation with fallbacks
  const safePrice = item.price_inr || item.price || 0;
  const safeChange24h = item.change_24h || 0;
  const safeChange24hPercent = item.change_24h_percent || 0;
  const safeVolume24h = item.volume_24h || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card
        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-0 shadow-lg bg-card/50 backdrop-blur-sm h-full ${
          isHovered ? 'shadow-xl scale-[1.02]' : 'hover:shadow-lg'
        } ${isInWatchlist ? 'ring-2 ring-amber-200 dark:ring-amber-800 bg-amber-50/30 dark:bg-amber-950/20' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-4 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getAssetTypeGradient(item.asset_type)} text-white shadow-lg`}>
                  {getAssetIcon(item.asset_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-lg truncate">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {item.symbol}
                    </Badge>
                    <Badge 
                      className={`text-xs transition-colors ${getAssetTypeBadgeColor(item.asset_type)}`}
                    >
                      {item.asset_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {item.exchange && (
                    <p className="text-xs text-muted-foreground mt-1">{item.exchange}</p>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={isInWatchlist ? onRemoveFromWatchlist : onAddToWatchlist}
                className="h-10 w-10 p-0 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                {isInWatchlist ? (
                  <BookmarkCheck className="h-5 w-5 text-amber-600" />
                ) : (
                  <Bookmark className="h-5 w-5 text-muted-foreground hover:text-amber-600" />
                )}
              </Button>
            </div>

            {/* Price and Performance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {showBalances ? formatCurrency(safePrice) : '••••••'}
                  </div>
                  {item.price_inr && item.price !== item.price_inr && showBalances && (
                    <div className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} USD
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 text-lg font-bold ${getPriceChangeColor(safeChange24hPercent)}`}>
                    {getPriceChangeIcon(safeChange24hPercent)}
                    {showBalances ? formatPercentage(safeChange24hPercent) : '••••'}
                  </div>
                  <div className={`text-sm ${getPriceChangeColor(safeChange24h)}`}>
                    {showBalances ? (
                      <>
                        {safeChange24h >= 0 ? '+' : ''}{formatCurrency(safeChange24h)}
                      </>
                    ) : (
                      '••••'
                    )}
                  </div>
                </div>
              </div>

              {/* 24h Price Range */}
              {item.high_24h && item.low_24h && item.high_24h > item.low_24h && showBalances && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>24h Low: {formatCurrency(item.low_24h)}</span>
                    <span>24h High: {formatCurrency(item.high_24h)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((safePrice - item.low_24h) / (item.high_24h - item.low_24h)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 gap-4">
              {safeVolume24h > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                  <p className="font-bold text-foreground text-sm">
                    {showBalances ? formatVolume(safeVolume24h) : '••••••'}
                  </p>
                </div>
              )}
              {item.market_cap > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                  <p className="font-bold text-foreground text-sm">
                    {showBalances ? (
                      item.market_cap >= 1e12 
                        ? `₹${(item.market_cap / 1e12).toFixed(2)}T`
                        : item.market_cap >= 1e9 
                        ? `₹${(item.market_cap / 1e9).toFixed(2)}B` 
                        : `₹${(item.market_cap / 1e6).toFixed(2)}M`
                    ) : '••••••'}
                  </p>
                </div>
              )}
              {item.dividend_yield && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Dividend Yield</p>
                  <p className="font-bold text-foreground text-sm">
                    {showBalances ? `${(item.dividend_yield * 100).toFixed(2)}%` : '••••'}
                  </p>
                </div>
              )}
              {item.expense_ratio && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expense Ratio</p>
                  <p className="font-bold text-foreground text-sm">
                    {showBalances ? `${(item.expense_ratio * 100).toFixed(2)}%` : '••••'}
                  </p>
                </div>
              )}
            </div>

            {/* Sector */}
            {item.sector && (
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sector</span>
                </div>
                <p className="font-semibold text-foreground text-sm mt-1">
                  {item.sector}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex gap-3">
              <Button
                onClick={onViewChart}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="font-medium">View Chart</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${item.symbol}`, '_blank')}
                className="px-3 hover:bg-muted border-border/50"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hover Effects */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border/50"
            >
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(item.last_updated).toLocaleTimeString()}</span>
                </div>
                {item.asset_type === 'bond' && item.maturity_date && (
                  <div className="flex justify-between">
                    <span>Maturity:</span>
                    <span>{new Date(item.maturity_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}