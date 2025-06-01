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
<<<<<<< HEAD
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
=======
    let stockData;
    
    // Try to get real stock data using Python script
    try {
      // Uncomment this when you have your Python script ready
      // const { stdout, stderr } = await execPromise(`python predict.py --symbol ${symbol} --data_only true`);
      // if (stderr && !stderr.includes('WARNING')) {
      //   throw new Error(`Error from Python script: ${stderr}`);
      // }
      // stockData = JSON.parse(stdout);
      
      // For now, we'll use simulated data
      stockData = getSimulatedStockData(symbol);
    } catch (execError) {
      console.warn('Error getting stock data, using simulated data:', execError);
      stockData = getSimulatedStockData(symbol);
    }
    
    // Check if we have the API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    
    try {
      // Replace placeholders in the prompt
      const customizedPrompt = PREDICTION_PROMPT
        .replace('{SYMBOL}', symbol)
        + '\n\n' + JSON.stringify(stockData, null, 2);
      
      // Call Claude API for prediction analysis
      const completion = await anthropic.messages.create({
        model: "claude-3-opus-20240229", // Or your preferred Claude model
        max_tokens: 1000,
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
        messages: [
          {
            role: "user", 
            content: customizedPrompt
          }
        ],
<<<<<<< HEAD
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
=======
        temperature: 0.2, // Lower temperature for more consistent predictions
      });
      
      // Extract Claude's JSON response
      let prediction;
      try {
        // Try to parse Claude's response as JSON
        const responseText = completion.content[0].type === 'text' ? (completion.content[0] as { text: string }).text : '';
        prediction = JSON.parse(responseText);
        
        // Ensure all required fields are present
        const requiredFields = [
          'symbol', 'current_price', 'predicted_price', 'change', 
          'percent_change', 'confidence', 'prediction_date'
        ];
        
        for (const field of requiredFields) {
          if (!(field in prediction)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
        
        return NextResponse.json(prediction);
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        console.log('Raw Claude response:', completion.content[0].type === 'text' ? (completion.content[0] as { text: string }).text : '');
        
        // Fall back to simulated prediction
        return NextResponse.json(getSimulatedPrediction(symbol));
      }
      
    } catch (claudeError) {
      console.error('Error calling Claude API for prediction:', claudeError);
      // Fall back to simulated prediction
      return NextResponse.json(getSimulatedPrediction(symbol));
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
    }
    
  } catch (error: any) {
    console.error(`Error in prediction API:`, error);
    return NextResponse.json({ 
<<<<<<< HEAD
      error: 'Failed to generate prediction',
      message: error.message 
=======
      error: error.message || 'Failed to generate prediction',
      fallback: getSimulatedPrediction(symbol)
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
    }, { status: 500 });
  }
}

<<<<<<< HEAD
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
=======
// Helper function to generate simulated stock data
function getSimulatedStockData(symbol: string) {
  // Create realistic looking historical data
  const basePrice = getBasePrice(symbol);
  const dates = getLast5TradingDays();
  
  const historicalData: HistoricalDataPoint[] = dates.map((date, index) => {
    // Create some random but plausible price movements
    const volatility = 0.02;  // 2% daily volatility
    const dayOffset = index === 0 ? 0 : (Math.random() * 2 - 1) * volatility * basePrice;
    const prevPrice: number = index === 0 ? basePrice : historicalData[index-1].close;
    const close: number = prevPrice + dayOffset;
    
    // Generate intraday range
    const high: number = close * (1 + Math.random() * 0.01);  // Up to 1% higher
    const low: number = close * (1 - Math.random() * 0.01);   // Up to 1% lower
    const open: number = low + Math.random() * (high - low);  // Random opening price within range
    
    // Random volume between 100k and 10M
    const volume: number = Math.floor(100000 + Math.random() * 9900000);
    
    return {
      date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    };
  });
  
  return {
    symbol,
    historical_data: historicalData,
    market_cap: getMarketCap(symbol, historicalData[historicalData.length-1].close),
    pe_ratio: 15 + Math.random() * 25,  // Random P/E between 15 and 40
    sector: getSector(symbol),
    current_price: historicalData[historicalData.length-1].close
  };
}

// Helper to get last 5 trading days
function getLast5TradingDays() {
  const dates = [];
  const today = new Date();
  let date = new Date(today);
  
  // Go back 5 trading days (excluding weekends)
  while (dates.length < 5) {
    date = new Date(date.setDate(date.getDate() - 1));
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.unshift(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}

// Helper to get base price for symbol
function getBasePrice(symbol: string) {
  // Return plausible starting prices based on symbol
  const prices: {[key: string]: number} = {
    'AAPL': 170,
    'MSFT': 320,
    'GOOGL': 130,
    'AMZN': 140,
    'META': 280,
    'TSLA': 200,
    'NFLX': 550,
    'NVDA': 400,
    'PYPL': 70,
    'INTC': 35
  };
  
  // Return price for symbol or random price
  return prices[symbol] || 50 + Math.random() * 200;
}

// Helper to get sector for symbol
function getSector(symbol: string) {
  const sectors: {[key: string]: string} = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Technology',
    'AMZN': 'Consumer Cyclical',
    'META': 'Technology',
    'TSLA': 'Automotive',
    'NFLX': 'Entertainment',
    'NVDA': 'Technology',
    'PYPL': 'Financial Services',
    'INTC': 'Technology'
  };
  
  return sectors[symbol] || 'Technology';
}

// Helper to calculate market cap
function getMarketCap(symbol: string, price: number) {
  const sharesOutstanding: {[key: string]: number} = {
    'AAPL': 16.5,  // billion
    'MSFT': 7.4,
    'GOOGL': 12.5,
    'AMZN': 10.2,
    'META': 2.8,
    'TSLA': 3.2,
    'NFLX': 0.44,
    'NVDA': 2.4,
    'PYPL': 1.1,
    'INTC': 4.2
  };
  
  const shares = sharesOutstanding[symbol] || 1 + Math.random() * 5;  // 1-6 billion shares
  return (shares * price).toFixed(2) + "B";
}

// Function to generate a simulated prediction
function getSimulatedPrediction(symbol: string) {
  const currentPrice = getBasePrice(symbol);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const percentChange = direction * (Math.random() * 3);  // -3% to +3%
  const change = currentPrice * (percentChange / 100);
  const predictedPrice = currentPrice + change;
  
  return {
    symbol,
    current_price: parseFloat(currentPrice.toFixed(2)),
    predicted_price: parseFloat(predictedPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    percent_change: parseFloat(percentChange.toFixed(2)),
    confidence: parseFloat((0.5 + Math.random() * 0.3).toFixed(2)),
    prediction_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    model_used: "simulated_prediction",
    prediction_type: "next_day_close",
    analysis: "This is a simulated prediction based on random data."
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
  };
}