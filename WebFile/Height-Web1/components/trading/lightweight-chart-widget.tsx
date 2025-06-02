// components/trading/lightweight-chart-widget.tsx
"use client";

import { useEffect, useRef, useState, memo } from "react";
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi,
  Time,
  UTCTimestamp,
  BusinessDay,
  CandlestickData,
  HistogramData,
  MouseEventParams,
  CrosshairMode
} from 'lightweight-charts';
import { useTheme } from "next-themes";
import { marketDataService } from '@/lib/market-data';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LightweightChartWidgetProps {
  symbol: string;
  height?: number;
  showIntervalTabs?: boolean;
  showVolume?: boolean;
  className?: string;
}

interface PriceData {
  value: number;
  time: UTCTimestamp;
}

function LightweightChartWidget({
  symbol,
  height = 400,
  showIntervalTabs = true,
  showVolume = true,
  className = "",
}: LightweightChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');
  const [crosshairData, setCrosshairData] = useState<{
    price: number;
    volume: number;
    time: string;
  } | null>(null);
  
  // Real-time price subscription
  useEffect(() => {
    const unsubscribe = marketDataService.subscribe(symbol, (data) => {
      if (candleSeries.current && chart.current) {
        const currentTime = Math.floor(Date.now() / 1000) as UTCTimestamp;
        
        try {
          // Update the last candle
          candleSeries.current.update({
            time: currentTime,
            open: data.price,
            high: data.high24h,
            low: data.low24h,
            close: data.price,
          });
          
          // Update volume if we have volume series
          if (volumeSeries.current && showVolume) {
            volumeSeries.current.update({
              time: currentTime,
              value: data.volume24h,
              color: data.change24hPercent >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            });
          }
        } catch (err) {
          console.error('Error updating real-time data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [symbol, showVolume]);

  // Fetch historical data from Coinbase
  const fetchHistoricalData = async () => {
    if (!chart.current || !candleSeries.current) {
      console.error('Chart not initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const productId = symbol.replace('CRYPTO:', '') + '-USD';
      const granularity = interval === '1m' ? 60 : 
                        interval === '5m' ? 300 : 
                        interval === '15m' ? 900 : 
                        interval === '1h' ? 3600 : 86400;
      
      // Calculate time range based on interval
      const now = Math.floor(Date.now() / 1000);
      const start = interval === '1m' ? now - 3600 : // 1 hour of 1m candles
                   interval === '5m' ? now - 86400 : // 1 day of 5m candles
                   interval === '15m' ? now - 259200 : // 3 days of 15m candles
                   interval === '1h' ? now - 604800 : // 1 week of 1h candles
                   now - 2592000; // 30 days of daily candles
      
      const response = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/candles?start=${start}&end=${now}&granularity=${granularity}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const data = await response.json();
      
      // Format data for lightweight charts
      const candleData: CandlestickData[] = data
        .map((candle: number[]) => ({
          time: candle[0] as UTCTimestamp,
          open: candle[3],
          high: candle[2],
          low: candle[1],
          close: candle[4],
        }))
        .sort((a: CandlestickData, b: CandlestickData) => 
          (a.time as number) - (b.time as number)
        );

      const volumeData: HistogramData[] = data
        .map((candle: number[]) => ({
          time: candle[0] as UTCTimestamp,
          value: candle[5],
          color: candle[4] >= candle[3] ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
        }))
        .sort((a: HistogramData, b: HistogramData) => 
          (a.time as number) - (b.time as number)
        );
      
      // Update chart with new data
      if (candleSeries.current) {
        candleSeries.current.setData(candleData);
      }
      
      if (volumeSeries.current && showVolume) {
        volumeSeries.current.setData(volumeData);
      }
      
      // Fit content to the chart
      if (chart.current) {
        chart.current.timeScale().fitContent();
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to load chart data');
      setLoading(false);
    }
  };

  // Initialize chart
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;

    function tryInitChart() {
      const container = chartContainerRef.current;
      if (!container) {
        console.log('Chart container not found');
        return;
      }

      const width = container.clientWidth;
      const heightPx = container.clientHeight || height;

      if (width === 0 || heightPx === 0) {
        console.log('Chart container has zero size, retrying...');
        retryTimeout = setTimeout(tryInitChart, 100);
        return;
      }

      try {
        console.log('Creating chart with', width, heightPx);
        const newChart = createChart(container, { width, height: heightPx });
        chart.current = newChart;

        // Add candlestick series (v5+ API)
        candleSeries.current = newChart.addSeries<'Candlestick'>('Candlestick' as any, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat: {
            type: 'price',
            precision: symbol.includes('BTC') ? 2 : 4,
            minMove: 0.01,
          },
        }) as ISeriesApi<'Candlestick'>;

        // Add volume series if enabled (v5+ API)
        if (showVolume) {
          volumeSeries.current = newChart.addSeries<'Histogram'>('Histogram' as any, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            // @ts-expect-error: scaleMargins is accepted by lightweight-charts at runtime
            scaleMargins: { top: 0.7, bottom: 0 },
          }) as ISeriesApi<'Histogram'>;
        }

        // Subscribe to crosshair move
        newChart.subscribeCrosshairMove((param: MouseEventParams) => {
          if (!param.time || !param.seriesData || param.seriesData.size === 0) {
            setCrosshairData(null);
            return;
          }

          const candleData = param.seriesData.get(candleSeries.current!) as CandlestickData;
          const volumeData = volumeSeries.current 
            ? param.seriesData.get(volumeSeries.current) as HistogramData
            : null;

          if (candleData) {
            const date = new Date((param.time as number) * 1000);
            setCrosshairData({
              price: candleData.close,
              volume: volumeData?.value || 0,
              time: date.toLocaleString(),
            });
          }
        });

        // Handle resize
        const handleResize = () => {
          if (chart.current && chartContainerRef.current) {
            chart.current.applyOptions({ 
              width: chartContainerRef.current.clientWidth 
            });
          }
        };

        window.addEventListener('resize', handleResize);

        // Initial data fetch
        setTimeout(() => {
          console.log('Fetching historical data...');
          fetchHistoricalData();
        }, 100);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          if (chart.current) {
            chart.current.remove();
            chart.current = null;
            candleSeries.current = null;
            volumeSeries.current = null;
          }
        };
      } catch (err) {
        console.error('Error initializing chart:', err);
        setError('Failed to initialize chart');
        setLoading(false);
      }
    }

    tryInitChart();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
        candleSeries.current = null;
        volumeSeries.current = null;
      }
    };
  }, [height, showVolume, symbol]);

  // Update chart theme when theme changes
  useEffect(() => {
    if (!chart.current) return;
    
    const isDark = theme === 'dark';
    
    try {
      chart.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: isDark ? '#0a0a0a' : '#ffffff' },
          textColor: isDark ? '#d1d5db' : '#374151',
        },
        grid: {
          vertLines: {
            color: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(229, 231, 235, 0.5)',
          },
          horzLines: {
            color: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(229, 231, 235, 0.5)',
          },
        },
        crosshair: {
          vertLine: {
            color: isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)',
          },
          horzLine: {
            color: isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)',
          },
        },
      });
    } catch (err) {
      console.error('Error updating theme:', err);
    }
  }, [theme]);

  // Fetch data when interval changes
  useEffect(() => {
    if (chart.current && candleSeries.current) {
      fetchHistoricalData();
    }
  }, [interval]);

  return (
    <div className={`w-full ${className}`}>
      {showIntervalTabs && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['1m', '5m', '15m', '1h', '1d'] as const).map((int) => (
              <Button
                key={int}
                variant={interval === int ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterval(int)}
                disabled={loading}
              >
                {int}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {crosshairData && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">${crosshairData.price.toFixed(2)}</span>
                {showVolume && (
                  <span className="ml-2">Vol: {crosshairData.volume.toLocaleString()}</span>
                )}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {symbol.replace('CRYPTO:', '')} / USD
            </div>
          </div>
        </div>
      )}
      
      <div className="relative" style={{ height: `${height}px` }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <Button size="sm" onClick={fetchHistoricalData}>
                Retry
              </Button>
            </div>
          </div>
        )}
        
        <div
          ref={chartContainerRef}
          className="w-full h-full min-w-[200px] min-h-[200px]"
          style={{ minHeight: 200, minWidth: 200 }}
        />
      </div>
    </div>
  );
}

export default memo(LightweightChartWidget);