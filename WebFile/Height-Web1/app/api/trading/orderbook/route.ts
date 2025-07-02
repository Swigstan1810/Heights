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
  
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol required' },
      { status: 400 }
    );
  }
  
  try {
    const exchange = getExchange();
    const orderbook = await exchange.fetchOrderBook(symbol, 20);
    
    return NextResponse.json({
      symbol,
      bids: orderbook.bids.map((bid: any) => ({ price: bid[0], amount: bid[1] })),
      asks: orderbook.asks.map((ask: any) => ({ price: ask[0], amount: ask[1] })),
      timestamp: orderbook.timestamp
    });
  } catch (error) {
    console.error('Orderbook API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orderbook' },
      { status: 500 }
    );
  }
}