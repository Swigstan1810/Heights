// components/trading/lightweight-chart-widget.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

declare global {
  interface Window {
    LightweightCharts: any;
  }
}

interface LightweightChartWidgetProps {
  symbol: string;
  height?: number;
  showIntervalTabs?: boolean;
  showVolume?: boolean;
  className?: string;
}

function LightweightChartWidget({
  symbol,
  height = 400,
  showIntervalTabs = true,
  showVolume = false,
  className = '',
}: LightweightChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [interval, setInterval] = useState('1H');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate mock data for the chart
  const generateMockData = (interval: string) => {
    const now = new Date();
    const data = [];
    const volumeData = [];
    let periods = 100;
    
    switch (interval) {
      case '1M': periods = 60; break;
      case '5M': periods = 100; break;
      case '15M': periods = 100; break;
      case '1H': periods = 100; break;
      case '1D': periods = 100; break;
      case '1W': periods = 52; break;
    }

    for (let i = periods; i >= 0; i--) {
      const time = new Date(now);
      
      switch (interval) {
        case '1M': time.setMinutes(time.getMinutes() - i); break;
        case '5M': time.setMinutes(time.getMinutes() - i * 5); break;
        case '15M': time.setMinutes(time.getMinutes() - i * 15); break;
        case '1H': time.setHours(time.getHours() - i); break;
        case '1D': time.setDate(time.getDate() - i); break;
        case '1W': time.setDate(time.getDate() - i * 7); break;
      }

      const basePrice = symbol.includes('BTC') ? 45000 : 
                       symbol.includes('ETH') ? 3000 : 
                       symbol.includes('SOL') ? 100 : 50;
      
      const volatility = 0.02;
      const trend = Math.sin(i / 20) * basePrice * 0.1;
      const randomWalk = (Math.random() - 0.5) * basePrice * volatility;
      
      const open = basePrice + trend + randomWalk;
      const close = open + (Math.random() - 0.5) * basePrice * volatility;
      const high = Math.max(open, close) + Math.random() * basePrice * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * basePrice * volatility * 0.5;
      
      data.push({
        time: Math.floor(time.getTime() / 1000),
        open: open,
        high: high,
        low: low,
        close: close,
      });
      
      volumeData.push({
        time: Math.floor(time.getTime() / 1000),
        value: Math.random() * 1000000,
        color: close > open ? '#26a69a' : '#ef5350',
      });
    }
    
    return { priceData: data, volumeData };
  };

  const initializeChart = () => {
    if (!window.LightweightCharts || !chartContainerRef.current) {
      setError('Chart library not loaded');
      return;
    }

    try {
      setIsLoading(false);
      setError(null);
      
      // Clear any existing chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      
      // Create chart
      chartRef.current = window.LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          scaleMargins: {
            top: 0.1,
            bottom: showVolume ? 0.3 : 0.1,
          },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: window.LightweightCharts.CrosshairMode.Normal,
        },
      });

      // Add candlestick series
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Add volume series if requested
      if (showVolume) {
        volumeSeriesRef.current = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }

      // Load initial data
      const { priceData, volumeData } = generateMockData(interval);
      candleSeriesRef.current.setData(priceData);
      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fit content
      chartRef.current.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Cleanup function for this specific initialization
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
      setError('Failed to initialize chart');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Check if library is already loaded
    if (window.LightweightCharts) {
      cleanup = initializeChart();
      return cleanup;
    }

    // Load TradingView Lightweight Charts library
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.async = true;
    
    script.onload = () => {
      cleanup = initializeChart();
    };

    script.onerror = () => {
      setError('Failed to load chart library');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (cleanup) cleanup();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [height, showVolume]); // Only reinitialize on these critical prop changes

  // Update data when interval or symbol changes
  useEffect(() => {
    if (candleSeriesRef.current && !isLoading) {
      try {
        const { priceData, volumeData } = generateMockData(interval);
        candleSeriesRef.current.setData(priceData);
        if (showVolume && volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volumeData);
        }
        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        console.error('Error updating chart data:', err);
      }
    }
  }, [interval, symbol, showVolume, isLoading]);

  // Update theme
  useEffect(() => {
    if (chartRef.current && !isLoading) {
      const isDark = document.documentElement.classList.contains('dark');
      try {
        chartRef.current.applyOptions({
          layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: isDark ? '#d1d5db' : '#333',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(197, 203, 206, 0.1)' : 'rgba(197, 203, 206, 0.1)' },
            horzLines: { color: isDark ? 'rgba(197, 203, 206, 0.1)' : 'rgba(197, 203, 206, 0.1)' },
          },
          rightPriceScale: {
            borderColor: isDark ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.3)',
          },
          timeScale: {
            borderColor: isDark ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.3)',
          },
        });
      } catch (err) {
        console.error('Error updating chart theme:', err);
      }
    }
  });

  if (error) {
    return (
      <div className={`relative ${className}`} style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-center">
            <p className="text-red-500 mb-2">Chart Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showIntervalTabs && (
        <div className="absolute top-2 right-2 z-10">
          <Tabs value={interval} onValueChange={setInterval}>
            <TabsList className="h-8">
              <TabsTrigger value="1M" className="text-xs px-2 h-7">1M</TabsTrigger>
              <TabsTrigger value="5M" className="text-xs px-2 h-7">5M</TabsTrigger>
              <TabsTrigger value="15M" className="text-xs px-2 h-7">15M</TabsTrigger>
              <TabsTrigger value="1H" className="text-xs px-2 h-7">1H</TabsTrigger>
              <TabsTrigger value="1D" className="text-xs px-2 h-7">1D</TabsTrigger>
              <TabsTrigger value="1W" className="text-xs px-2 h-7">1W</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
}

// Export with error boundary
export default function LightweightChartWidgetWithErrorBoundary(props: LightweightChartWidgetProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.message.includes('addCandlestickSeries') || event.message.includes('LightweightCharts')) {
        setHasError(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <div>Chart failed to load.</div>;
  }

  return <LightweightChartWidget {...props} />;
}