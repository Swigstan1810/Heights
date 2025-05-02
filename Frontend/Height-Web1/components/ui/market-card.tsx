"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Activity } from "lucide-react";
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type MarketCardProps = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline?: number[];
  type: "crypto" | "stock" | "index";
  className?: string;
};

export function MarketCard({
  symbol,
  name,
  price,
  change24h,
  sparkline,
  type,
  className,
}: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine color based on positive or negative change
  const isPositive = change24h > 0;
  const colorClass = isPositive ? "text-green-500" : "text-red-500";
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn("h-full", className)}
    >
      <Card className="h-full overflow-hidden bg-card/60 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              {type === "crypto" && (
                <div className="h-6 w-6 rounded-full bg-chart-1/20 flex items-center justify-center">
                  <Activity size={14} className="text-chart-1" />
                </div>
              )}
              {type === "stock" && (
                <div className="h-6 w-6 rounded-full bg-chart-2/20 flex items-center justify-center">
                  <Activity size={14} className="text-chart-2" />
                </div>
              )}
              {type === "index" && (
                <div className="h-6 w-6 rounded-full bg-chart-3/20 flex items-center justify-center">
                  <Activity size={14} className="text-chart-3" />
                </div>
              )}
              {symbol}
            </CardTitle>
            <div className={cn("flex items-center text-sm font-medium", colorClass)}>
              {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {formatPercentage(change24h)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{name}</p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-xl font-semibold">
            {formatCurrency(price, type === "crypto" ? "USD" : "INR")}
          </div>
          
          {sparkline && sparkline.length > 0 && (
            <div className="h-12 mt-3">
              <svg width="100%" height="100%" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id={`gradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? "rgba(34, 197, 94, 0)" : "rgba(239, 68, 68, 0)"}
                    />
                  </linearGradient>
                </defs>
                {sparkline && (
                  <>
                    <path
                      d={generateSparklinePath(sparkline, true)}
                      fill={`url(#gradient-${symbol})`}
                      stroke="none"
                    />
                    <path
                      d={generateSparklinePath(sparkline, false)}
                      fill="none"
                      stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                      strokeWidth="1.5"
                    />
                  </>
                )}
              </svg>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10
            }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <button className="w-full py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Trade Now
            </button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Helper function to generate SVG path for sparkline
function generateSparklinePath(data: number[], isFilled: boolean): string {
  if (!data || data.length === 0) return "";
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const xStep = 100 / (data.length - 1);
  
  const points = data.map((value, index) => {
    const x = index * xStep;
    const y = 40 - ((value - min) / range) * 30;
    return `${x},${y}`;
  });
  
  let path = `M0,${40 - ((data[0] - min) / range) * 30} ` + points.map(point => `L${point}`).join(" ");
  
  if (isFilled) {
    path += ` L100,40 L0,40 Z`;
  }
  
  return path;
}