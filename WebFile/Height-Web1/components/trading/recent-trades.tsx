"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RecentTradesProps {
  symbol: string;
}

interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: number;
}

export function RecentTrades({ symbol }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Generate mock trades for demo
    const mockTrades: Trade[] = Array.from({ length: 50 }, (_, i) => ({
      id: `trade-${i}`,
      price: 51234.56 + (Math.random() - 0.5) * 100,
      quantity: Math.random() * 2,
      side: Math.random() > 0.5 ? "buy" : "sell",
      timestamp: Date.now() - i * 1000 * Math.random() * 60,
    }));

    setTrades(mockTrades);
  }, [symbol]);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Trades</h3>
      </div>
      
      <div className="overflow-y-auto max-h-[500px]">
        <table className="w-full">
          <thead className="text-sm text-muted-foreground sticky top-0 bg-card">
            <tr className="border-b">
              <th className="text-left p-2">Price</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-right p-2">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b hover:bg-muted/50">
                <td className={`p-2 ${
                  trade.side === "buy" ? "text-green-500" : "text-red-500"
                }`}>
                  <span className="flex items-center">
                    {trade.side === "buy" ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    ₹{trade.price.toFixed(2)}
                  </span>
                </td>
                <td className="text-right p-2">
                  {trade.quantity.toFixed(4)}
                </td>
                <td className="text-right p-2 text-muted-foreground">
                  {formatDistanceToNow(trade.timestamp, { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}