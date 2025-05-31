"use client";

import { useState, useEffect } from "react";
import { useHeightsTheme } from "@/components/theme-provider";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarketQuote, HistoricalDataPoint } from "@/lib/market-data-api";

interface MarketDataWidgetProps {
  symbol: string;
  type: "stock" | "crypto";
  showHistorical?: boolean;
  interval: string;
  limit?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function MarketDataWidget({
  symbol,
  type,
  showHistorical = true,
  interval,
  limit = 30,
  className,
  children
}: MarketDataWidgetProps) {
  const [data, setData] = useState<MarketQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useHeightsTheme();
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `/api/market/${symbol}?type=${type}&historical=${showHistorical}&interval=${interval}&limit=${limit}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const marketData = await response.json();
      
      if (!marketData.success) {
        throw new Error(marketData.error || 'Failed to fetch market data');
      }
      
      setData(marketData.quote);
      
      if (showHistorical && marketData.historical) {
        setHistoricalData(marketData.historical);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching market data');
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount and when props change
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every minute (60000ms)
    const intervalId = setInterval(fetchData, 60000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [symbol, type, showHistorical, interval, limit]);
  
  // Format currency based on type
  const formatCurrency = (value: number) => {
    if (type === 'crypto') {
      // For crypto, show more decimals for small values
      return value < 1 
        ? `$${value.toFixed(6)}` 
        : value < 1000 
          ? `$${value.toFixed(2)}` 
          : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // For stocks, standard 2 decimal places
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-2 rounded-md shadow-sm">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            {symbol}
            {type === 'crypto' && <span className="ml-1 text-sm text-muted-foreground">USD</span>}
          </CardTitle>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {error ? (
          <div className="flex items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-4" 
                onClick={fetchData}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : loading && !data ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data ? (
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <div className="text-2xl font-bold">
                {formatCurrency(data.price)}
              </div>
              <div className={cn(
                "flex items-center text-sm font-medium",
                data.changePercent >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.changePercent >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {formatCurrency(data.change)} ({Math.abs(data.changePercent).toFixed(2)}%)
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open</span>
                <span>{formatCurrency(data.open)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prev Close</span>
                <span>{formatCurrency(data.previousClose)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High</span>
                <span>{formatCurrency(data.high)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low</span>
                <span>{formatCurrency(data.low)}</span>
              </div>
            </div>
            
            {showHistorical && historicalData && historicalData.length > 0 && (
              <motion.div 
                className="h-[120px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <defs>
                      <linearGradient id={`gradientArea-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={data.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                          stopOpacity={0.3} 
                        />
                        <stop 
                          offset="95%" 
                          stopColor={data.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                          stopOpacity={0} 
                        />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        // Format date based on interval
                        const date = new Date(value);
                        if (interval === '1d') {
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } else if (interval === '1w') {
                          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                        } else {
                          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }
                      }}
                    />
                    <YAxis 
                      domain={['dataMin', 'dataMax']} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      width={35}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke={data.changePercent >= 0 ? "#22c55e" : "#ef4444"} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        ) : null}
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        {data && (
          <div className="w-full flex justify-between items-center">
            <div>
              {data.source === 'simulated' ? 'Simulated Data' : data.exchange}
            </div>
            <div>
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}