import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, address, type, network } = body;
    
    const { data, error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        wallet_address: address,
        wallet_type: type,
        network,
        is_primary: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,wallet_address'
      });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to save wallet' },
      { status: 500 }
    );
  }
}