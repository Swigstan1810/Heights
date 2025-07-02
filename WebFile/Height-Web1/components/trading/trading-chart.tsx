// components/trading/trading-chart.tsx
"use client";

import { TradingViewChart } from './tradingview-chart';

interface TradingChartProps {
  symbol: string;
  interval: string;
}

export function TradingChart({ symbol, interval }: TradingChartProps) {
  return (
    <div className="w-full h-full">
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        height={500}
        autosize={true}
        style="candles"
        range="6M"
        hide_side_toolbar={false}
        hide_top_toolbar={false}
        save_image={true}
      />
    </div>
  );
}