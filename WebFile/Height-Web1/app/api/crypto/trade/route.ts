// app/api/crypto/trade/route.ts - Fixed Portfolio Integration API
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, tradeType, quantity, priceUSD, totalINR, userId } = body;

    // Validate input
    if (!symbol || !tradeType || !quantity || !priceUSD || !totalINR) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const priceINR = priceUSD * 83; // USD to INR conversion

    // Get current wallet balance - fixed to handle single result
    const { data: wallet, error: walletError } = await supabase
      .from('wallet_balance')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'INR')
      .single();

    if (walletError) {
      console.error('Wallet error:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet balance' },
        { status: 500 }
      );
    }

    // Check if user has sufficient balance for buy orders
    if (tradeType === 'buy' && totalINR > wallet.balance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Get current holding if exists
    const { data: currentHolding } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .eq('asset_type', 'crypto')
      .single();

    // For sell orders, check if user has enough crypto
    if (tradeType === 'sell') {
      if (!currentHolding || quantity > currentHolding.quantity) {
        return NextResponse.json(
          { error: 'Insufficient crypto balance' },
          { status: 400 }
        );
      }
    }

    // Calculate new holding values
    let newQuantity: number;
    let newTotalInvested: number;
    let newAverageBuyPrice: number;

    if (currentHolding) {
      if (tradeType === 'buy') {
        newQuantity = currentHolding.quantity + quantity;
        newTotalInvested = currentHolding.total_invested + totalINR;
        newAverageBuyPrice = newTotalInvested / newQuantity;
      } else {
        newQuantity = Math.max(0, currentHolding.quantity - quantity);
        if (newQuantity > 0) {
          newAverageBuyPrice = currentHolding.average_buy_price;
          newTotalInvested = newQuantity * newAverageBuyPrice;
        } else {
          newAverageBuyPrice = 0;
          newTotalInvested = 0;
        }
      }
    } else {
      // New holding (only for buy orders)
      newQuantity = quantity;
      newTotalInvested = totalINR;
      newAverageBuyPrice = priceINR;
    }

    const newCurrentValue = newQuantity * priceINR;
    const newProfitLoss = newCurrentValue - newTotalInvested;
    const newProfitLossPercentage = newTotalInvested > 0 ? (newProfitLoss / newTotalInvested) * 100 : 0;

    // Execute trade using the database function
    const { error: transactionError } = await supabase.rpc('handle_crypto_trade', {
      p_user_id: user.id,
      p_symbol: symbol,
      p_trade_type: tradeType,
      p_quantity: quantity,
      p_price_inr: priceINR,
      p_total_inr: totalINR,
      p_new_quantity: newQuantity,
      p_new_total_invested: newTotalInvested,
      p_new_average_buy_price: newAverageBuyPrice,
      p_new_current_value: newCurrentValue,
      p_new_profit_loss: newProfitLoss,
      p_new_profit_loss_percentage: newProfitLossPercentage,
      p_asset_name: getCryptoName(symbol)
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to execute trade: ' + transactionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity.toFixed(6)} ${symbol}`,
      data: {
        symbol,
        tradeType,
        quantity,
        priceINR,
        totalINR,
        newQuantity,
        newCurrentValue,
        newProfitLoss,
        newProfitLossPercentage
      }
    });

  } catch (error) {
    console.error('Trade API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get crypto names
function getCryptoName(symbol: string): string {
  const names: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'SOL': 'Solana',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'AVAX': 'Avalanche',
    'DOT': 'Polkadot',
    'ADA': 'Cardano',
    'UNI': 'Uniswap',
    'AAVE': 'Aave'
  };
  return names[symbol] || symbol;
}