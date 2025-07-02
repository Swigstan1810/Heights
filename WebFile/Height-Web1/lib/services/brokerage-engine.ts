// lib/services/brokerage-engine.ts
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

export interface FeeStructure {
  spotTrading: number; // 0.08% for buy/sell/swap
  leverageTrading: number; // 0.08% on notional
  fundingRate: number; // Daily funding rate for leverage
  withdrawalFee: number; // 0 (only network fees)
  makerFee: number; // 0.08%
  takerFee: number; // 0.08%
}

export interface TradeParams {
  userId: string;
  tradeType: 'spot' | 'leverage' | 'swap';
  side: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  leverage?: number;
  walletAddress?: string;
}

export interface FeeCalculation {
  tradeAmount: number;
  feeAmount: number;
  feePercentage: number;
  netAmount: number;
  feeBreakdown: {
    tradingFee: number;
    networkFee?: number;
    fundingFee?: number;
  };
}

export interface WithdrawalParams {
  userId: string;
  asset: string;
  amount: number;
  toAddress: string;
  network: string;
}

export class BrokerageEngine {
  private supabase: any;
  private adminWallet: string;
  private feeStructure: FeeStructure;
  
  constructor() {
    // Initialize supabase lazily to prevent build-time errors
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development' || process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    
    this.adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || '';
    this.feeStructure = {
      spotTrading: 0.0008, // 0.08%
      leverageTrading: 0.0008, // 0.08%
      fundingRate: 0.0001, // 0.01% daily
      withdrawalFee: 0, // Only network fees
      makerFee: 0.0008,
      takerFee: 0.0008
    };
  }

  /**
   * Calculate fees for a trade
   */
  calculateTradeFees(params: TradeParams): FeeCalculation {
    const { tradeType, amount, price, leverage } = params;
    let feePercentage = 0;
    let fundingFee = 0;
    let notionalAmount = amount * price;

    switch (tradeType) {
      case 'spot':
      case 'swap':
        feePercentage = this.feeStructure.spotTrading;
        break;
      
      case 'leverage':
        feePercentage = this.feeStructure.leverageTrading;
        notionalAmount = notionalAmount * (leverage || 1);
        // Calculate daily funding fee if position is held
        fundingFee = notionalAmount * this.feeStructure.fundingRate;
        break;
    }

    const tradingFee = notionalAmount * feePercentage;
    const totalFee = tradingFee + fundingFee;
    
    return {
      tradeAmount: notionalAmount,
      feeAmount: totalFee,
      feePercentage: feePercentage * 100,
      netAmount: params.side === 'buy' 
        ? notionalAmount + totalFee 
        : notionalAmount - totalFee,
      feeBreakdown: {
        tradingFee,
        fundingFee: fundingFee > 0 ? fundingFee : undefined
      }
    };
  }

