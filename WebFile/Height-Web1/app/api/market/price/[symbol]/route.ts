import { NextResponse } from 'next/server';
import { coinbaseRealtimeService } from '@/lib/services/coinbase-realtime-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const marketData = await coinbaseRealtimeService.getMarketDataForSymbol(symbol);

    if (!marketData) {
      return NextResponse.json(
        { error: `Market data not found for ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json(marketData);
  } catch (error) {
    console.error(`[API] Error fetching market data for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 