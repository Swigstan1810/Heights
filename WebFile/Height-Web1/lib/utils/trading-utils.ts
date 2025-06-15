// lib/utils/trading-utils.ts
export class TradingUtils {
    private static readonly USD_INR_RATE = 83.25; // Mock rate - in production, fetch from API
    private static readonly BROKERAGE_RATE = 0.001; // 0.1%
    private static readonly MIN_BROKERAGE = 10; // ₹10
    private static readonly MAX_BROKERAGE = 1000; // ₹1000
  
    /**
     * Calculate brokerage fee based on trade amount
     * Formula: ₹50 per ₹50,000 (0.1%) with min ₹10 and max ₹1000
     */
    static calculateBrokerageFee(amountInr: number): number {
      const calculatedFee = amountInr * this.BROKERAGE_RATE;
      return Math.max(this.MIN_BROKERAGE, Math.min(this.MAX_BROKERAGE, calculatedFee));
    }
  
    /**
     * Convert USD to INR
     */
    static usdToInr(usdAmount: number): number {
      return usdAmount * this.USD_INR_RATE;
    }
  
    /**
     * Convert INR to USD
     */
    static inrToUsd(inrAmount: number): number {
      return inrAmount / this.USD_INR_RATE;
    }
  
    /**
     * Format currency for display
     */
    static formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
      const locale = currency === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'INR' ? 2 : 8,
        maximumFractionDigits: currency === 'INR' ? 2 : 8,
      }).format(amount);
    }
  
    /**
     * Format percentage for display
     */
    static formatPercentage(value: number, includeSign: boolean = true): string {
      const sign = includeSign && value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    }
  
    /**
     * Format volume for display
     */
    static formatVolume(value: number): string {
      if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `₹${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `₹${(value / 1e3).toFixed(2)}K`;
      return this.formatCurrency(value);
    }
  
    /**
     * Calculate trade details for buy order
     */
    static calculateBuyOrder(amountInr: number, priceInr: number): {
      quantity: number;
      brokerageFee: number;
      netAmount: number;
      totalCost: number;
    } {
      const quantity = amountInr / priceInr;
      const brokerageFee = this.calculateBrokerageFee(amountInr);
      const totalCost = amountInr + brokerageFee;
      
      return {
        quantity,
        brokerageFee,
        netAmount: totalCost,
        totalCost
      };
    }
  
    /**
     * Calculate trade details for sell order
     */
    static calculateSellOrder(quantity: number, priceInr: number): {
      totalValue: number;
      brokerageFee: number;
      netAmount: number;
      receivedAmount: number;
    } {
      const totalValue = quantity * priceInr;
      const brokerageFee = this.calculateBrokerageFee(totalValue);
      const receivedAmount = totalValue - brokerageFee;
      
      return {
        totalValue,
        brokerageFee,
        netAmount: receivedAmount,
        receivedAmount
      };
    }
  
    /**
     * Validate trade parameters
     */
    static validateTrade(
      tradeType: 'buy' | 'sell',
      amount: number,
      price: number,
      availableBalance: number
    ): { valid: boolean; error?: string } {
      if (amount <= 0) {
        return { valid: false, error: 'Amount must be greater than 0' };
      }
  
      if (price <= 0) {
        return { valid: false, error: 'Price must be greater than 0' };
      }
  
      if (tradeType === 'buy') {
        const { totalCost } = this.calculateBuyOrder(amount, price);
        if (totalCost > availableBalance) {
          return { valid: false, error: 'Insufficient INR balance' };
        }
      } else {
        if (amount > availableBalance) {
          return { valid: false, error: 'Insufficient crypto balance' };
        }
      }
  
      return { valid: true };
    }
  
    /**
     * Generate crypto portfolio allocation suggestions
     */
    static generateAllocationSuggestions(
      totalValue: number,
      riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
    ): Array<{ symbol: string; name: string; allocation: number; rationale: string }> {
      const allocations = {
        conservative: [
          { symbol: 'BTC', name: 'Bitcoin', allocation: 60, rationale: 'Store of value, most stable crypto' },
          { symbol: 'ETH', name: 'Ethereum', allocation: 30, rationale: 'Smart contract platform, strong fundamentals' },
          { symbol: 'ADA', name: 'Cardano', allocation: 10, rationale: 'Research-driven, sustainable blockchain' }
        ],
        moderate: [
          { symbol: 'BTC', name: 'Bitcoin', allocation: 40, rationale: 'Digital gold, portfolio anchor' },
          { symbol: 'ETH', name: 'Ethereum', allocation: 35, rationale: 'DeFi and NFT ecosystem leader' },
          { symbol: 'SOL', name: 'Solana', allocation: 15, rationale: 'High-performance blockchain' },
          { symbol: 'DOT', name: 'Polkadot', allocation: 10, rationale: 'Interoperability and scaling' }
        ],
        aggressive: [
          { symbol: 'BTC', name: 'Bitcoin', allocation: 25, rationale: 'Foundation asset' },
          { symbol: 'ETH', name: 'Ethereum', allocation: 25, rationale: 'Innovation leader' },
          { symbol: 'SOL', name: 'Solana', allocation: 20, rationale: 'Fast-growing ecosystem' },
          { symbol: 'AVAX', name: 'Avalanche', allocation: 15, rationale: 'Ethereum competitor' },
          { symbol: 'MATIC', name: 'Polygon', allocation: 10, rationale: 'Layer 2 scaling solution' },
          { symbol: 'LINK', name: 'Chainlink', allocation: 5, rationale: 'Oracle network leader' }
        ]
      };
  
      return allocations[riskTolerance];
    }
  
    /**
     * Calculate portfolio risk score
     */
    static calculateRiskScore(holdings: Array<{
      symbol: string;
      allocation: number;
      volatility24h: number;
    }>): { score: number; level: 'Low' | 'Medium' | 'High'; recommendations: string[] } {
      if (holdings.length === 0) {
        return { score: 0, level: 'Low', recommendations: ['Start investing to build your portfolio'] };
      }
  
      // Calculate weighted average volatility
      const weightedVolatility = holdings.reduce((sum, holding) => {
        return sum + (holding.allocation / 100) * Math.abs(holding.volatility24h);
      }, 0);
  
      // Calculate concentration risk (Herfindahl index)
      const concentrationRisk = holdings.reduce((sum, holding) => {
        return sum + Math.pow(holding.allocation / 100, 2);
      }, 0);
  
      // Combine factors for final score
      const volatilityScore = Math.min(100, weightedVolatility * 2);
      const concentrationScore = concentrationRisk * 100;
      const finalScore = (volatilityScore + concentrationScore) / 2;
  
      let level: 'Low' | 'Medium' | 'High';
      let recommendations: string[] = [];
  
      if (finalScore < 30) {
        level = 'Low';
        recommendations = ['Your portfolio has low risk', 'Consider adding growth assets for higher returns'];
      } else if (finalScore < 70) {
        level = 'Medium';
        recommendations = ['Balanced risk profile', 'Monitor volatility and rebalance periodically'];
      } else {
        level = 'High';
        recommendations = [
          'High risk portfolio detected',
          'Consider reducing concentration in volatile assets',
          'Add stable assets like Bitcoin to reduce risk'
        ];
      }
  
      return { score: finalScore, level, recommendations };
    }
  
    /**
     * Generate rebalancing suggestions
     */
    static generateRebalancingSuggestions(
      currentHoldings: Array<{ symbol: string; currentAllocation: number; targetAllocation: number; value: number }>,
      totalPortfolioValue: number
    ): Array<{ symbol: string; action: 'buy' | 'sell'; amount: number; reason: string }> {
      const suggestions: Array<{ symbol: string; action: 'buy' | 'sell'; amount: number; reason: string }> = [];
      const threshold = 5; // 5% threshold for rebalancing
  
      currentHoldings.forEach(holding => {
        const difference = holding.currentAllocation - holding.targetAllocation;
        
        if (Math.abs(difference) > threshold) {
          const amountToAdjust = Math.abs(difference / 100) * totalPortfolioValue;
          
          if (difference > 0) {
            // Overweight - suggest selling
            suggestions.push({
              symbol: holding.symbol,
              action: 'sell',
              amount: amountToAdjust,
              reason: `Overweight by ${difference.toFixed(1)}% - reduce position`
            });
          } else {
            // Underweight - suggest buying
            suggestions.push({
              symbol: holding.symbol,
              action: 'buy',
              amount: amountToAdjust,
              reason: `Underweight by ${Math.abs(difference).toFixed(1)}% - increase position`
            });
          }
        }
      });
  
      return suggestions.sort((a, b) => b.amount - a.amount); // Sort by impact (amount)
    }
  
    /**
     * Calculate tax implications (simplified for India)
     */
    static calculateTaxImplications(
      gains: number,
      holdingPeriod: number // in days
    ): { taxRate: number; taxAmount: number; netGains: number } {
      // Simplified Indian crypto tax calculation
      // Short-term: 30% flat rate (regardless of holding period for crypto)
      const taxRate = 0.30; // 30% flat rate for crypto in India
      const taxAmount = Math.max(0, gains * taxRate);
      const netGains = gains - taxAmount;
  
      return { taxRate, taxAmount, netGains };
    }
  
    /**
     * Format time duration
     */
    static formatDuration(milliseconds: number): string {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
  
      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
      return `${seconds}s`;
    }
  
    /**
     * Debounce function for search and API calls
     */
    static debounce<T extends (...args: any[]) => any>(
      func: T,
      wait: number
    ): (...args: Parameters<T>) => void {
      let timeout: NodeJS.Timeout;
      return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    }
  
    /**
     * Throttle function for frequent updates
     */
    static throttle<T extends (...args: any[]) => any>(
      func: T,
      limit: number
    ): (...args: Parameters<T>) => void {
      let inThrottle: boolean;
      return (...args: Parameters<T>) => {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  }
  
  // types/trading.ts
  export interface CryptoMarket {
    symbol: string;
    name: string;
    price_usd: number;
    price_inr: number;
    change_24h: number;
    change_24h_percent: number;
    volume_24h: number;
    market_cap: number;
    high_24h: number;
    low_24h: number;
    coinbase_product_id: string;
    last_updated: string;
    is_active: boolean;
  }
  
  export interface TradeOrder {
    id: string;
    user_id: string;
    symbol: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price_usd: number;
    price_inr: number;
    total_usd: number;
    total_inr: number;
    brokerage_fee: number;
    net_amount: number;
    usd_inr_rate: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    executed_at?: string;
    wallet_address?: string;
  }
  
  export interface UserBalance {
    symbol: string;
    balance: number;
    locked_balance: number;
    average_buy_price: number;
    total_invested_inr: number;
    current_price_inr: number;
    current_value_inr: number;
    pnl_inr: number;
    pnl_percentage: number;
  }
  
  export interface PortfolioSummary {
    total_invested_inr: number;
    current_value_inr: number;
    total_pnl_inr: number;
    total_pnl_percentage: number;
    holdings_count: number;
    inr_balance: number;
  }
  
  // scripts/init-demo-data.ts
  import { createClient } from '@supabase/supabase-js';
  
  const DEMO_CRYPTO_DATA = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price_usd: 45000,
      change_24h_percent: 2.74,
      volume_24h: 28500000000,
      market_cap: 880000000000,
      coinbase_product_id: 'BTC-USD'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price_usd: 3000,
      change_24h_percent: 2.92,
      volume_24h: 15200000000,
      market_cap: 360000000000,
      coinbase_product_id: 'ETH-USD'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price_usd: 100,
      change_24h_percent: 3.62,
      volume_24h: 2800000000,
      market_cap: 45000000000,
      coinbase_product_id: 'SOL-USD'
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price_usd: 0.5,
      change_24h_percent: 4.17,
      volume_24h: 450000000,
      market_cap: 17500000000,
      coinbase_product_id: 'ADA-USD'
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      price_usd: 7,
      change_24h_percent: 3.70,
      volume_24h: 280000000,
      market_cap: 9000000000,
      coinbase_product_id: 'DOT-USD'
    }
  ];
  
  export async function initializeDemoData(supabaseUrl: string, supabaseAnonKey: string, userId: string) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const usdInrRate = 83.25;
  
    try {
      console.log('Initializing demo data...');
  
      // 1. Initialize crypto markets
      const marketsToInsert = DEMO_CRYPTO_DATA.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price_usd: crypto.price_usd,
        price_inr: crypto.price_usd * usdInrRate,
        change_24h: crypto.price_usd * (crypto.change_24h_percent / 100),
        change_24h_percent: crypto.change_24h_percent,
        volume_24h: crypto.volume_24h,
        market_cap: crypto.market_cap,
        high_24h: crypto.price_usd * 1.05,
        low_24h: crypto.price_usd * 0.95,
        coinbase_product_id: crypto.coinbase_product_id,
        is_active: true,
        last_updated: new Date().toISOString()
      }));
  
      const { error: marketsError } = await supabase
        .from('crypto_markets')
        .upsert(marketsToInsert, { onConflict: 'symbol' });
  
      if (marketsError) {
        console.error('Error inserting markets:', marketsError);
        return;
      }
  
      console.log('✅ Crypto markets initialized');
  
      // 2. Initialize user INR wallet
      const { error: walletError } = await supabase
        .from('user_inr_wallet')
        .upsert({
          user_id: userId,
          balance: 100000, // ₹1,00,000 demo balance
          total_deposited: 100000
        }, { onConflict: 'user_id' });
  
      if (walletError) {
        console.error('Error initializing wallet:', walletError);
        return;
      }
  
      console.log('✅ User INR wallet initialized with ₹1,00,000');
  
      // 3. Create some demo trades (optional)
      const demoTrades = [
        {
          user_id: userId,
          symbol: 'BTC',
          trade_type: 'buy',
          quantity: 0.001,
          price_usd: 44000,
          price_inr: 44000 * usdInrRate,
          total_usd: 44,
          total_inr: 44 * usdInrRate,
          brokerage_fee: TradingUtils.calculateBrokerageFee(44 * usdInrRate),
          net_amount: (44 * usdInrRate) + TradingUtils.calculateBrokerageFee(44 * usdInrRate),
          usd_inr_rate: usdInrRate,
          status: 'completed',
          executed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
          user_id: userId,
          symbol: 'ETH',
          trade_type: 'buy',
          quantity: 0.05,
          price_usd: 2900,
          price_inr: 2900 * usdInrRate,
          total_usd: 145,
          total_inr: 145 * usdInrRate,
          brokerage_fee: TradingUtils.calculateBrokerageFee(145 * usdInrRate),
          net_amount: (145 * usdInrRate) + TradingUtils.calculateBrokerageFee(145 * usdInrRate),
          usd_inr_rate: usdInrRate,
          status: 'completed',
          executed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        }
      ];
  
      const { error: tradesError } = await supabase
        .from('crypto_trades')
        .insert(demoTrades);
  
      if (tradesError) {
        console.error('Error inserting demo trades:', tradesError);
      } else {
        console.log('✅ Demo trades created');
      }
  
      console.log('🎉 Demo data initialization complete!');
      return { success: true, message: 'Demo data initialized successfully' };
  
    } catch (error) {
      console.error('Error initializing demo data:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  // constants/trading.ts
  export const TRADING_CONSTANTS = {
    USD_INR_RATE: 83.25,
    BROKERAGE_RATE: 0.001, // 0.1%
    MIN_BROKERAGE: 10, // ₹10
    MAX_BROKERAGE: 1000, // ₹1000
    MIN_TRADE_AMOUNT: 100, // ₹100
    MAX_TRADE_AMOUNT: 1000000, // ₹10,00,000
    PRICE_UPDATE_INTERVAL: 5000, // 5 seconds
    DATA_REFRESH_INTERVAL: 30000, // 30 seconds
    SUPPORTED_CRYPTOCURRENCIES: [
      'BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX', 'UNI', 'AAVE'
    ],
    RISK_LEVELS: {
      LOW: { min: 0, max: 30, color: 'green' },
      MEDIUM: { min: 30, max: 70, color: 'yellow' },
      HIGH: { min: 70, max: 100, color: 'red' }
    }
  } as const;