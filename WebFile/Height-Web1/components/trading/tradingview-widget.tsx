"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewWidgetProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  autosize?: boolean;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: 'bars' | 'candles' | 'line' | 'area';
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_top_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  container_id?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewWidget({
  symbol = "BINANCE:BTCUSDT",
  width = "100%",
  height = 400,
  autosize = true,
  interval = "1H",
  timezone = "Etc/UTC",
  style = "candles",
  locale = "en",
  toolbar_bg = "#f1f3f6",
  enable_publishing = false,
  hide_top_toolbar = false,
  hide_legend = false,
  save_image = false,
  container_id
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadScript = async () => {
      if (window.TradingView) {
        initWidget();
        return;
      }

      if (scriptLoaded.current) return;
      scriptLoaded.current = true;

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        showFallback();
      };
      
      document.head.appendChild(script);
    };

    const initWidget = () => {
      if (!containerRef.current || !window.TradingView) return;

      // Clear existing content
      containerRef.current.innerHTML = '';

      try {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          width: autosize ? "100%" : width,
          height: height,
          symbol: symbol,
          interval: interval,
          timezone: timezone,
          theme: theme === 'dark' ? 'dark' : 'light',
          style: getStyleCode(style),
          locale: locale,
          toolbar_bg: theme === 'dark' ? '#1e1e1e' : toolbar_bg,
          enable_publishing: enable_publishing,
          hide_top_toolbar: hide_top_toolbar,
          hide_legend: hide_legend,
          save_image: save_image,
          details: true,
          hotlist: true,
          calendar: true,
          studies: [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "Volume@tv-basicstudies"
          ],
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650",
          autosize: autosize,
          disabled_features: [
            "use_localstorage_for_settings"
          ],
          enabled_features: [
            "study_templates"
          ],
          overrides: getThemeOverrides(theme),
          loading_screen: {
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#ffffff' : '#000000'
          }
        });
      } catch (error) {
        console.error('Error creating TradingView widget:', error);
        showFallback();
      }
    };

    const showFallback = () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: ${typeof height === 'number' ? height + 'px' : height}; 
            background: ${theme === 'dark' ? '#1e1e1e' : '#f8f9fa'}; 
            border: 1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'};
            border-radius: 8px; 
            color: ${theme === 'dark' ? '#ffffff' : '#000000'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            <div style="text-align: center;">
              <div style="font-size: 18px; margin-bottom: 8px; font-weight: 600;">
                📈 Trading Chart
              </div>
              <div style="font-size: 14px; opacity: 0.7;">
                ${symbol}
              </div>
              <div style="font-size: 12px; opacity: 0.5; margin-top: 8px;">
                Chart loading...
              </div>
            </div>
          </div>
        `;
      }
    };

    // Generate unique container ID
    if (containerRef.current) {
      containerRef.current.id = container_id || `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      loadScript();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, height, width, style, autosize]);

  return (
    <div 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ 
        width: autosize ? '100%' : width, 
        height: typeof height === 'number' ? `${height}px` : height 
      }}
    />
  );
}

// Helper functions
function getStyleCode(style: string): string {
  switch (style) {
    case 'bars': return '0';
    case 'candles': return '1';
    case 'line': return '2';
    case 'area': return '3';
    default: return '1';
  }
}

function getThemeOverrides(theme: string | undefined) {
  if (theme === 'dark') {
    return {
      "paneProperties.background": "#1e1e1e",
      "paneProperties.backgroundType": "solid",
      "mainSeriesProperties.candleStyle.upColor": "#22c55e",
      "mainSeriesProperties.candleStyle.downColor": "#ef4444",
      "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
      "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
      "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
      "paneProperties.vertGridProperties.color": "#2d2d2d",
      "paneProperties.horzGridProperties.color": "#2d2d2d",
      "scalesProperties.textColor": "#b1b5c3",
      "scalesProperties.backgroundColor": "#1e1e1e"
    };
  }
  
  return {
    "paneProperties.background": "#ffffff",
    "paneProperties.backgroundType": "solid",
    "mainSeriesProperties.candleStyle.upColor": "#22c55e",
    "mainSeriesProperties.candleStyle.downColor": "#ef4444",
    "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
    "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
    "paneProperties.vertGridProperties.color": "#e1e3e6",
    "paneProperties.horzGridProperties.color": "#e1e3e6",
    "scalesProperties.textColor": "#131722"
  };
}

export default TradingViewWidget;