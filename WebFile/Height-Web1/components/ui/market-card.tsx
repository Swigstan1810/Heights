"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatPercentage } from "@/lib/utils";

interface MarketCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
  type: "crypto" | "stock" | "index";
}

export function MarketCard({ symbol, name, price, change24h, sparkline, type }: MarketCardProps) {
  const router = useRouter();
  const isPositive = change24h >= 0;
  
  // Generate SVG path for sparkline
  const generateSparklinePath = () => {
    if (!sparkline || sparkline.length === 0) return "";
    
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1; // Avoid division by zero
    
    // Scale the values to fit within the SVG height (0-40)
    const scaledValues = sparkline.map(value => 40 - ((value - min) / range) * 40);
    
    // Create the SVG path
    const width = 100;
    const segmentWidth = width / (scaledValues.length - 1);
    
    let path = `M 0,${scaledValues[0]}`;
    
    for (let i = 1; i < scaledValues.length; i++) {
      path += ` L ${i * segmentWidth},${scaledValues[i]}`;
    }
    
    return path;
  };
  
  // Determine color based on change
  const colorClass = isPositive ? "text-green-500" : "text-red-500";
  const strokeColor = isPositive ? "stroke-green-500" : "stroke-red-500";
  
  return (
    <div 
      className="p-4 rounded-lg border border-border hover:border-primary/50 bg-card transition-all cursor-pointer"
      onClick={() => router.push(`/markets/${type}/${symbol.toLowerCase()}`)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="font-semibold">{symbol}</div>
        <div className={cn("flex items-center text-sm font-medium", colorClass)}>
          {isPositive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {formatPercentage(change24h)}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{name}</p>
      
      <div className="mt-3 flex items-end justify-between">
        <div className="text-lg font-bold">₹{price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</div>
        
        <div className="h-10 w-24 relative">
          <svg width="100" height="40" viewBox="0 0 100 40" className="overflow-visible">
            <path
              d={generateSparklinePath()}
              fill="none"
              className={strokeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}