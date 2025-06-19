// components/watchlist/modern-chart-modal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ExternalLink,
  Maximize2,
  X,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MarketDataItem } from '@/hooks/use-watchlist-data';
import EnhancedTradingViewWidget from '@/components/trading/enhanced-tradingview-widget';

interface ModernChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketDataItem | null;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
  theme: 'light' | 'dark';
}

export function ModernChartModal({
  isOpen,
  onClose,
  item,
  formatCurrency,
  formatPercentage,
  theme
}: ModernChartModalProps) {
  if (!item) return null;

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

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-500';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-5 w-5" />;
    if (change < 0) return <ArrowDownRight className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const openInTradingView = () => {
    const symbol = item.symbol;
    let tvSymbol = '';
    
    // Map to TradingView symbols
    switch (item.asset_type) {
      case 'stock':
        if (symbol.includes('RELIANCE') || symbol.includes('TCS') || symbol.includes('INFY') || symbol.includes('HDFC') || symbol.includes('ICICI')) {
          tvSymbol = `NSE:${symbol}`;
        } else {
          tvSymbol = `NASDAQ:${symbol}`;
        }
        break;
      case 'crypto':
        tvSymbol = `COINBASE:${symbol}USD`;
        break;
      case 'commodity':
        if (symbol === 'GOLD') tvSymbol = 'OANDA:XAUUSD';
        else if (symbol === 'SILVER') tvSymbol = 'OANDA:XAGUSD';
        else if (symbol === 'CRUDE') tvSymbol = 'NYMEX:CL1!';
        else tvSymbol = `COMEX:${symbol}`;
        break;
      default:
        tvSymbol = symbol;
    }
    
    window.open(`https://www.tradingview.com/chart/?symbol=${tvSymbol}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw] p-0 bg-white rounded-2xl border-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getAssetTypeGradient(item.asset_type)} text-white shadow-lg`}>
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{item.name}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">{item.symbol}</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {item.asset_type.replace('_', ' ')}
                  </Badge>
                  {item.exchange && (
                    <span className="text-sm text-gray-500">• {item.exchange}</span>
                  )}
                </div>
              </div>
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openInTradingView}
                className="gap-2 hover:bg-blue-50 border-blue-200"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open in TradingView</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 space-y-6">
          {/* Price Info */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {formatCurrency(item.price_inr || item.price)}
                  </div>
                  {item.price_inr && item.price !== item.price_inr && (
                    <div className="text-lg text-gray-500 mt-1">
                      ${item.price.toFixed(2)} USD
                    </div>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 ${getPriceChangeColor(item.change_24h_percent)}`}>
                  {getPriceChangeIcon(item.change_24h_percent)}
                  <div>
                    <div className="text-2xl font-bold">
                      {formatPercentage(item.change_24h_percent)}
                    </div>
                    <div className="text-sm">
                      {item.change_24h >= 0 ? '+' : ''}{formatCurrency(item.change_24h)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 24h Range */}
              {item.high_24h && item.low_24h && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 min-w-64">
                  <div className="text-xs text-gray-500 mb-2">24h Range</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{formatCurrency(item.low_24h)}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${((item.price - item.low_24h) / (item.high_24h - item.low_24h)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="font-medium">{formatCurrency(item.high_24h)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TradingView Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <EnhancedTradingViewWidget
              symbol={item.symbol}
              assetType={item.asset_type}
              height={600}
              width="100%"
              theme={theme}
              interval="1D"
              allow_symbol_change={false}
              studies={['MASimple@tv-basicstudies', 'RSI@tv-basicstudies']}
              className="w-full"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
            {item.volume_24h > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="text-xs text-blue-600 font-medium mb-1">24h Volume</div>
                <div className="text-lg font-bold text-blue-900">
                  {item.volume_24h >= 1e9 
                    ? `₹${(item.volume_24h / 1e9).toFixed(2)}B` 
                    : `₹${(item.volume_24h / 1e6).toFixed(2)}M`
                  }
                </div>
              </div>
            )}
            
            {item.market_cap > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                <div className="text-xs text-purple-600 font-medium mb-1">Market Cap</div>
                <div className="text-lg font-bold text-purple-900">
                  {item.market_cap >= 1e12 
                    ? `₹${(item.market_cap / 1e12).toFixed(2)}T`
                    : item.market_cap >= 1e9 
                    ? `₹${(item.market_cap / 1e9).toFixed(2)}B` 
                    : `₹${(item.market_cap / 1e6).toFixed(2)}M`
                  }
                </div>
              </div>
            )}

            {item.dividend_yield && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="text-xs text-green-600 font-medium mb-1">Dividend Yield</div>
                <div className="text-lg font-bold text-green-900">
                  {(item.dividend_yield * 100).toFixed(2)}%
                </div>
              </div>
            )}

            {item.expense_ratio && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                <div className="text-xs text-orange-600 font-medium mb-1">Expense Ratio</div>
                <div className="text-lg font-bold text-orange-900">
                  {(item.expense_ratio * 100).toFixed(2)}%
                </div>
              </div>
            )}

            {item.sector && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-1">Sector</div>
                <div className="text-lg font-bold text-gray-900">
                  {item.sector}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}