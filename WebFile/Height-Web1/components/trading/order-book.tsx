// components/trading/order-book.tsx
"use client";

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface OrderBookProps {
  symbol: string;
}

interface Order {
  price: number;
  amount: number;
  total?: number;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderBook();
    const interval = setInterval(loadOrderBook, 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  const loadOrderBook = async () => {
    try {
      const response = await fetch(`/api/trading/orderbook?symbol=${symbol}`);
      const data = await response.json();
      
      // Calculate totals and percentages
      const maxBidTotal = Math.max(...data.bids.map((b: Order) => b.amount));
      const maxAskTotal = Math.max(...data.asks.map((a: Order) => a.amount));
      
      setBids(data.bids.slice(0, 10).map((bid: Order) => ({
        ...bid,
        total: (bid.amount / maxBidTotal) * 100
      })));
      
      setAsks(data.asks.slice(0, 10).reverse().map((ask: Order) => ({
        ...ask,
        total: (ask.amount / maxAskTotal) * 100
      })));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading order book:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  return (
    <div className="space-y-2">
      {/* Asks */}
      <div className="space-y-1">
        {asks.map((ask, i) => (
          <div key={i} className="relative flex justify-between text-xs">
            <Progress 
              value={ask.total} 
              className="absolute inset-0 h-full opacity-20"
              indicatorClassName="bg-red-500"
            />
            <span className="relative z-10 text-red-600">{ask.price.toFixed(2)}</span>
            <span className="relative z-10">{ask.amount.toFixed(6)}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="text-center py-2 border-y">
        <span className="text-sm font-medium">
          Spread: {((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)}
        </span>
      </div>

      {/* Bids */}
      <div className="space-y-1">
        {bids.map((bid, i) => (
          <div key={i} className="relative flex justify-between text-xs">
            <Progress 
              value={bid.total} 
              className="absolute inset-0 h-full opacity-20"
              indicatorClassName="bg-green-500"
            />
            <span className="relative z-10 text-green-600">{bid.price.toFixed(2)}</span>
            <span className="relative z-10">{bid.amount.toFixed(6)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}