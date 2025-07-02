import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, walletAddress, userId } = body;
    
    const stripe = getStripe();
    
    // Create Stripe Checkout session for crypto purchase
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Crypto Purchase',
            description: `Buy crypto for wallet: ${walletAddress.slice(0, 10)}...`,
            images: ['https://your-app.com/crypto-icon.png']
          },
          unit_amount: amount * 100 // Convert to cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?cancelled=true`,
      metadata: {
        userId,
        walletAddress,
        type: 'crypto_purchase'
      },
      payment_intent_data: {
        metadata: {
          userId,
          walletAddress,
          type: 'crypto_purchase'
        }
      }
    });
    
    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}