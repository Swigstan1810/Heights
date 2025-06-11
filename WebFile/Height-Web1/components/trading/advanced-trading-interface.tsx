"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  DollarSign,
  Clock,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { marketDataService, type MarketData } from '@/lib/market-data';
import { useToast } from '@/components/ui/use-toast';
import TradingViewWidget from './tradingview-widget';
import { OrderBook } from './order-book';
import { RecentTrades } from './recent-trades';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  createdAt: Date;
}

export default function AdvancedTradingInterface({ symbol = 'CRYPTO:BTC' }: { symbol?: string }) {
  const { user, walletBalance } = useAuth();
  const { toast } = useToast();
  
  // Market data state
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Order form state
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK' | 'DAY'>('GTC');
  const [percentage, setPercentage] = useState([25]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Real-time market data subscription
  useEffect(() => {
    const unsubscribe = marketDataService.subscribe(symbol, (data) => {
      setMarketData(data);
      setLoading(false);
      
      // Auto-fill price for limit orders
      if (orderType === 'limit' && !price) {
        setPrice(data.price.toFixed(2));
      }
    });

    return unsubscribe;
  }, [symbol, orderType, price]);

  // Calculate order values
  const calculateOrderValue = () => {
    const qty = parseFloat(quantity) || 0;
    const orderPrice = orderType === 'market' ? (marketData?.price || 0) : (parseFloat(price) || 0);
    return qty * orderPrice;
  };

  const calculateMaxQuantity = () => {
    if (!marketData || !walletBalance) return 0;
    const availableBalance = walletBalance.balance;
    const orderPrice = orderType === 'market' ? marketData.price : (parseFloat(price) || marketData.price);
    return availableBalance / orderPrice;
  };

  // Handle percentage slider
  const handlePercentageChange = (value: number[]) => {
    setPercentage(value);
    if (marketData && walletBalance) {
      const maxQty = calculateMaxQuantity();
      const newQty = (maxQty * value[0]) / 100;
      setQuantity(newQty.toFixed(6));
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!user || !marketData) {
      toast({
        title: "Error",
        description: "Please login to place orders",
        variant: "destructive"
      });
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price for limit orders",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Simulate order placement (replace with actual API call)
      const newOrder: Order = {
        id: `order_${Date.now()}`,
        symbol,
        side: orderSide,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderType !== 'market' ? parseFloat(price) : undefined,
        stopPrice: (orderType === 'stop' || orderType === 'stop_limit') ? parseFloat(stopPrice) : undefined,
        timeInForce,
        status: 'pending',
        createdAt: new Date()
      };

      setOrders(prev => [newOrder, ...prev]);

      // Simulate order execution after 1 second
      setTimeout(() => {
        setOrders(prev => prev.map(order => 
          order.id === newOrder.id 
            ? { ...order, status: 'filled' as const }
            : order
        ));
        
        toast({
          title: "Order Executed",
          description: `${orderSide.toUpperCase()} order for ${quantity} ${symbol} executed successfully`,
        });
      }, 1000);

      // Reset form
      setQuantity('');
      setPrice('');
      setStopPrice('');
      setPercentage([25]);

    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen overflow-hidden">
      {/* Trading Chart - 2 columns */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-xl">{symbol.replace('CRYPTO:', '')}</CardTitle>
                {marketData && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      ${formatPrice(marketData.price)}
                    </span>
                    <Badge variant={marketData.change24hPercent >= 0 ? "default" : "destructive"}>
                      {marketData.change24hPercent >= 0 ? '+' : ''}
                      {marketData.change24hPercent.toFixed(2)}%
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-80px)]">
            <TradingViewWidget symbol={symbol} height={600} />
          </CardContent>
        </Card>
      </div>

      {/* Order Form */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Place Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Side */}
            <Tabs value={orderSide} onValueChange={(value: any) => setOrderSide(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Sell
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Order Type */}
            <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="stop">Stop</SelectItem>
                <SelectItem value="stop_limit">Stop Limit</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Input (for non-market orders) */}
            {orderType !== 'market' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">
                    USD
                  </span>
                </div>
              </div>
            )}

            {/* Stop Price (for stop orders) */}
            {(orderType === 'stop' || orderType === 'stop_limit') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Stop Price</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="0.00"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">
                    USD
                  </span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="relative">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00000000"
                  className="pr-16"
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground">
                  {symbol.replace('CRYPTO:', '').replace('NSE:', '')}
                </span>
              </div>
            </div>

            {/* Percentage Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Amount</label>
                <span className="text-sm text-muted-foreground">{percentage[0]}%</span>
              </div>
              <Slider
                value={percentage}
                onValueChange={handlePercentageChange}
                max={100}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Time in Force */}
            <Select value={timeInForce} onValueChange={(value: any) => setTimeInForce(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Time in Force" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                <SelectItem value="FOK">Fill or Kill</SelectItem>
                <SelectItem value="DAY">Day Order</SelectItem>
              </SelectContent>
            </Select>

            {/* Order Summary */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Value</span>
                <span className="font-medium">${calculateOrderValue().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Fee (0.1%)</span>
                <span>${(calculateOrderValue() * 0.001).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                <span>Total</span>
                <span>${(calculateOrderValue() * 1.001).toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <Button
              onClick={placeOrder}
              disabled={isPlacingOrder || !quantity}
              className={`w-full ${
                orderSide === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  {orderSide === 'buy' ? (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-2" />
                  )}
                  {orderSide === 'buy' ? 'Buy' : 'Sell'} {symbol.replace('CRYPTO:', '')}
                </>
              )}
            </Button>

            {/* Available Balance */}
            {walletBalance && (
              <div className="text-sm text-muted-foreground text-center">
                Available: ${walletBalance.balance.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrderType('market');
                  setOrderSide('buy');
                  setQuantity('0.01');
                }}
              >
                Quick Buy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrderType('market');
                  setOrderSide('sell');
                  setQuantity('0.01');
                }}
              >
                Quick Sell
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setOrderType('limit');
                if (marketData) {
                  setPrice((marketData.price * 0.95).toFixed(2));
                  setQuantity('0.1');
                }
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Set Buy Limit -5%
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Market Data & Orders */}
      <div className="space-y-4">
        <Tabs defaultValue="orderbook" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="orderbook" className="h-[calc(100%-60px)]">
            <OrderBook symbol={symbol} />
          </TabsContent>

          <TabsContent value="trades" className="h-[calc(100%-60px)]">
            <RecentTrades symbol={symbol} />
          </TabsContent>

          <TabsContent value="orders" className="h-[calc(100%-60px)]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Open Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No open orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={order.side === 'buy' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{order.type.toUpperCase()}</span>
                          </div>
                          <Badge
                            variant={
                              order.status === 'filled' ? 'default' :
                              order.status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {order.status === 'filled' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {order.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span>{order.quantity}</span>
                          </div>
                          {order.price && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span>${order.price.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span>{order.createdAt.toLocaleTimeString()}</span>
                          </div>
                        </div>
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setOrders(prev => prev.map(o => 
                                o.id === order.id 
                                  ? { ...o, status: 'cancelled' as const }
                                  : o
                              ));
                            }}
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}