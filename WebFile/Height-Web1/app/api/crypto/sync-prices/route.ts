
// app/api/crypto/sync-prices/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // In production, this would fetch real prices from Coinbase API
    // For now, simulate price updates with small random changes
    const { data: markets, error: fetchError } = await supabase
      .from('crypto_markets')
      .select('*')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    const usdInrRate = 83.25; // Mock rate
    const updatedMarkets = markets.map(market => {
      // Simulate price movement (±2%)
      const priceChange = (Math.random() - 0.5) * 0.04; // ±2%
      const newPriceUsd = market.price_usd * (1 + priceChange);
      const newPriceInr = newPriceUsd * usdInrRate;
      
      return {
        ...market,
        price_usd: newPriceUsd,
        price_inr: newPriceInr,
        change_24h: newPriceUsd - market.price_usd,
        change_24h_percent: priceChange * 100,
        last_updated: new Date().toISOString()
      };
    });

    // Update prices in database
    for (const market of updatedMarkets) {
      await supabase
        .from('crypto_markets')
        .update({
          price_usd: market.price_usd,
          price_inr: market.price_inr,
          change_24h: market.change_24h,
          change_24h_percent: market.change_24h_percent,
          last_updated: market.last_updated
        })
        .eq('symbol', market.symbol);

      // Store price history for charts
      await supabase
        .from('crypto_price_history')
        .insert({
          symbol: market.symbol,
          price_usd: market.price_usd,
          price_inr: market.price_inr,
          volume: market.volume_24h,
          timestamp: new Date().toISOString(),
          interval_type: '1m'
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Prices synchronized successfully',
      updated_count: updatedMarkets.length
    });

  } catch (error: any) {
    console.error('Price sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices', details: error.message },
      { status: 500 }
    );
  }
}