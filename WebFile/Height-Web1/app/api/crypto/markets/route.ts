// app/api/crypto/markets/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: markets, error } = await supabase
      .from('crypto_markets')
      .select('*')
      .eq('is_active', true)
      .order('volume_24h', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: markets });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}