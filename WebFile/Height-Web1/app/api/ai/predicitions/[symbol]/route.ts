// app/api/ai/predictions/[symbol]/route.ts (with Claude integration)

import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude-api';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Claude prompt for stock predictions
const PREDICTION_PROMPT = `
You are a financial analyst assistant for Heights trading platform. 
I need you to analyze the following financial data for the stock symbol: {SYMBOL}.

Based on this data, generate a price prediction for tomorrow.
Your analysis should include:
1. A predicted price (be precise with a number)
2. Confidence level (as a percentage)
3. Brief justification for your prediction

Format your response as valid JSON with these fields:
- symbol: the stock symbol
- current_price: the current price from the data
- predicted_price: your prediction for tomorrow's price
- change: the calculated difference between current and predicted
- percent_change: the percentage change
- confidence: your confidence level as a decimal (0.0-1.0)
- prediction_date: tomorrow's date in ISO format
- model_used: "claude-analysis"
- prediction_type: "next_day_close"
- analysis: brief explanation for the prediction

Only return the JSON object, nothing else.
`;

interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  
  try {
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
        messages: [
          {
            role: "user", 
            content: customizedPrompt
          }
        ],
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
    }
    
  } catch (error: any) {
    console.error(`Error in prediction API:`, error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate prediction',
      fallback: getSimulatedPrediction(symbol)
    }, { status: 500 });
  }
}

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
  };
}