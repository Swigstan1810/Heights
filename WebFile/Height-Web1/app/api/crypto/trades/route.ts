// app/api/crypto/trades/route.ts - Get recent crypto trades
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent trades for the user
    const { data: trades, error: tradesError } = await supabase
      .from('crypto_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tradesError) {
      console.error('Trades fetch error:', tradesError);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    // Transform trades to match the expected format in your frontend
    const transformedTrades = (trades || []).map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      trade_type: trade.trade_type,
      quantity: trade.quantity,
      price_inr: trade.price_inr,
      total_inr: trade.total_inr,
      brokerage_fee: trade.brokerage_fee,
      status: trade.status,
      executed_at: trade.executed_at || trade.created_at
    }));

    return NextResponse.json({
      success: true,
      trades: transformedTrades
    });

  } catch (error) {
    console.error('Trades API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}