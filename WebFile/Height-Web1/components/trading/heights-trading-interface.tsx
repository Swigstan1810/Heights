"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Calculator, 
  AlertTriangle, 
  Info,
  BarChart3,
  Activity,
  Coins,
  ArrowUpDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { brokerageEngine, type TradeParams, type FeeCalculation } from '@/lib/services/brokerage-engine';
import { HeightsTokenContract, createHeightsTokenContract } from '@/lib/contracts/heights-token';
import { ethers } from 'ethers';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  type: 'spot' | 'leverage';
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: Date;
  fees: FeeCalculation;
}

const SUPPORTED_ASSETS = [
  { symbol: 'HGT', name: 'Heights Token', type: 'token' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'ARB', name: 'Arbitrum', type: 'crypto' },
  { symbol: 'USDC', name: 'USD Coin', type: 'stablecoin' }
];

export function HeightsTradingInterface() {
  const { user } = useAuth();
  
  // Trading state
  const [selectedAsset, setSelectedAsset] = useState('HGT');
  const [tradeType, setTradeType] = useState<'spot' | 'leverage'>('spot');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [slippage, setSlippage] = useState(0.5);
  
  // Market data
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({
    bids: [],
    asks: []
  });
  
  // Trading state
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [feeEstimate, setFeeEstimate] = useState<FeeCalculation | null>(null);
  const [balance, setBalance] = useState<Record<string, number>>({});
  
  // Heights Token integration
  const [hgtContract, setHgtContract] = useState<HeightsTokenContract | null>(null);
  const [hgtInfo, setHgtInfo] = useState<any>(null);

  // Initialize Heights Token contract
  useEffect(() => {
    const initHgtContract = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = createHeightsTokenContract(provider);
          setHgtContract(contract);
          
          const info = await contract.getTokenInfo();
          setHgtInfo(info);
        }
      } catch (error) {
        console.error('Failed to initialize HGT contract:', error);
      }
    };

    initHgtContract();
  }, []);

  // Load market data
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const response = await fetch('/api/trading/markets');
        const data = await response.json();
        
        if (data.success) {
          const marketMap = data.markets.reduce((acc: Record<string, MarketData>, market: any) => {
            acc[market.symbol] = {
              symbol: market.symbol,
              price: market.price,
              change24h: market.change24h,
              changePercent: market.changePercent,
              volume: market.volume,
              high24h: market.high24h,
              low24h: market.low24h,
              marketCap: market.marketCap
            };
            return acc;
          }, {});
          
          setMarketData(marketMap);
        }
      } catch (error) {
        console.error('Failed to load market data:', error);
      }
    };

    loadMarketData();
    const interval = setInterval(loadMarketData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate fees when trade parameters change
  useEffect(() => {
    if (amount && (orderType === 'market' || price) && selectedAsset) {
      calculateFees();
    }
  }, [amount, price, selectedAsset, tradeSide, tradeType, leverage, orderType]);

  const calculateFees = useCallback(async () => {
    if (!user || !amount) return;

    try {
      const currentPrice = orderType === 'market' 
        ? marketData[selectedAsset]?.price || 0
        : parseFloat(price) || 0;

      if (currentPrice === 0) return;

      const tradeParams: TradeParams = {
        userId: user.id,
        tradeType: tradeType === 'leverage' ? 'leverage' : 'spot',
        side: tradeSide,
        symbol: selectedAsset,
        amount: parseFloat(amount),
        price: currentPrice,
        leverage: tradeType === 'leverage' ? leverage : undefined
      };

      const fees = brokerageEngine.calculateTradeFees(tradeParams);
      setFeeEstimate(fees);
    } catch (error) {
      console.error('Fee calculation error:', error);
    }
  }, [user, amount, price, selectedAsset, tradeSide, tradeType, leverage, orderType, marketData]);

  const executeTrade = async () => {
    if (!user || !amount || !selectedAsset) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const currentPrice = orderType === 'market' 
        ? marketData[selectedAsset]?.price || 0
        : parseFloat(price) || 0;

      if (currentPrice === 0) {
        throw new Error('Invalid price');
      }

      const tradeParams: TradeParams = {
        userId: user.id,
        tradeType: tradeType === 'leverage' ? 'leverage' : 'spot',
        side: tradeSide,
        symbol: selectedAsset,
        amount: parseFloat(amount),
        price: currentPrice,
        leverage: tradeType === 'leverage' ? leverage : undefined
      };

      // For HGT trades, validate with smart contract
      if (selectedAsset === 'HGT' && hgtContract) {
        const accounts = await window.ethereum?.request({ method: 'eth_accounts' }) as string[] | undefined;
        const userAddress = accounts?.[0];
        if (userAddress) {
          const validation = await hgtContract.canTransact(
            userAddress,
            '0x0000000000000000000000000000000000000000', // Placeholder for exchange
            amount
          );
          
          if (!validation.canTransact) {
            throw new Error(`HGT Transaction not allowed: ${validation.reason}`);
          }
        }
      }

      const result = await brokerageEngine.processTrade(tradeParams);

      if (result.success) {
        toast.success(`${tradeSide.toUpperCase()} order executed successfully!`);
        
        // Add to active trades
        const newTrade: ActiveTrade = {
          id: result.tradeId!,
          symbol: selectedAsset,
          side: tradeSide,
          amount: parseFloat(amount),
          price: currentPrice,
          type: tradeType,
          status: 'filled',
          timestamp: new Date(),
          fees: result.fees!
        };
        
        setActiveTrades(prev => [newTrade, ...prev]);
        
        // Reset form
        setAmount('');
        setPrice('');
        setFeeEstimate(null);
      } else {
        throw new Error(result.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Trade execution failed');
    } finally {
      setLoading(false);
    }
  };

  const currentMarket = marketData[selectedAsset];
  const isHgtSelected = selectedAsset === 'HGT';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trading Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Asset Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Trading Pair
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {SUPPORTED_ASSETS.map((asset) => (
                <Button
                  key={asset.symbol}
                  variant={selectedAsset === asset.symbol ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <span className="font-semibold">{asset.symbol}</span>
                  <span className="text-xs opacity-70">{asset.name}</span>
                  {marketData[asset.symbol] && (
                    <Badge 
                      variant={marketData[asset.symbol].changePercent >= 0 ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {marketData[asset.symbol].changePercent >= 0 ? '+' : ''}
                      {marketData[asset.symbol].changePercent.toFixed(2)}%
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Data */}
        {currentMarket && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">${currentMarket.price.toFixed(6)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p className={`text-lg font-semibold ${currentMarket.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentMarket.changePercent >= 0 ? '+' : ''}{currentMarket.changePercent.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">24h High</p>
                  <p className="text-lg font-semibold">${currentMarket.high24h.toFixed(6)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">24h Low</p>
                  <p className="text-lg font-semibold">${currentMarket.low24h.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HGT Specific Info */}
        {isHgtSelected && hgtInfo && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Heights Token (HGT) Trading:</strong> 
              Fee: {hgtInfo.transferFee}% | 
              Max Wallet: {parseFloat(hgtInfo.maxWalletAmount).toLocaleString()} HGT | 
              Trading {hgtInfo.tradingEnabled ? 'Enabled' : 'Disabled'}
            </AlertDescription>
          </Alert>
        )}

        {/* Trading Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Place Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tradeType} onValueChange={(value: string) => setTradeType(value as 'spot' | 'leverage')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spot">Spot Trading</TabsTrigger>
                <TabsTrigger value="leverage">Leverage Trading</TabsTrigger>
              </TabsList>

              <TabsContent value="spot" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tradeSide === 'buy' ? 'default' : 'outline'}
                    onClick={() => setTradeSide('buy')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    BUY
                  </Button>
                  <Button
                    variant={tradeSide === 'sell' ? 'default' : 'outline'}
                    onClick={() => setTradeSide('sell')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    SELL
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Order Type</Label>
                    <Select value={orderType} onValueChange={(value: string) => setOrderType(value as 'market' | 'limit')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {orderType === 'limit' && (
                    <div>
                      <Label>Price (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Amount ({selectedAsset})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Slippage Tolerance (%)</Label>
                    <Slider
                      value={[slippage]}
                      onValueChange={(value) => setSlippage(value[0])}
                      max={5}
                      min={0.1}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">{slippage}%</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leverage" className="space-y-4 mt-4">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Leverage trading involves significant risk. You may lose more than your initial investment.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Leverage</Label>
                  <Slider
                    value={[leverage]}
                    onValueChange={(value) => setLeverage(value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">{leverage}x Leverage</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tradeSide === 'buy' ? 'default' : 'outline'}
                    onClick={() => setTradeSide('buy')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    LONG
                  </Button>
                  <Button
                    variant={tradeSide === 'sell' ? 'default' : 'outline'}
                    onClick={() => setTradeSide('sell')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    SHORT
                  </Button>
                </div>

                <div>
                  <Label>Position Size ({selectedAsset})</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Fee Breakdown */}
            {feeEstimate && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Fee Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trade Amount:</span>
                      <span>${feeEstimate.tradeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trading Fee ({feeEstimate.feePercentage}%):</span>
                      <span>${feeEstimate.feeBreakdown.tradingFee.toFixed(2)}</span>
                    </div>
                    {feeEstimate.feeBreakdown.fundingFee && (
                      <div className="flex justify-between">
                        <span>Funding Fee (Daily):</span>
                        <span>${feeEstimate.feeBreakdown.fundingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total Cost:</span>
                      <span>${feeEstimate.netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={executeTrade}
              disabled={loading || !amount || (orderType === 'limit' && !price)}
              className="w-full mt-4"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Processing...' : `${tradeSide.toUpperCase()} ${selectedAsset}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        {/* Active Trades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTrades.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active trades</p>
            ) : (
              <div className="space-y-2">
                {activeTrades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {trade.status === 'filled' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : trade.status === 'cancelled' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          {trade.side.toUpperCase()} {trade.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trade.amount} @ ${trade.price.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                      {trade.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SUPPORTED_ASSETS.map((asset) => (
                <div key={asset.symbol} className="flex justify-between">
                  <span className="text-sm">{asset.symbol}</span>
                  <span className="text-sm font-semibold">
                    {balance[asset.symbol]?.toFixed(6) || '0.000000'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}