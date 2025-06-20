"use client";

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

declare global {
  interface Window {
    TradingView?: any;
  }
}

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
}

const EnhancedTradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  height = 500
}) => {
  const container = useRef<HTMLDivElement>(null);
  const isScriptReady = useRef(false);
  const { theme: colorTheme } = useTheme();

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';

    const createWidget = () => {
      if (!container.current || !window.TradingView) {
        return;
      }
      
      // Clear any existing widget
      container.current.innerHTML = '';

      new window.TradingView.widget({
        width: '100%',
        height: height,
        symbol: `COINBASE:${symbol}USD` || "COINBASE:BTCUSD",
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: colorTheme === 'dark' ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: container.current.id,
        autosize: true,
        studies: [
          "STD;RSI",
          "STD;Stochastic_RSI",
          "STD;MACD"
        ],
      });
    };

    const handleScriptLoad = () => {
      isScriptReady.current = true;
      createWidget();
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = handleScriptLoad;
      document.body.appendChild(script);
    } else if (isScriptReady.current) {
      createWidget();
    } else {
      // If script exists but hasn't loaded, add a listener
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.addEventListener('load', handleScriptLoad);
      }
    }

    // Cleanup function
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.removeEventListener('load', handleScriptLoad);
      }
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, colorTheme, height]);

  // Use a stable, unique ID for the container
  const widgetContainerId = useRef(`tradingview_widget_${Math.random().toString(36).substring(2, 9)}`).current;

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px`, width: '100%' }}>
      <div 
        id={widgetContainerId}
        ref={container} 
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(EnhancedTradingViewWidget);