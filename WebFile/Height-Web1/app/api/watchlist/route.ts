// app/api/watchlist/route.ts - Watchlist-only version
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
          .from('unified_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: false })
          .order('created_at', { ascending: false });

        if (watchlistError) throw watchlistError;
        return NextResponse.json({ success: true, data: watchlist || [] });

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
        const { symbol, name, asset_type, exchange, sector, market_cap, notes, tags } = data;
        
        // Check if already exists first to avoid conflicts
        const { data: existing, error: checkError } = await supabase
          .from('unified_watchlist')
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
          .from('unified_watchlist')
          .insert({
            user_id: user.id,
            symbol,
            name,
            asset_type,
            exchange,
            sector,
            market_cap: market_cap || 0,
            notes: notes || null,
            tags: tags || []
          });

        if (insertError) throw insertError;

        return NextResponse.json({ 
          success: true, 
          message: 'Added to watchlist successfully' 
        });

      case 'remove_from_watchlist':
        const { symbol: removeSymbol, asset_type: removeAssetType } = data;
        
        const { error: deleteError } = await supabase
          .from('unified_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', removeSymbol)
          .eq('asset_type', removeAssetType);

        if (deleteError) throw deleteError;

        return NextResponse.json({ 
          success: true, 
          message: 'Removed from watchlist successfully' 
        });

      case 'update_watchlist_item':
        const { 
          id: itemId, 
          notes: updateNotes, 
          tags: updateTags, 
          sort_order: updateSortOrder 
        } = data;
        
        const updateData: any = {};
        if (updateNotes !== undefined) updateData.notes = updateNotes;
        if (updateTags !== undefined) updateData.tags = updateTags;
        if (updateSortOrder !== undefined) updateData.sort_order = updateSortOrder;

        const { error: updateError } = await supabase
          .from('unified_watchlist')
          .update(updateData)
          .eq('user_id', user.id)
          .eq('id', itemId);

        if (updateError) throw updateError;

        return NextResponse.json({ 
          success: true, 
          message: 'Watchlist item updated successfully' 
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