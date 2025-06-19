// app/api/portfolio/route.ts 
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'holdings':
        const { data: holdings, error: holdingsError } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id)
          .gt('quantity', 0)
          .order('current_value', { ascending: false });

        if (holdingsError) {
          console.error('Holdings fetch error:', holdingsError);
          return NextResponse.json({ holdings: [] });
        }

        return NextResponse.json({ holdings: holdings || [] });

      case 'summary':
        try {
          const { data: summary, error: summaryError } = await supabase
            .from('portfolio_summary_view')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!summaryError && summary) {
            return NextResponse.json({ 
              summary: {
                total_value: Number(summary.total_value) || 0,
                total_invested: Number(summary.total_invested) || 0,
                total_pnl: Number(summary.total_pnl) || 0,
                total_pnl_percentage: Number(summary.total_pnl_percentage) || 0,
                holdings_count: Number(summary.holdings_count) || 0
              }
            });
          }

          return NextResponse.json({ 
            summary: {
              total_value: 0,
              total_invested: 0,
              total_pnl: 0,
              total_pnl_percentage: 0,
              holdings_count: 0
            }
          });

        } catch (error) {
          console.error('Summary error:', error);
          return NextResponse.json({ 
            summary: {
              total_value: 0,
              total_invested: 0,
              total_pnl: 0,
              total_pnl_percentage: 0,
              holdings_count: 0
            }
          });
        }

      case 'balance':
        return NextResponse.redirect(new URL('/api/portfolio/balance', request.url));

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}