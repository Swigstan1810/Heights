// app/api/coinbase/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || ['BTC', 'ETH', 'SOL'];
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServerComponentClient({ cookies });

    // Get latest prices from our database
    const { data: prices, error } = await supabase
      .from('coinbase_price_feed')
      .select('*')
      .in('symbol', symbols)
      .order('time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Group by symbol and get latest for each
    const latestPrices = symbols.map(symbol => {
      const symbolPrices = prices?.filter(p => p.symbol === symbol) || [];
      return symbolPrices.length > 0 ? symbolPrices[0] : null;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: latestPrices,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, price, productId, volume24h, high24h, low24h, change24h, change24hPercent } = body;

    const supabase = createServerComponentClient({ cookies });

    // Insert new price data
    const { data, error } = await supabase
      .from('coinbase_price_feed')
      .insert({
        product_id: productId,
        symbol: symbol.toUpperCase(),
        price: parseFloat(price),
        volume_24h: parseFloat(volume24h || '0'),
        high_24h: parseFloat(high24h || price),
        low_24h: parseFloat(low24h || price),
        change_24h: parseFloat(change24h || '0'),
        change_24h_percent: parseFloat(change24hPercent || '0'),
        time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}