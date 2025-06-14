// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { aiOrchestrator } from '@/lib/services/enhanced-ai-orchestrator';
import { ChatContext } from '@/types/ai-types';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration
const RATE_LIMITS = {
  anonymous: { requests: 10, period: 60 * 1000 }, // 10 requests per minute
  authenticated: { requests: 30, period: 60 * 1000 }, // 30 requests per minute
  premium: { requests: 100, period: 60 * 1000 } // 100 requests per minute
};

// In-memory rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number; tier: keyof typeof RATE_LIMITS }>();

function checkRateLimit(identifier: string, tier: keyof typeof RATE_LIMITS = 'anonymous'): { 
  success: boolean; 
  remaining: number; 
  resetTime: number 
} {
  const now = Date.now();
  const limit = RATE_LIMITS[tier];

  const current = requestCounts.get(identifier);
  
  if (!current || now > current.resetTime) {
    const resetTime = now + limit.period;
    requestCounts.set(identifier, { count: 1, resetTime, tier });
    return { success: true, remaining: limit.requests - 1, resetTime };
  }
  
  if (current.count >= limit.requests) {
    return { success: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { success: true, remaining: limit.requests - current.count, resetTime: current.resetTime };
}

async function getUserTier(userId?: string): Promise<keyof typeof RATE_LIMITS> {
  if (!userId) return 'anonymous';
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (profile?.subscription_tier === 'premium') return 'premium';
    return 'authenticated';
  } catch {
    return 'authenticated';
  }
}

async function logConversation(
  userId: string | undefined,
  message: string,
  response: any,
  metadata: any
) {
  try {
    await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId || 'anonymous',
        user_message: message,
        ai_response: JSON.stringify(response),
        metadata: {
          ...metadata,
          ip: headers().get('x-forwarded-for') || 'unknown',
          user_agent: headers().get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Failed to log conversation:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      message, 
      history = [], 
      userId,
      preferences = {},
      sessionId = `session_${Date.now()}`
    } = body;
    
    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 1000 characters allowed.' },
        { status: 400 }
      );
    }

    // Rate limiting
    const userTier = await getUserTier(userId);
    const identifier = userId || headers().get('x-forwarded-for') || 'anonymous';
    const { success, remaining, resetTime } = checkRateLimit(identifier, userTier);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          rateLimitReset: new Date(resetTime).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS[userTier].requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    console.log(`[AI Chat] Processing request for ${userTier} user, remaining: ${remaining}`);

    // Add structured and usePerplexity flags to preferences
    const enhancedPreferences = {
      ...preferences,
      structured: preferences.structured ?? true,
      usePerplexity: preferences.usePerplexity ?? true
    };
    
    // Add conversationPurpose if present
    const conversationPurpose = preferences.intent || preferences.conversationPurpose || undefined;

    // Build chat context
    const context: ChatContext = {
      userId,
      sessionId,
      messageHistory: history,
      preferences: enhancedPreferences,
      activeAnalyses: {},
      ...(conversationPurpose ? { conversationPurpose } : {})
    };

    // Process query with enhanced AI orchestrator
    const response = await aiOrchestrator.processQuery(message, context, {
      useCache: true,
      maxRetries: 3
    });

    // Log conversation for analytics
    await logConversation(userId, message, response, {
      processingTime: Date.now() - startTime,
      rateLimitRemaining: remaining,
      userTier,
      classification: response.metadata.classification
    });

    // Return enhanced response
    return NextResponse.json({
      ...response,
      responseTime: Date.now() - startTime,
      rateLimitRemaining: remaining
    }, {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMITS[userTier].requests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
        'Cache-Control': 'private, no-cache',
        'X-Response-Time': String(Date.now() - startTime)
      }
    });

  } catch (error) {
    let userIdForError = 'unknown';
    try {
      const body = await request.json();
      userIdForError = body.userId || 'unknown';
    } catch {}
    console.error('AI Chat API error:', error, { requestBody: await request.text?.(), userContext: { headers: headers(), userId: userIdForError } });
    // Log error for debugging
    await supabase
      .from('ai_errors')
      .insert({
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        context: {
          endpoint: '/api/ai/chat',
          timestamp: new Date().toISOString(),
          ip: headers().get('x-forwarded-for'),
          requestBody: await request.text?.(),
          userId: userIdForError
        }
      });
    return NextResponse.json(
      { 
        error: 'Sorry, our AI assistant is temporarily unavailable. Please try again in a few moments.',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Something went wrong. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  const userId = searchParams.get('userId');
  
  if (!message) {
    return NextResponse.json({ error: 'Message parameter required' }, { status: 400 });
  }

  // Rate limiting for streaming
  const userTier = await getUserTier(userId || undefined);
  const identifier = userId || headers().get('x-forwarded-for') || 'anonymous';
  const { success } = checkRateLimit(identifier, userTier);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded for streaming' },
      { status: 429 }
    );
  }

  // Create ReadableStream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start',
          message: 'Starting AI analysis...',
          timestamp: Date.now()
          })}\n\n`));
          
        // Stream the processing
        for await (const update of aiOrchestrator.streamProcessQuery(message)) {
          const data = `data: ${JSON.stringify({ 
            type: 'update',
            data: update,
            timestamp: Date.now() 
          })}\n\n`;
          
          controller.enqueue(encoder.encode(data));
        }
        
        // Send completion
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
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Health check endpoint
export async function HEAD() {
  try {
    // Quick health check
    const testResponse = await aiOrchestrator.processQuery('health check', undefined, {
      useCache: false,
      maxRetries: 1
    });
    
    return new Response(null, {
      status: testResponse ? 200 : 503,
      headers: {
        'X-Service-Status': testResponse ? 'healthy' : 'degraded',
        'Cache-Control': 'no-cache'
      }
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Service-Status': 'unhealthy',
        'Cache-Control': 'no-cache'
      }
    });
  }
}