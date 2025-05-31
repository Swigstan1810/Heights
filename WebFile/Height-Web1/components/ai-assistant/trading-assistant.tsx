"use client";

import { useState } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAssistant } from "./context";

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
 * TradingAssistant component
 * Trading-specific assistant features and prediction interface
 */
export function TradingAssistant() {
  const { addMessage, messages, isLoading } = useAssistant();
  const [predictionsVisible, setPredictionsVisible] = useState(false);
  const [activePrediction, setActivePrediction] = useState<TradingPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [symbol, setSymbol] = useState("AAPL");
  
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
        const prediction: TradingPrediction = {
          symbol: targetSymbol,
          current_price: 154.23,
          predicted_price: 159.87,
          change: 5.64,
          percent_change: 3.66,
          confidence: 0.78,
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
  
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-bold">Market Predictions</h3>
        <p className="text-sm text-muted-foreground">
          Get AI-powered price predictions for your favorite stocks and cryptocurrencies
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Input 
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (e.g. AAPL)"
          className="w-32"
        />
        <Button 
          onClick={() => {
            fetchPrediction(symbol);
            setPredictionsVisible(true);
          }}
          disabled={predictionLoading || !symbol}
        >
          {predictionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Get Prediction
        </Button>
      </div>
      
      {predictionsVisible && (
        <div className="bg-card border border-border rounded-lg p-4">
          {activePrediction ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg">{activePrediction.symbol}</h4>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded-full",
                  activePrediction.percent_change >= 0 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {activePrediction.percent_change >= 0 ? <ArrowUpRight className="h-3 w-3 inline mr-1" /> : <ArrowDownRight className="h-3 w-3 inline mr-1" />}
                  {Math.abs(activePrediction.percent_change).toFixed(2)}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-medium">${activePrediction.current_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Predicted Price</p>
                  <p className="font-medium">${activePrediction.predicted_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{activePrediction.prediction_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="font-medium">{(activePrediction.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Model: {activePrediction.model_used}</p>
                <p>Prediction Type: {activePrediction.prediction_type}</p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addMessage(`I'd like more information about the ${activePrediction.symbol} prediction showing a ${activePrediction.percent_change >= 0 ? 'positive' : 'negative'} ${Math.abs(activePrediction.percent_change).toFixed(2)}% change for ${activePrediction.prediction_date}`, "user");
                }}
              >
                Ask AI About This Prediction
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading prediction...</p>
            </div>
          )}
        </div>
      )}
      
      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-bold mb-4">Ask Our AI Assistant</h3>
        
        <div className="text-muted-foreground text-sm mb-4">
          <p>Try asking about:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Market trends and analysis</li>
            <li>Stock predictions and recommendations</li>
            <li>Trading strategies and tips</li>
            <li>Platform features and how-to guides</li>
          </ul>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['How do I connect my wallet?', 'What trading fees do you charge?', 'Explain the KYC process'].map(suggestion => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => addMessage(suggestion, "user")}
              disabled={isLoading}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
      
      {messages.length > 1 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-lg font-bold mb-4">Recent Conversation</h3>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {messages.slice(-4).filter(m => m.role !== "system").map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2",
                  message.role === "user" ? "justify-end" : ""
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "p-2 rounded text-sm max-w-[80%]",
                    message.role === "user" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}