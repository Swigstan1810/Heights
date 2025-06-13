// lib/services/portfolio-service.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation: number;
  walletAddress?: string;
  blockchain?: string;
}

interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  numberOfAssets: number;
  bestPerformer: PortfolioAsset | null;
  worstPerformer: PortfolioAsset | null;
  cagr: number;
  sharpeRatio: number;
  volatility: number;
  riskScore: number;
}

interface HistoricalDataPoint {
  date: string;
  value: number;
  pnl: number;
}

class PortfolioService {
  private supabase = createClientComponentClient<Database>();
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private CACHE_DURATION = 60 * 1000; // 1 minute

  async syncWalletHoldings(userId: string, walletAddress: string, holdings: any[]) {
    try {
      const updates = holdings.map(holding => ({
        user_id: userId,
        wallet_address: walletAddress,
        symbol: holding.symbol,
        name: holding.name || holding.symbol,
        asset_type: 'crypto',
        quantity: holding.quantity,
        current_price: holding.price,
        current_value: holding.quantity * holding.price,
        is_wallet_holding: true,
        blockchain: holding.blockchain || 'ethereum',
        token_address: holding.tokenAddress,
        updated_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('portfolio_holdings')
        .upsert(updates, {
          onConflict: 'user_id,symbol,wallet_address'
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error syncing wallet holdings:', error);
      return { success: false, error };
    }
  }

  async getPortfolioAssets(userId: string): Promise<PortfolioAsset[]> {
    try {
      const { data: holdings, error } = await this.supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId)
        .gt('quantity', 0);

      if (error) throw error;
      if (!holdings || holdings.length === 0) return [];

      // Update prices for all holdings
      const updatedHoldings = await this.updatePrices(holdings);

      // Calculate portfolio metrics
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.current_value, 0);

      return updatedHoldings.map(holding => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        averageBuyPrice: holding.average_buy_price,
        currentPrice: holding.current_price,
        value: holding.current_value,
        profitLoss: holding.current_value - holding.total_invested,
        profitLossPercentage: ((holding.current_value - holding.total_invested) / holding.total_invested) * 100,
        allocation: (holding.current_value / totalValue) * 100,
        walletAddress: holding.wallet_address || undefined,
        blockchain: holding.blockchain || 'ethereum'
      }));
    } catch (error) {
      console.error('Error fetching portfolio assets:', error);
      return [];
    }
  }

  async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics | null> {
    try {
      const assets = await this.getPortfolioAssets(userId);
      if (assets.length === 0) return null;

      const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
      const totalInvested = assets.reduce((sum, a) => sum + (a.value / (1 + a.profitLossPercentage / 100)), 0);
      const totalProfitLoss = totalValue - totalInvested;
      const totalProfitLossPercentage = (totalProfitLoss / totalInvested) * 100;

      // Sort by performance
      const sortedByPerformance = [...assets].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage);
      const bestPerformer = sortedByPerformance[0] || null;
      const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1] || null;

      // Calculate CAGR (assuming 1 year for simplicity)
      const years = 1;
      const cagr = totalInvested > 0 ? (Math.pow(totalValue / totalInvested, 1 / years) - 1) * 100 : 0;

      // Calculate volatility and risk metrics
      const returns = assets.map(a => a.profitLossPercentage);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      // Simplified Sharpe Ratio (assuming risk-free rate of 2%)
      const riskFreeRate = 2;
      const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;

      // Risk score (0-100)
      const riskScore = Math.min(100, Math.max(0, volatility * 2));

      return {
        totalValue,
        totalInvested,
        totalProfitLoss,
        totalProfitLossPercentage,
        numberOfAssets: assets.length,
        bestPerformer,
        worstPerformer,
        cagr,
        sharpeRatio,
        volatility,
        riskScore
      };
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      return null;
    }
  }

  async getHistoricalPerformance(userId: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    // In a real implementation, this would fetch historical price data
    // For now, we'll generate mock data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dataPoints: HistoricalDataPoint[] = [];
    const currentMetrics = await this.getPortfolioMetrics(userId);
    
    if (!currentMetrics) return [];

    // Generate daily data points
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Add some random variance to simulate price movement
      const variance = (Math.random() - 0.5) * 0.05; // ±5% daily variance
      const dayProgress = i / days;
      const value = currentMetrics.totalInvested + 
        (currentMetrics.totalProfitLoss * dayProgress) * (1 + variance);
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        value,
        pnl: value - currentMetrics.totalInvested
      });
    }

    return dataPoints;
  }

  private async updatePrices(holdings: any[]): Promise<any[]> {
    // Get unique symbols
    const symbols = [...new Set(holdings.map(h => h.symbol.toLowerCase()))];
    const now = Date.now();

    // Filter symbols that need price updates
    const symbolsToUpdate = symbols.filter(symbol => {
      const cached = this.priceCache.get(symbol);
      return !cached || (now - cached.timestamp) > this.CACHE_DURATION;
    });

    if (symbolsToUpdate.length > 0) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsToUpdate.join(',')}&vs_currencies=usd`
        );
        const prices = await response.json();

        // Update cache
        Object.entries(prices).forEach(([symbol, data]: [string, any]) => {
          this.priceCache.set(symbol, {
            price: data.usd,
            timestamp: now
          });
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    }

    // Update holdings with latest prices
    return holdings.map(holding => {
      const cached = this.priceCache.get(holding.symbol.toLowerCase());
      const currentPrice = cached?.price || holding.current_price;
      const currentValue = holding.quantity * currentPrice;

      return {
        ...holding,
        current_price: currentPrice,
        current_value: currentValue,
        profit_loss: currentValue - holding.total_invested,
        profit_loss_percentage: ((currentValue - holding.total_invested) / holding.total_invested) * 100
      };
    });
  }

  async exportPortfolio(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const assets = await this.getPortfolioAssets(userId);
    
    if (format === 'json') {
      return JSON.stringify(assets, null, 2);
    }

    // CSV format
    const headers = ['Symbol', 'Name', 'Quantity', 'Avg Buy Price', 'Current Price', 'Value', 'P&L', 'P&L %', 'Allocation %'];
    const rows = assets.map(a => [
      a.symbol,
      a.name,
      a.quantity.toFixed(8),
      a.averageBuyPrice.toFixed(2),
      a.currentPrice.toFixed(2),
      a.value.toFixed(2),
      a.profitLoss.toFixed(2),
      a.profitLossPercentage.toFixed(2),
      a.allocation.toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const portfolioService = new PortfolioService();