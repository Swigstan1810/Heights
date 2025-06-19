// app/api/watchlist/route.ts - FIXED VERSION
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
      case 'market_data':
        // Get all market data
        const { data: marketData, error: marketError } = await supabase
          .from('market_data')
          .select('*')
          .eq('is_active', true)
          .order('volume_24h', { ascending: false });

        if (marketError) throw marketError;
        return NextResponse.json({ success: true, data: marketData || [] });

      case 'watchlist':
        // Get user's watchlist
        const { data: watchlist, error: watchlistError } = await supabase
          .from('watchlist_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (watchlistError) throw watchlistError;
        return NextResponse.json({ success: true, data: watchlist || [] });

      case 'portfolio':
        // Get demo portfolio
        const { data: portfolio, error: portfolioError } = await supabase
          .from('demo_portfolio')
          .select('*')
          .eq('user_id', user.id)
          .gt('quantity', 0)
          .order('current_value', { ascending: false });

        if (portfolioError) throw portfolioError;
        return NextResponse.json({ success: true, data: portfolio || [] });

      case 'balance':
        // Get demo wallet balance - FIXED QUERY
        const { data: balance, error: balanceError } = await supabase
          .from('demo_wallet_balance')
          .select('*')
          .eq('user_id', user.id)
          .eq('currency', 'INR')
          .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

        if (balanceError && balanceError.code !== 'PGRST116') {
          throw balanceError;
        }

        if (!balance) {
          // Create default balance
          const { data: newBalance, error: createError } = await supabase
            .from('demo_wallet_balance')
            .insert({
              user_id: user.id,
              balance: 1000000,
              currency: 'INR'
            })
            .select()
            .single();

          if (createError) throw createError;
          return NextResponse.json({ success: true, data: newBalance });
        }

        return NextResponse.json({ success: true, data: balance });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add_to_watchlist':
        const { symbol, name, asset_type, exchange, sector, market_cap } = data;
        
        // Check if already exists first to avoid 409 errors
        const { data: existing, error: checkError } = await supabase
          .from('watchlist_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .eq('asset_type', asset_type)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          return NextResponse.json(
            { error: 'Item already in watchlist' },
            { status: 400 }
          );
        }

        const { error: insertError } = await supabase
          .from('watchlist_items')
          .insert({
            user_id: user.id,
            symbol,
            name,
            asset_type,
            exchange,
            sector,
            market_cap: market_cap || 0
          });

        if (insertError) throw insertError;

        return NextResponse.json({ 
          success: true, 
          message: 'Added to watchlist successfully' 
        });

      case 'remove_from_watchlist':
        const { symbol: removeSymbol, asset_type: removeAssetType } = data;
        
        const { error: deleteError } = await supabase
          .from('watchlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', removeSymbol)
          .eq('asset_type', removeAssetType);

        if (deleteError) throw deleteError;

        return NextResponse.json({ 
          success: true, 
          message: 'Removed from watchlist successfully' 
        });

      case 'execute_trade':
        const { 
          symbol: tradeSymbol, 
          asset_type: tradeAssetType, 
          trade_type, 
          quantity, 
          price 
        } = data;

        const totalAmount = quantity * price;
        const fees = Math.max(10, totalAmount * 0.001);

        // Validate numbers
        if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
          return NextResponse.json(
            { error: 'Invalid quantity or price' },
            { status: 400 }
          );
        }

        // Check wallet balance for buy orders
        if (trade_type === 'buy') {
          const { data: walletBalance, error: walletError } = await supabase
            .from('demo_wallet_balance')
            .select('balance')
            .eq('user_id', user.id)
            .eq('currency', 'INR')
            .maybeSingle();

          if (walletError && walletError.code !== 'PGRST116') {
            throw walletError;
          }

          const balance = walletBalance?.balance || 0;
          if ((totalAmount + fees) > balance) {
            return NextResponse.json(
              { error: 'Insufficient balance' },
              { status: 400 }
            );
          }
        }

        // Check holdings for sell orders
        if (trade_type === 'sell') {
          const { data: holding, error: holdingError } = await supabase
            .from('demo_portfolio')
            .select('quantity')
            .eq('user_id', user.id)
            .eq('symbol', tradeSymbol)
            .eq('asset_type', tradeAssetType)
            .maybeSingle();

          if (holdingError && holdingError.code !== 'PGRST116') {
            throw holdingError;
          }

          const availableQuantity = holding?.quantity || 0;
          if (quantity > availableQuantity) {
            return NextResponse.json(
              { error: 'Insufficient holdings' },
              { status: 400 }
            );
          }
        }

        // Execute the trade using stored procedure
        const { data: result, error: tradeError } = await supabase
          .rpc('execute_demo_trade', {
            p_user_id: user.id,
            p_symbol: tradeSymbol,
            p_asset_type: tradeAssetType,
            p_trade_type: trade_type,
            p_quantity: quantity,
            p_price: price,
            p_total_amount: totalAmount,
            p_fees: fees
          });

        if (tradeError) {
          console.error('Trade execution error:', tradeError);
          throw new Error(tradeError.message || 'Trade execution failed');
        }

        return NextResponse.json({ 
          success: true, 
          message: `${trade_type.charAt(0).toUpperCase() + trade_type.slice(1)} order executed successfully`,
          data: result
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}