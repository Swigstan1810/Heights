// components/trading/simple-price-chart.tsx
"use client";

import { useEffect, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

interface SimplePriceChartProps {
  symbol: string;
  height?: number;
  showIntervalTabs?: boolean;
  className?: string;
}

export default function SimplePriceChart({
  symbol,
  height = 400,
  showIntervalTabs = true,
  className = '',
}: SimplePriceChartProps) {
  const [interval, setInterval] = useState('1H');
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate mock data for the chart
  const generateMockData = (interval: string) => {
    const now = new Date();
    const data = [];
    let periods = 100;
    
    switch (interval) {
      case '1M': periods = 60; break;
      case '5M': periods = 100; break;
      case '15M': periods = 100; break;
      case '1H': periods = 100; break;
      case '1D': periods = 30; break;
      case '1W': periods = 12; break;
    }

    const basePrice = symbol.includes('BTC') ? 45000 : 
                     symbol.includes('ETH') ? 3000 : 
                     symbol.includes('SOL') ? 100 : 50;

    for (let i = periods; i >= 0; i--) {
      const time = new Date(now);
      
      switch (interval) {
        case '1M': time.setMinutes(time.getMinutes() - i); break;
        case '5M': time.setMinutes(time.getMinutes() - i * 5); break;
        case '15M': time.setMinutes(time.getMinutes() - i * 15); break;
        case '1H': time.setHours(time.getHours() - i); break;
        case '1D': time.setDate(time.getDate() - i); break;
        case '1W': time.setDate(time.getDate() - i * 7); break;
      }

      const volatility = 0.02;
      const trend = Math.sin(i / 20) * basePrice * 0.1;
      const randomWalk = (Math.random() - 0.5) * basePrice * volatility;
      const price = basePrice + trend + randomWalk;
      
      data.push({
        time: time.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: interval.includes('M') || interval === '1H' ? '2-digit' : undefined,
          minute: interval.includes('M') ? '2-digit' : undefined,
        }),
        price: parseFloat(price.toFixed(2)),
        volume: Math.random() * 1000000,
      });
    }
    
    return data;
  };

  useEffect(() => {
    setChartData(generateMockData(interval));
  }, [interval, symbol]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-green-500">
            Price: ${payload[0].value.toLocaleString()}
          </p>
          {payload[1] && (
            <p className="text-sm text-muted-foreground">
              Volume: ${(payload[1].value / 1000).toFixed(0)}k
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {showIntervalTabs && (
        <div className="absolute top-2 right-2 z-10">
          <Tabs value={interval} onValueChange={setInterval}>
            <TabsList className="h-8">
              <TabsTrigger value="1M" className="text-xs px-2 h-7">1M</TabsTrigger>
              <TabsTrigger value="5M" className="text-xs px-2 h-7">5M</TabsTrigger>
              <TabsTrigger value="15M" className="text-xs px-2 h-7">15M</TabsTrigger>
              <TabsTrigger value="1H" className="text-xs px-2 h-7">1H</TabsTrigger>
              <TabsTrigger value="1D" className="text-xs px-2 h-7">1D</TabsTrigger>
              <TabsTrigger value="1W" className="text-xs px-2 h-7">1W</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11 }}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11 }}
            tickMargin={10}
            tickFormatter={formatYAxis}
            domain={['dataMin * 0.99', 'dataMax * 1.01']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#colorPrice)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}