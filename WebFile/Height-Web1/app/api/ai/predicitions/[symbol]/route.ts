// app/api/ai/predictions/[symbol]/route.ts
import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude-api';
import { marketDataService } from '@/lib/market-data';

// Enhanced prediction prompt with more technical analysis
const ENHANCED_PREDICTION_PROMPT = `
You are an expert financial analyst and trader for Heights trading platform with deep knowledge of technical analysis, market psychology, and quantitative trading strategies.

I need you to analyze the following data for {SYMBOL} and generate a comprehensive prediction.

Market Data:
{MARKET_DATA}

Your analysis should include:

1. **Price Prediction**: Provide specific price targets for:
   - Next 24 hours
   - Next 7 days  
   - Next 30 days

2. **Technical Analysis**:
   - Current trend (uptrend/downtrend/sideways)
   - Key support and resistance levels
   - Important moving averages (MA20, MA50, MA200)
   - RSI analysis (overbought/oversold conditions)
   - MACD signals
   - Volume analysis

3. **Market Sentiment**:
   - Overall market conditions
   - Fear & Greed index interpretation
   - Social sentiment if applicable

4. **Risk Assessment**:
   - Volatility analysis
   - Risk/reward ratio
   - Stop loss recommendations
   - Position sizing suggestions

5. **Trading Strategy**:
   - Entry points
   - Exit targets
   - Risk management approach

Format your response as valid JSON with this structure:
{
  "symbol": "string",
  "current_price": number,
  "predictions": {
    "next_24h": {
      "price": number,
      "change_percent": number,
      "confidence": number
    },
    "next_7d": {
      "price": number,
      "change_percent": number,
      "confidence": number
    },
    "next_30d": {
      "price": number,
      "change_percent": number,
      "confidence": number
    }
  },
  "technical_analysis": {
    "trend": "uptrend" | "downtrend" | "sideways",
    "support_levels": [number],
    "resistance_levels": [number],
    "rsi": number,
    "rsi_signal": "overbought" | "oversold" | "neutral",
    "macd_signal": "bullish" | "bearish" | "neutral",
    "volume_trend": "increasing" | "decreasing" | "stable"
  },
  "risk_assessment": {
    "volatility": "low" | "medium" | "high",
    "risk_score": number, // 1-10
    "stop_loss": number,
    "take_profit": number,
    "risk_reward_ratio": number
  },
  "recommendation": {
    "action": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
    "confidence": number, // 0.0-1.0
    "entry_price": number,
    "position_size": "small" | "medium" | "large",
    "reasoning": "string"
  },
  "timestamp": "ISO date string"
}

Base your analysis on the provided data, technical indicators, and market conditions. Be specific and actionable.
`;

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  
  try {
    // Get real-time market data
    let marketData;
    try {
      marketData = await marketDataService.getMarketData(symbol);
      if (!marketData) {
        throw new Error('Unable to fetch market data');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      return NextResponse.json({ 
        error: 'Unable to fetch market data for this symbol' 
      }, { status: 400 });
    }

    // Get order book for additional context
    const orderBook = await marketDataService.getOrderBook(symbol);
    
    // Get recent trades
    const recentTrades = await marketDataService.getRecentTrades(symbol, 20);
    
    // Calculate additional metrics
    const buyVolume = recentTrades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.quantity, 0);
    const sellVolume = recentTrades.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.quantity, 0);
    const volumeRatio = buyVolume / (buyVolume + sellVolume);
    
    // Prepare comprehensive market data for Claude
    const comprehensiveData = {
      current: marketData,
      orderBook: orderBook ? {
        bestBid: orderBook.bids[0]?.[0],
        bestAsk: orderBook.asks[0]?.[0],
        bidDepth: orderBook.bids.slice(0, 5),
        askDepth: orderBook.asks.slice(0, 5),
        spread: orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0]
      } : null,
      recentTrades: {
        count: recentTrades.length,
        buyVolume,
        sellVolume,
        volumeRatio,
        averagePrice: recentTrades.reduce((sum, t) => sum + t.price, 0) / recentTrades.length
      },
      marketMetrics: {
        priceChangePercent24h: marketData.change24hPercent,
        volumeChange24h: marketData.volume24h,
        priceRange24h: marketData.high24h - marketData.low24h,
        volatility: ((marketData.high24h - marketData.low24h) / marketData.price) * 100
      }
    };

    // Check if we have the API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set, returning basic prediction");
      return NextResponse.json(generateBasicPrediction(symbol, marketData));
    }

    try {
      // Prepare the prompt with real data
      const customizedPrompt = ENHANCED_PREDICTION_PROMPT
        .replace('{SYMBOL}', symbol)
        .replace('{MARKET_DATA}', JSON.stringify(comprehensiveData, null, 2));

      // Call Claude API for advanced prediction
      const completion = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        messages: [
          {
            role: "user", 
            content: customizedPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent predictions
      });

      // Extract and parse Claude's response
      let prediction;
      try {
        const responseText = completion.content[0].type === 'text' 
          ? (completion.content[0] as { text: string }).text 
          : '';
        
        prediction = JSON.parse(responseText);
        
        // Add metadata
        prediction.metadata = {
          model: "claude-3-opus",
          dataSource: "coinbase",
          analysisType: "comprehensive"
        };
        
        return NextResponse.json(prediction);
        
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        // Fall back to basic prediction
        return NextResponse.json(generateBasicPrediction(symbol, marketData));
      }
      
    } catch (claudeError) {
      console.error('Error calling Claude API:', claudeError);
      // Fall back to basic prediction
      return NextResponse.json(generateBasicPrediction(symbol, marketData));
    }
    
  } catch (error: any) {
    console.error(`Error in prediction API:`, error);
    return NextResponse.json({ 
      error: 'Failed to generate prediction',
      message: error.message 
    }, { status: 500 });
  }
}

