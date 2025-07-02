// app/api/ai/predictions/[symbol]/route.ts
// Environment variables (API keys, etc.) can be set in .env, .env.local, or .env.production
import { NextResponse } from 'next/server';
import { ultimateAnalyst } from '@/lib/enhanced-ai-system';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get cached prediction from Supabase
async function getCachedPrediction(symbol: string) {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('symbol', symbol)
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
  const includeNews = searchParams.get('news') !== 'false';
  
  try {
    // Check cache first
    const cachedPrediction = await getCachedPrediction(symbol);
    if (cachedPrediction) {
      console.log('Cache hit for', symbol);
      return NextResponse.json(cachedPrediction.prediction);
    }

    // Rate limiting check
    const ip = headers().get('x-forwarded-for') ?? 'anonymous';
    
    // Use ultimate analyst for predictions
    console.log(`🔮 Generating predictions for ${symbol} using Claude + Perplexity`);
    const analysis = await ultimateAnalyst.analyzeAsset(symbol, {
      includeNews,
      deepAnalysis: true
    });

    // Structure the prediction response
    const prediction = {
      symbol,
      timestamp: new Date().toISOString(),
      currentPrice: analysis.marketData.price,
      
      predictions: {
        shortTerm: {
          period: analysis.predictions.shortTerm.timeframe,
          direction: analysis.predictions.shortTerm.direction,
          targetPrice: analysis.predictions.shortTerm.targetPrice,
          confidence: analysis.predictions.shortTerm.confidence,
          changePercent: ((analysis.predictions.shortTerm.targetPrice - analysis.marketData.price) / analysis.marketData.price) * 100,
          reasoning: analysis.predictions.shortTerm.reasoning
        },
        longTerm: {
          period: analysis.predictions.longTerm.timeframe,
          direction: analysis.predictions.longTerm.direction,
          targetPrice: analysis.predictions.longTerm.targetPrice,
          confidence: analysis.predictions.longTerm.confidence,
          changePercent: ((analysis.predictions.longTerm.targetPrice - analysis.marketData.price) / analysis.marketData.price) * 100,
          reasoning: analysis.predictions.longTerm.reasoning
        }
      },
      
      technical_analysis: {
        rsi: analysis.predictions.technicalIndicators.rsi,
        macd: analysis.predictions.technicalIndicators.macd,
        movingAverages: analysis.predictions.technicalIndicators.movingAverages,
        support: analysis.predictions.technicalIndicators.support,
        resistance: analysis.predictions.technicalIndicators.resistance,
        trend: analysis.predictions.technicalIndicators.trend,
        
        signals: {
          overall: analysis.predictions.technicalIndicators.trend,
          strength: analysis.recommendation.confidence
        }
      },
      
      market_sentiment: {
        overall: analysis.marketData.sentiment,
        news_sentiment: analysis.newsAnalysis.sentimentScore > 0 ? 'positive' : 
                        analysis.newsAnalysis.sentimentScore < 0 ? 'negative' : 'neutral',
        sentiment_score: analysis.newsAnalysis.sentimentScore,
        market_impact: analysis.newsAnalysis.marketImpact
      },
      
      risk_assessment: {
        volatility: analysis.predictions.riskMetrics.volatility,
        risk_level: analysis.predictions.riskMetrics.riskLevel,
        stop_loss: analysis.predictions.riskMetrics.stopLoss,
        take_profit: analysis.predictions.riskMetrics.takeProfit,
        risk_reward_ratio: (
          (analysis.predictions.riskMetrics.takeProfit - analysis.marketData.price) /
          (analysis.marketData.price - analysis.predictions.riskMetrics.stopLoss)
        ).toFixed(2)
      },
      
      trading_signals: [
        {
          type: analysis.recommendation.action,
          reason: analysis.recommendation.reasoning,
          strength: analysis.recommendation.confidence,
          entry_points: analysis.recommendation.entryPoints,
          exit_points: analysis.recommendation.exitPoints
        },
        ...analysis.newsAnalysis.tradingSignals.map(signal => ({
          type: 'news_based',
          reason: signal,
          strength: 0.7
        }))
      ],
      
      ai_consensus: {
        confidence: analysis.aiConsensus.combinedConfidence,
        perplexity_analysis: analysis.aiConsensus.perplexityView,
        claude_analysis: analysis.aiConsensus.claudeView
      },
      
      metadata: {
        data_sources: ['claude-3.5-sonnet', 'perplexity-llama-3.1'],
        analysis_depth: 'comprehensive',
        includes_real_time_data: true,
        last_updated: new Date().toISOString()
      }
    };

    // Store prediction in cache
    await storePrediction({
      symbol,
      prediction,
      created_at: new Date().toISOString()
    });

    return NextResponse.json(prediction);
  
  } catch (err: unknown) {
    console.error('Prediction API error:', err);
    
    // Return a structured error response
    return NextResponse.json({ 
      error: 'Failed to generate prediction',
      message: err instanceof Error ? err.message : 'An unknown error occurred',
      symbol,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Check if the symbol is valid',
        'Try again in a few moments',
        'Contact support if the issue persists'
      ]
    }, { status: 500 });
  }
}