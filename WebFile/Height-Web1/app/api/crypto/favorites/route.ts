import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

// GET request handler to fetch favorite assets
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { data, error } = await supabase
      .from('crypto_favorites')
      .select('symbol')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Favorites GET] Supabase Error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('[Favorites GET] Internal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST request handler to add or remove a favorite asset
export async function POST(request: Request) {
  const { symbol, name, asset_type, is_favorite } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (!symbol || !asset_type) {
    return new NextResponse(JSON.stringify({ error: 'Symbol and asset_type are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (is_favorite) {
      // Add to favorites
      const { data, error } = await supabase
        .from('crypto_favorites')
        .upsert(
          { 
            user_id: user.id, 
            symbol,
            name: name || symbol,
            asset_type
          },
          { onConflict: 'user_id,symbol,asset_type' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, data });

    } else {
      // Remove from favorites
      const { error } = await supabase
        .from('crypto_favorites')
        .delete()
        .match({ user_id: user.id, symbol: symbol, asset_type: asset_type });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[Favorites POST] Supabase/Internal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 