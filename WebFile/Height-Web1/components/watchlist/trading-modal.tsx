// components/watchlist/trading-modal.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Minus,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketDataItem, DemoPortfolioItem, DemoWalletBalance } from '@/hooks/use-watchlist-data';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketDataItem | null;
  portfolioItem?: DemoPortfolioItem | null;
  walletBalance: DemoWalletBalance | null;
  onTrade: (trade: {
    symbol: string;
    asset_type: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price: number;
  }) => Promise<boolean>;
  formatCurrency: (value: number) => string;
}

export function TradingModal({
  isOpen,
  onClose,
  item,
  portfolioItem,
  walletBalance,
  onTrade,
  formatCurrency
}: TradingModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setError('');
      setActiveTab('buy');
    }
  }, [isOpen]);

  if (!item) return null;

  const currentPrice = item.price_inr || item.price;
  const totalAmount = parseFloat(quantity) * currentPrice;
  const fees = Math.max(10, totalAmount * 0.001); // 0.1% fee, min ₹10
  const totalCost = totalAmount + fees;

  // Validation
  const validateTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }

    if (activeTab === 'buy') {
      if (!walletBalance || totalCost > walletBalance.balance) {
        setError(`Insufficient balance. Available: ${formatCurrency(walletBalance?.balance || 0)}`);
        return false;
      }
    } else {
      if (!portfolioItem || parseFloat(quantity) > portfolioItem.quantity) {
        setError(`Insufficient holdings. Available: ${portfolioItem?.quantity.toFixed(6) || 0}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleTrade = async () => {
    if (!validateTrade()) return;

    setIsTrading(true);
    try {
      const success = await onTrade({
        symbol: item.symbol,
        asset_type: item.asset_type,
        trade_type: activeTab,
        quantity: parseFloat(quantity),
        price: currentPrice
      });

      if (success) {
        onClose();
      }
    } catch (err) {
      setError('Failed to execute trade');
    } finally {
      setIsTrading(false);
    }
  };

  const getQuickAmounts = () => {
    if (activeTab === 'buy' && walletBalance) {
      const maxAmount = walletBalance.balance * 0.95; // Leave some buffer
      return [
        { label: '25%', amount: (maxAmount * 0.25) / currentPrice },
        { label: '50%', amount: (maxAmount * 0.50) / currentPrice },
        { label: '75%', amount: (maxAmount * 0.75) / currentPrice },
        { label: 'Max', amount: maxAmount / currentPrice }
      ];
    } else if (activeTab === 'sell' && portfolioItem) {
      return [
        { label: '25%', amount: portfolioItem.quantity * 0.25 },
        { label: '50%', amount: portfolioItem.quantity * 0.50 },
        { label: '75%', amount: portfolioItem.quantity * 0.75 },
        { label: 'All', amount: portfolioItem.quantity }
      ];
    }
    return [];
  };

  const quickAmounts = getQuickAmounts();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="h-4 w-4" />
            </div>
            Trade {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-500">{item.symbol}</div>
              </div>
              <Badge variant="outline" className="capitalize">
                {item.asset_type.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">
                {formatCurrency(currentPrice)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                item.change_24h_percent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change_24h_percent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {item.change_24h_percent >= 0 ? '+' : ''}{item.change_24h_percent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Buy/Sell Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Plus className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <Minus className="h-4 w-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="buy-quantity">Quantity</Label>
                <Input
                  id="buy-quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.000001"
                />
              </div>

              {quickAmounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((qa) => (
                      <Button
                        key={qa.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(qa.amount.toFixed(6))}
                        className="text-xs"
                      >
                        {qa.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy Summary */}
              {quantity && !isNaN(parseFloat(quantity)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-semibold">{parseFloat(quantity).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per unit:</span>
                      <span className="font-semibold">{formatCurrency(currentPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Fees (0.1%):</span>
                      <span>{formatCurrency(fees)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-green-700 border-t border-green-200 pt-2">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Available Balance */}
              <div className="text-sm text-gray-600">
                Available Balance: {formatCurrency(walletBalance?.balance || 0)}
              </div>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Quantity</Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  placeholder="Enter quantity to sell"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.000001"
                />
              </div>

              {quickAmounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((qa) => (
                      <Button
                        key={qa.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(qa.amount.toFixed(6))}
                        className="text-xs"
                      >
                        {qa.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sell Summary */}
              {quantity && !isNaN(parseFloat(quantity)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-semibold">{parseFloat(quantity).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per unit:</span>
                      <span className="font-semibold">{formatCurrency(currentPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gross Amount:</span>
                      <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Fees (0.1%):</span>
                      <span>{formatCurrency(fees)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-red-700 border-t border-red-200 pt-2">
                      <span>Net Amount:</span>
                      <span>{formatCurrency(totalAmount - fees)}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Available Holdings */}
              <div className="text-sm text-gray-600">
                Available: {portfolioItem ? `${portfolioItem.quantity.toFixed(6)} ${item.symbol}` : 'No holdings'}
              </div>
            </TabsContent>
          </Tabs>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isTrading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              disabled={!quantity || parseFloat(quantity) <= 0 || isTrading}
              className={`flex-1 gap-2 ${
                activeTab === 'buy' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isTrading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : activeTab === 'buy' ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {isTrading ? 'Processing...' : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${item.symbol}`}
            </Button>
          </div>

          {/* Demo Notice */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This is a demo trading environment. No real money is involved.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}