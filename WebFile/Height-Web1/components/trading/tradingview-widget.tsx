
"use client";

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
  allowSymbolChange?: boolean;
  showIntervalTabs?: boolean;
}

export default function TradingViewWidget({
  symbol,
  height = 500,
  theme = 'dark',
  allowSymbolChange = false,
  showIntervalTabs = false
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Clean up previous widget
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
        widgetRef.current = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    if (!containerRef.current) return;

    // Create unique container ID
    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;
    containerRef.current.id = containerId;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        try {
          // Remove any existing content
          containerRef.current.innerHTML = '';
          
          widgetRef.current = new window.TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: theme,
            style: "1",
            locale: "en",
            toolbar_bg: theme === 'dark' ? "#1e1e1e" : "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: allowSymbolChange,
            container_id: containerId,
            hide_side_toolbar: !showIntervalTabs,
            hide_legend: false,
            save_image: false,
            studies: ["RSI@tv-basicstudies"],
            height: height,
            width: "100%"
          });
        } catch (error) {
          console.error('TradingView widget initialization error:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load TradingView script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, height, theme, allowSymbolChange, showIntervalTabs]);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-background">
      <div 
        ref={containerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center h-full bg-muted/50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      </div>
    </div>
  );
}