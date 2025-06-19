// components/trading/enhanced-tradingview-widget.tsx
"use client";

import { useEffect, useRef, memo } from 'react';

interface EnhancedTradingViewWidgetProps {
  symbol: string;
  assetType?: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  studies?: string[];
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  no_referral_id?: boolean;
  className?: string;
}

function EnhancedTradingViewWidget({
  symbol,
  assetType = 'stock',
  width = '100%',
  height = 400,
  interval = '1D',
  theme = 'light',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  allow_symbol_change = false,
  studies = [],
  show_popup_button = true,
  popup_width = '1000',
  popup_height = '650',
  no_referral_id = true,
  className = ''
}: EnhancedTradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map symbol to TradingView format based on asset type
  const getTradingViewSymbol = (symbol: string, assetType: string) => {
    const cleanSymbol = symbol.toUpperCase();
    
    switch (assetType) {
      case 'crypto':
        // For crypto, use major exchanges
        if (['BTC', 'BITCOIN'].includes(cleanSymbol)) return 'COINBASE:BTCUSD';
        if (['ETH', 'ETHEREUM'].includes(cleanSymbol)) return 'COINBASE:ETHUSD';
        if (['ADA', 'CARDANO'].includes(cleanSymbol)) return 'COINBASE:ADAUSD';
        if (['SOL', 'SOLANA'].includes(cleanSymbol)) return 'COINBASE:SOLUSD';
        if (['MATIC', 'POLYGON'].includes(cleanSymbol)) return 'COINBASE:MATICUSD';
        if (['DOT', 'POLKADOT'].includes(cleanSymbol)) return 'COINBASE:DOTUSD';
        return `COINBASE:${cleanSymbol}USD`;
        
      case 'stock':
        // For Indian stocks
        if (['RELIANCE', 'RELIANCE.NS'].includes(cleanSymbol)) return 'NSE:RELIANCE';
        if (['TCS', 'TCS.NS'].includes(cleanSymbol)) return 'NSE:TCS';
        if (['INFY', 'INFY.NS', 'INFOSYS'].includes(cleanSymbol)) return 'NSE:INFY';
        if (['HDFCBANK', 'HDFCBANK.NS'].includes(cleanSymbol)) return 'NSE:HDFCBANK';
        if (['ICICIBANK', 'ICICIBANK.NS'].includes(cleanSymbol)) return 'NSE:ICICIBANK';
        if (['BHARTIARTL', 'BHARTIARTL.NS'].includes(cleanSymbol)) return 'NSE:BHARTIARTL';
        if (['ITC', 'ITC.NS'].includes(cleanSymbol)) return 'NSE:ITC';
        if (['SBIN', 'SBIN.NS'].includes(cleanSymbol)) return 'NSE:SBIN';
        if (['LT', 'LT.NS'].includes(cleanSymbol)) return 'NSE:LT';
        if (['WIPRO', 'WIPRO.NS'].includes(cleanSymbol)) return 'NSE:WIPRO';
        
        // For US stocks
        if (['AAPL', 'APPLE'].includes(cleanSymbol)) return 'NASDAQ:AAPL';
        if (['GOOGL', 'GOOGLE'].includes(cleanSymbol)) return 'NASDAQ:GOOGL';
        if (['MSFT', 'MICROSOFT'].includes(cleanSymbol)) return 'NASDAQ:MSFT';
        if (['AMZN', 'AMAZON'].includes(cleanSymbol)) return 'NASDAQ:AMZN';
        if (['TSLA', 'TESLA'].includes(cleanSymbol)) return 'NASDAQ:TSLA';
        if (['META', 'FACEBOOK'].includes(cleanSymbol)) return 'NASDAQ:META';
        if (['NVDA', 'NVIDIA'].includes(cleanSymbol)) return 'NASDAQ:NVDA';
        if (['NFLX', 'NETFLIX'].includes(cleanSymbol)) return 'NASDAQ:NFLX';
        
        // Default to NASDAQ for unknown symbols
        return cleanSymbol.includes('.NS') ? `NSE:${cleanSymbol.replace('.NS', '')}` : `NASDAQ:${cleanSymbol}`;
        
      case 'commodity':
        if (['GOLD'].includes(cleanSymbol)) return 'OANDA:XAUUSD';
        if (['SILVER'].includes(cleanSymbol)) return 'OANDA:XAGUSD';
        if (['OIL', 'CRUDE'].includes(cleanSymbol)) return 'NYMEX:CL1!';
        if (['COPPER'].includes(cleanSymbol)) return 'COMEX:HG1!';
        return `COMEX:${cleanSymbol}1!`;
        
      case 'mutual_fund':
        // Most mutual funds don't have TradingView symbols, use related index
        return 'NSE:NIFTY';
        
      case 'bond':
        // Use treasury bonds or government bonds
        return 'CBOT:ZB1!';
        
      default:
        return `NASDAQ:${cleanSymbol}`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          container_id: containerRef.current?.id,
          autosize: false,
          symbol: getTradingViewSymbol(symbol, assetType),
          interval,
          timezone: 'Asia/Kolkata',
          theme,
          style,
          locale,
          toolbar_bg,
          enable_publishing,
          allow_symbol_change,
          studies,
          show_popup_button,
          popup_width,
          popup_height,
          no_referral_id,
          width: typeof width === 'number' ? width : undefined,
          height: typeof height === 'number' ? height : undefined,
          // Additional professional features
          withdateranges: true,
          hide_side_toolbar: false,
          save_image: true,
          hide_legend: false,
          hide_volume: false,
          overrides: {
            "paneProperties.background": theme === 'light' ? "#ffffff" : "#1e1e1e",
            "paneProperties.vertGridProperties.color": theme === 'light' ? "#f0f0f0" : "#2a2a2a",
            "paneProperties.horzGridProperties.color": theme === 'light' ? "#f0f0f0" : "#2a2a2a",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": theme === 'light' ? "#333333" : "#cccccc",
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [
    symbol, 
    assetType, 
    width, 
    height, 
    interval, 
    theme, 
    style, 
    locale, 
    toolbar_bg, 
    enable_publishing, 
    allow_symbol_change, 
    studies, 
    show_popup_button, 
    popup_width, 
    popup_height, 
    no_referral_id
  ]);

  // Generate unique ID for this widget instance
  const widgetId = `tradingview_${symbol}_${assetType}_${Date.now()}`;

  return (
    <div className={`tradingview-widget-container ${className}`}>
      <div
        ref={containerRef}
        id={widgetId}
        style={{ 
          width: typeof width === 'string' ? width : `${width}px`,
          height: typeof height === 'string' ? height : `${height}px`
        }}
      />
      <div className="tradingview-widget-copyright">
        <a 
          href={`https://www.tradingview.com/chart/?symbol=${getTradingViewSymbol(symbol, assetType)}`}
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          View on TradingView
        </a>
      </div>
    </div>
  );
}

export default memo(EnhancedTradingViewWidget);