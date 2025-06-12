// components/trading/tradingview-widget.tsx
"use client";

import { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
}

function TradingViewWidget({ 
  symbol, 
  height = 400, 
  theme = 'dark' 
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptIdRef = useRef<string>(`tradingview_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === 'undefined' || !container.current) return;

    // Clear any existing content
    container.current.innerHTML = '';

    // Create the inner container div
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    container.current.appendChild(widgetContainer);

    // Create and configure the script
    const script = document.createElement('script');
    script.id = scriptIdRef.current;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // Widget configuration
    const config = {
      "autosize": false,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": scriptIdRef.current,
      "hide_side_toolbar": false,
      "studies": [],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "width": "100%",
      "height": height
    };

    script.innerHTML = JSON.stringify(config);

    // Add the script to the container
    container.current.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.getElementById(scriptIdRef.current);
      if (existingScript) {
        existingScript.remove();
      }
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme, height]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container}
      style={{ 
        height: `${height}px`, 
        width: "100%",
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TradingViewWidget);