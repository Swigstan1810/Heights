import { NextResponse } from 'next/server';
import { fetchMarketData, fetchHistoricalData } from '@/lib/market-data-api';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = params.symbol.toUpperCase();
    const type = searchParams.get('type') as 'stock' | 'crypto' || 'stock';
    const includeHistorical = searchParams.get('historical') === 'true';
    const interval = searchParams.get('interval') as '1d' | '1w' | '1m' || '1d';
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    
    // Fetch current market data
    const marketData = await fetchMarketData(symbol, type);
    
    // If requested, add historical data
    if (includeHistorical) {
      const historicalData = await fetchHistoricalData(symbol, type, interval, limit);
      marketData.historical = historicalData;
    }
    
    return NextResponse.json(marketData);
    
  } catch (error: any) {
    console.error(`Error fetching market data: ${error.message}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}