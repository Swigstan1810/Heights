// app/api/coinbase/products/route.ts
import { NextResponse } from 'next/server';
import { coinbaseAPI } from '@/lib/services/coinbase-api';

// Cache for products data
let productsCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

export async function GET() {
  try {
    console.log('[Products API] Fetching Coinbase products...');
    
    // Check cache first
    const now = Date.now();
    if (productsCache && (now - productsCache.timestamp) < CACHE_DURATION) {
      console.log('[Products API] Returning cached data');
      return NextResponse.json({
        success: true,
        data: productsCache.data,
        cached: true,
        timestamp: new Date(productsCache.timestamp).toISOString()
      });
    }

    // Health check first
    const isHealthy = await coinbaseAPI.healthCheck();
    if (!isHealthy) {
      console.warn('[Products API] Coinbase API health check failed');
      return NextResponse.json({
        success: false,
        error: 'Coinbase API is currently unavailable',
        data: [],
        fallback: true
      }, { status: 503 });
    }

    // Get USD trading pairs from Coinbase
    const products = await coinbaseAPI.getAllUSDPairs();
    
    if (!products || products.length === 0) {
      console.warn('[Products API] No products returned from Coinbase API');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No trading pairs available at the moment',
        timestamp: new Date().toISOString()
      });
    }

    // Sort by volume descending and filter out invalid data
    const validProducts = products
      .filter(product => 
        product && 
        product.price > 0 && 
        product.symbol && 
        product.id
      )
      .sort((a, b) => b.volume24h - a.volume24h)
      .map(product => ({
        id: product.id,
        symbol: product.symbol,
        name: product.name,
        price: Number(product.price.toFixed(2)),
        change24h: Number(product.change24h.toFixed(2)),
        change24hPercent: Number(((product.change24h / (product.price - product.change24h)) * 100).toFixed(2)),
        volume24h: Number(product.volume24h.toFixed(0)),
        high24h: Number(product.high24h.toFixed(2)),
        low24h: Number(product.low24h.toFixed(2)),
        lastUpdated: new Date().toISOString()
      }));

    // Update cache
    productsCache = {
      data: validProducts,
      timestamp: now
    };

    console.log(`[Products API] Successfully fetched ${validProducts.length} products`);
    
    return NextResponse.json({
      success: true,
      data: validProducts,
      count: validProducts.length,
      timestamp: new Date().toISOString(),
      cached: false
    });

  } catch (error: any) {
    console.error('[Products API] Error fetching Coinbase products:', error);
    
    // Return cached data if available, even if expired
    if (productsCache && productsCache.data.length > 0) {
      console.log('[Products API] Returning stale cached data due to error');
      return NextResponse.json({
        success: true,
        data: productsCache.data,
        cached: true,
        stale: true,
        error: 'Using cached data due to API error',
        timestamp: new Date(productsCache.timestamp).toISOString()
      });
    }

    // Return minimal fallback data
    const fallbackProducts = [
      {
        id: 'BTC-USD',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 0,
        change24h: 0,
        change24hPercent: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0,
        lastUpdated: new Date().toISOString(),
        fallback: true
      },
      {
        id: 'ETH-USD',
        symbol: 'ETH',
        name: 'Ethereum', 
        price: 0,
        change24h: 0,
        change24hPercent: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0,
        lastUpdated: new Date().toISOString(),
        fallback: true
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products from Coinbase',
      message: error.message || 'Coinbase API temporarily unavailable',
      data: fallbackProducts,
      fallback: true,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// Add POST method for manual cache refresh (optional)
export async function POST() {
  try {
    // Clear cache
    productsCache = null;
    
    // Force fresh fetch
    const response = await GET();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared and data refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh cache',
      message: error.message
    }, { status: 500 });
  }
}