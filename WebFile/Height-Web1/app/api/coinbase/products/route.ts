// app/api/coinbase/products/route.ts
import { NextResponse } from 'next/server';
import { coinbaseAPI } from '@/lib/services/coinbase-api';

export async function GET() {
  try {
    // Get all USD trading pairs from Coinbase
    const products = await coinbaseAPI.getAllUSDPairs();
    
    // Sort by volume descending
    products.sort((a, b) => b.volume24h - a.volume24h);
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching Coinbase products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}
