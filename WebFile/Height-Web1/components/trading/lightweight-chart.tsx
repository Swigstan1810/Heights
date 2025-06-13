// components/trading/lightweight-chart.tsx
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, LineStyle, PriceScaleMode } from 'lightweight-charts';
import { useTheme } from 'next-themes';

interface LightweightChartProps {
  symbol: string;
  data?: any[];
  height?: number;
  showVolume?: boolean;
}

export function LightweightChart({ 
  symbol, 
  data,
  height = 400,
  showVolume = true 
}: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { theme } = useTheme();

  const fetchChartData = useCallback(async () => {
    try {
      // Fetch historical data from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/ohlc?vs_currency=usd&days=30`
      );
      
      if (!response.ok) throw new Error('Failed to fetch chart data');
      
      const rawData = await response.json();
      
      // Transform data for lightweight-charts
      const candlestickData = rawData.map((item: number[]) => ({
        time: Math.floor(item[0] / 1000), // Convert to seconds
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4]
      })).sort((a: any, b: any) => a.time - b.time);

      // Generate volume data (simulated as CoinGecko doesn't provide in OHLC)
      const volumeData = candlestickData.map((item: any) => ({
        time: item.time,
        value: Math.random() * 1000000 * (item.high - item.low), // Simulated volume
        color: item.close >= item.open ? '#26a69a' : '#ef5350'
      }));

      return { candlestickData, volumeData };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return { candlestickData: [], volumeData: [] };
    }
  }, [symbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart configuration
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: theme === 'dark' ? '#0a0a0a' : '#ffffff',
        },
        textColor: theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: {
          color: theme === 'dark' ? '#1f2937' : '#e5e7eb',
          style: LineStyle.Dotted,
        },
        horzLines: {
          color: theme === 'dark' ? '#1f2937' : '#e5e7eb',
          style: LineStyle.Dotted,
        },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series if enabled
    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volumeSeries = (chart as any).addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Load data
    fetchChartData().then(({ candlestickData, volumeData }) => {
      if (candlestickData.length > 0) {
        candlestickSeries.setData(candlestickData);
        if (volumeSeries && volumeData.length > 0) {
          volumeSeries.setData(volumeData);
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [symbol, height, theme, showVolume, fetchChartData]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full relative"
      style={{ height: `${height}px` }}
    />
  );
}