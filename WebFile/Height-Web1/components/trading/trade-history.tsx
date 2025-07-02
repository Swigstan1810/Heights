// components/trading/trade-history.tsx
"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface TradeHistoryProps {
  symbol?: string;
  userId?: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  fee: number;
  timestamp: string;
  status: string;
}

export function TradeHistory({ symbol, userId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, [symbol, userId]);

  const loadTrades = async () => {
    try {
      let url = '/api/trading/trades?';
      if (symbol) url += `symbol=${symbol}&`;
      if (userId) url += `userId=${userId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setTrades(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />;
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No trades yet
          </div>
        ) : (
          trades.map((trade) => (
            <div key={trade.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={trade.side === 'buy' ? 'default' : 'secondary'}
                    className={trade.side === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {trade.side.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{trade.symbol}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {trade.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Price: </span>
                  <span className="font-medium">${trade.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-medium">{trade.amount.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium">${trade.total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fee: </span>
                  <span className="font-medium">${trade.fee.toFixed(4)}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}