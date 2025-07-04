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
      console.log('Portfolio API: User not authenticated, returning demo data');
      // Return demo data instead of 401 for better UX
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      
      switch (action) {
        case 'holdings':
          return NextResponse.json({ holdings: [] });
        case 'summary':
          return NextResponse.json({ 
            summary: {
              total_value: 0,
              total_invested: 0,
              total_pnl: 0,
              total_pnl_percentage: 0,
              holdings_count: 0
            }
          });
        case 'balance':
          return NextResponse.json({ 
            balance: { balance: 500000, currency: 'INR' }
          });
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }
    
    // Validate user session
    if (!user.id || !user.email) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'holdings':
        const { data: holdings, error: holdingsError } = await supabase
          .from('portfolio_holdings')
          .select(`
            id,
            symbol,
            name,
            asset_type,
            quantity,
            average_buy_price,
            current_price,
            total_invested,
            current_value,
            profit_loss,
            profit_loss_percentage,
            updated_at
          `)
          .eq('user_id', user.id)
          .gte('quantity', 0)
          .order('current_value', { ascending: false })
          .limit(100); // Limit results for security

        if (holdingsError) {
          console.error('Holdings fetch error:', holdingsError);
          // Return empty holdings instead of throwing error
          return NextResponse.json({ holdings: [] });
        }

        // Sanitize data before returning
        const sanitizedHoldings = (holdings || []).map(holding => ({
          ...holding,
          quantity: Number(holding.quantity) || 0,
          average_buy_price: Number(holding.average_buy_price) || 0,
          current_price: Number(holding.current_price) || 0,
          total_invested: Number(holding.total_invested) || 0,
          current_value: Number(holding.current_value) || 0,
          profit_loss: Number(holding.profit_loss) || 0,
          profit_loss_percentage: Number(holding.profit_loss_percentage) || 0
        }));

        return NextResponse.json({ holdings: sanitizedHoldings });

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