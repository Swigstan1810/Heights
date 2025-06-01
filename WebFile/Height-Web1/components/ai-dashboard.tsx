// components/ai-dashboard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Bot, BarChart2, ArrowUpRight, ArrowDownRight, AlertCircle, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAIAssistant } from "@/components/ai-assistant/enhanced-assistant";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Example data - in a real application, this would come from your API
const predictionData = [
  { symbol: "AAPL", currentPrice: 182.58, predictedPrice: 187.94, change: 5.36, percentChange: 2.94, confidence: 0.81 },
  { symbol: "MSFT", currentPrice: 404.21, predictedPrice: 418.56, change: 14.35, percentChange: 3.55, confidence: 0.77 },
  { symbol: "GOOGL", currentPrice: 174.12, predictedPrice: 170.09, change: -4.03, percentChange: -2.31, confidence: 0.68 },
  { symbol: "AMZN", currentPrice: 178.23, predictedPrice: 184.97, change: 6.74, percentChange: 3.78, confidence: 0.72 },
];

// Simulated historical accuracy data
const accuracyData = [
  { month: "Jan", accuracy: 0.72 },
  { month: "Feb", accuracy: 0.68 },
  { month: "Mar", accuracy: 0.75 },
  { month: "Apr", accuracy: 0.77 },
  { month: "May", accuracy: 0.82 },
  { month: "Jun", accuracy: 0.79 },
];

export default function AIDashboard() {
  const [selectedTab, setSelectedTab] = useState("assistant");

  const handleTradeRecommendation = (recommendation: any) => {
    console.log('Trade recommendation received:', recommendation);
    // Handle trade recommendations from the AI assistant
    // You could show a notification, open a trade modal, etc.
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Trading Assistant</h1>
            <p className="text-muted-foreground mt-2">Market insights and predictions powered by Claude AI</p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced AI Assistant Panel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Claude-Powered AI Assistant</CardTitle>
                  <CardDescription>Get real-time trading insights and market analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <EnhancedAIAssistant onTradeRecommendation={handleTradeRecommendation} />
                </CardContent>
              </Card>

              {/* Predictions & Analytics */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Prediction Accuracy</CardTitle>
                    <CardDescription>Historical model performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={accuracyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                          <YAxis
                            domain={[0.5, 1]}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                          />
                          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                          <Tooltip
                            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Accuracy"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                            dot={{ r: 3 }}
                            fill="url(#accuracyGradient)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Based on 500+ historical predictions</span>
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Top Predictions</CardTitle>
                    <CardDescription>AI-powered market forecasts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {predictionData.slice(0, 3).map((prediction) => (
                      <div
                        key={prediction.symbol}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">{prediction.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            ${prediction.currentPrice.toFixed(2)} → ${prediction.predictedPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div
                            className={cn(
                              "flex items-center font-medium",
                              prediction.percentChange >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {prediction.percentChange >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                            )}
                            {Math.abs(prediction.percentChange).toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">{(prediction.confidence * 100).toFixed(0)}% confidence</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>All Predictions</CardTitle>
                <CardDescription>View all available market predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionData.map((prediction) => (
                    <div
                      key={prediction.symbol}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-lg">{prediction.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: ${prediction.currentPrice.toFixed(2)} | Predicted: ${prediction.predictedPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div
                          className={cn(
                            "flex items-center font-medium text-lg",
                            prediction.percentChange >= 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {prediction.percentChange >= 0 ? (
                            <ArrowUpRight className="h-5 w-5 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 mr-1" />
                          )}
                          {Math.abs(prediction.percentChange).toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence: {(prediction.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Model Analytics</CardTitle>
                <CardDescription>Performance metrics for prediction models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Accuracy</h3>
                      <p className="text-3xl font-bold">76%</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Predictions Made</h3>
                      <p className="text-3xl font-bold">1,248</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Confidence</h3>
                      <p className="text-3xl font-bold">74%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Model Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4">Model</th>
                            <th className="text-left py-3 px-4">Accuracy</th>
                            <th className="text-left py-3 px-4">MAE</th>
                            <th className="text-left py-3 px-4">Predictions</th>
                            <th className="text-left py-3 px-4">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="py-3 px-4">claude-3-opus</td>
                            <td className="py-3 px-4">82%</td>
                            <td className="py-3 px-4">0.86</td>
                            <td className="py-3 px-4">523</td>
                            <td className="py-3 px-4">Today</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-3 px-4">gradient_boosting</td>
                            <td className="py-3 px-4">78%</td>
                            <td className="py-3 px-4">1.24</td>
                            <td className="py-3 px-4">489</td>
                            <td className="py-3 px-4">Yesterday</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="py-3 px-4">random_forest</td>
                            <td className="py-3 px-4">68%</td>
                            <td className="py-3 px-4">2.36</td>
                            <td className="py-3 px-4">236</td>
                            <td className="py-3 px-4">2 days ago</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Prediction History</CardTitle>
                <CardDescription>View past predictions and their accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Symbol</th>
                          <th className="text-left py-3 px-4">Prediction</th>
                          <th className="text-left py-3 px-4">Actual</th>
                          <th className="text-left py-3 px-4">Accuracy</th>
                          <th className="text-left py-3 px-4">Model</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4">2024-04-28</td>
                          <td className="py-3 px-4">AAPL</td>
                          <td className="py-3 px-4">$178.42</td>
                          <td className="py-3 px-4">$182.58</td>
                          <td className="py-3 px-4 text-green-600">97.7%</td>
                          <td className="py-3 px-4">claude-3-opus</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4">2024-04-28</td>
                          <td className="py-3 px-4">MSFT</td>
                          <td className="py-3 px-4">$415.20</td>
                          <td className="py-3 px-4">$404.21</td>
                          <td className="py-3 px-4 text-yellow-600">92.7%</td>
                          <td className="py-3 px-4">claude-3-opus</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4">2024-04-27</td>
                          <td className="py-3 px-4">GOOGL</td>
                          <td className="py-3 px-4">$168.32</td>
                          <td className="py-3 px-4">$174.12</td>
                          <td className="py-3 px-4 text-yellow-600">93.3%</td>
                          <td className="py-3 px-4">random_forest</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4">2024-04-27</td>
                          <td className="py-3 px-4">AMZN</td>
                          <td className="py-3 px-4">$185.64</td>
                          <td className="py-3 px-4">$178.23</td>
                          <td className="py-3 px-4 text-yellow-600">91.8%</td>
                          <td className="py-3 px-4">random_forest</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4">2024-04-26</td>
                          <td className="py-3 px-4">TSLA</td>
                          <td className="py-3 px-4">$168.89</td>
                          <td className="py-3 px-4">$170.18</td>
                          <td className="py-3 px-4 text-green-600">99.2%</td>
                          <td className="py-3 px-4">claude-3-opus</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}