"use client";

import { MarketData } from "@/lib/market-data";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketStatsProps {
  symbol: string;
  marketData: MarketData | null;
}

export function MarketStats({ symbol, marketData }: MarketStatsProps) {
  if (!marketData) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = marketData.change24hPercent >= 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {symbol.split(':')[1]}
            <span className={`text-lg flex items-center ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {isPositive ? "+" : ""}{marketData.change24hPercent.toFixed(2)}%
            </span>
          </h2>
          <p className="text-3xl font-bold mt-1">
            ${marketData.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-sm text-muted-foreground">24h High</p>
            <p className="font-medium">${marketData.high24h.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">24h Low</p>
            <p className="font-medium">${marketData.low24h.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">24h Volume</p>
            <p className="font-medium">
              ${(marketData.volume24h / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}