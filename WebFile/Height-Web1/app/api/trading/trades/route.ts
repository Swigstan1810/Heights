import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const userId = searchParams.get('userId');
  
  try {
    let query = supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (symbol) {
      query = query.eq('symbol', symbol);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: trades, error } = await query;
    
    if (error) throw error;
    
    // Format trades for frontend
    const formattedTrades = trades?.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      price: trade.price,
      amount: trade.amount,
      total: trade.total,
      fee: trade.fee,
      timestamp: trade.created_at,
      status: trade.status
    })) || [];
    
    return NextResponse.json(formattedTrades);
  } catch (error) {
    console.error('Trades API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}