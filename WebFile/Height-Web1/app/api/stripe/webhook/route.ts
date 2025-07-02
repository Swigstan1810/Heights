import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe and Supabase inside the handler to prevent build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  const supabase = getSupabase();
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === 'crypto_purchase') {
        // Process crypto purchase
        const { userId, walletAddress } = session.metadata;
        const amountUSD = session.amount_total! / 100;
        
        // Calculate crypto amount based on current prices
        // In production, use real-time prices
        const cryptoAmount = amountUSD / 45000; // Example: BTC price
        
        // Credit user's wallet
        await supabase.from('crypto_deposits').insert({
          user_id: userId,
          wallet_address: walletAddress,
          amount_usd: amountUSD,
          crypto_amount: cryptoAmount,
          currency: 'BTC',
          status: 'completed',
          stripe_session_id: session.id,
          created_at: new Date().toISOString()
        });
        
        // Update user balance
        await supabase.rpc('credit_user_balance', {
          p_user_id: userId,
          p_asset: 'BTC',
          p_amount: cryptoAmount
        });
        
        console.log(`Crypto purchase completed: ${amountUSD} USD -> ${cryptoAmount} BTC`);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  return NextResponse.json({ received: true });
}