// components/trading/crypto-trading-interface.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { brokerageEngine } from '@/lib/services/brokerage-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Info,
  Calculator,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { TradingChart } from './trading-chart';
import { OrderBook } from './order-book';
import { TradeHistory } from './trade-history';

interface Market {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderFormData {
  type: 'market' | 'limit' | 'stop-limit';
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  stopPrice: string;
  total: string;
}

export function CryptoTradingInterface() {
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    type: 'market',
    side: 'buy',
    amount: '',
    price: '',
    stopPrice: '',
    total: ''
  });
  const [balance, setBalance] = useState({ base: 0, quote: 0 });
  const [loading, setLoading] = useState(false);
  const [leverageEnabled, setLeverageEnabled] = useState(false);
  const [leverage, setLeverage] = useState(1);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [feeCalculation, setFeeCalculation] = useState<any>(null);

  // Load markets from CCXT
  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMarkets = async () => {
    try {
      const response = await fetch('/api/trading/markets');
      const data = await response.json();
      setMarkets(data);
      
      if (!selectedMarket && data.length > 0) {
        setSelectedMarket(data[0]);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    }
  };

  // Calculate fees when order changes
  useEffect(() => {
    if (orderForm.amount && selectedMarket) {
      const amount = parseFloat(orderForm.amount);
      const price = orderForm.type === 'market' 
        ? selectedMarket.price 
        : parseFloat(orderForm.price) || selectedMarket.price;

      if (amount > 0 && price > 0) {
        const fees = brokerageEngine.calculateTradeFees({
          userId: user?.id || '',
          tradeType: leverageEnabled ? 'leverage' : 'spot',
          side: orderForm.side,
          symbol: selectedMarket.symbol,
          amount,
          price,
          leverage: leverageEnabled ? leverage : 1
        });

        setFeeCalculation(fees);
        setOrderForm(prev => ({
          ...prev,
          total: fees.netAmount.toFixed(2)
        }));
      }
    }
  }, [orderForm.amount, orderForm.price, orderForm.side, selectedMarket, leverageEnabled, leverage, user]);

  // Place order
  const placeOrder = async () => {
    if (!selectedMarket || !user) return;

    const amount = parseFloat(orderForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await brokerageEngine.processTrade({
        userId: user.id,
        tradeType: leverageEnabled ? 'leverage' : 'spot',
        side: orderForm.side,
        symbol: selectedMarket.symbol,
        amount,
        price: orderForm.type === 'market' 
          ? selectedMarket.price 
          : parseFloat(orderForm.price),
        leverage: leverageEnabled ? leverage : undefined
      });

      if (result.success) {
        toast.success(`Order placed successfully! Trade ID: ${result.tradeId}`);
        resetOrderForm();
        // Refresh balances
        loadBalances();
      } else {
        toast.error(result.error || 'Order failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Load user balances
  const loadBalances = async () => {
    if (!user || !selectedMarket) return;

    try {
      const response = await fetch(`/api/trading/balances?userId=${user.id}`);
      const data = await response.json();
      
      const baseBalance = data[selectedMarket.base] || 0;
      const quoteBalance = data[selectedMarket.quote] || 0;
      
      setBalance({ base: baseBalance, quote: quoteBalance });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  // Reset order form
  const resetOrderForm = () => {
    setOrderForm({
      type: 'market',
      side: 'buy',
      amount: '',
      price: '',
      stopPrice: '',
      total: ''
    });
    setFeeCalculation(null);
  };

  // Set order amount by percentage
  const setAmountByPercentage = (percentage: number) => {
    if (!selectedMarket) return;

    const availableBalance = orderForm.side === 'buy' 
      ? balance.quote 
      : balance.base;

    const amount = orderForm.side === 'buy'
      ? (availableBalance * percentage / 100) / selectedMarket.price
      : availableBalance * percentage / 100;

    setOrderForm(prev => ({
      ...prev,
      amount: amount.toFixed(6)
    }));
  };

  // Load balances when market or user changes
  useEffect(() => {
    if (user && selectedMarket) {
      loadBalances();
    }
  }, [user, selectedMarket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Market List & Order Form */}
      <div className="space-y-6">
        {/* Market Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedMarket?.symbol}
              onValueChange={(value) => {
                const market = markets.find(m => m.symbol === value);
                setSelectedMarket(market || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {markets.map(market => (
                  <SelectItem key={market.symbol} value={market.symbol}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{market.symbol}</span>
                      <span className={`text-sm ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMarket && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-medium">${selectedMarket.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">24h Volume</span>
                  <span className="font-medium">${(selectedMarket.volume24h / 1e6).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">24h High/Low</span>
                  <span className="font-medium text-sm">
                    ${selectedMarket.high24h.toFixed(2)} / ${selectedMarket.low24h.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Place Order</CardTitle>
            <CardDescription>Trade {selectedMarket?.symbol || 'crypto'} with 0.08% fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type Tabs */}
            <Tabs value={orderForm.type} onValueChange={(v) => setOrderForm(prev => ({ ...prev, type: v as any }))}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="limit">Limit</TabsTrigger>
                <TabsTrigger value="stop-limit">Stop-Limit</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderForm.side === 'buy' ? 'default' : 'outline'}
                className={orderForm.side === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
              >
                Buy
              </Button>
              <Button
                variant={orderForm.side === 'sell' ? 'default' : 'outline'}
                className={orderForm.side === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
              >
                Sell
              </Button>
            </div>

            {/* Leverage Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Leverage Trading</span>
              </div>
              <Switch
                checked={leverageEnabled}
                onCheckedChange={setLeverageEnabled}
              />
            </div>

            {leverageEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Leverage</Label>
                  <span className="font-medium">{leverage}x</span>
                </div>
                <Slider
                  value={[leverage]}
                  onValueChange={([v]) => setLeverage(v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount ({selectedMarket?.base || 'Token'})</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={orderForm.amount}
                onChange={(e) => setOrderForm(prev => ({ ...prev, amount: e.target.value }))}
              />
              <div className="flex gap-2">
                {[25, 50, 75, 100].map(pct => (
                  <Button
                    key={pct}
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountByPercentage(pct)}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Input (for limit orders) */}
            {(orderForm.type === 'limit' || orderForm.type === 'stop-limit') && (
              <div className="space-y-2">
                <Label>Price ({selectedMarket?.quote || 'USD'})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            )}

            {/* Stop Price (for stop-limit) */}
            {orderForm.type === 'stop-limit' && (
              <div className="space-y-2">
                <Label>Stop Price ({selectedMarket?.quote || 'USD'})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={orderForm.stopPrice}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, stopPrice: e.target.value }))}
                />
              </div>
            )}

            {/* Balance Display */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">
                {orderForm.side === 'buy' 
                  ? `${balance.quote.toFixed(2)} ${selectedMarket?.quote || 'USD'}`
                  : `${balance.base.toFixed(6)} ${selectedMarket?.base || 'Token'}`
                }
              </span>
            </div>

            {/* Fee Breakdown */}
            {feeCalculation && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                >
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Fee: ${feeCalculation.feeAmount.toFixed(4)}
                  </span>
                  <Info className="h-4 w-4" />
                </Button>

                {showFeeBreakdown && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Trading Fee ({feeCalculation.feePercentage}%)</span>
                          <span>${feeCalculation.feeBreakdown.tradingFee.toFixed(4)}</span>
                        </div>
                        {feeCalculation.feeBreakdown.fundingFee && (
                          <div className="flex justify-between">
                            <span>Daily Funding</span>
                            <span>${feeCalculation.feeBreakdown.fundingFee.toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Total</span>
                          <span>${feeCalculation.netAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Place Order Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={placeOrder}
              disabled={loading || !orderForm.amount}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  {orderForm.side === 'buy' ? 'Buy' : 'Sell'} {selectedMarket?.base || 'Crypto'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Middle Panel - Chart */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="h-[500px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Price Chart</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  Live
                </Badge>
                <Button size="sm" variant="ghost">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            {selectedMarket && (
              <TradingChart 
                symbol={selectedMarket.symbol}
                interval="1h"
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Book */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMarket && (
                <OrderBook symbol={selectedMarket.symbol} />
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMarket && (
                <TradeHistory 
                  symbol={selectedMarket.symbol}
                  userId={user?.id}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}