import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';

// Initialize exchange lazily to prevent build-time errors
function getExchange() {
  return new ccxt.binance({
    apiKey: process.env.EXCHANGE_API_KEY,
    secret: process.env.EXCHANGE_API_SECRET,
    enableRateLimit: true,
    options: {
      defaultType: 'spot'
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol required' },
      { status: 400 }
    );
  }
  
  try {
    const exchange = getExchange();
    
    // Fetch OHLCV data
    const ohlcv = await exchange.fetchOHLCV(symbol, interval, undefined, 100);
    
    const candleData = ohlcv.map((candle: any) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5]
    }));
    
    return NextResponse.json(candleData);
  } catch (error) {
    console.error('Chart data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}