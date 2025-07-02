import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { brokerageEngine } from '@/lib/services/brokerage-engine';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, side, symbol, amount, price, leverage } = body;
    
    // Validate inputs
    if (!userId || !type || !side || !symbol || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Process through brokerage engine
    const result = await brokerageEngine.processTrade({
      userId,
      tradeType: type,
      side,
      symbol,
      amount: parseFloat(amount),
      price: parseFloat(price),
      leverage
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    const exchange = getExchange();
    
    // Execute on exchange
    let order;
    if (type === 'market') {
      order = await exchange.createMarketOrder(
        symbol,
        side,
        parseFloat(amount)
      );
    } else if (type === 'limit') {
      order = await exchange.createLimitOrder(
        symbol,
        side,
        parseFloat(amount),
        parseFloat(price)
      );
    }
    
    return NextResponse.json({
      success: true,
      tradeId: result.tradeId,
      orderId: order?.id,
      fees: result.fees
    });
  } catch (error) {
    console.error('Execute trade error:', error);
    return NextResponse.json(
      { error: 'Trade execution failed' },
      { status: 500 }
    );
  }
}