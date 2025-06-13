// app/api/ai/analyze/route.ts
import { NextResponse } from 'next/server';
import { financialAnalyst } from '@/lib/enhanced-ai-system';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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
  const maxRequests = 20; // Lower for comprehensive analysis

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
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
          }
        }
      );
    }

    const body = await request.json();
    const { 
      asset, 
      timeframe = '1 year',
      analysisType = 'comprehensive',
      shortTermPeriod = '1 week',
      longTermPeriod = '6 months',
      usePerplexity = true,
      useClaude = true,
      userId = 'anonymous'
    } = body;
    
    if (!asset) {
      return NextResponse.json({ error: 'Asset symbol is required' }, { status: 400 });
    }

    console.log(`[Financial Analysis] Analyzing ${asset} for ${ip}`);

    // Perform comprehensive analysis
    const analysis = await financialAnalyst.analyzeAsset(asset, timeframe, {
      usePerplexity,
      useClaude,
      shortTermPeriod,
      longTermPeriod
    });

    // Store analysis in Supabase
    await supabase
      .from('ai_financial_analyses')
      .insert({
        user_id: userId,
        asset,
        timeframe,
        analysis: analysis,
        created_at: new Date().toISOString(),
        metadata: {
          ip,
          analysisType,
          executionTime: Date.now() - startTime,
          models: {
            claude: useClaude,
            perplexity: usePerplexity
          }
        }
      });

    // Return comprehensive analysis
    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        executionTime: Date.now() - startTime,
        rateLimitRemaining: remaining,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '20',
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
  const timeframe = searchParams.get('timeframe') || '1 year';
  
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
        for await (const update of financialAnalyst.streamAnalysis(asset, timeframe)) {
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