  /**
   * Process a trade with fee collection
   */
  async processTrade(params: TradeParams): Promise<{
    success: boolean;
    tradeId?: string;
    fees?: FeeCalculation;
    error?: string;
  }> {
    try {
      // Calculate fees
      const fees = this.calculateTradeFees(params);
      
      // Validate user balance
      const hasBalance = await this.validateUserBalance(
        params.userId,
        params.symbol,
        params.side === 'buy' ? fees.netAmount : params.amount
      );
      
      if (!hasBalance) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Record trade in database
      const { data: trade, error: tradeError } = await this.supabase
        .from('trades')
        .insert({
          user_id: params.userId,
          trade_type: params.tradeType,
          side: params.side,
          symbol: params.symbol,
          amount: params.amount,
          price: params.price,
          leverage: params.leverage,
          fee_amount: fees.feeAmount,
          fee_percentage: fees.feePercentage,
          net_amount: fees.netAmount,
          status: 'pending',
          wallet_address: params.walletAddress,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Execute trade logic (integrate with CCXT or DEX)
      const executed = await this.executeTrade(trade.id, params, fees);
      
      if (executed) {
        // Transfer fees to admin wallet
        await this.collectFees(trade.id, fees.feeAmount, params.symbol);
        
        // Update trade status
        await this.supabase
          .from('trades')
          .update({ 
            status: 'completed',
            executed_at: new Date().toISOString()
          })
          .eq('id', trade.id);

        return { 
          success: true, 
          tradeId: trade.id, 
          fees 
        };
      } else {
        throw new Error('Trade execution failed');
      }

    } catch (error) {
      console.error('Trade processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Trade failed' 
      };
    }
  }

  /**
   * Calculate withdrawal fees (network fees only)
   */
  async calculateWithdrawalFees(params: WithdrawalParams): Promise<{
    networkFee: number;
    totalFee: number;
    estimatedTime: string;
  }> {
    // Get current network fees
    const networkFees = await this.getNetworkFees(params.network);
    
    return {
      networkFee: networkFees,
      totalFee: networkFees, // No markup
      estimatedTime: this.getEstimatedWithdrawalTime(params.network)
    };
  }

  /**
   * Process withdrawal with only network fees
   */
  async processWithdrawal(params: WithdrawalParams): Promise<{
    success: boolean;
    withdrawalId?: string;
    txHash?: string;
    error?: string;
  }> {
    try {
      // Calculate fees
      const fees = await this.calculateWithdrawalFees(params);
      
      // Validate balance
      const totalAmount = params.amount + fees.networkFee;
      const hasBalance = await this.validateUserBalance(
        params.userId,
        params.asset,
        totalAmount
      );
      
      if (!hasBalance) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Record withdrawal
      const { data: withdrawal, error } = await this.supabase
        .from('withdrawals')
        .insert({
          user_id: params.userId,
          asset: params.asset,
          amount: params.amount,
          network_fee: fees.networkFee,
          to_address: params.toAddress,
          network: params.network,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Process withdrawal (integrate with blockchain)
      const txHash = await this.executeWithdrawal(withdrawal.id, params);
      
      if (txHash) {
        await this.supabase
          .from('withdrawals')
          .update({ 
            status: 'completed',
            tx_hash: txHash,
            completed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        return { 
          success: true, 
          withdrawalId: withdrawal.id,
          txHash 
        };
      }
      // Ensure all code paths return
      return { 
        success: false, 
        error: "Withdrawal failed to execute" 
      };

    } catch (error) {
      console.error('Withdrawal error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Withdrawal failed' 
      };
    }
  }

  /**
   * Get fee report for transparency
   */
  async getUserFeeReport(userId: string, period: 'day' | 'week' | 'month' | 'all'): Promise<{
    totalFees: number;
    feesByType: Record<string, number>;
    feesByAsset: Record<string, number>;
    trades: number;
    averageFeePerTrade: number;
  }> {
    const startDate = this.getStartDate(period);
    
    const { data: trades } = await this.supabase
      .from('trades')
      .select('fee_amount, trade_type, symbol')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    if (!trades || trades.length === 0) {
      return {
        totalFees: 0,
        feesByType: {},
        feesByAsset: {},
        trades: 0,
        averageFeePerTrade: 0
      };
    }

    const totalFees = trades.reduce((sum: number, t: any) => sum + t.fee_amount, 0);
    const feesByType: Record<string, number> = {};
    const feesByAsset: Record<string, number> = {};

    trades.forEach((trade: any) => {
      // By type
      if (!feesByType[trade.trade_type]) {
        feesByType[trade.trade_type] = 0;
      }
      feesByType[trade.trade_type] += trade.fee_amount;

      // By asset
      if (!feesByAsset[trade.symbol]) {
        feesByAsset[trade.symbol] = 0;
      }
      feesByAsset[trade.symbol] += trade.fee_amount;
    });

    return {
      totalFees,
      feesByType,
      feesByAsset,
      trades: trades.length,
      averageFeePerTrade: totalFees / trades.length
    };
  }

  /**
   * Update fee structure (admin only)
   */
  async updateFeeStructure(
    newFees: Partial<FeeStructure>,
    adminSignature: string
  ): Promise<boolean> {
    try {
      // Verify admin signature
      const isAdmin = await this.verifyAdminSignature(adminSignature);
      if (!isAdmin) {
        throw new Error('Unauthorized');
      }

      // Update fees
      this.feeStructure = {
        ...this.feeStructure,
        ...newFees
      };

      // Log fee update
      await this.supabase
        .from('fee_updates')
        .insert({
          old_fees: this.feeStructure,
          new_fees: newFees,
          updated_by: 'admin',
          updated_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Fee update error:', error);
      return false;
    }
  }

  // Private helper methods
  private async validateUserBalance(
    userId: string,
    asset: string,
    amount: number
  ): Promise<boolean> {
    const { data: balance } = await this.supabase
      .from('user_balances')
      .select('available_balance')
      .eq('user_id', userId)
      .eq('asset', asset)
      .single();

    return !!(balance && balance.available_balance >= amount);
  }

  private async executeTrade(
    tradeId: string,
    params: TradeParams,
    fees: FeeCalculation
  ): Promise<boolean> {
    // Implement actual trade execution
    // This would integrate with CCXT for CEX trades
    // or with smart contracts for DEX trades
    
    // Placeholder for now
    console.log('Executing trade:', tradeId, params, fees);
    return true;
  }

  private async collectFees(
    tradeId: string,
    feeAmount: number,
    asset: string
  ): Promise<void> {
    // Record fee collection
    await this.supabase
      .from('fee_collections')
      .insert({
        trade_id: tradeId,
        amount: feeAmount,
        asset,
        collected_at: new Date().toISOString()
      });

    // In production, this would transfer fees to admin wallet
    console.log(`Collected fee: ${feeAmount} ${asset} to ${this.adminWallet}`);
  }

  private async getNetworkFees(network: string): Promise<number> {
    // Implement actual network fee calculation
    // This would query current gas prices
    const fees: Record<string, number> = {
      'arbitrum': 0.001, // ETH
      'ethereum': 0.01, // ETH
      'bsc': 0.0005, // BNB
      'polygon': 0.001 // MATIC
    };
    
    return fees[network] || 0.001;
  }

  private getEstimatedWithdrawalTime(network: string): string {
    const times: Record<string, string> = {
      'arbitrum': '5-10 minutes',
      'ethereum': '10-20 minutes',
      'bsc': '5 minutes',
      'polygon': '5-10 minutes'
    };
    
    return times[network] || '10-30 minutes';
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return new Date(0); // All time
    }
  }

  private async verifyAdminSignature(signature: string): Promise<boolean> {
    // Implement signature verification
    // This would verify the signature matches admin wallet
    return true; // Placeholder
  }

  private async executeWithdrawal(
    withdrawalId: string,
    params: WithdrawalParams
  ): Promise<string> {
    // Implement actual withdrawal logic here
    // For now, return a mock tx hash
    return "0xMOCK_TX_HASH";
  }
}

export const brokerageEngine = new BrokerageEngine();