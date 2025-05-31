"use client";

import { useEffect, useState } from "react";
import { marketDataService, OrderBook as OrderBookType } from "@/lib/market-data";
import { Loader2 } from "lucide-react";

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderBook = async () => {
      setLoading(true);
      const data = await marketDataService.getOrderBook(symbol);
      setOrderBook(data);
      setLoading(false);
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  if (loading || !orderBook) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxVolume = Math.max(
    ...orderBook.bids.map(b => b[1]),
    ...orderBook.asks.map(a => a[1])
  );

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Bids */}
        <div>
          <h3 className="text-sm font-medium text-green-500 mb-2">BIDS</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs text-muted-foreground pb-2 border-b">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Total</span>
            </div>
            {orderBook.bids.slice(0, 15).map((bid, index) => (
              <div key={index} className="grid grid-cols-3 text-sm relative">
                <div
                  className="absolute inset-0 bg-green-500/10"
                  style={{ width: `${(bid[1] / maxVolume) * 100}%` }}
                />
                <span className="relative z-10">{bid[0].toFixed(2)}</span>
                <span className="relative z-10 text-right">{bid[1].toFixed(4)}</span>
                <span className="relative z-10 text-right">
                  {(bid[0] * bid[1]).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <h3 className="text-sm font-medium text-red-500 mb-2">ASKS</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs text-muted-foreground pb-2 border-b">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Total</span>
            </div>
            {orderBook.asks.slice(0, 15).map((ask, index) => (
              <div key={index} className="grid grid-cols-3 text-sm relative">
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{ width: `${(ask[1] / maxVolume) * 100}%` }}
                />
                <span className="relative z-10">{ask[0].toFixed(2)}</span>
                <span className="relative z-10 text-right">{ask[1].toFixed(4)}</span>
                <span className="relative z-10 text-right">
                  {(ask[0] * ask[1]).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}