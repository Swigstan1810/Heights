// app/api/portfolio/route.ts - Fixed version
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'holdings':
        // Get portfolio holdings
        const { data: holdings, error: holdingsError } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id)
          .gt('quantity', 0) // Only get holdings with positive quantity
          .order('current_value', { ascending: false });

        if (holdingsError) {
          console.error('Holdings fetch error:', holdingsError);
          return NextResponse.json({ holdings: [] });
        }

        // Calculate current values based on latest prices
        const holdingsWithUpdatedValues = holdings?.map(holding => ({
          ...holding,
          current_value: holding.quantity * holding.current_price,
          profit_loss: (holding.quantity * holding.current_price) - holding.total_invested,
          profit_loss_percentage: holding.total_invested > 0 
            ? (((holding.quantity * holding.current_price) - holding.total_invested) / holding.total_invested) * 100
            : 0
        })) || [];

        return NextResponse.json({ holdings: holdingsWithUpdatedValues });

      case 'summary':
        // Try multiple approaches to get summary
        try {
          // First try the view
          const { data: viewData, error: viewError } = await supabase
            .from('portfolio_summary_view')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!viewError && viewData) {
            return NextResponse.json({ 
              summary: {
                total_value: Number(viewData.total_value) || 0,
                total_invested: Number(viewData.total_invested) || 0,
                total_pnl: Number(viewData.total_pnl) || 0,
                total_pnl_percentage: Number(viewData.total_pnl_percentage) || 0,
                holdings_count: Number(viewData.holdings_count) || 0
              }
            });
          }

          // Fallback to manual calculation
          const { data: holdings, error: holdingsError } = await supabase
            .from('portfolio_holdings')
            .select('current_value, total_invested, quantity, current_price')
            .eq('user_id', user.id)
            .gt('quantity', 0);

          if (!holdingsError && holdings) {
            const summary = holdings.reduce((acc, holding) => {
              const currentValue = holding.quantity * holding.current_price;
              return {
                total_value: acc.total_value + currentValue,
                total_invested: acc.total_invested + holding.total_invested,
                holdings_count: acc.holdings_count + 1
              };
            }, { total_value: 0, total_invested: 0, holdings_count: 0 });

            const total_pnl = summary.total_value - summary.total_invested;
            const total_pnl_percentage = summary.total_invested > 0 
              ? (total_pnl / summary.total_invested) * 100 
              : 0;

            return NextResponse.json({ 
              summary: {
                total_value: summary.total_value,
                total_invested: summary.total_invested,
                total_pnl: total_pnl,
                total_pnl_percentage: total_pnl_percentage,
                holdings_count: summary.holdings_count
              }
            });
          }

          // Return empty summary if no data
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
          console.error('Summary calculation error:', error);
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
        // Redirect to dedicated balance endpoint
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