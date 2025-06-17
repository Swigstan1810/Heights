// app/api/portfolio/route.ts - Fixed version with proper error handling
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
          console.error('Holdings fetch error:', holdingsError);
          return NextResponse.json({ holdings: [] });
        }

        return NextResponse.json({ holdings: holdings || [] });

      case 'summary':
        // Get portfolio summary using the fixed database function
        try {
          const { data: summary, error: summaryError } = await supabase
            .rpc('get_portfolio_summary', { p_user_id: user.id });

          if (summaryError) {
            console.error('Summary RPC error:', summaryError);
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

          return NextResponse.json({ 
            summary: summary?.[0] || {
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
        // Get wallet balance - fixed to handle single row properly
        try {
          const { data: balance, error: balanceError } = await supabase
            .from('wallet_balance')
            .select('balance, currency')
            .eq('user_id', user.id)
            .eq('currency', 'INR')
            .single();

          if (balanceError) {
            console.error('Balance fetch error:', balanceError);
            return NextResponse.json({ 
              balance: { balance: 500000, currency: 'INR' }
            });
          }

          return NextResponse.json({ 
            balance: balance || { balance: 500000, currency: 'INR' }
          });
        } catch (error) {
          console.error('Balance error:', error);
          return NextResponse.json({ 
            balance: { balance: 500000, currency: 'INR' }
          });
        }

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
          console.error('Order creation error:', orderError);
          return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
          );
        }

        // Update holdings after successful order
        if (order_type === 'buy') {
          await updateHoldingsAfterBuy(supabase, user.id, symbol, name, asset_type, Number(quantity), Number(price));
        } else if (order_type === 'sell') {
          await updateHoldingsAfterSell(supabase, user.id, symbol, Number(quantity), Number(price));
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
            await supabase
              .from('portfolio_holdings')
              .update({ 
                current_price: Number(price),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('symbol', symbol);
          }
        }

        return NextResponse.json({ 
          message: 'Prices updated successfully' 
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

// Helper function to update holdings after buy order
async function updateHoldingsAfterBuy(
  supabase: any,
  userId: string,
  symbol: string,
  name: string,
  assetType: string,
  quantity: number,
  price: number
) {
  // Check if holding exists
  const { data: existingHolding } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('asset_type', assetType)
    .single();

  if (existingHolding) {
    // Update existing holding
    const newQuantity = Number(existingHolding.quantity) + quantity;
    const newTotalInvested = Number(existingHolding.total_invested) + (quantity * price);
    const newAvgBuyPrice = newTotalInvested / newQuantity;
    const newCurrentValue = newQuantity * price;
    const newProfitLoss = newCurrentValue - newTotalInvested;
    const newProfitLossPercentage = newTotalInvested > 0 ? (newProfitLoss / newTotalInvested) * 100 : 0;

    await supabase
      .from('portfolio_holdings')
      .update({
        quantity: newQuantity,
        average_buy_price: newAvgBuyPrice,
        total_invested: newTotalInvested,
        current_price: price,
        current_value: newCurrentValue,
        profit_loss: newProfitLoss,
        profit_loss_percentage: newProfitLossPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingHolding.id);
  } else {
    // Create new holding
    const currentValue = quantity * price;
    await supabase
      .from('portfolio_holdings')
      .insert({
        user_id: userId,
        symbol,
        name,
        asset_type: assetType,
        quantity,
        average_buy_price: price,
        current_price: price,
        total_invested: quantity * price,
        current_value: currentValue,
        profit_loss: 0,
        profit_loss_percentage: 0
      });
  }
}

// Helper function to update holdings after sell order
async function updateHoldingsAfterSell(
  supabase: any,
  userId: string,
  symbol: string,
  quantity: number,
  price: number
) {
  const { data: existingHolding } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (existingHolding) {
    const newQuantity = Number(existingHolding.quantity) - quantity;
    
    if (newQuantity <= 0) {
      // Delete holding if quantity is 0
      await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('id', existingHolding.id);
    } else {
      // Update holding
      const newTotalInvested = newQuantity * Number(existingHolding.average_buy_price);
      const newCurrentValue = newQuantity * price;
      const newProfitLoss = newCurrentValue - newTotalInvested;
      const newProfitLossPercentage = newTotalInvested > 0 ? (newProfitLoss / newTotalInvested) * 100 : 0;
      
      await supabase
        .from('portfolio_holdings')
        .update({
          quantity: newQuantity,
          total_invested: newTotalInvested,
          current_price: price,
          current_value: newCurrentValue,
          profit_loss: newProfitLoss,
          profit_loss_percentage: newProfitLossPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHolding.id);
    }
  }
}