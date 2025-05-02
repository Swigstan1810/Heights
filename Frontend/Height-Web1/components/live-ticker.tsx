"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { symbol: "BTC/USD", price: 51324.78, change: 2.43 },
    { symbol: "ETH/USD", price: 2897.65, change: 1.27 },
    { symbol: "SOL/USD", price: 112.34, change: 3.51 },
    { symbol: "NIFTY", price: 24156.25, change: -0.42 },
    { symbol: "SENSEX", price: 79845.12, change: -0.31 },
    { symbol: "AAPL", price: 186.42, change: 0.78 },
    { symbol: "MSFT", price: 421.75, change: 1.03 },
    { symbol: "GOOGL", price: 169.83, change: -0.25 },
  ]);
  
  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prevItems => 
        prevItems.map(item => {
          // Random small change (-0.5% to +0.5%)
          const priceChange = item.price * (Math.random() * 0.01 - 0.005);
          const newPrice = item.price + priceChange;
          
          // Accumulate change
          const newChange = item.change + (priceChange / item.price) * 100;
          
          return {
            ...item,
            price: Number(newPrice.toFixed(2)),
            change: Number(newChange.toFixed(2)),
          };
        })
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="w-full overflow-hidden bg-background/50 backdrop-blur-sm border-y border-border">
      <div className="flex items-center py-1 px-4">
        <span className="text-xs font-semibold mr-4 text-muted-foreground">LIVE</span>
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex space-x-6"
            animate={{ x: [0, -2000] }}
            transition={{
              x: {
                duration: 35,
                ease: "linear",
                repeat: Infinity,
              }
            }}
          >
            {[...items, ...items].map((item, index) => (
              <div key={`${item.symbol}-${index}`} className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-sm font-medium">{item.symbol}</span>
                <AnimatePresence>
                  <motion.span 
                    key={`${item.symbol}-${item.price}`}
                    initial={{ opacity: 0.5, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm"
                  >
                    {item.price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </motion.span>
                </AnimatePresence>
                <span className={cn(
                  "text-xs flex items-center",
                  item.change >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {item.change >= 0 
                    ? <ChevronUp className="h-3 w-3" /> 
                    : <ChevronDown className="h-3 w-3" />
                  }
                  {Math.abs(item.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}