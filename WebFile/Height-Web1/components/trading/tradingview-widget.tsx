// components/trading/tradingview-widget.tsx - Fixed implementation based on TradingView examples
"use client";

import { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewWidgetProps {
  symbol?: string;
  height?: number;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  interval?: string;
  timezone?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  studies?: string[];
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  hide_side_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  hide_volume?: boolean;
  support_host?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

function TradingViewWidget({
  symbol = "BTCUSD",
  height = 400,
  theme,
  autosize = true,
  interval = "1D",
  timezone = "Etc/UTC",
  style = "1",
  locale = "en",
  toolbar_bg = "#f1f3f6",
  enable_publishing = false,
  allow_symbol_change = true,
  studies = [],
  show_popup_button = false,
  popup_width = "1000",
  popup_height = "650",
  hide_side_toolbar = false,
  hide_legend = false,
  save_image = false,
  hide_volume = false,
  support_host = "https://www.tradingview.com"
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptIdRef = useRef<string>(`tradingview_${Math.random().toString(36).substring(7)}`);
  const { theme: systemTheme } = useTheme();
  const widgetTheme = theme || (systemTheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let widgetInstance: any = null;

    const initializeWidget = () => {
      if (!container.current) return;

      // Clear any existing content
      container.current.innerHTML = '';

      // Create the widget configuration
      const widgetConfig = {
        autosize,
        symbol,
        interval,
        timezone,
        theme: widgetTheme,
        style,
        locale,
        toolbar_bg,
        enable_publishing,
        allow_symbol_change,
        container_id: scriptIdRef.current,
        studies,
        show_popup_button,
        popup_width,
        popup_height,
        hide_side_toolbar,
        hide_legend,
        save_image,
        hide_volume,
        support_host,
        width: "100%",
        height: height
      };

      // Check if TradingView is already loaded
      if (window.TradingView) {
        try {
          widgetInstance = new window.TradingView.widget(widgetConfig);
        } catch (error) {
          console.error('Error creating TradingView widget:', error);
        }
      } else {
        // Load TradingView library
        scriptElement = document.createElement('script');
        scriptElement.src = 'https://s3.tradingview.com/tv.js';
        scriptElement.type = 'text/javascript';
        scriptElement.async = true;
        
        scriptElement.onload = () => {
          if (window.TradingView && container.current) {
            try {
              widgetInstance = new window.TradingView.widget(widgetConfig);
            } catch (error) {
              console.error('Error creating TradingView widget after script load:', error);
            }
          }
        };

        scriptElement.onerror = (error) => {
          console.error('Error loading TradingView script:', error);
        };

        // Append script to container
        if (container.current) {
          container.current.appendChild(scriptElement);
        }
      }
    };

    // Initialize the widget
    const timeoutId = setTimeout(initializeWidget, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      
      if (widgetInstance && typeof widgetInstance.remove === 'function') {
        try {
          widgetInstance.remove();
        } catch (error) {
          console.warn('Error removing TradingView widget:', error);
        }
      }

      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }

      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, height, widgetTheme, interval, timezone, style, locale, toolbar_bg, enable_publishing, allow_symbol_change, JSON.stringify(studies), show_popup_button, popup_width, popup_height, hide_side_toolbar, hide_legend, save_image, hide_volume, support_host, autosize]);

  return (
    <div 
      className="tradingview-widget-container w-full" 
      ref={container}
      id={scriptIdRef.current}
      style={{ 
        height: autosize ? '100%' : `${height}px`, 
        minHeight: `${height}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

// Advanced Chart Widget (more features)
export function TradingViewAdvancedChart({
  symbol = "BTCUSD",
  height = 600,
  theme,
  interval = "1D",
  studies = ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
  ...props
}: TradingViewWidgetProps) {
  return (
    <TradingViewWidget
      symbol={symbol}
      height={height}
      theme={theme}
      interval={interval}
      studies={studies}
      hide_side_toolbar={false}
      allow_symbol_change={true}
      show_popup_button={true}
      {...props}
    />
  );
}

// Mini Chart Widget (simplified)
export function TradingViewMiniChart({
  symbol = "BTCUSD",
  height = 300,
  theme,
  ...props
}: TradingViewWidgetProps) {
  return (
    <TradingViewWidget
      symbol={symbol}
      height={height}
      theme={theme}
      interval="1D"
      hide_side_toolbar={true}
      allow_symbol_change={false}
      show_popup_button={false}
      hide_legend={true}
      hide_volume={true}
      studies={[]}
      {...props}
    />
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TradingViewWidget);