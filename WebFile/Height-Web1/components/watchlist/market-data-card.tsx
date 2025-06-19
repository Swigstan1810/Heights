// components/watchlist/market-data-card.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Minus,
  BarChart3,
  Building2,
  Coins,
  Banknote,
  Gem,
  Shield,
  ChevronRight,
  Activity,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketDataItem, DemoPortfolioItem } from '@/hooks/use-watchlist-data';

interface MarketDataCardProps {
  item: MarketDataItem;
  portfolioItem?: DemoPortfolioItem | null;
  isInWatchlist: boolean;
  onAddToWatchlist: () => void;
  onRemoveFromWatchlist: () => void;
  onBuy: () => void;
  onSell: () => void;
  onViewChart: () => void;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
  index?: number;
}

export function MarketDataCard({
  item,
  portfolioItem,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onBuy,
  onSell,
  onViewChart,
  formatCurrency,
  formatPercentage,
  index = 0
}: MarketDataCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'stock':
        return <Building2 className="h-4 w-4" />;
      case 'crypto':
        return <Coins className="h-4 w-4" />;
      case 'mutual_fund':
        return <Banknote className="h-4 w-4" />;
      case 'commodity':
        return <Gem className="h-4 w-4" />;
      case 'bond':
        return <Shield className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getAssetTypeColor = (assetType: string) => {
    switch (assetType) {
      case 'stock':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'crypto':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'mutual_fund':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'commodity':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'bond':
        return 'bg-green-50 text-green-600 border-green-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e12) return `₹${(volume / 1e12).toFixed(2)}T`;
    if (volume >= 1e9) return `₹${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `₹${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `₹${(volume / 1e3).toFixed(2)}K`;
    return `₹${volume.toFixed(0)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `₹${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `₹${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `₹${(marketCap / 1e6).toFixed(2)}M`;
    return `₹${marketCap.toFixed(0)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`group cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
          isHovered ? 'border-blue-200 shadow-lg' : 'border-transparent hover:border-gray-200'
        } ${portfolioItem ? 'ring-1 ring-green-200 bg-green-50/30' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getAssetTypeColor(item.asset_type)}`}>
                  {getAssetIcon(item.asset_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {item.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {item.symbol}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getAssetTypeColor(item.asset_type)}`}
                    >
                      {item.asset_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {item.exchange && (
                      <span className="text-xs text-gray-500">{item.exchange}</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={isInWatchlist ? onRemoveFromWatchlist : onAddToWatchlist}
                className="h-8 w-8 p-0"
              >
                <Star 
                  className={`h-4 w-4 ${
                    isInWatchlist ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                  }`} 
                />
              </Button>
            </div>

            {/* Price and Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(item.price_inr || item.price)}
                  </div>
                  {item.price_inr && item.price !== item.price_inr && (
                    <div className="text-sm text-gray-500">
                      ${item.price.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 text-sm font-semibold ${getPriceChangeColor(item.change_24h_percent)}`}>
                    {getPerformanceIcon(item.change_24h_percent)}
                    {formatPercentage(item.change_24h_percent)}
                  </div>
                  <div className={`text-xs ${getPriceChangeColor(item.change_24h)}`}>
                    {item.change_24h >= 0 ? '+' : ''}{formatCurrency(item.change_24h)}
                  </div>
                </div>
              </div>

              {/* Price Range */}
              {item.high_24h && item.low_24h && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>24h Low: {formatCurrency(item.low_24h)}</span>
                    <span>24h High: {formatCurrency(item.high_24h)}</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
                      style={{
                        width: `${((item.price - item.low_24h) / (item.high_24h - item.low_24h)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Holding (if any) */}
            {portfolioItem && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 font-medium">Your Holdings</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {portfolioItem.quantity.toFixed(4)} units
                  </Badge>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-green-600">
                    Value: {formatCurrency(portfolioItem.current_value)}
                  </span>
                  <span className={`font-medium ${getPriceChangeColor(portfolioItem.profit_loss)}`}>
                    P&L: {formatPercentage(portfolioItem.profit_loss_percentage)}
                  </span>
                </div>
              </div>
            )}

            {/* Market Stats */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {item.volume_24h > 0 && (
                <div>
                  <span className="text-gray-500">24h Volume</span>
                  <div className="font-semibold text-gray-900">
                    {formatVolume(item.volume_24h)}
                  </div>
                </div>
              )}
              {item.market_cap > 0 && (
                <div>
                  <span className="text-gray-500">Market Cap</span>
                  <div className="font-semibold text-gray-900">
                    {formatMarketCap(item.market_cap)}
                  </div>
                </div>
              )}
              {item.dividend_yield && (
                <div>
                  <span className="text-gray-500">Dividend Yield</span>
                  <div className="font-semibold text-gray-900">
                    {(item.dividend_yield * 100).toFixed(2)}%
                  </div>
                </div>
              )}
              {item.expense_ratio && (
                <div>
                  <span className="text-gray-500">Expense Ratio</span>
                  <div className="font-semibold text-gray-900">
                    {(item.expense_ratio * 100).toFixed(2)}%
                  </div>
                </div>
              )}
              {item.sector && (
                <div className="col-span-2">
                  <span className="text-gray-500">Sector</span>
                  <div className="font-semibold text-gray-900">
                    {item.sector}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                onClick={onViewChart}
                variant="outline"
                className="flex-1 gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">View Chart</span>
                <span className="sm:hidden">Chart</span>
              </Button>
              
              <div className="flex gap-2 flex-1">
                <Button
                  size="sm"
                  onClick={onBuy}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Buy</span>
                  <span className="sm:hidden">Buy</span>
                </Button>
                
                <Button
                  size="sm"
                  onClick={onSell}
                  variant="outline"
                  className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={!portfolioItem || portfolioItem.quantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sell</span>
                  <span className="sm:hidden">Sell</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats on Hover */}
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-gray-100"
              >
                <div className="text-xs text-gray-500 space-y-1">
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}