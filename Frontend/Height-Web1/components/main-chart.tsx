"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { generateChartData } from "@/lib/utils";

type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export function MainChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("1M");
  const [trend, setTrend] = useState<"up" | "down" | "volatile">("up");
  
  // Generate data based on selected time range
  const getDays = (range: TimeRange) => {
    switch (range) {
      case "1D": return 24; // 24 hours
      case "1W": return 7;
      case "1M": return 30;
      case "3M": return 90;
      case "1Y": return 365;
      case "ALL": return 1095; // 3 years
      default: return 30;
    }
  };
  
  const data = generateChartData(getDays(activeRange), trend);
  
  // Get min and max for better visualization
  const minValue = Math.min(...data.map(d => d.value)) * 0.95;
  const maxValue = Math.max(...data.map(d => d.value)) * 1.05;
  
  // Calculate price change
  const priceChange = (data[data.length - 1].value - data[0].value) / data[0].value * 100;
  const isPositive = priceChange > 0;
  
  const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  
  return (
    <div className="w-full p-4 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">BTC/USD</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">$51,324.78</span>
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => {
                setActiveRange(range);
                // Change trend randomly on range change for demo
                setTrend(["up", "down", "volatile"][Math.floor(Math.random() * 3)] as "up" | "down" | "volatile");
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeRange === range 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-[300px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"} 
                  stopOpacity={0.3} 
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString(undefined, { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`,
                "Price"
              ]}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"}
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}