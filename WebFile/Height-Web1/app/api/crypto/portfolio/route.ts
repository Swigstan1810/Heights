// app/api/crypto/portfolio/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary':
        const { data: summary, error: summaryError } = await supabase
          .rpc('get_user_portfolio_summary', { p_user_id: user.id });

        if (summaryError) throw summaryError;
        return NextResponse.json({ success: true, data: summary?.[0] });

      case 'holdings':
        const { data: holdings, error: holdingsError } = await supabase
          .rpc('get_user_crypto_holdings', { p_user_id: user.id });

        if (holdingsError) throw holdingsError;
        return NextResponse.json({ success: true, data: holdings });

      case 'transactions':
        const { data: transactions, error: txError } = await supabase
          .from('crypto_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (txError) throw txError;
        return NextResponse.json({ success: true, data: transactions });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data', details: error.message },
      { status: 500 }
    );
  }
}
