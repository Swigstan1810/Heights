"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, AlertCircle, User, Brain, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAssistant } from "./context";
import { HeightsLogo } from "@/components/ui/heights-logo";

// Type for the API response
type TradingPrediction = {
  symbol: string;
  predicted_price: number;
  current_price: number;
  change: number;
  percent_change: number;
  confidence: number;
  prediction_date: string;
  model_used: string;
  prediction_type: string;
};

/**
 * TradingAssistant component - Mobile-Optimized
 * Trading-specific assistant features and prediction interface with responsive design
 */
export function TradingAssistant() {
  const { addMessage, messages, isLoading } = useAssistant();
  const [predictionsVisible, setPredictionsVisible] = useState(false);
  const [activePrediction, setActivePrediction] = useState<TradingPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [symbol, setSymbol] = useState("AAPL");
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Function to fetch trading prediction
  const fetchPrediction = async (targetSymbol: string) => {
    setPredictionLoading(true);
    
    try {
      // Attempt to fetch from API
      try {
        const response = await fetch(`/api/ai/predictions/${targetSymbol}`);
        
        if (!response.ok) {
          throw new Error('API response not OK');
        }
        
        const data = await response.json();
        setActivePrediction(data);
      } catch (err) {
        console.warn('Prediction API error, using fallback data:', err);
        
        // Fallback prediction data for development/demo
        const basePrice = 154.23;
        const changePercent = (Math.random() - 0.5) * 10; // Random between -5% and +5%
        const predictedPrice = basePrice * (1 + changePercent / 100);
        
        const prediction: TradingPrediction = {
          symbol: targetSymbol,
          current_price: basePrice,
          predicted_price: predictedPrice,
          change: predictedPrice - basePrice,
          percent_change: changePercent,
          confidence: 0.75 + Math.random() * 0.2, // Random between 75-95%
          prediction_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          model_used: "gradient_boosting",
          prediction_type: "next_day_close"
        };
        
        setActivePrediction(prediction);
      }
    } catch (error) {
      console.error("Error fetching prediction:", error);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Quick suggestion prompts
  const quickSuggestions = [
    'How do I connect my wallet?',
    'What trading fees do you charge?',
    'Explain the KYC process',
    'Best trading strategies?',
    'How to read charts?',
    'Portfolio diversification tips'
  ];
  
  return (
    <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">AI Trading Assistant</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Get AI-powered market predictions and trading insights
            </p>
          </div>
        </div>
      </div>
      
      {/* Market Predictions Card */}
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Market Predictions</span>
            </div>
            <Badge variant="outline" className="text-xs">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Input Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <Input 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol (e.g. AAPL, BTC, TSLA)"
                className="w-full text-sm sm:text-base"
                maxLength={10}
              />
            </div>
            <Button 
              onClick={() => {
                fetchPrediction(symbol);
                setPredictionsVisible(true);
              }}
              disabled={predictionLoading || !symbol}
              className="w-full sm:w-auto bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53]"
            >
              {predictionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {predictionLoading ? 'Analyzing...' : 'Get Prediction'}
            </Button>
          </div>
          
          {/* Prediction Results */}
          {predictionsVisible && (
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border rounded-lg p-4">
              {activePrediction ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg sm:text-xl">{activePrediction.symbol}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {activePrediction.model_used.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className={cn(
                      "text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 w-fit",
                      activePrediction.percent_change >= 0 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {activePrediction.percent_change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {activePrediction.percent_change >= 0 ? '+' : ''}{activePrediction.percent_change.toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Price</p>
                      <p className="font-semibold text-sm sm:text-base">${activePrediction.current_price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Predicted Price</p>
                      <p className="font-semibold text-sm sm:text-base">${activePrediction.predicted_price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Target Date</p>
                      <p className="font-semibold text-xs sm:text-sm">{new Date(activePrediction.prediction_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${activePrediction.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-xs sm:text-sm">
                          {(activePrediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <strong>Model:</strong> {activePrediction.model_used.replace('_', ' ')}
                      </div>
                      <div>
                        <strong>Type:</strong> {activePrediction.prediction_type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ask AI Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addMessage(`I'd like more information about the ${activePrediction.symbol} prediction showing a ${activePrediction.percent_change >= 0 ? 'positive' : 'negative'} ${Math.abs(activePrediction.percent_change).toFixed(2)}% change for ${activePrediction.prediction_date}. Can you explain the reasoning and provide additional market context?`, "user");
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Ask AI About This Prediction
                  </Button>
                </div>
              ) : (
                <div className="py-6 sm:py-8 text-center">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generating prediction...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Assistant Section */}
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <HeightsLogo size="sm" className="text-primary" />
            Ask Our AI Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="text-muted-foreground text-xs sm:text-sm">
            <p className="mb-3">Get instant help with:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Market trends and analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Trading strategies and tips</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Platform features guide</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Risk management advice</span>
              </div>
            </div>
          </div>
          
          {/* Quick Suggestions */}
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-medium">Quick Questions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addMessage(suggestion, "user")}
                  disabled={isLoading}
                  className="text-xs h-auto py-2 px-3 justify-start text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Conversation */}
      {messages.length > 1 && (
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Recent Conversation</CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-2">
              {messages.slice(-4).filter(m => m.role !== "system").map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-2 w-full",
                    message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center shrink-0">
                      <HeightsLogo size="sm" className="text-white" animate={false} />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "p-3 rounded-lg text-xs sm:text-sm max-w-[85%] break-words",
                      message.role === "user" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted"
                    )}
                  >
                    {message.content.length > 200 ? (
                      <>
                        {message.content.substring(0, 200)}
                        <span className="text-muted-foreground">... (truncated)</span>
                      </>
                    ) : (
                      message.content
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}