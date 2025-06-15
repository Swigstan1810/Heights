// app/api/crypto/trade/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, trade_type, amount, wallet_address } = body;

    // Validate input
    if (!symbol || !trade_type || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get current market price
    const { data: market, error: marketError } = await supabase
      .from('crypto_markets')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Calculate trade details
    const usdInrRate = 83.25; // In production, fetch from real API
    const quantity = trade_type === 'buy' ? amount / market.price_inr : amount;
    const totalInr = trade_type === 'buy' ? amount : amount * market.price_inr;
    const brokerageFee = Math.max(10, Math.min(1000, totalInr * 0.001));
    const netAmount = trade_type === 'buy' ? totalInr + brokerageFee : totalInr - brokerageFee;

    // Check user balances
    if (trade_type === 'buy') {
      // Check INR balance
      const { data: inrWallet } = await supabase
        .from('user_inr_wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!inrWallet || inrWallet.balance < netAmount) {
        return NextResponse.json({ error: 'Insufficient INR balance' }, { status: 400 });
      }
    } else {
      // Check crypto balance
      const { data: cryptoBalance } = await supabase
        .from('user_crypto_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .single();

      if (!cryptoBalance || cryptoBalance.balance < quantity) {
        return NextResponse.json({ error: 'Insufficient crypto balance' }, { status: 400 });
      }
    }

    // Create trade record
    const { data: trade, error: tradeError } = await supabase
      .from('crypto_trades')
      .insert({
        user_id: user.id,
        wallet_address,
        symbol,
        trade_type,
        quantity,
        price_usd: market.price_usd,
        price_inr: market.price_inr,
        total_usd: quantity * market.price_usd,
        total_inr: totalInr,
        brokerage_fee: brokerageFee,
        net_amount: netAmount,
        usd_inr_rate: usdInrRate,
        status: 'completed',
        executed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    return NextResponse.json({
      success: true,
      trade,
      message: `${trade_type === 'buy' ? 'Buy' : 'Sell'} order executed successfully`
    });

  } catch (error: any) {
    console.error('Trade execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade', details: error.message },
      { status: 500 }
    );
  }
}