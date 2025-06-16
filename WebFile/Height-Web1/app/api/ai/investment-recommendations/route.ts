// app/api/ai/investment-recommendations/route.ts
// Environment variables (API keys, etc.) can be set in .env, .env.local, or .env.production
import { NextResponse } from 'next/server';
import { investmentAnalyzer, InvestmentRecommendationRequest } from '@/lib/investment-api-handlers';
import { tradingAgent } from '@/lib/claude-api';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const recommendationRequest: InvestmentRecommendationRequest = {
      query: body.query,
      assetType: body.assetType || 'all',
      riskProfile: body.riskProfile || 'moderate',
      investmentHorizon: body.investmentHorizon || 'medium'
    };

    console.log(`[Investment Recommendations] Generating recommendations for ${recommendationRequest.assetType} assets`);

    // Get AI-powered recommendations
    const recommendations = await investmentAnalyzer.getInvestmentRecommendations(recommendationRequest);

    // Enhance with Claude's insights
    const aiPrompt = `
Based on the following investment recommendations for a ${recommendationRequest.riskProfile} risk profile investor:

${recommendations.recommendations.slice(0, 3).map((rec, idx) => {
  const asset = rec.asset;
  const assetName = ('name' in asset && typeof asset.name === 'string') ? asset.name : (('symbol' in asset && asset.symbol) ? asset.symbol : 'Unknown Asset');
  const assetSymbol = ('symbol' in asset && asset.symbol) ? asset.symbol : (('name' in asset && asset.name) ? asset.name : 'N/A');
  const assetPrice = ('price' in asset && asset.price !== undefined) ? asset.price : (('nav' in asset && asset.nav !== undefined) ? asset.nav : 'N/A');
  return `
${idx + 1}. ${assetName} (${assetSymbol})
   - Current Price: $${assetPrice}
   - Recommendation: ${rec.recommendation.action.toUpperCase()}
   - Confidence: ${(rec.recommendation.confidence * 100).toFixed(0)}%
   - Risk Level: ${rec.recommendation.riskLevel}
   - Score: ${rec.score.toFixed(0)}/100
`;
}).join('\n')}

Investment Horizon: ${recommendationRequest.investmentHorizon} term
Asset Types: ${recommendationRequest.assetType}

Please provide:
1. A summary of today's best investment opportunities
2. Why these specific investments stand out
3. Diversification strategy recommendations
4. Key risks to watch
5. Actionable next steps

Keep the advice practical and tailored to a ${recommendationRequest.riskProfile} investor.
`;

    const aiResponse = await tradingAgent.chatWithAgent(aiPrompt);

    // Structure the response
    const response = {
      success: true,
      message: aiResponse,
      recommendations: recommendations.recommendations.map(rec => {
        const asset = rec.asset;
        return {
          asset: {
            symbol: ('symbol' in asset && asset.symbol) ? asset.symbol : (('name' in asset && asset.name) ? asset.name : 'N/A'),
            name: ('name' in asset && typeof asset.name === 'string') ? asset.name : (('symbol' in asset && asset.symbol) ? asset.symbol : 'Unknown Asset'),
            type: ('type' in asset && asset.type) ? asset.type : 'N/A',
            price: ('price' in asset && asset.price !== undefined) ? asset.price : (('nav' in asset && asset.nav !== undefined) ? asset.nav : 'N/A'),
            changePercent: ('changePercent' in asset && asset.changePercent !== undefined) ? asset.changePercent : 'N/A'
          },
          action: rec.recommendation.action,
          confidence: rec.recommendation.confidence,
          reasoning: rec.recommendation.reasoning,
          riskLevel: rec.recommendation.riskLevel,
          score: rec.score,
          predictions: rec.predictions?.slice(0, 2),
          keyMetrics: {
            rsi: rec.technicalIndicators?.rsi,
            trend: rec.technicalIndicators?.trend?.trend,
            support: rec.technicalIndicators?.support,
            resistance: rec.technicalIndicators?.resistance
          }
        };
      }),
      summary: recommendations.summary,
      metadata: {
        riskProfile: recommendationRequest.riskProfile,
        assetType: recommendationRequest.assetType,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      },
      suggestions: [
        'Set up a diversified portfolio',
        'Enable price alerts for recommendations',
        'Review and rebalance monthly',
        'Consider dollar-cost averaging'
      ]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Recommendation generation error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      suggestions: [
        'Try specifying an asset type (crypto, stock, etc.)',
        'Adjust your risk profile',
        'Check market hours for stock recommendations'
      ]
    }, { status: 500 });
  }
}