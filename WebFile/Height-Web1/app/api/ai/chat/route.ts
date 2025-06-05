// app/api/ai/chat/route.ts - Enhanced with Real-time Data
import { NextResponse } from 'next/server';
import { tradingAgent } from '@/lib/claude-api';
import { headers } from 'next/headers';
import { ratelimit } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with runtime check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Rate limiting
const rateLimiter = ratelimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Real-time market data fetchers
async function fetchRealTimeMarketData(symbol: string) {
  try {
    // Multiple data sources for reliability
    const promises = [];

    // 1. Coinbase API for crypto
    if (['BTC', 'ETH', 'SOL', 'MATIC'].includes(symbol.toUpperCase())) {
      promises.push(
        fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`)
          .then(res => res.json())
          .then(data => ({
            source: 'coinbase',
            price: parseFloat(data.data?.rates?.USD || '0'),
            timestamp: new Date().toISOString()
          }))
          .catch(() => null)
      );
    }

    // 2. Yahoo Finance for stocks (via proxy or serverless function)
    if (!['BTC', 'ETH', 'SOL', 'MATIC'].includes(symbol.toUpperCase())) {
      promises.push(
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
          .then(res => res.json())
          .then(data => {
            const result = data.chart?.result?.[0];
            return {
              source: 'yahoo',
              price: result?.meta?.regularMarketPrice || 0,
              change: result?.meta?.regularMarketPrice - result?.meta?.previousClose,
              changePercent: ((result?.meta?.regularMarketPrice - result?.meta?.previousClose) / result?.meta?.previousClose) * 100,
              volume: result?.meta?.regularMarketVolume || 0,
              high: result?.meta?.regularMarketDayHigh || 0,
              low: result?.meta?.regularMarketDayLow || 0,
              timestamp: new Date().toISOString()
            };
          })
          .catch(() => null)
      );
    }

    // 3. Alpha Vantage API (if available)
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      promises.push(
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => ({
            source: 'alphavantage',
            price: parseFloat(data['Global Quote']?.['05. price'] || '0'),
            change: parseFloat(data['Global Quote']?.['09. change'] || '0'),
            changePercent: parseFloat(data['Global Quote']?.['10. change percent']?.replace('%', '') || '0'),
            volume: parseInt(data['Global Quote']?.['06. volume'] || '0'),
            timestamp: new Date().toISOString()
          }))
          .catch(() => null)
      );
    }

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null && r.price > 0);
    
    return validResults.length > 0 ? validResults[0] : null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

async function fetchRealTimeNews(symbol: string) {
  try {
    const newsPromises = [];

    // 1. NewsAPI
    if (process.env.NEWS_API_KEY) {
      newsPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}`)
          .then(res => res.json())
          .then(data => ({
            source: 'newsapi',
            articles: data.articles?.slice(0, 5).map((article: any) => ({
              title: article.title,
              description: article.description,
              url: article.url,
              publishedAt: article.publishedAt,
              source: article.source.name,
              sentiment: analyzeSentiment(article.title + ' ' + article.description)
            })) || []
          }))
          .catch(() => ({ source: 'newsapi', articles: [] }))
      );
    }

    // 2. Alpha Vantage News
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      newsPromises.push(
        fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`)
          .then(res => res.json())
          .then(data => ({
            source: 'alphavantage',
            articles: data.feed?.slice(0, 5).map((item: any) => ({
              title: item.title,
              description: item.summary,
              url: item.url,
              publishedAt: item.time_published,
              sentiment: item.overall_sentiment_label || 'neutral',
              sentimentScore: item.overall_sentiment_score || 0
            })) || []
          }))
          .catch(() => ({ source: 'alphavantage', articles: [] }))
      );
    }

    const results = await Promise.all(newsPromises);
    const allArticles = results.flatMap(r => r.articles);
    
    return allArticles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['gain', 'rise', 'up', 'bull', 'positive', 'growth', 'surge', 'rally', 'breakthrough'];
  const negativeWords = ['fall', 'drop', 'down', 'bear', 'negative', 'decline', 'crash', 'plunge', 'loss'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Store conversation in Supabase
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
    console.error('Error with Supabase:', error);
  }
}

// Store market analysis in Supabase
async function storeMarketAnalysis(symbol: string, analysis: any) {
  try {
    const { error } = await supabase
      .from('market_analyses')
      .insert({
        symbol,
        analysis,
        confidence: analysis.confidence || 0.7,
        created_at: new Date().toISOString()
      });
    
    if (error) console.error('Error storing analysis:', error);
  } catch (error) {
    console.error('Error with Supabase:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = headers().get('x-forwarded-for') ?? 'anonymous';
    const { success, limit, reset, remaining } = await rateLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', limit, reset, remaining },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history, userId = 'anonymous', streamResponse = false, analysisType = 'comprehensive' } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if this is a market analysis request
    const isMarketQuery = message.toLowerCase().includes('analyze') || 
                         message.toLowerCase().includes('predict') ||
                         message.toLowerCase().includes('market') ||
                         message.toLowerCase().includes('price') ||
                         /\b[A-Z]{2,5}\b/.test(message); // Looks like a ticker symbol

    try {
      let response;
      let metadata: any = {
        model: 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString(),
        analysisType,
        rateLimitRemaining: remaining
      };

      if (isMarketQuery) {
        // Extract potential symbols from the message
        const symbolMatch = message.match(/\b([A-Z]{2,5})\b/g);
        const symbols = symbolMatch ? symbolMatch : ['BTC'];

        // Fetch real-time data for all symbols
        const marketDataPromises = symbols.map((symbol: string) => fetchRealTimeMarketData(symbol));
        const newsDataPromises = symbols.map((symbol: string) => fetchRealTimeNews(symbol));

        const [marketDataResults, newsDataResults] = await Promise.all([
          Promise.all(marketDataPromises),
          Promise.all(newsDataPromises)
        ]);

        // Combine all data
        const enrichedData = symbols.map((symbol: string, index: number) => ({
          symbol,
          marketData: marketDataResults[index],
          news: newsDataResults[index]
        }));

        // Create enhanced context for Claude
        const marketContext = `
Real-time Market Data:
-${enrichedData.map((data: any) => `
Symbol: ${data.symbol}
Current Price: $${data.marketData?.price || 'N/A'}
24h Change: ${(data.marketData && 'changePercent' in data.marketData) ? data.marketData.changePercent : 0}%
Volume: ${data.marketData?.volume || 'N/A'}

Recent News:
${data.news.slice(0, 3).map((article: any) => 
  `- ${article.title} (${article.sentiment}) - ${new Date(article.publishedAt).toLocaleDateString()}`
).join('\n')}
`).join('\n---\n')}

User Question: ${message}
`;

        // Use enhanced market analysis with real data
        response = await tradingAgent.analyzeMarket(symbols[0], analysisType);

        metadata = {
          ...metadata,
          symbols,
          marketData: enrichedData,
          analysisPerformed: true,
          dataSourcesUsed: ['real-time', 'news', 'technical_analysis']
        };

        // Store analysis in Supabase
        await storeMarketAnalysis(symbols[0], {
          response,
          marketData: enrichedData,
          metadata
        });

      } else {
        // Regular chat with context
        const contextMessage = history?.length > 0 
          ? `Previous context: ${history.slice(-3).map((h: any) => `${h.role}: ${h.content}`).join('\n')}\n\nCurrent question: ${message}`
          : message;

        response = await tradingAgent.chatWithAgent(contextMessage);
        metadata = {
          ...metadata,
          contextProvided: history?.length > 0
        };
      }

      // Store conversation in Supabase
      await storeConversation(userId, message, response, metadata);

      // Enhanced response with structured data
      const enhancedResponse = {
        message: response,
        metadata,
        suggestions: generateSuggestions(message, response),
        relatedSymbols: extractSymbols(response),
        confidence: calculateConfidence(response)
      };

      return NextResponse.json(enhancedResponse);

    } catch (apiError: unknown) {
      console.error('Enhanced Claude API error:', apiError);
      
      // Log error to Supabase
      await supabase
        .from('ai_errors')
        .insert({
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
          context: { message, userId },
          created_at: new Date().toISOString()
        });
      
      return NextResponse.json({ 
        message: "I'm experiencing some technical difficulties accessing real-time data. Please try again in a moment.",
        metadata: {
          source: "error_handler",
          error: apiError instanceof Error ? apiError.message : 'API temporarily unavailable',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error: unknown) {
    console.error(`Enhanced API error: ${error}`);
    return NextResponse.json({ 
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

// Enhanced streaming endpoint with real-time data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  const userId = searchParams.get('userId') || 'anonymous';
  
  if (!message) {
    return NextResponse.json({ error: 'Message parameter required' }, { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // Fetch real-time data first
        const symbolMatch = message.match(/\b([A-Z]{2,5})\b/);
        const symbol = symbolMatch ? symbolMatch[1] : 'BTC';
        
        const [marketData, news] = await Promise.all([
          fetchRealTimeMarketData(symbol),
          fetchRealTimeNews(symbol)
        ]);

        const enrichedMessage = `
${message}

Current Market Data for ${symbol}:
Price: $${marketData?.price || 'N/A'}
-24h Change: ${(marketData && 'changePercent' in marketData) ? marketData.changePercent : 0}%

Recent News Sentiment: ${news.length > 0 ? news[0].sentiment : 'No recent news'}
`;

        tradingAgent.streamResponse(enrichedMessage, (token: string) => {
          const data = `data: ${JSON.stringify({ token, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }).then(() => {
          controller.close();
        }).catch((error) => {
          const errorData = `data: ${JSON.stringify({ error: error.message, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        });
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ error: 'Failed to fetch market data', timestamp: Date.now() })}\n\n`;
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

// Helper functions remain the same
function generateSuggestions(userMessage: string, aiResponse: string): string[] {
  const suggestions = [];
  
  if (userMessage.toLowerCase().includes('btc') || userMessage.toLowerCase().includes('bitcoin')) {
    suggestions.push('Show me Ethereum analysis', 'Compare BTC to S&P 500', 'What are the BTC support levels?');
  } else if (userMessage.toLowerCase().includes('market')) {
    suggestions.push('Analyze top crypto gainers', 'Show me market sentiment', 'Risk assessment for my portfolio');
  } else {
    suggestions.push('Analyze current market trends', 'Show me trading opportunities', 'What are today\'s market movers?');
  }
  
  return suggestions.slice(0, 3);
}

function extractSymbols(text: string): string[] {
  const symbolRegex = /\b([A-Z]{2,5})\b/g;
  const matches = text.match(symbolRegex) || [];
  return Array.from(new Set(matches)).slice(0, 5);
}

function calculateConfidence(response: string): number {
  let confidence = 0.7;
  
  if (response.includes('strong') || response.includes('high probability')) confidence += 0.1;
  if (response.includes('uncertain') || response.includes('might')) confidence -= 0.1;
  if (response.includes('data shows') || response.includes('analysis indicates')) confidence += 0.15;
  if (response.length > 500) confidence += 0.05;
  
  return Math.max(0.1, Math.min(0.95, confidence));
}