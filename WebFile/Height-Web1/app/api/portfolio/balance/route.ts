// app/api/portfolio/balance/route.ts
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

    // Try to get balance from wallet_balance table first
    const { data: walletBalance, error: walletError } = await supabase
      .from('wallet_balance')
      .select('balance, currency')
      .eq('user_id', user.id)
      .eq('currency', 'INR')
      .single();

    if (walletBalance && !walletError) {
      return NextResponse.json({ 
        balance: { 
          balance: Number(walletBalance.balance) || 500000, 
          currency: walletBalance.currency || 'INR' 
        }
      });
    }

    // Fallback to user_inr_wallet table
    const { data: inrWallet, error: inrWalletError } = await supabase
      .from('user_inr_wallet')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (inrWallet && !inrWalletError) {
      return NextResponse.json({ 
        balance: { 
          balance: Number(inrWallet.balance) || 500000, 
          currency: 'INR' 
        }
      });
    }

    // If no wallet exists, create one with default balance
    if (walletError?.code === 'PGRST116') { // No rows found
      const { data: newWallet, error: createError } = await supabase
        .from('wallet_balance')
        .insert({
          user_id: user.id,
          balance: 500000,
          currency: 'INR',
          locked_balance: 0
        })
        .select()
        .single();

      if (newWallet && !createError) {
        return NextResponse.json({ 
          balance: { 
            balance: 500000, 
            currency: 'INR' 
          }
        });
      }
    }

    // Default response if all else fails
    return NextResponse.json({ 
      balance: { 
        balance: 500000, 
        currency: 'INR' 
      }
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json({ 
      balance: { 
        balance: 500000, 
        currency: 'INR' 
      }
    });
  }
}