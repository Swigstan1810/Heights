// components/trading/tradingview-widget.tsx
"use client";

import { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";
import { toTradingViewSymbol } from '@/lib/market-data';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  autosize?: boolean;
  height?: number;
  width?: string | number;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  allowSymbolChange?: boolean;
  saveImage?: boolean;
  container?: string;
  studies?: string[];
  showIntervalTabs?: boolean;
  locale?: string;
  watchlist?: string[];
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  theme?: "light" | "dark";
}

function TradingViewWidget({
  symbol = "COINBASE:BTCUSD",
  interval = "D",
  autosize = true,
  height = 610,
  width = "100%",
  hideTopToolbar = false,
  hideSideToolbar = false,
  allowSymbolChange = true,
  saveImage = true,
  container = "tradingview_widget",
  studies = ["STD;RSI", "STD;MACD"],
  showIntervalTabs = true,
  locale = "en",
  watchlist = ["COINBASE:BTCUSD", "COINBASE:ETHUSD", "COINBASE:SOLUSD", "NSE:RELIANCE", "NSE:TCS"],
  details = true,
  hotlist = true,
  calendar = true,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const getTradingViewSymbol = (sym: string) => {
    return toTradingViewSymbol(sym);
  };

  useEffect(() => {
    // Clean up any existing widget
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined" && containerRef.current) {
        const tvSymbol = getTradingViewSymbol(symbol);
        new window.TradingView.widget({
          autosize: autosize,
          symbol: tvSymbol,
          interval: interval,
          timezone: "Etc/UTC",
          theme: theme === "dark" ? "dark" : "light",
          style: "1",
          locale: locale,
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: allowSymbolChange,
          watchlist: watchlist.map(getTradingViewSymbol),
          details: details,
          hotlist: hotlist,
          calendar: calendar,
          studies: studies,
          container_id: container,
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650",
          hide_top_toolbar: hideTopToolbar,
          hide_side_toolbar: hideSideToolbar,
          save_image: saveImage,
          height: height,
          width: width,
        });
      }
    };

    containerRef.current?.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, interval, theme, autosize, height, width]);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div id={container} style={{ height: `${height}px`, width: width }} />
    </div>
  );
}

export default memo(TradingViewWidget);