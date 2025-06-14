// app/api/ai/predictions/[symbol]/route.ts - Real-time Predictions
import { NextResponse } from 'next/server';
import { financialAnalyst } from '@/lib/enhanced-ai-system';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fetch real technical indicators
async function fetchTechnicalIndicators(symbol: string) {
  try {
    // Taapi.io API for technical indicators (free tier available)
    if (process.env.TAAPI_API_KEY) {
      const indicators = ['rsi', 'macd', 'bbands', 'sma', 'ema'];
      const promises = indicators.map(indicator =>
        fetch(`https://api.taapi.io/${indicator}?secret=${process.env.TAAPI_API_KEY}&exchange=binance&symbol=${symbol}/USDT&interval=1h`)
          .then(res => res.json())
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      return {
        rsi: results[0]?.value || null,
        macd: results[1] || null,
        bollinger: results[2] || null,
        sma: results[3]?.value || null,
        ema: results[4]?.value || null
      };
    }

    // Fallback to Alpha Vantage
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );
      const data = await response.json();
      
      return {
        rsi: data['Technical Analysis: RSI'] 
          ? (Object.values(data['Technical Analysis: RSI']) as any[])[0]['RSI'] 
          : null
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    return null;
  }
}

// Fetch historical price data
async function fetchHistoricalData(symbol: string, days: number = 30) {
  try {
    // CoinGecko API for crypto
    if (['BTC', 'ETH', 'SOL', 'MATIC'].includes(symbol.toUpperCase())) {
      const coinId = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'MATIC': 'matic-network'
      }[symbol.toUpperCase()];

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      const data = await response.json();
      
      return {
        prices: data.prices,
        volumes: data.total_volumes,
        marketCaps: data.market_caps
      };
    }

    // Yahoo Finance for stocks
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${days}d&interval=1d`
    );
    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      return {
        prices: result.indicators.quote[0].close.map((price: number, index: number) => [
          result.timestamp[index] * 1000,
          price
        ]),
        volumes: result.indicators.quote[0].volume
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

// Get cached prediction from Supabase
async function getCachedPrediction(symbol: string, timeframe: string) {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes cache
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching cached prediction:', error);
    return null;
  }
}

// Store prediction in Supabase
async function storePrediction(prediction: any) {
  try {
    const { error } = await supabase
      .from('ai_predictions')
      .insert(prediction);
    
    if (error) console.error('Error storing prediction:', error);
  } catch (error) {
    console.error('Error with Supabase:', error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '1 year';
  const analysisDepth = searchParams.get('depth') || 'comprehensive';
  const includeNews = searchParams.get('news') !== 'false';
  
  try {
    // Check cache first
    const cachedPrediction = await getCachedPrediction(symbol, timeframe);
    if (cachedPrediction) {
      console.log('Cache hit for', symbol);
      return NextResponse.json(cachedPrediction.prediction);
    }

    // Rate limiting check
    const ip = headers().get('x-forwarded-for') ?? 'anonymous';
    
    // Use enhanced AI system for comprehensive prediction/analysis
    const analysis = await financialAnalyst.analyzeAsset(symbol, timeframe, {
      usePerplexity: true,
      useClaude: true,
      shortTermPeriod: '1 week',
      longTermPeriod: '6 months'
    });

    // Structure the enhanced prediction (extract relevant fields for backward compatibility)
    const enhancedPrediction = {
      symbol,
      timestamp: new Date().toISOString(),
      timeframe,
      currentPrice: analysis?.technicalAnalysis?.movingAverages?.sma20 || null,
      predictions: analysis?.predictions || {},
      technical_analysis: analysis?.technicalAnalysis || {},
      trend_analysis: analysis?.technicalAnalysis?.overallSignal ? { trend: analysis.technicalAnalysis.overallSignal } : {},
      sentiment_analysis: analysis?.marketSentiment || {},
      risk_assessment: analysis?.recommendation?.riskWarning ? { risk_warning: analysis.recommendation.riskWarning } : {},
      trading_signals: analysis?.recommendation ? [{
        type: analysis.recommendation.action,
        reason: analysis.recommendation.reasoning,
        strength: analysis.metadata?.confidence || 0.75
      }] : [],
      metadata: analysis?.metadata || {}
    };

    // Store prediction in Supabase
    await storePrediction({
      symbol,
      timeframe,
      prediction: enhancedPrediction,
      created_at: new Date().toISOString()
    });

    return NextResponse.json(enhancedPrediction);
  
  } catch (err: unknown) {
    console.error('Prediction API error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'An unknown error occurred',
      symbol,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function calculatePerformance(priceHistory: any[], days: number): string {
  if (!priceHistory || priceHistory.length < days) return 'N/A';
  
  const currentPrice = priceHistory[priceHistory.length - 1][1];
  const pastPrice = priceHistory[priceHistory.length - days] ? priceHistory[priceHistory.length - days][1] : priceHistory[0][1];
  
  const change = ((currentPrice - pastPrice) / pastPrice) * 100;
  return change.toFixed(2);
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally'];
  const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function calculateOverallSentiment(newsContext: any[]): string {
  if (!newsContext || newsContext.length === 0) return 'neutral';
  
  const sentiments = newsContext.map(news => news.sentiment);
  const positiveCount = sentiments.filter(s => s === 'positive').length;
  const negativeCount = sentiments.filter(s => s === 'negative').length;
  
  if (positiveCount > negativeCount) return 'bullish';
  if (negativeCount > positiveCount) return 'bearish';
  return 'neutral';
}

function getSentimentDistribution(newsContext: any[]): any {
  if (!newsContext || newsContext.length === 0) {
    return { positive: 0, negative: 0, neutral: 0 };
  }
  
  const sentiments = newsContext.map(news => news.sentiment);
  return {
    positive: sentiments.filter(s => s === 'positive').length,
    negative: sentiments.filter(s => s === 'negative').length,
    neutral: sentiments.filter(s => s === 'neutral').length
  };
}

function generateTradingSignals(context: any): any[] {
  const signals = [];
  
  // RSI-based signals
  if (context.technicalIndicators?.rsi) {
    if (context.technicalIndicators.rsi < 30) {
      signals.push({
        type: 'buy',
        indicator: 'RSI',
        reason: 'Oversold condition',
        strength: 0.8
      });
    } else if (context.technicalIndicators.rsi > 70) {
    signals.push({
        type: 'sell',
        indicator: 'RSI',
        reason: 'Overbought condition',
        strength: 0.8
      });
    }
  }
  
  // Trend-based signals
  if (context.trendAnalysis?.trend === 'uptrend' && context.trendAnalysis.trendStrength > 5) {
    signals.push({
      type: 'buy',
      indicator: 'Trend',
      reason: 'Strong uptrend detected',
      strength: 0.7
    });
  }
  
  return signals;
}