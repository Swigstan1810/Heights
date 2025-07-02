import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }
  
  try {
    // Get user balances from database
    const { data: balances, error } = await supabase
      .from('user_balances')
      .select('asset, available_balance, locked_balance')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Format balances
    const formattedBalances: Record<string, number> = {};
    balances?.forEach(balance => {
      formattedBalances[balance.asset] = balance.available_balance;
    });
    
    return NextResponse.json(formattedBalances);
  } catch (error) {
    console.error('Balances API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}