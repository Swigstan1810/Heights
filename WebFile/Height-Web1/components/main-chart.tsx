"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { generateChartData } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";

type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export function MainChart() {
  const [mounted, setMounted] = useState(false);
  const [activeRange, setActiveRange] = useState<TimeRange>("1M");
  const [trend, setTrend] = useState<"up" | "down" | "volatile">("up");
  const [data, setData] = useState<any[]>([]);
  const [priceChange, setPriceChange] = useState(0);
  const [isPositive, setIsPositive] = useState(true);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100000);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(51324.78);
  
  useEffect(() => {
    setMounted(true);
    
    const getDays = (range: TimeRange) => {
      switch (range) {
        case "1D": return 24;
        case "1W": return 7;
        case "1M": return 30;
        case "3M": return 90;
        case "1Y": return 365;
        case "ALL": return 1095;
        default: return 30;
      }
    };
    
    const loadData = () => {
      setIsLoading(true);
      setTimeout(() => {
        const chartData = generateChartData(getDays(activeRange), trend);
        setData(chartData);
        
        setMinValue(Math.min(...chartData.map(d => d.value)) * 0.95);
        setMaxValue(Math.max(...chartData.map(d => d.value)) * 1.05);
        
        const change = (chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100;
        setPriceChange(change);
        setIsPositive(change > 0);
        setCurrentPrice(chartData[chartData.length - 1].value);
        setIsLoading(false);
      }, 300);
    };
    
    loadData();
  }, [activeRange, trend]);
  
  const refreshData = () => {
    setTrend(["up", "down", "volatile"][Math.floor(Math.random() * 3)] as "up" | "down" | "volatile");
  };
  
  if (!mounted) {
    return (
      <div className="w-full p-4 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }
  
  const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  
  return (
    <motion.div 
      className="w-full p-4 rounded-lg border border-border bg-card/60 backdrop-blur-sm relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <motion.div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">BTC/USD</h3>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </motion.div>
            </motion.div>
            
            <div className="flex items-baseline space-x-2">
              <AnimatePresence mode="wait">
                <motion.span 
                  key={currentPrice}
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
              </AnimatePresence>
              
              <motion.span 
                className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 0.5,
                  times: [0, 0.5, 1],
                }}
              >
                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
              </motion.span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={refreshData}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
            
            <div className="flex items-center space-x-1">
              {ranges.map((range, index) => (
                <motion.button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeRange === range 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {range}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[300px] flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-8 w-8 text-primary" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="h-[300px] mt-6"
            >
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
                    cursor={{
                      stroke: 'hsl(var(--primary))',
                      strokeWidth: 1,
                      strokeDasharray: '5 5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Live indicator */}
        <motion.div 
          className="absolute top-4 right-4 flex items-center gap-2 text-xs text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-2 w-2 rounded-full bg-green-500" />
          LIVE
        </motion.div>
      </div>
    </motion.div>
  );
}

// Bitcoin icon component
function Bitcoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
    </svg>
  );
}