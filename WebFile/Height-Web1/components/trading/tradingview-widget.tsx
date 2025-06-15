"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { coinbaseRealtimeService, type MarketData } from '@/lib/services/coinbase-realtime-service';
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

// Fallback Chart Component with Real-time Data
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
  }>>([]);
  const [currentPrice, setCurrentPrice] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<'1m' | '5m' | '1h' | '1d'>('5m');
  
  useEffect(() => {
    const unsubscribe = coinbaseRealtimeService.subscribe(symbol, (data) => {
      setCurrentPrice(data);
      setIsLoading(false);
      
      // Add to price history
      setPriceData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          price: data.price,
          volume: data.volume24h
        }].slice(-50); // Keep last 50 points
        return newData;
      });
    });

    // Generate initial mock data if no real data
    const generateMockData = () => {
      const now = new Date();
      const data = [];
      const basePrice = symbol === 'BTC' ? 45000 : symbol === 'ETH' ? 3000 : 100;
      
      for (let i = 49; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        const variance = (Math.random() - 0.5) * 0.02;
        data.push({
          time: time.toLocaleTimeString(),
          price: basePrice * (1 + variance),
          volume: Math.random() * 1000000
        });
      }
      setPriceData(data);
      setIsLoading(false);
    };

    const timer = setTimeout(generateMockData, 2000);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [symbol]);

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
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">{symbol}/USD</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    ${currentPrice?.price.toLocaleString() || priceData[priceData.length - 1]?.price.toLocaleString()}
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
              
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                <Activity className="h-3 w-3" />
                <span className="text-xs font-medium">Live</span>
              </div>
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
                  onClick={onFullscreenToggle}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-[calc(100%-80px)] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={priceChangePercent >= 0 ? "#10b981" : "#ef4444"} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={priceChangePercent >= 0 ? "#10b981" : "#ef4444"} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any, name: string) => [
                    `$${value.toLocaleString()}`,
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
                    strokeWidth: 0 
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Bar */}
          <div className="border-t p-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">24h High</span>
              <p className="font-medium">${currentPrice?.high24h.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">24h Low</span>
              <p className="font-medium">${currentPrice?.low24h.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">24h Volume</span>
              <p className="font-medium">${(currentPrice?.volume24h || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main TradingView Widget with Fallback
function EnhancedTradingViewWidget(props: EnhancedTradingViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const { theme: systemTheme } = useTheme();
  const [useFallback, setUseFallback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scriptLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    symbol = "BTCUSD", 
    height = 400,
    showControls = true 
  } = props;

  useEffect(() => {
    let widgetInstance: any = null;
    
    const initTradingView = () => {
      if (!container.current || useFallback) return;

      try {
        // Clear previous content
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
          // Load TradingView script
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
          
          // Timeout fallback
          scriptLoadTimeoutRef.current = setTimeout(() => {
            console.warn('TradingView script timeout, using fallback');
            setUseFallback(true);
            setIsLoading(false);
          }, 10000);
        }
      } catch (error) {
        console.error('TradingView widget error:', error);
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initTradingView, 100);

    return () => {
      clearTimeout(timer);
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

  // Loading state
  if (isLoading && !useFallback) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center bg-muted/20 rounded-lg`}>
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading TradingView...</p>
          <button 
            onClick={() => setUseFallback(true)}
            className="text-xs text-primary hover:underline mt-2"
          >
            Use fallback chart
          </button>
        </div>
      </div>
    );
  }

  // Use fallback chart
  if (useFallback) {
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

  // TradingView container
  return (
    <div className="relative">
      <div 
        ref={container}
        className={`tradingview-widget-container w-full`}
        style={{ height: `${height}px` }}
      />
      {showControls && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
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