"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { generateMockMarketData, formatCurrency, generateChartData } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, PieChart, BarChart2, RefreshCw } from "lucide-react";

export default function PortfolioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  // Sample portfolio data
  const marketData = generateMockMarketData(8);
  const chartData = generateChartData(30, 'up');
  
  // Show loading 
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Overview</h1>
            <p className="text-muted-foreground">Track your investments and performance</p>
          </div>
          <div className="flex items-center">
            <button className="flex items-center text-sm font-medium px-3 py-1 rounded-md border border-border bg-card hover:bg-accent">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </button>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Total Portfolio Value</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(125432)}</h3>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <PieChart className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+12.4% all time</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Monthly Profit/Loss</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(3245)}</h3>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <BarChart2 className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-green-500 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+2.6% this month</span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm">Number of Assets</p>
                <h3 className="text-2xl font-bold mt-1">8</h3>
              </div>
              <span className="p-2 bg-primary/10 rounded-full text-primary">
                <PieChart className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-sm text-yellow-500 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              <span>Same as last month</span>
            </div>
          </div>
        </div>
        
        {/* Portfolio Chart */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Portfolio Performance</h2>
            <div className="flex items-center space-x-2">
              <button className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground">1M</button>
              <button className="text-xs font-medium px-3 py-1 rounded-md hover:bg-accent">3M</button>
              <button className="text-xs font-medium px-3 py-1 rounded-md hover:bg-accent">6M</button>
              <button className="text-xs font-medium px-3 py-1 rounded-md hover:bg-accent">1Y</button>
              <button className="text-xs font-medium px-3 py-1 rounded-md hover:bg-accent">ALL</button>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
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
                    `₹${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}`,
                    "Value"
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
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Asset Holdings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Assets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Asset</th>
                  <th className="px-4 py-3 text-left font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium">Avg. Buy Price</th>
                  <th className="px-4 py-3 text-left font-medium">Current Price</th>
                  <th className="px-4 py-3 text-left font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Profit/Loss</th>
                  <th className="px-4 py-3 text-left font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((asset, index) => {
                  const quantity = (Math.random() * 10).toFixed(4);
                  const avgBuyPrice = asset.price * (0.8 + Math.random() * 0.4);
                  const value = asset.price * parseFloat(quantity);
                  const profitLoss = value - avgBuyPrice * parseFloat(quantity);
                  const change = (profitLoss / (avgBuyPrice * parseFloat(quantity))) * 100;
                  
                  return (
                    <tr key={asset.symbol} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="ml-2">
                            <p className="font-medium">{asset.symbol}</p>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{quantity}</td>
                      <td className="px-4 py-4">{formatCurrency(avgBuyPrice)}</td>
                      <td className="px-4 py-4">{formatCurrency(asset.price)}</td>
                      <td className="px-4 py-4">{formatCurrency(value)}</td>
                      <td className="px-4 py-4">
                        <span className={profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatCurrency(profitLoss)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {change >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(change).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Bought BTC</p>
                    <p className="text-xs text-muted-foreground">May 5, 2025 - 10:45 AM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">0.025 BTC</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(1245)}</p>
                </div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 mr-3">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Sold ETH</p>
                    <p className="text-xs text-muted-foreground">May 3, 2025 - 3:30 PM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">1.5 ETH</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(4350)}</p>
                </div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Bought AAPL</p>
                    <p className="text-xs text-muted-foreground">May 2, 2025 - 11:15 AM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">10 AAPL</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(2300)}</p>
                </div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 mr-3">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-xs text-muted-foreground">April 28, 2025 - 2:00 PM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(25000)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}