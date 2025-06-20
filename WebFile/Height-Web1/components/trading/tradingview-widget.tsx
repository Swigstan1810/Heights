"use client";

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView?: any;
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a stable unique ID for the widget container
  const widgetIdRef = useRef(`tradingview_${Math.random().toString(36).substring(2, 10)}`);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    let widget: any = null;
    setLoading(true);
    setError(null);

    // Cleanup function
    const cleanup = () => {
      if (widget && typeof widget.remove === 'function') {
        try {
          widget.remove();
        } catch (e) {
          // ignore
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        createWidget();
      };
      script.onerror = () => {
        setError('Failed to load TradingView script');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      createWidget();
    }

    function createWidget() {
      if (!window.TradingView || !containerRef.current) {
        setError('TradingView not available');
        setLoading(false);
        return;
      }
      try {
        containerRef.current.innerHTML = '';
        widget = new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme,
          style: "1",
          locale: "en",
          toolbar_bg: theme === 'dark' ? "#1e1e1e" : "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: allowSymbolChange,
          container_id: widgetIdRef.current,
          hide_side_toolbar: !showIntervalTabs,
          hide_legend: false,
          save_image: false,
          studies: ["RSI@tv-basicstudies"],
          height,
          width: "100%"
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize TradingView widget');
        setLoading(false);
      }
    }

    return cleanup;
  }, [symbol, height, theme, allowSymbolChange, showIntervalTabs]);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-background">
      <div
        ref={containerRef}
        id={widgetIdRef.current}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {loading && (
          <div className="flex items-center justify-center h-full bg-muted/50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full bg-muted/50">
            <div className="text-center">
              <p className="text-red-500 mb-2">Chart Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}