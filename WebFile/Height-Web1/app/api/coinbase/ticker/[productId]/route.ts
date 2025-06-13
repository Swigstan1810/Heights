
// app/api/coinbase/ticker/[productId]/route.ts
import { NextResponse } from 'next/server';
import { coinbaseAPI } from '@/lib/services/coinbase-api';

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const ticker = await coinbaseAPI.getTicker(params.productId);
    const stats = await coinbaseAPI.get24hrStats(params.productId);
    
    return NextResponse.json({
      ticker,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching ticker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker', details: error.message },
      { status: 500 }
    );
  }
}
