
// app/api/coinbase/accounts/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { coinbaseAPI } from '@/lib/services/coinbase-api';

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we have API credentials
    if (!process.env.COINBASE_API_KEY || !process.env.COINBASE_API_SECRET) {
      return NextResponse.json({
        accounts: [],
        message: 'Coinbase API credentials not configured'
      });
    }

    // Get accounts from Coinbase
    const accounts = await coinbaseAPI.getAccounts();
    
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error.message },
      { status: 500 }
    );
  }
}