import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Sample crypto data for initialization
const SAMPLE_CRYPTO_DATA = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price_usd: 45000,
    price_inr: 3742500,
    change_24h: 1200,
    change_24h_percent: 2.74,
    volume_24h: 28500000000,
    market_cap: 880000000000,
    high_24h: 46200,
    low_24h: 44100,
    coinbase_product_id: 'BTC-USD'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price_usd: 3000,
    price_inr: 249750,
    change_24h: 85,
    change_24h_percent: 2.92,
    volume_24h: 15200000000,
    market_cap: 360000000000,
    high_24h: 3100,
    low_24h: 2920,
    coinbase_product_id: 'ETH-USD'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price_usd: 100,
    price_inr: 8325,
    change_24h: 3.5,
    change_24h_percent: 3.62,
    volume_24h: 2800000000,
    market_cap: 45000000000,
    high_24h: 102,
    low_24h: 96.5,
    coinbase_product_id: 'SOL-USD'
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price_usd: 0.5,
    price_inr: 41.625,
    change_24h: 0.02,
    change_24h_percent: 4.17,
    volume_24h: 450000000,
    market_cap: 17500000000,
    high_24h: 0.52,
    low_24h: 0.48,
    coinbase_product_id: 'ADA-USD'
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    price_usd: 7,
    price_inr: 582.75,
    change_24h: 0.25,
    change_24h_percent: 3.70,
    volume_24h: 280000000,
    market_cap: 9000000000,
    high_24h: 7.2,
    low_24h: 6.8,
    coinbase_product_id: 'DOT-USD'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    price_usd: 15,
    price_inr: 1248.75,
    change_24h: 0.45,
    change_24h_percent: 3.09,
    volume_24h: 520000000,
    market_cap: 8500000000,
    high_24h: 15.5,
    low_24h: 14.2,
    coinbase_product_id: 'LINK-USD'
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    price_usd: 0.8,
    price_inr: 66.6,
    change_24h: 0.03,
    change_24h_percent: 3.90,
    volume_24h: 380000000,
    market_cap: 7800000000,
    high_24h: 0.82,
    low_24h: 0.76,
    coinbase_product_id: 'MATIC-USD'
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price_usd: 35,
    price_inr: 2913.75,
    change_24h: 1.2,
    change_24h_percent: 3.55,
    volume_24h: 720000000,
    market_cap: 13500000000,
    high_24h: 36,
    low_24h: 33.5,
    coinbase_product_id: 'AVAX-USD'
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    price_usd: 6.5,
    price_inr: 541.125,
    change_24h: 0.2,
    change_24h_percent: 3.17,
    volume_24h: 180000000,
    market_cap: 4900000000,
    high_24h: 6.7,
    low_24h: 6.2,
    coinbase_product_id: 'UNI-USD'
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    price_usd: 85,
    price_inr: 7076.25,
    change_24h: 2.8,
    change_24h_percent: 3.41,
    volume_24h: 140000000,
    market_cap: 1200000000,
    high_24h: 87,
    low_24h: 81,
    coinbase_product_id: 'AAVE-USD'
  }
];

export async function POST() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize crypto markets with sample data
    const { error: marketsError } = await supabase
      .from('crypto_markets')
      .upsert(SAMPLE_CRYPTO_DATA.map(crypto => ({
        ...crypto,
        last_updated: new Date().toISOString()
      })), {
        onConflict: 'symbol'
      });

    if (marketsError) throw marketsError;

    // Initialize user INR wallet if not exists
    const { error: walletError } = await supabase
      .from('user_inr_wallet')
      .upsert({
        user_id: user.id,
        balance: 100000, // ₹1,00,000 demo balance
        total_deposited: 100000
      }, {
        onConflict: 'user_id'
      });

    if (walletError) throw walletError;

    return NextResponse.json({
      success: true,
      message: 'Crypto trading system initialized successfully',
      data: {
        markets_added: SAMPLE_CRYPTO_DATA.length,
        demo_balance: 100000
      }
    });

  } catch (error: any) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize', details: error.message },
      { status: 500 }
    );
  }
}
