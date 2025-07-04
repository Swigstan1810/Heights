export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  // PRODUCTION LOCK - Market data APIs disabled for launch
  return NextResponse.json(
    { success: false, error: 'Market data API temporarily disabled for production launch' },
    { status: 503 }
  );
}