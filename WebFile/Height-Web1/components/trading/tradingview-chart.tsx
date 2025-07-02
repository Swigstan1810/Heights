"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  height?: number;
  width?: number;
  style?: 'bars' | 'candles' | 'line' | 'area';
  theme?: 'light' | 'dark';
  locale?: string;
  timezone?: string;
  autosize?: boolean;
  range?: string;
  hide_side_toolbar?: boolean;
  hide_top_toolbar?: boolean;
  save_image?: boolean;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart({
  symbol,
  interval = '1H',
  height = 500,
  width = 100,
  style = 'candles',
  locale = 'en',
  timezone = 'Etc/UTC',
  autosize = true,
  range = '6M',
  hide_side_toolbar = false,
  hide_top_toolbar = false,
  save_image = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Load TradingView script if not already loaded
    const loadTradingViewScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TradingView script'));
        
        document.head.appendChild(script);
        scriptRef.current = script;
      });
    };

    const initializeChart = () => {
      if (!containerRef.current || !window.TradingView) return;

      // Clear any existing chart
      containerRef.current.innerHTML = '';

      try {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          width: autosize ? '100%' : width,
          height: height,
          symbol: formatSymbol(symbol),
          interval: interval,
          timezone: timezone,
          theme: theme === 'dark' ? 'dark' : 'light',
          style: getChartStyle(style),
          locale: locale,
          toolbar_bg: theme === 'dark' ? '#1e1e1e' : '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: hide_side_toolbar,
          hide_top_toolbar: hide_top_toolbar,
          save_image: save_image,
          details: true,
          hotlist: true,
          calendar: true,
          studies: [
            'MACD@tv-basicstudies',
            'RSI@tv-basicstudies',
            'Volume@tv-basicstudies'
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          range: range,
          autosize: autosize,
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode'
          ],
          overrides: getThemeOverrides(theme),
          loading_screen: {
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#ffffff' : '#000000'
          }
        });
      } catch (error) {
        console.error('Error initializing TradingView chart:', error);
        // Fallback content
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: ${height}px; background: ${theme === 'dark' ? '#1e1e1e' : '#f8f9fa'}; border-radius: 8px; color: ${theme === 'dark' ? '#ffffff' : '#000000'};">
              <div style="text-align: center;">
                <div style="font-size: 18px; margin-bottom: 8px;">Chart Loading...</div>
                <div style="font-size: 14px; opacity: 0.7;">${symbol}</div>
              </div>
            </div>
          `;
        }
      }
    };

    loadTradingViewScript()
      .then(() => {
        // Add small delay to ensure TradingView is fully loaded
        setTimeout(initializeChart, 100);
      })
      .catch((error) => {
        console.error('Failed to load TradingView:', error);
      });

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, width, style, locale, timezone, autosize, range, hide_side_toolbar, hide_top_toolbar, save_image]);

  // Generate unique ID for the container
  const containerId = `tradingview-chart-${symbol.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;

  return (
    <div className="w-full h-full">
      <div
        ref={containerRef}
        id={containerId}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

// Helper functions
function formatSymbol(symbol: string): string {
  // Convert our symbol format to TradingView format
  // BTC/USDT -> BINANCE:BTCUSDT
  // ETH/USD -> COINBASE:ETHUSD
  const [base, quote] = symbol.split('/');
  
  if (!base || !quote) return symbol;
  
  // Default to Binance for most crypto pairs
  if (quote === 'USDT') {
    return `BINANCE:${base}${quote}`;
  }
  
  // Use Coinbase for USD pairs
  if (quote === 'USD') {
    return `COINBASE:${base}${quote}`;
  }
  
  // Fallback
  return `${base}${quote}`;
}

function getChartStyle(style: string): string {
  switch (style) {
    case 'bars':
      return '0';
    case 'candles':
      return '1';
    case 'line':
      return '2';
    case 'area':
      return '3';
    default:
      return '1'; // candles
  }
}

function getThemeOverrides(theme: string | undefined) {
  if (theme === 'dark') {
    return {
      'paneProperties.background': '#1e1e1e',
      'paneProperties.backgroundType': 'solid',
      'paneProperties.backgroundGradientStartColor': '#1e1e1e',
      'paneProperties.backgroundGradientEndColor': '#1e1e1e',
      'mainSeriesProperties.candleStyle.upColor': '#22c55e',
      'mainSeriesProperties.candleStyle.downColor': '#ef4444',
      'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
      'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
      'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
      'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
      'paneProperties.vertGridProperties.color': '#2d2d2d',
      'paneProperties.horzGridProperties.color': '#2d2d2d',
      'symbolWatermarkProperties.transparency': '90',
      'scalesProperties.textColor': '#b1b5c3',
      'scalesProperties.backgroundColor': '#1e1e1e'
    };
  }
  
  return {
    'paneProperties.background': '#ffffff',
    'paneProperties.backgroundType': 'solid',
    'mainSeriesProperties.candleStyle.upColor': '#22c55e',
    'mainSeriesProperties.candleStyle.downColor': '#ef4444',
    'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
    'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
    'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
    'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
    'paneProperties.vertGridProperties.color': '#e1e3e6',
    'paneProperties.horzGridProperties.color': '#e1e3e6',
    'symbolWatermarkProperties.transparency': '90',
    'scalesProperties.textColor': '#131722'
  };
}