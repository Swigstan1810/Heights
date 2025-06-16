// app/api/coinbase/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // The coinbase_price_feed table is deleted, so return empty data
    return NextResponse.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
      warning: 'coinbase_price_feed table has been removed'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'coinbase_price_feed table has been removed',
    success: false
  }, { status: 410 });
}