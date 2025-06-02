// components/trading/tradingview-widget.tsx
"use client";

import { useEffect, useRef, memo } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  height?: number;
  theme?: 'light' | 'dark';
  allowSymbolChange?: boolean;
  showIntervalTabs?: boolean;
}

function TradingViewWidget({
  symbol = 'CRYPTO:BTCUSD',
  height = 500,
  theme,
  allowSymbolChange = true,
  showIntervalTabs = true,
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Clean up previous widget
    if (container.current) {
      container.current.innerHTML = '';
    }

    // Map internal symbols to TradingView format
    const tvSymbol = symbol.replace('CRYPTO:', '').replace('NSE:', '') + 'USD';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        new window.TradingView.widget({
          width: '100%',
          height: height,
          symbol: tvSymbol,
          interval: '1',
          timezone: 'Asia/Kolkata',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: allowSymbolChange,
          hide_side_toolbar: false,
          container_id: 'tradingview_widget',
          studies: ['MACD@tv-basicstudies', 'RSI@tv-basicstudies'],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          support_host: 'https://www.tradingview.com',
        });
      }
    };

    scriptRef.current = script;
    container.current?.appendChild(script);

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [symbol, height, theme, allowSymbolChange]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div id="tradingview_widget" />
    </div>
  );
}

export default memo(TradingViewWidget);