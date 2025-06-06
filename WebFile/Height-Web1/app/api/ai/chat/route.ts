// app/api/ai/chat/route.ts - Complete integration with all APIs
import { NextResponse } from 'next/server';
import { tradingAgent } from '@/lib/claude-api';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute

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

// Enhanced market data fetchers using your APIs
async function fetchCoinbaseData(symbol: string) {
  try {
    const coinbaseSymbol = symbol.replace('CRYPTO:', '') + '-USD';
    
    // Using Coinbase Advanced API (public endpoints)
    const [tickerResponse, statsResponse] = await Promise.all([
      fetch(`https://api.exchange.coinbase.com/products/${coinbaseSymbol}/ticker`),
      fetch(`https://api.exchange.coinbase.com/products/${coinbaseSymbol}/stats`)
    ]);

    if (tickerResponse.ok && statsResponse.ok) {
      const ticker = await tickerResponse.json();
      const stats = await statsResponse.json();
      
      return {
        source: 'coinbase',
        symbol,
        price: parseFloat(ticker.price),
        change24h: parseFloat(ticker.price) - parseFloat(stats.open),
        changePercent: ((parseFloat(ticker.price) - parseFloat(stats.open)) / parseFloat(stats.open)) * 100,
        volume24h: parseFloat(stats.volume),
        high24h: parseFloat(stats.high),
        low24h: parseFloat(stats.low),
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Coinbase API error:', error);
  }
  return null;
}

async function fetchAlphaVantageData(symbol: string) {
  const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  if (!API_KEY) return null;

  try {
    const cleanSymbol = symbol.replace('NSE:', '').replace('.NS', '');
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (quote && quote['05. price']) {
        return {
          source: 'alphavantage',
          symbol,
          price: parseFloat(quote['05. price']),
          change24h: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
  }
  return null;
}

async function fetchPolygonData(symbol: string) {
  const API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
  if (!API_KEY) return null;

  try {
    const cleanSymbol = symbol.replace('NSE:', '').replace('.NS', '');
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${cleanSymbol}/prev?adjusted=true&apikey=${API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          source: 'polygon',
          symbol,
          price: result.c,
          change24h: result.c - result.o,
          changePercent: ((result.c - result.o) / result.o) * 100,
          volume: result.v,
          high: result.h,
          low: result.l,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('Polygon API error:', error);
  }
  return null;
}

async function fetchNewsData(symbols: string[]) {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
  
  const articles = [];
  
  try {
    // Try NewsAPI first
    if (NEWS_API_KEY) {
      const query = symbols.length > 0 ? symbols.join(' OR ') : 'cryptocurrency finance market';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          articles.push(...data.articles.slice(0, 3).map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source.name,
            sentiment: analyzeSentiment(article.title + ' ' + (article.description || ''))
          })));
        }
      }
    }
    
    // Try GNews as backup
    if (articles.length === 0 && GNEWS_API_KEY) {
      const query = symbols.length > 0 ? symbols[0] : 'finance';
      const response = await fetch(
        `https://gnews.io/api/v4/search?q=${query}&lang=en&country=us&max=3&apikey=${GNEWS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles) {
          articles.push(...data.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source?.name || 'GNews',
            sentiment: analyzeSentiment(article.title + ' ' + (article.description || ''))
          })));
        }
      }
    }
  } catch (error) {
    console.error('News API error:', error);
  }
  
  return articles;
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = [
    'gain', 'rise', 'surge', 'bull', 'positive', 'growth', 'rally', 'breakthrough',
    'profit', 'increase', 'up', 'high', 'strong', 'boost', 'advance', 'soar'
  ];
  
  const negativeWords = [
    'fall', 'drop', 'decline', 'bear', 'negative', 'crash', 'plunge', 'loss',
    'decrease', 'down', 'low', 'weak', 'tumble', 'slump', 'dive', 'collapse'
  ];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

async function getMarketData(symbols: string[]) {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      // Route to appropriate API based on symbol type
      if (symbol.startsWith('CRYPTO:') || ['BTC', 'ETH', 'SOL', 'MATIC'].includes(symbol)) {
        const coinbaseData = await fetchCoinbaseData(symbol.startsWith('CRYPTO:') ? symbol : `CRYPTO:${symbol}`);
        if (coinbaseData) return coinbaseData;
      } else {
        // Try stock APIs
        const alphaData = await fetchAlphaVantageData(symbol);
        if (alphaData) return alphaData;
        
        const polygonData = await fetchPolygonData(symbol);
        if (polygonData) return polygonData;
      }
      
      // Fallback to mock data
      return generateMockData(symbol);
    })
  );
  
  return results.filter(Boolean);
}

function generateMockData(symbol: string) {
  const basePrice = symbol.includes('BTC') ? 45000 : 
                   symbol.includes('ETH') ? 3000 :
                   symbol.includes('SOL') ? 100 : 
                   symbol.includes('RELIANCE') ? 2800 : 150;
  
  const change = (Math.random() - 0.5) * basePrice * 0.02;
  
  return {
    source: 'mock',
    symbol,
    price: basePrice + change,
    change24h: change,
    changePercent: (change / basePrice) * 100,
    volume24h: Math.random() * 1000000000,
    high24h: basePrice + Math.abs(change) * 1.5,
    low24h: basePrice - Math.abs(change) * 1.5,
    timestamp: new Date().toISOString()
  };
}

async function storeConversation(userId: string, message: string, response: string, metadata: any) {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        user_message: message,
        ai_response: response,
        metadata,
        created_at: new Date().toISOString()
      });
    
    if (error) console.error('Error storing conversation:', error);
  } catch (error) {
    console.error('Supabase error:', error);
  }
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
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history = [], userId = 'anonymous', analysisType = 'comprehensive' } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log(`[AI Chat] Processing request from ${ip}, remaining: ${remaining}`);

    // Check if this is a market-related query
    const isMarketQuery = /\b(analyze|analysis|predict|prediction|market|price|buy|sell|trade|trading|BTC|ETH|SOL|MATIC|RELIANCE|TCS|NIFTY)\b/i.test(message);
    
    let response: string;
    let metadata: any = {
      model: 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString(),
      rateLimitRemaining: remaining,
      responseTime: 0
    };

    try {
      if (isMarketQuery) {
        // Extract potential symbols from the message
        const symbolMatches = message.match(/\b([A-Z]{2,5})\b/g) || [];
        const symbols = Array.from(new Set(symbolMatches)) as string[];
        
        console.log(`[AI Chat] Market query detected for symbols: ${symbols.join(', ')}`);

        // Fetch real-time market data and news in parallel
        const [marketResults, newsResults] = await Promise.all([
          getMarketData(symbols.length > 0 ? symbols : ['BTC', 'ETH']),
          fetchNewsData(symbols.length > 0 ? symbols : ['cryptocurrency', 'finance'])
        ]);

        // Create enhanced context for Claude
        const marketContext = marketResults.map(data => 
          `${data.symbol}: $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%) - Source: ${data.source}`
        ).join('\n');

        const newsContext = newsResults.slice(0, 3).map(news => 
          `• ${news.title} (${news.sentiment}) - ${news.source}`
        ).join('\n');

        const enhancedMessage = `
User Question: ${message}

REAL-TIME MARKET DATA:
${marketContext}

RECENT NEWS:
${newsContext}

Please provide a comprehensive analysis based on this real-time data. Include:
1. Current market sentiment and key drivers
2. Technical analysis with specific price levels
3. Risk assessment and opportunities
4. Actionable trading recommendations with entry/exit points
5. Time horizons (short-term vs long-term outlook)

Be specific with price levels and percentages. Include appropriate disclaimers.`;

        response = await tradingAgent.analyzeMarket(symbols[0] || 'BTC', analysisType);

        metadata = {
          ...metadata,
          symbols,
          marketData: marketResults,
          newsData: newsResults,
          analysisPerformed: true,
          dataSourcesUsed: Array.from(new Set(marketResults.map(r => r.source))) as string[],
          enhancedContext: true
        };

      } else {
        // Regular chat
        const contextMessage = history?.length > 0 
          ? `Previous conversation context:\n${history.slice(-3).map((h: any) => `${h.role}: ${h.content}`).join('\n')}\n\nCurrent question: ${message}`
          : message;

        response = await tradingAgent.chatWithAgent(contextMessage);
        metadata.contextProvided = history?.length > 0;
      }

      metadata.responseTime = Date.now() - startTime;

      // Store conversation in Supabase
      await storeConversation(userId, message, response, metadata);

      // Enhanced response
      const enhancedResponse = {
        message: response,
        metadata,
        suggestions: generateSuggestions(message),
        relatedSymbols: extractSymbols(response),
        confidence: calculateConfidence(response, isMarketQuery)
      };

      return NextResponse.json(enhancedResponse);

    } catch (apiError) {
      console.error('Claude API error:', apiError);
      
      // Log error to Supabase
      await supabase
        .from('ai_errors')
        .insert({
          error: apiError instanceof Error ? apiError.message : 'Unknown Claude API error',
          context: { message, userId, ip },
          created_at: new Date().toISOString()
        });
      
      // Provide intelligent fallback response
      const fallbackResponse = generateIntelligentFallback(message, isMarketQuery);
      
      return NextResponse.json({ 
        message: fallbackResponse,
        metadata: {
          source: "fallback_handler",
          error: "Claude API temporarily unavailable",
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }
  } catch (error) {
    console.error(`API error: ${error}`);
    return NextResponse.json({ 
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

// Helper functions
function generateSuggestions(userMessage: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('btc') || lowerMessage.includes('bitcoin')) {
    return [
      'Analyze Ethereum vs Bitcoin',
      'Show me BTC support and resistance levels',
      'What factors affect Bitcoin price?'
    ];
  } else if (lowerMessage.includes('market') || lowerMessage.includes('trading')) {
    return [
      'Show me top cryptocurrency gainers today',
      'Analyze current market sentiment',
      'What are the best trading opportunities now?'
    ];
  } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('investment')) {
    return [
      'How should I diversify my portfolio?',
      'Analyze my risk exposure',
      'What are good long-term investments?'
    ];
  } else {
    return [
      'Analyze current market trends',
      'Show me trading opportunities',
      'What should I know about crypto markets?'
    ];
  }
}

function extractSymbols(text: string): string[] {
  const symbolRegex = /\b([A-Z]{2,5})\b/g;
  const matches = text.match(symbolRegex) || [];
  return Array.from(new Set(matches)) as string[];
}

function calculateConfidence(response: string, isMarketQuery: boolean): number {
  let confidence = 0.7;
  
  // Boost confidence for market queries with data
  if (isMarketQuery) confidence += 0.1;
  
  // Adjust based on response content
  if (response.includes('data shows') || response.includes('according to')) confidence += 0.15;
  if (response.includes('strong') || response.includes('clear')) confidence += 0.1;
  if (response.includes('uncertain') || response.includes('might')) confidence -= 0.1;
  if (response.includes('DISCLAIMER') || response.includes('not financial advice')) confidence += 0.05; // Good practice
  if (response.length > 500) confidence += 0.05; // Detailed responses
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

function generateIntelligentFallback(message: string, isMarketQuery: boolean): string {
  if (isMarketQuery) {
    return `I understand you're asking about market analysis for specific assets. While I'm currently experiencing some technical difficulties accessing real-time data, I can share some general insights:

**Market Analysis Approach:**
• **Technical Analysis**: Look for support/resistance levels, moving averages, and volume patterns
• **Fundamental Factors**: Consider news events, regulatory changes, and market sentiment
• **Risk Management**: Always use stop-losses and position sizing appropriate to your risk tolerance

**Key Trading Principles:**
• Never invest more than you can afford to lose
• Diversify your portfolio across different asset classes
• Stay updated with market news and trends
• Consider both short-term and long-term perspectives

**Next Steps:**
• Check multiple sources for current market data
• Consider consulting with financial advisors for personalized advice
• Use demo accounts to practice trading strategies

*Please note: This is educational information only and not personalized financial advice. Always do your own research before making investment decisions.*

Would you like me to explain any specific trading concepts or strategies?`;
  } else {
    return `I'm here to help with your trading and investment questions! While I'm experiencing some technical difficulties at the moment, I can still assist with:

• **Trading Education**: Explaining concepts, strategies, and market terminology
• **Risk Management**: Guidelines for safe trading practices
• **Platform Features**: How to use Heights trading tools effectively
• **General Market Insights**: Broad market trends and analysis approaches

Feel free to ask about any trading topic, and I'll provide helpful educational information based on established financial principles.

*Disclaimer: All information provided is for educational purposes only and should not be considered personalized financial advice.*`;
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  
  if (!message) {
    return NextResponse.json({ error: 'Message parameter required' }, { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // Check if this is a market query
        const isMarketQuery = /\b(analyze|market|price|BTC|ETH)\b/i.test(message);
        
        if (isMarketQuery) {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Fetching real-time market data...' 
          })}\n\n`));
          
          // Get market data
          const symbols = message.match(/\b([A-Z]{2,5})\b/g) || ['BTC'];
          const marketData = await getMarketData(symbols.slice(0, 2));
          
          // Send market data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'market_data', 
            data: marketData 
          })}\n\n`));
          
          // Send analysis status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Generating AI analysis...' 
          })}\n\n`));
        }
        
        // Stream the AI response
        await tradingAgent.streamResponse(message, (token: string) => {
          const data = `data: ${JSON.stringify({ 
            type: 'token', 
            token, 
            timestamp: Date.now() 
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        });
        
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}