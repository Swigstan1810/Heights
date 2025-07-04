// app/api/crypto/markets/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { serverOnchainPriceService } from '@/lib/services/server-onchain-service';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get authentication status but don't require it for market data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Get real-time on-chain data first
    let onchainTokens: any[] = [];
    try {
      onchainTokens = await serverOnchainPriceService.getAllSupportedTokens();
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
    }
    
    // Market data should be accessible without authentication
    const { data: markets, error } = await supabase
      .from('crypto_markets')
      .select(`
        id,
        symbol,
        name,
        price_usd,
        price_inr,
        change_24h,
        change_24h_percent,
        volume_24h,
        market_cap,
        high_24h,
        low_24h,
        coinbase_product_id,
        last_updated
      `)
      .eq('is_active', true)
      .order('volume_24h', { ascending: false })
      .limit(50); // Limit results for performance

    // Combine on-chain data with traditional market data
    const combinedMarkets = [];
    
    // Add on-chain tokens first (priority for real-time data)
    for (const token of onchainTokens) {
      combinedMarkets.push({
        id: token.symbol.toLowerCase(),
        symbol: token.symbol,
        name: token.name,
        price_usd: token.price || token.priceInUSD || 0,
        price_inr: (token.price || token.priceInUSD || 0) * 83,
        change_24h: token.change24h || 0,
        change_24h_percent: token.change24hPercent || 0,
        volume_24h: token.volume24h || 0,
        market_cap: token.marketCap || 0,
        high_24h: (token.price || 0) * 1.05,
        low_24h: (token.price || 0) * 0.95,
        coinbase_product_id: `${token.symbol}-USD`,
        last_updated: token.timestamp || new Date().toISOString(),
        source: 'onchain',
        network: token.network || 'arbitrum'
      });
    }
    
    // If we get a permission error or no data, include sample data
    if ((error && error.code === 'PGRST301') || combinedMarkets.length === 0) {
      console.log('Including sample/fallback data');
      const sampleMarkets = [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price_usd: 43250.50,
          price_inr: 3595000,
          change_24h: 1250.30,
          change_24h_percent: 2.98,
          volume_24h: 28500000000,
          market_cap: 847000000000,
          high_24h: 44100.25,
          low_24h: 42180.75,
          coinbase_product_id: 'BTC-USD',
          last_updated: new Date().toISOString(),
          source: 'sample',
          network: 'external'
        }
      ];
      
      // Add sample data only if not already present
      const existingSymbols = new Set(combinedMarkets.map(m => m.symbol));
      for (const sample of sampleMarkets) {
        if (!existingSymbols.has(sample.symbol)) {
          combinedMarkets.push(sample);
        }
      }
    }
    
    if (error) throw error;

    // Add traditional market data if available and not overlapping
    if (markets && Array.isArray(markets)) {
      const existingSymbols = new Set(combinedMarkets.map(m => m.symbol));
      for (const market of markets) {
        if (!existingSymbols.has(market.symbol)) {
          combinedMarkets.push({
            ...market,
            price_usd: Number(market.price_usd) || 0,
            price_inr: Number(market.price_inr) || 0,
            change_24h: Number(market.change_24h) || 0,
            change_24h_percent: Number(market.change_24h_percent) || 0,
            volume_24h: Number(market.volume_24h) || 0,
            market_cap: Number(market.market_cap) || 0,
            high_24h: Number(market.high_24h) || 0,
            low_24h: Number(market.low_24h) || 0,
            source: 'database'
          });
        }
      }
    }
    
    // Sanitize and sort data
    const sanitizedMarkets = combinedMarkets.map(market => ({
      ...market,
      price_usd: Number(market.price_usd) || 0,
      price_inr: Number(market.price_inr) || 0,
      change_24h: Number(market.change_24h) || 0,
      change_24h_percent: Number(market.change_24h_percent) || 0,
      volume_24h: Number(market.volume_24h) || 0,
      market_cap: Number(market.market_cap) || 0,
      high_24h: Number(market.high_24h) || 0,
      low_24h: Number(market.low_24h) || 0
    })).sort((a, b) => {
      // Prioritize on-chain data, then by volume
      if (a.source === 'onchain' && b.source !== 'onchain') return -1;
      if (b.source === 'onchain' && a.source !== 'onchain') return 1;
      return (b.volume_24h || 0) - (a.volume_24h || 0);
    });

    return NextResponse.json({ 
      success: true, 
      data: sanitizedMarkets,
      meta: {
        onchain_tokens: onchainTokens.length,
        total_tokens: sanitizedMarkets.length,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}