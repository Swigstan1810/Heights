// app/api/coinbase/order/route.ts
// Environment variables (API keys, etc.) can be set in .env, .env.local, or .env.production
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { coinbaseAPI } from '@/lib/services/coinbase-api';

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { side, productId, amount, userId, walletAddress } = body;

    // Validate input
    if (!side || !productId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Check if we have Coinbase API credentials
    if (!process.env.COINBASE_API_KEY || !process.env.COINBASE_API_SECRET) {
      // Simulate order for demo purposes
      const orderId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Log to database
      await supabase.from('crypto_transactions').insert({
        user_id: userId,
        wallet_address: walletAddress,
        transaction_type: side,
        currency_pair: productId,
        amount: side === 'buy' ? amount : parseFloat(amount),
        price: 0, // Would get from ticker
        total_value: amount,
        status: 'demo',
        coinbase_order_id: orderId,
        metadata: { demo: true }
      });

      return NextResponse.json({
        success: true,
        orderId,
        message: 'Demo order placed (API credentials not configured)',
        demo: true
      });
    }

    // Place real order through Coinbase
    try {
      const order = await coinbaseAPI.placeMarketOrder({
        side,
        productId,
        ...(side === 'buy' ? { funds: amount.toString() } : { size: amount.toString() })
      });

      // Log successful order to database
      await supabase.from('crypto_transactions').insert({
        user_id: userId,
        wallet_address: walletAddress,
        transaction_type: side,
        currency_pair: productId,
        amount: parseFloat(order.size || amount),
        price: parseFloat(order.price || '0'),
        total_value: parseFloat(order.executed_value || amount),
        status: order.status,
        coinbase_order_id: order.id,
        metadata: order
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: `${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully`,
        order
      });
    } catch (error: any) {
      console.error('Coinbase order error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to place order'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Order endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