// Generate a basic prediction when Claude is unavailable
function generateBasicPrediction(symbol: string, marketData: any) {
  const currentPrice = marketData.price;
  const volatility = ((marketData.high24h - marketData.low24h) / currentPrice) * 100;
  const trend = marketData.change24hPercent > 0 ? 'uptrend' : 'downtrend';
  
  // Simple technical analysis based on price action
  const rsi = 50 + (marketData.change24hPercent * 2); // Simplified RSI
  const support = marketData.low24h * 0.98;
  const resistance = marketData.high24h * 1.02;
  
  // Generate predictions based on current trend
  const trendMultiplier = trend === 'uptrend' ? 1 : -1;
  const next24h = currentPrice * (1 + (trendMultiplier * volatility * 0.01));
  const next7d = currentPrice * (1 + (trendMultiplier * volatility * 0.03));
  const next30d = currentPrice * (1 + (trendMultiplier * volatility * 0.05));
  
  return {
    symbol,
    current_price: currentPrice,
    predictions: {
      next_24h: {
        price: parseFloat(next24h.toFixed(2)),
        change_percent: parseFloat(((next24h - currentPrice) / currentPrice * 100).toFixed(2)),
        confidence: 0.7
      },
      next_7d: {
        price: parseFloat(next7d.toFixed(2)),
        change_percent: parseFloat(((next7d - currentPrice) / currentPrice * 100).toFixed(2)),
        confidence: 0.6
      },
      next_30d: {
        price: parseFloat(next30d.toFixed(2)),
        change_percent: parseFloat(((next30d - currentPrice) / currentPrice * 100).toFixed(2)),
        confidence: 0.5
      }
    },
    technical_analysis: {
      trend,
      support_levels: [support],
      resistance_levels: [resistance],
      rsi: Math.max(20, Math.min(80, rsi)),
      rsi_signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
      macd_signal: trend === 'uptrend' ? 'bullish' : 'bearish',
      volume_trend: 'stable'
    },
    risk_assessment: {
      volatility: volatility > 5 ? 'high' : volatility > 2 ? 'medium' : 'low',
      risk_score: Math.min(10, Math.round(volatility)),
      stop_loss: currentPrice * 0.95,
      take_profit: currentPrice * 1.05,
      risk_reward_ratio: 1.0
    },
    recommendation: {
      action: trend === 'uptrend' && rsi < 70 ? 'buy' : 'hold',
      confidence: 0.6,
      entry_price: currentPrice,
      position_size: volatility > 5 ? 'small' : 'medium',
      reasoning: 'Basic technical analysis based on price action and volume'
    },
    timestamp: new Date().toISOString(),
    metadata: {
      model: "basic",
      dataSource: "coinbase",
      analysisType: "simplified"
    }
  };
}