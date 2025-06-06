// app/api/portfolio/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

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
          .order('current_value', { ascending: false });

        if (holdingsError) {
          throw holdingsError;
        }

        return NextResponse.json({ holdings });

      case 'orders':
        // Get portfolio orders
        const { data: orders, error: ordersError } = await supabase
          .from('portfolio_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (ordersError) {
          throw ordersError;
        }

        return NextResponse.json({ orders });

      case 'summary':
        // Get portfolio summary using the database function
        const { data: summary, error: summaryError } = await supabase
          .rpc('get_portfolio_summary', { p_user_id: user.id });

        if (summaryError) {
          throw summaryError;
        }

        return NextResponse.json({ 
          summary: summary?.[0] || {
            total_value: 0,
            total_invested: 0,
            total_pnl: 0,
            total_pnl_percentage: 0,
            holdings_count: 0
          }
        });

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'place_order':
        const { symbol, name, asset_type, order_type, quantity, price } = body;

        // Validate required fields
        if (!symbol || !name || !asset_type || !order_type || !quantity || !price) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const totalAmount = Number(quantity) * Number(price);

        // For demo purposes, we'll auto-complete the order
        // In a real app, you'd integrate with a broker API
        const { data: order, error: orderError } = await supabase
          .from('portfolio_orders')
          .insert({
            user_id: user.id,
            symbol,
            name,
            asset_type,
            order_type,
            quantity: Number(quantity),
            price: Number(price),
            total_amount: totalAmount,
            status: 'completed', // Auto-complete for demo
            fees: totalAmount * 0.001, // 0.1% fee
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          throw orderError;
        }

        return NextResponse.json({ 
          message: 'Order placed successfully',
          order 
        });

      case 'update_prices':
        // Update portfolio holding prices (for demo/testing)
        const { updates } = body;
        
        if (!Array.isArray(updates)) {
          return NextResponse.json(
            { error: 'Updates must be an array' },
            { status: 400 }
          );
        }

        for (const update of updates) {
          const { symbol, price } = update;
          if (symbol && price) {
            await supabase.rpc('update_portfolio_prices', {
              p_symbol: symbol,
              p_current_price: Number(price)
            });
          }
        }

        return NextResponse.json({ 
          message: 'Prices updated successfully' 
        });

      case 'simulate_trade':
        // Simulate a trade for demo purposes
        const { trade_symbol, trade_type, trade_quantity, trade_price, trade_name } = body;

        const simulatedOrder = {
          user_id: user.id,
          symbol: trade_symbol,
          name: trade_name || trade_symbol,
          asset_type: 'crypto',
          order_type: trade_type,
          quantity: Number(trade_quantity),
          price: Number(trade_price),
          total_amount: Number(trade_quantity) * Number(trade_price),
          status: 'completed',
          fees: (Number(trade_quantity) * Number(trade_price)) * 0.001,
          completed_at: new Date().toISOString()
        };

        const { data: simulatedOrderResult, error: simulatedOrderError } = await supabase
          .from('portfolio_orders')
          .insert(simulatedOrder)
          .select()
          .single();

        if (simulatedOrderError) {
          throw simulatedOrderError;
        }

        return NextResponse.json({ 
          message: 'Trade simulated successfully',
          order: simulatedOrderResult 
        });

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

// Sample function to add demo portfolio data
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add some demo portfolio data
    const demoTrades = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        asset_type: 'crypto',
        order_type: 'buy',
        quantity: 0.1,
        price: 45000,
        current_price: 47000
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        asset_type: 'crypto',
        order_type: 'buy',
        quantity: 2.5,
        price: 3200,
        current_price: 3350
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        asset_type: 'crypto',
        order_type: 'buy',
        quantity: 50,
        price: 95,
        current_price: 110
      }
    ];

    const results = [];

    for (const trade of demoTrades) {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('portfolio_orders')
        .insert({
          user_id: user.id,
          symbol: trade.symbol,
          name: trade.name,
          asset_type: trade.asset_type,
          order_type: trade.order_type,
          quantity: trade.quantity,
          price: trade.price,
          total_amount: trade.quantity * trade.price,
          status: 'completed',
          fees: (trade.quantity * trade.price) * 0.001,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!orderError) {
        // Update current price
        await supabase.rpc('update_portfolio_prices', {
          p_symbol: trade.symbol,
          p_current_price: trade.current_price
        });

        results.push(order);
      }
    }

    return NextResponse.json({ 
      message: 'Demo data added successfully',
      orders: results 
    });

  } catch (error) {
    console.error('Portfolio demo data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}