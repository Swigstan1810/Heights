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
  try {
    const exchange = getExchange();
    
    // Load markets
    await exchange.loadMarkets();
    
    // Get tickers for major pairs
    const symbols = [
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT',
      'LINK/USDT', 'MATIC/USDT', 'AVAX/USDT', 'UNI/USDT', 'AAVE/USDT'
    ];
    
    const tickers = await exchange.fetchTickers(symbols);
    
    // Format market data
    const markets = Object.entries(tickers).map(([symbol, ticker]) => {
      const [base, quote] = symbol.split('/');
      return {
        symbol,
        base,
        quote,
        price: ticker.last,
        change24h: ticker.change,
        change24hPercent: ticker.percentage,
        volume24h: ticker.quoteVolume,
        high24h: ticker.high,
        low24h: ticker.low,
        bid: ticker.bid,
        ask: ticker.ask,
        timestamp: ticker.timestamp
      };
    });
    
    return NextResponse.json(markets);
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}