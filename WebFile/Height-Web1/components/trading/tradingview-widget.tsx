"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    TradingView?: any;
  }
}

interface EnhancedTradingViewProps {
  symbol?: string;
  height?: number;
  showControls?: boolean;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

// Mock market data for demo
const generateMockData = (symbol: string) => {
  const basePrices: Record<string, number> = {
    'BTC': 45000,
    'ETH': 3000,
    'SOL': 100,
    'ADA': 0.5,
    'MATIC': 0.8,
    'LINK': 15,
    'AVAX': 35,
    'UNI': 6.5,
    'AAVE': 85,
    'LTC': 75
  };

  const basePrice = basePrices[symbol] || 100;
  const data = [];
  const now = new Date();

  for (let i = 49; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const variance = (Math.random() - 0.5) * 0.02; // ±1%
    const price = basePrice * (1 + variance);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: price,
      volume: Math.random() * 1000000,
      timestamp: time.getTime()
    });
  }

  return data;
};

// Enhanced Fallback Chart Component
function FallbackChart({ 
  symbol = "BTC", 
  height = 400,
  showControls = true,
  fullscreen = false,
  onFullscreenToggle 
}: EnhancedTradingViewProps) {
  const [priceData, setPriceData] = useState<Array<{
    time: string;
    price: number;
    volume: number;
    timestamp: number;
  }>>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<'1m' | '5m' | '1h' | '1d'>('5m');
  const [isLive, setIsLive] = useState(true);
  
  // Initialize data
  useEffect(() => {
    const data = generateMockData(symbol);
    setPriceData(data);
    setCurrentPrice(data[data.length - 1]?.price || 0);
    setIsLoading(false);
  }, [symbol]);

  // Simulate live updates
  useEffect(() => {
    if (!isLive || isLoading) return;

    const intervalId = window.setInterval(() => {
      setPriceData(prev => {
        if (prev.length === 0) return prev;
        
        const lastPrice = prev[prev.length - 1].price;
        const variance = (Math.random() - 0.5) * 0.01; // ±0.5%
        const newPrice = lastPrice * (1 + variance);
        const now = new Date();
        
        const newData = [...prev.slice(1), {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          volume: Math.random() * 1000000,
          timestamp: now.getTime()
        }];
        
        setCurrentPrice(newPrice);
        return newData;
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isLive, isLoading]);

  const priceChange = priceData.length > 1 
    ? priceData[priceData.length - 1].price - priceData[0].price 
    : 0;
  const priceChangePercent = priceData.length > 1 
    ? (priceChange / priceData[0].price) * 100 
    : 0;

  const containerClass = fullscreen 
    ? "fixed inset-0 z-50 bg-background" 
    : `h-[${height}px]`;

  if (isLoading) {
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} relative`}>
      <Card className="h-full border-0 shadow-none">
        <CardContent className="p-0 h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">{symbol}/USD</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                  <div className={`flex items-center gap-1 ${priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChangePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {isLive && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">Live</span>
                </motion.div>
              )}
            </div>

            {showControls && (
              <div className="flex items-center gap-2">
                {/* Interval Selector */}
                <div className="flex rounded-lg bg-muted p-1">
                  {(['1m', '5m', '1h', '1d'] as const).map((int) => (
                    <Button
                      key={int}
                      variant={interval === int ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => setInterval(int)}
                    >
                      {int}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLive(!isLive)}
                  className={`h-8 px-3 ${isLive ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  {isLive ? 'Live' : 'Paused'}
                </Button>

                {onFullscreenToggle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFullscreenToggle}
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-[calc(100%-120px)] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={priceChangePercent >= 0 ? "#10b981" : "#ef4444"} 
                      stopOpacity={0.4}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={priceChangePercent >= 0 ? "#10b981" : "#ef4444"} 
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  domain={['dataMin - 50', 'dataMax + 50']}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
                    'Price'
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={priceChangePercent >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: priceChangePercent >= 0 ? "#10b981" : "#ef4444",
                    strokeWidth: 2,
                    stroke: 'white'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Bar */}
          <div className="border-t p-3 bg-muted/20">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <span className="text-muted-foreground block">24h High</span>
                <p className="font-medium">${Math.max(...priceData.map(d => d.price)).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">24h Low</span>
                <p className="font-medium">${Math.min(...priceData.map(d => d.price)).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">24h Volume</span>
                <p className="font-medium">${(priceData[priceData.length - 1]?.volume || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main TradingView Widget with Enhanced Fallback
function EnhancedTradingViewWidget(props: EnhancedTradingViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const { theme: systemTheme } = useTheme();
  const [useFallback, setUseFallback] = useState(true); // Start with fallback for reliability
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scriptLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    symbol = "BTCUSD", 
    height = 400,
    showControls = true 
  } = props;

  // Try to load TradingView but fallback quickly for demo
  useEffect(() => {
    let widgetInstance: any = null;
    
    const initTradingView = () => {
      if (useFallback || !container.current) return;

      try {
        setIsLoading(true);
        container.current.innerHTML = '';

        const widgetConfig = {
          autosize: true,
          symbol: `COINBASE:${symbol}`,
          interval: "5",
          timezone: "Etc/UTC",
          theme: systemTheme === 'dark' ? 'dark' : 'light',
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: container.current,
          studies: ["RSI@tv-basicstudies"],
          hide_side_toolbar: !showControls,
          hide_legend: false,
          save_image: false,
          width: "100%",
          height: height
        };

        if (window.TradingView) {
          widgetInstance = new window.TradingView.widget(widgetConfig);
          setIsLoading(false);
        } else {
          // Load TradingView script with timeout
          const script = document.createElement('script');
          script.src = 'https://s3.tradingview.com/tv.js';
          script.async = true;
          script.onload = () => {
            if (window.TradingView && container.current) {
              widgetInstance = new window.TradingView.widget(widgetConfig);
              setIsLoading(false);
            }
          };
          script.onerror = () => {
            console.warn('TradingView script failed to load, using fallback');
            setUseFallback(true);
            setIsLoading(false);
          };
          
          document.head.appendChild(script);
          
          // Quick timeout for demo
          scriptLoadTimeoutRef.current = setTimeout(() => {
            console.warn('TradingView script timeout, using fallback');
            setUseFallback(true);
            setIsLoading(false);
          }, 5000);
        }
      } catch (error) {
        console.error('TradingView widget error:', error);
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    // Uncomment this line to try TradingView (currently disabled for demo reliability)
    // const timer = setTimeout(initTradingView, 100);

    return () => {
      // clearTimeout(timer);
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current);
      }
      if (widgetInstance && typeof widgetInstance.remove === 'function') {
        try {
          widgetInstance.remove();
        } catch (error) {
          console.warn('Error removing TradingView widget:', error);
        }
      }
    };
  }, [symbol, height, systemTheme, showControls, useFallback]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (props.onFullscreenToggle) {
      props.onFullscreenToggle();
    }
  };

  // Use fallback chart (enhanced for demo)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <FallbackChart
          symbol={symbol.replace('USD', '')}
          height={height}
          showControls={showControls}
          fullscreen={isFullscreen}
          onFullscreenToggle={toggleFullscreen}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Fullscreen Chart Modal
export function FullscreenChart({ 
  symbol, 
  isOpen, 
  onClose 
}: { 
  symbol: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{symbol} Advanced Chart</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1">
          <EnhancedTradingViewWidget 
            symbol={symbol} 
            height={window.innerHeight - 80}
            showControls={true}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default memo(EnhancedTradingViewWidget);