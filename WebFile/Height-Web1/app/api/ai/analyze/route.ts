// app/api/ai/analyze/route.ts
import { NextResponse } from 'next/server';
import { ultimateAnalyst } from '@/lib/enhanced-ai-system';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Environment variables (API keys, URLs, etc.) can be set in .env, .env.local, or .env.production

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // Higher limit for analysis

  const current = requestCounts.get(ip);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }
  
  if (current.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  
  current.count++;
  return { success: true, remaining: maxRequests - current.count };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = headers().get('x-forwarded-for') ?? headers().get('x-real-ip') ?? 'anonymous';
    const { success, remaining } = checkRateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
          }
        }
      );
    }

    const body = await request.json();
    const { 
      asset, 
      userId = 'anonymous'
    } = body;
    
    if (!asset) {
      return NextResponse.json({ error: 'Asset symbol is required' }, { status: 400 });
    }

    console.log(`[AI Analysis] Analyzing ${asset} with Claude + Perplexity`);

    // Perform comprehensive analysis with the ultimate analyst
    const analysis = await ultimateAnalyst.analyzeAsset(asset, {
      includeNews: true,
      deepAnalysis: true
    });

    // Store analysis in Supabase
    try {
      await supabase
        .from('ai_financial_analyses')
        .insert({
          user_id: userId,
          asset,
          analysis: {
            marketData: analysis.marketData,
            predictions: analysis.predictions,
            recommendation: analysis.recommendation,
            newsAnalysis: analysis.newsAnalysis,
            aiConsensus: analysis.aiConsensus
          },
          created_at: new Date().toISOString(),
          metadata: {
            ip,
            executionTime: Date.now() - startTime,
            models: {
              claude: true,
              perplexity: true
            }
          }
        });
    } catch (dbError) {
      console.error('Failed to store analysis:', dbError);
    }

    // Return comprehensive analysis
    return NextResponse.json({
      success: true,
      analysis: {
        asset: analysis.asset,
        timestamp: analysis.timestamp,
        
        // Market Data
        currentPrice: analysis.marketData.price,
        priceChange: {
          amount: analysis.marketData.change24h,
          percentage: analysis.marketData.changePercent
        },
        volume: analysis.marketData.volume,
        marketCap: analysis.marketData.marketCap,
        sentiment: analysis.marketData.sentiment,
        
        // Predictions
        shortTermPrediction: {
          direction: analysis.predictions.shortTerm.direction,
          targetPrice: analysis.predictions.shortTerm.targetPrice,
          confidence: analysis.predictions.shortTerm.confidence,
          timeframe: analysis.predictions.shortTerm.timeframe,
          reasoning: analysis.predictions.shortTerm.reasoning
        },
        longTermPrediction: {
          direction: analysis.predictions.longTerm.direction,
          targetPrice: analysis.predictions.longTerm.targetPrice,
          confidence: analysis.predictions.longTerm.confidence,
          timeframe: analysis.predictions.longTerm.timeframe,
          reasoning: analysis.predictions.longTerm.reasoning
        },
        
        // Technical Indicators
        technicalIndicators: analysis.predictions.technicalIndicators,
        riskMetrics: analysis.predictions.riskMetrics,
        
        // News Analysis
        newsHeadlines: analysis.newsAnalysis.headlines.slice(0, 5),
        newsSentiment: {
          score: analysis.newsAnalysis.sentimentScore,
          impact: analysis.newsAnalysis.marketImpact
        },
        keyEvents: analysis.newsAnalysis.keyEvents,
        tradingSignals: analysis.newsAnalysis.tradingSignals,
        
        // AI Recommendation
        recommendation: {
          action: analysis.recommendation.action,
          confidence: analysis.recommendation.confidence,
          reasoning: analysis.recommendation.reasoning,
          entryPoints: analysis.recommendation.entryPoints,
          exitPoints: analysis.recommendation.exitPoints
        },
        
        // AI Consensus
        aiConsensus: analysis.aiConsensus
      },
      metadata: {
        executionTime: Date.now() - startTime,
        rateLimitRemaining: remaining,
        timestamp: new Date().toISOString(),
        dataSources: ['claude-3.5-sonnet', 'perplexity-llama-3.1']
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(remaining),
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Financial analysis error:', error);
    
    // Log error to Supabase
    await supabase
      .from('ai_errors')
      .insert({
        error: error instanceof Error ? error.message : 'Unknown error',
        context: { 
          endpoint: '/api/ai/analyze',
          body: request.body
        },
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({ 
      error: 'Failed to analyze asset',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

// Streaming endpoint for real-time updates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset');
  
  if (!asset) {
    return NextResponse.json({ error: 'Asset parameter required' }, { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'status', 
          message: `Starting analysis for ${asset}...` 
        })}\n\n`));

        // Stream analysis updates
        for await (const update of ultimateAnalyst.streamAnalysis(asset)) {
          const data = `data: ${JSON.stringify({ 
            type: 'update', 
            data: update,
            timestamp: Date.now() 
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        
        // Send completion signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          timestamp: Date.now() 
        })}\n\n`));
        
        controller.close();
        
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Streaming failed',
          timestamp: Date.now() 
        })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}