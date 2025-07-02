// components/trading/dex-trading-interface.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { ethers } from 'ethers';
import { DexTradingService, TradeQuote, SwapParams } from '@/lib/services/dex-trading-service';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowDownUp, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield, 
  Info, 
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Gas,
  Percent,
  Clock,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenBalance {
  symbol: string;
  balance: string;
  name: string;
  address: string;
}

export function DexTradingInterface() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  
  // Trading state
  const [dexService, setDexService] = useState<DexTradingService | null>(null);
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('HGT');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [swapping, setSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Initialize DEX service
  useEffect(() => {
    if (isConnected && signer) {
      const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
      const service = new DexTradingService(provider, signer);
      setDexService(service);
    }
  }, [isConnected, signer]);

  // Load user balances
  const loadBalances = useCallback(async () => {
    if (!dexService || !address) return;
    
    setLoading(true);
    try {
      const portfolio = await dexService.getUserPortfolio(address);
      setBalances(portfolio);
    } catch (error) {
      console.error('Error loading balances:', error);
      toast.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, [dexService, address]);

  // Get quote when amount changes
  const getQuote = useCallback(async () => {
    if (!dexService || !amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    try {
      const newQuote = await dexService.getSwapQuote(tokenIn, tokenOut, amountIn);
      setQuote(newQuote);
    } catch (error) {
      console.error('Error getting quote:', error);
      setQuote(null);
      toast.error('Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  }, [dexService, tokenIn, tokenOut, amountIn]);

  // Load balances on mount and when tokens change
  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // Get quote when inputs change
  useEffect(() => {
    const timer = setTimeout(getQuote, 500); // Debounce
    return () => clearTimeout(timer);
  }, [getQuote]);

  // Execute swap
  const executeSwap = async () => {
    if (!dexService || !quote || !address) return;

    setSwapping(true);
    try {
      const swapParams: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        recipient: address
      };

      const tx = await dexService.executeSwap(swapParams);
      setLastTxHash(tx.hash);
      
      toast.success('Swap transaction submitted!');
      
      // Wait for confirmation
      await tx.wait();
      
      toast.success('Swap completed successfully!');
      
      // Refresh balances
      await loadBalances();
      
      // Clear form
      setAmountIn('');
      setQuote(null);
      
    } catch (error) {
      console.error('Swap error:', error);
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  // Flip tokens
  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setQuote(null);
  };

  // Set max amount
  const setMaxAmount = () => {
    const balance = balances[tokenIn];
    if (balance) {
      const maxAmount = tokenIn === 'ETH' 
        ? (parseFloat(balance.balance) * 0.99).toString() // Leave some for gas
        : balance.balance;
      setAmountIn(maxAmount);
    }
  };

  // Format currency
  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.000001) return '<0.000001';
    return num.toFixed(decimals);
  };

  // Get supported tokens (excluding the selected one)
  const getAvailableTokens = (exclude: string) => {
    return dexService?.getSupportedTokens().filter(token => token.symbol !== exclude) || [];
  };

  // Check if swap is valid
  const canSwap = () => {
    if (!quote || !amountIn || parseFloat(amountIn) <= 0) return false;
    
    const balance = balances[tokenIn];
    if (!balance || parseFloat(balance.balance) < parseFloat(amountIn)) return false;
    
    return true;
  };

  if (!isConnected) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect Wallet to Trade</h3>
          <p className="text-muted-foreground mb-4">
            Connect your wallet to start trading on Arbitrum DEX
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trading Interface */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                DEX Trading
              </CardTitle>
              <CardDescription>
                Trade directly on Arbitrum with zero fees beyond gas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadBalances} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Token Input */}
          <div className="space-y-4">
            {/* From Token */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">From</Label>
                <div className="text-xs text-muted-foreground">
                  Balance: {balances[tokenIn] ? formatAmount(balances[tokenIn].balance) : '0'} {tokenIn}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={tokenIn} onValueChange={setTokenIn}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTokens(tokenOut).map(token => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          {token.symbol === 'HGT' && <Star className="h-3 w-3 text-purple-500" />}
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={setMaxAmount}
                  disabled={!balances[tokenIn]}
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={flipTokens}
                className="rounded-full h-10 w-10 p-0"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">To</Label>
                <div className="text-xs text-muted-foreground">
                  Balance: {balances[tokenOut] ? formatAmount(balances[tokenOut].balance) : '0'} {tokenOut}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={tokenOut} onValueChange={setTokenOut}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTokens(tokenIn).map(token => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          {token.symbol === 'HGT' && <Star className="h-3 w-3 text-purple-500" />}
                          {token.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex-1 text-lg font-medium p-3 bg-background rounded-md border">
                  {quoteLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting quote...
                    </div>
                  ) : quote ? (
                    formatAmount(quote.amountOut)
                  ) : (
                    <span className="text-muted-foreground">0.0</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <AnimatePresence>
            {quote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span>1 {tokenIn} = {(parseFloat(quote.amountOut) / parseFloat(quote.amountIn)).toFixed(6)} {tokenOut}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Price Impact
                    </span>
                    <span className={`${quote.priceImpact > 3 ? 'text-red-500' : quote.priceImpact > 1 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {quote.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Gas className="h-3 w-3" />
                      Gas Fee
                    </span>
                    <span>~{parseFloat(quote.gasEstimate).toFixed(6)} ETH</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Slippage
                    </span>
                    <Select value={slippage.toString()} onValueChange={(v) => setSlippage(parseFloat(v))}>
                      <SelectTrigger className="w-20 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">0.1%</SelectItem>
                        <SelectItem value="0.5">0.5%</SelectItem>
                        <SelectItem value="1">1%</SelectItem>
                        <SelectItem value="3">3%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Warnings */}
                {quote.priceImpact > 3 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High price impact ({quote.priceImpact.toFixed(2)}%). Consider reducing trade size.
                    </AlertDescription>
                  </Alert>
                )}

                {tokenIn === 'HGT' && (
                  <Alert>
                    <Star className="h-4 w-4" />
                    <AlertDescription>
                      Selling Heights Token may incur additional fees. Check tokenomics for details.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swap Button */}
          <Button 
            className="w-full h-12 text-lg font-semibold"
            onClick={executeSwap}
            disabled={!canSwap() || swapping}
          >
            {swapping ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Swapping...
              </>
            ) : !amountIn ? (
              'Enter Amount'
            ) : !quote ? (
              'Get Quote'
            ) : !balances[tokenIn] || parseFloat(balances[tokenIn].balance) < parseFloat(amountIn) ? (
              `Insufficient ${tokenIn} Balance`
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Swap {tokenIn} for {tokenOut}
              </>
            )}
          </Button>

          {/* Transaction Hash */}
          {lastTxHash && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Transaction submitted</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://arbiscan.io/tx/${lastTxHash}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            Your Portfolio
          </CardTitle>
          <CardDescription>
            Your token balances on Arbitrum
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : Object.keys(balances).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tokens found in wallet
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(balances).map(([symbol, balance]) => (
                <div key={symbol} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      symbol === 'HGT' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}>
                      {symbol === 'HGT' ? 'H' : symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{balance.name}</p>
                      <p className="text-xs text-muted-foreground">{symbol}</p>
                    </div>
                    {symbol === 'HGT' && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Platform Token
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(balance.balance)}</p>
                    <p className="text-xs text-muted-foreground">{symbol}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DexTradingInterface;