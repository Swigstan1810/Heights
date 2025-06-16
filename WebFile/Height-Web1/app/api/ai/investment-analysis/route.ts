// app/api/ai/investment-analysis/route.ts
// Environment variables (API keys, etc.) can be set in .env, .env.local, or .env.production
import { NextResponse } from 'next/server';
import { investmentAnalyzer } from '@/lib/investment-api-handlers';
import { tradingAgent } from '@/lib/claude-api';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, symbols, assetType, analysisType = 'comprehensive' } = body;

    if (!symbols || symbols.length === 0) {
      return NextResponse.json({ 
        error: 'No symbols provided for analysis' 
      }, { status: 400 });
    }

    console.log(`[Investment Analysis] Analyzing ${symbols.join(', ')} - Type: ${assetType}`);

    // Analyze the primary symbol
    const primarySymbol = symbols[0];
    const analysis = await investmentAnalyzer.analyzeAsset(primarySymbol, assetType);

    // Safely extract asset properties for all asset types using type guards
    const asset = analysis.asset;
    const assetName = ('name' in asset && typeof asset.name === 'string') ? asset.name : (('symbol' in asset && asset.symbol) ? asset.symbol : 'Unknown Asset');
    const assetSymbol = ('symbol' in asset && asset.symbol) ? asset.symbol : (('name' in asset && asset.name) ? asset.name : 'N/A');
    const assetPrice = ('price' in asset && asset.price !== undefined) ? asset.price : (('nav' in asset && asset.nav !== undefined) ? asset.nav : 'N/A');
    const assetChangePercent = ('changePercent' in asset && asset.changePercent !== undefined) ? asset.changePercent : 'N/A';
    const assetMarketCap = ('marketCap' in asset && asset.marketCap !== undefined) ? asset.marketCap : 'N/A';
    const assetVolume = ('volume' in asset && asset.volume !== undefined) ? asset.volume : 'N/A';
    const assetSources = ('sources' in asset && Array.isArray(asset.sources)) ? asset.sources : ['multiple'];

    // Generate comprehensive response using Claude
    const aiPrompt = `
Based on the following investment analysis for ${assetName} (${assetSymbol}):

Current Price: $${assetPrice}
24h Change: ${assetChangePercent}%
Market Cap: ${assetMarketCap !== 'N/A' ? `$${(assetMarketCap / 1e9).toFixed(2)}B` : 'N/A'}
Volume: $${assetVolume !== 'N/A' ? (assetVolume / 1e6).toFixed(2) + 'M' : 'N/A'}

Technical Indicators:
${JSON.stringify(analysis.technicalIndicators, null, 2)}

Recommendation: ${analysis.recommendation.action.toUpperCase()} with ${(analysis.recommendation.confidence * 100).toFixed(0)}% confidence
Reasoning: ${analysis.recommendation.reasoning}

Recent News Sentiment:
${analysis.news.slice(0, 3).map(n => `- ${n.sentiment}: ${n.title}`).join('\n')}

Please provide a comprehensive, easy-to-understand explanation covering:
1. What this asset is (in simple terms)
2. Current market position and recent performance
3. Technical analysis insights
4. Investment outlook and risks
5. Who might consider investing in this

Keep the language accessible for both beginners and experienced investors.
`;

    const aiResponse = await tradingAgent.chatWithAgent(aiPrompt);

    // Format the response
    const response = {
      success: true,
      query,
      analysis: {
        ...analysis,
        summary: aiResponse,
        metadata: {
          analysisType,
          timestamp: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          dataSourcesUsed: assetSources,
          confidence: analysis.recommendation.confidence
        }
      },
      message: aiResponse,
      suggestions: generateSuggestions(analysis)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Investment analysis error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to analyze investment',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      suggestions: [
        'Try searching for a specific symbol like "BTC" or "AAPL"',
        'Check if the symbol is correct',
        'Try again in a moment'
      ]
    }, { status: 500 });
  }
}

function generateSuggestions(analysis: any): string[] {
  const suggestions = [];
  const symbol = analysis.asset.symbol;
  const assetType = analysis.asset.type;

  // Context-aware suggestions
  if (assetType === 'crypto') {
    suggestions.push(
      `Compare ${symbol} with other cryptocurrencies`,
      `Check ${symbol} staking opportunities`,
      `Analyze ${symbol} on-chain metrics`
    );
  } else if (assetType === 'stock') {
    suggestions.push(
      `View ${symbol} earnings calendar`,
      `Compare ${symbol} with sector peers`,
      `Check ${symbol} dividend history`
    );
  }

  // General suggestions
  suggestions.push(
    `Set price alert for ${symbol}`,
    `View ${symbol} historical chart`,
    `Read latest news about ${symbol}`
  );

  return suggestions.slice(0, 4);
}