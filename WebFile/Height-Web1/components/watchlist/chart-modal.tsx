// components/watchlist/chart-modal.tsx
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
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { MarketDataItem } from '@/hooks/use-watchlist-data';
import EnhancedTradingViewWidget from '@/components/trading/enhanced-tradingview-widget';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketDataItem | null;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function ChartModal({
  isOpen,
  onClose,
  item,
  formatCurrency,
  formatPercentage
}: ChartModalProps) {
  if (!item) return null;

  const openInTradingView = () => {
    const symbol = item.symbol;
    let tvSymbol = '';
    
    // Map to TradingView symbols
    switch (item.asset_type) {
      case 'stock':
        if (symbol.includes('RELIANCE') || symbol.includes('TCS') || symbol.includes('INFY')) {
          tvSymbol = `NSE:${symbol}`;
        } else {
          tvSymbol = `NASDAQ:${symbol}`;
        }
        break;
      case 'crypto':
        tvSymbol = `COINBASE:${symbol}USD`;
        break;
      case 'commodity':
        tvSymbol = `MCX:${symbol}`;
        break;
      default:
        tvSymbol = symbol;
    }
    
    window.open(`https://www.tradingview.com/chart/?symbol=${tvSymbol}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">{item.name}</div>
                <div className="text-sm text-gray-500 font-normal">
                  {item.symbol} • {item.exchange}
                </div>
              </div>
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {item.asset_type.replace('_', ' ')}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={openInTradingView}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open in TradingView</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(item.price_inr || item.price)}
                </div>
                {item.price_inr && item.price !== item.price_inr && (
                  <div className="text-sm text-gray-500">
                    ${item.price.toFixed(2)} USD
                  </div>
                )}
              </div>
              
              <div className={`flex items-center gap-1 ${
                item.change_24h_percent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change_24h_percent >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <div className="text-lg font-semibold">
                  {formatPercentage(item.change_24h_percent)}
                </div>
              </div>
            </div>

            {/* 24h Range */}
            {item.high_24h && item.low_24h && (
              <div className="mt-3 sm:mt-0">
                <div className="text-xs text-gray-500 mb-1">24h Range</div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{formatCurrency(item.low_24h)}</span>
                  <div className="h-1 w-20 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
                      style={{
                        width: `${((item.price - item.low_24h) / (item.high_24h - item.low_24h)) * 100}%`
                      }}
                    />
                  </div>
                  <span>{formatCurrency(item.high_24h)}</span>
                </div>
              </div>
            )}
          </div>

          {/* TradingView Chart */}
          <div className="min-h-[500px]">
            <EnhancedTradingViewWidget
              symbol={item.symbol}
              assetType={item.asset_type}
              height={500}
              width="100%"
              theme="light"
              interval="1D"
              showControls={true}
              allow_symbol_change={false}
              studies={['MASimple@tv-basicstudies', 'RSI@tv-basicstudies']}
              className="rounded-lg overflow-hidden"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {item.volume_24h > 0 && (
              <div className="text-center">
                <div className="text-xs text-gray-500">24h Volume</div>
                <div className="font-semibold">
                  {item.volume_24h >= 1e9 
                    ? `₹${(item.volume_24h / 1e9).toFixed(2)}B` 
                    : `₹${(item.volume_24h / 1e6).toFixed(2)}M`
                  }
                </div>
              </div>
            )}
            
            {item.market_cap > 0 && (
              <div className="text-center">
                <div className="text-xs text-gray-500">Market Cap</div>
                <div className="font-semibold">
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
              <div className="text-center">
                <div className="text-xs text-gray-500">Dividend Yield</div>
                <div className="font-semibold">
                  {(item.dividend_yield * 100).toFixed(2)}%
                </div>
              </div>
            )}

            {item.expense_ratio && (
              <div className="text-center">
                <div className="text-xs text-gray-500">Expense Ratio</div>
                <div className="font-semibold">
                  {(item.expense_ratio * 100).toFixed(2)}%
                </div>
              </div>
            )}

            <div className="text-center">
              <div className="text-xs text-gray-500">Sector</div>
              <div className="font-semibold text-sm">
                {item.sector || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}