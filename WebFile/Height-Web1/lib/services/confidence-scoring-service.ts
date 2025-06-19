// Create new file: lib/services/confidence-scoring-service.ts

import { 
    EnhancedAnalysis, 
    TimeframeAnalysis, 
    TradeSetup, 
    AIPrediction,
    TimeframeTrend,
    TradeTarget 
  } from '@/types/ai-types';
  
  export class ConfidenceScoringService {
    private static instance: ConfidenceScoringService;
    
    private constructor() {}
    
    static getInstance(): ConfidenceScoringService {
      if (!ConfidenceScoringService.instance) {
        ConfidenceScoringService.instance = new ConfidenceScoringService();
      }
      return ConfidenceScoringService.instance;
    }
  
    // Calculate comprehensive confidence score
    calculateConfidenceScore(
      technical: any,
      fundamental: any,
      marketData: any,
      news: any
    ): EnhancedAnalysis['confidenceFactors'] {
      const technicalAlignment = this.calculateTechnicalAlignment(technical);
      const fundamentalStrength = this.calculateFundamentalStrength(fundamental);
      const marketConditions = this.calculateMarketConditions(marketData);
      const newssentiment = this.calculateNewsSentiment(news);
  
      return {
        technicalAlignment,
        fundamentalStrength,
        marketConditions,
        newssentiment
      };
    }
  
    private calculateTechnicalAlignment(technical: any): number {
      let score = 50; // Base score
  
      // RSI alignment
      if (technical.rsi) {
        if (technical.rsi < 30) score += 10; // Oversold
        else if (technical.rsi > 70) score -= 10; // Overbought
        else score += 5; // Neutral is good
      }
  
      // Trend alignment
      if (technical.trend?.trend === 'up' && technical.macd?.signal === 'bullish') {
        score += 20;
      } else if (technical.trend?.trend === 'down' && technical.macd?.signal === 'bearish') {
        score += 15; // Alignment even in downtrend
      }
  
      // Support/Resistance positioning
      if (technical.support && technical.resistance) {
        const pricePosition = (technical.currentPrice - technical.support) / 
                             (technical.resistance - technical.support);
        if (pricePosition > 0.3 && pricePosition < 0.7) {
          score += 10; // Good risk/reward position
        }
      }
  
      return Math.min(100, Math.max(0, score));
    }
  
    private calculateFundamentalStrength(fundamental: any): number {
      if (!fundamental) return 50;
  
      let score = 50;
  
      // P/E ratio analysis
      if (fundamental.pe && fundamental.sectorAvgPE) {
        if (fundamental.pe < fundamental.sectorAvgPE * 0.8) score += 15;
        else if (fundamental.pe > fundamental.sectorAvgPE * 1.2) score -= 10;
      }
  
      // Growth metrics
      if (fundamental.revenueGrowth > 0.15) score += 10;
      if (fundamental.epsGrowth > 0.20) score += 15;
  
      // Profitability
      if (fundamental.roe > 0.15) score += 10;
      if (fundamental.operatingMargin > 0.20) score += 10;
  
      return Math.min(100, Math.max(0, score));
    }
  
    private calculateMarketConditions(marketData: any): number {
      let score = 50;
  
      // Market trend
      if (marketData.sentiment === 'bullish') score += 15;
      else if (marketData.sentiment === 'bearish') score -= 15;
  
      // Volume analysis
      if (marketData.volumeRatio > 1.2) score += 10; // High volume
      else if (marketData.volumeRatio < 0.8) score -= 5; // Low volume
  
      // Volatility
      if (marketData.volatility < 0.15) score += 10; // Low volatility
      else if (marketData.volatility > 0.30) score -= 10; // High volatility
  
      return Math.min(100, Math.max(0, score));
    }
  
    private calculateNewsSentiment(news: any): number {
      if (!news || news.length === 0) return 50;
  
      const sentimentScores = news.map((item: any) => {
        switch (item.sentiment) {
          case 'positive': return 70;
          case 'negative': return 30;
          default: return 50;
        }
      });
  
      const avgSentiment = sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length;
      
      // Adjust for news volume
      if (news.length > 5) {
        return avgSentiment * 1.1; // More news = higher confidence
      }
      
      return avgSentiment;
    }
  
    // Multi-timeframe analysis
    analyzeTimeframes(priceData: any): TimeframeAnalysis {
      const timeframes = ['1min', '5min', '15min', '1hour', '4hour', 'daily', 'weekly', 'monthly'];
      const analysis: any = {};
  
      timeframes.forEach(tf => {
        analysis[tf] = this.analyzeTimeframe(priceData, tf);
      });
  
      // Calculate alignment
      const trends = Object.values(analysis).map((a: any) => a.trend);
      const bullishCount = trends.filter(t => t === 'bullish').length;
      const bearishCount = trends.filter(t => t === 'bearish').length;
      
      const alignment = Math.max(bullishCount, bearishCount) / trends.length * 100;
      const primaryTrend = bullishCount > bearishCount ? 'bullish' : 
                          bearishCount > bullishCount ? 'bearish' : 'neutral';
      const conviction = alignment > 80 ? 'strong' : alignment > 60 ? 'moderate' : 'weak';
  
      return {
        ...analysis,
        summary: {
          alignment,
          primaryTrend,
          conviction
        }
      };
    }
  
    private analyzeTimeframe(priceData: any, timeframe: string): TimeframeTrend {
      // Simplified analysis - in production, use actual price data
      const mockTrend = Math.random() > 0.5 ? 'bullish' : 'bearish';
      const strength = Math.random() * 100;
      
      return {
        trend: mockTrend as any,
        strength,
        momentum: strength > 70 ? 'increasing' : strength < 30 ? 'decreasing' : 'stable',
        keyLevels: {
          support: priceData.currentPrice * 0.95,
          resistance: priceData.currentPrice * 1.05,
          pivot: priceData.currentPrice
        }
      };
    }
  
    // Risk/Reward Calculator
    calculateTradeSetup(
      symbol: string,
      currentPrice: number,
      analysis: any,
      portfolioSize: number
    ): TradeSetup {
      // Calculate entry based on analysis
      const entry = this.calculateOptimalEntry(currentPrice, analysis);
      const stopLoss = this.calculateStopLoss(entry, analysis);
      const targets = this.calculateTargets(entry, analysis);
      
      const risk = entry - stopLoss;
      const reward = targets[0].price - entry;
      const riskRewardRatio = reward / risk;
      
      // Position sizing based on Kelly Criterion
      const winProbability = analysis.confidence / 100;
      const kellyPercentage = this.calculateKellyCriterion(winProbability, riskRewardRatio);
      
      // Conservative position sizing
      const positionSize = portfolioSize * Math.min(kellyPercentage * 0.25, 0.05); // Max 5% per trade
      const portfolioPercentage = (positionSize / portfolioSize) * 100;
      const maxLoss = positionSize * (risk / entry);
      const expectedReturn = positionSize * (reward / entry) * winProbability;
  
      return {
        symbol,
        currentPrice,
        entry,
        stopLoss,
        targets,
        riskRewardRatio,
        positionSize,
        portfolioPercentage,
        maxLoss,
        expectedReturn,
        winProbability,
        kellyPercentage,
        setup: {
          pattern: analysis.pattern,
          trigger: analysis.trigger,
          timeframe: analysis.timeframe
        }
      };
    }
  
    private calculateOptimalEntry(currentPrice: number, analysis: any): number {
      // Entry logic based on analysis
      if (analysis.trend === 'bullish') {
        return currentPrice * 1.001; // Slight premium for bullish
      } else if (analysis.trend === 'bearish') {
        return currentPrice * 0.999; // Slight discount for bearish
      }
      return currentPrice;
    }
  
    private calculateStopLoss(entry: number, analysis: any): number {
      // Dynamic stop loss based on volatility and timeframe
      const baseStop = 0.02; // 2% base stop
      const volatilityAdjustment = analysis.volatility || 1;
      const stopPercentage = baseStop * volatilityAdjustment;
      
      return entry * (1 - stopPercentage);
    }
  
    private calculateTargets(entry: number, analysis: any): TradeTarget[] {
      const targets: TradeTarget[] = [];
      
      // Three targets with different risk/reward ratios
      const baseTarget = analysis.resistance || entry * 1.05;
      
      targets.push({
        price: entry + (entry - analysis.stopLoss) * 1.5, // 1.5:1 RR
        percentage: 40,
        riskReward: 1.5,
        probability: 0.70
      });
      
      targets.push({
        price: entry + (entry - analysis.stopLoss) * 2.5, // 2.5:1 RR
        percentage: 40,
        riskReward: 2.5,
        probability: 0.50
      });
      
      targets.push({
        price: entry + (entry - analysis.stopLoss) * 4, // 4:1 RR
        percentage: 20,
        riskReward: 4,
        probability: 0.30
      });
      
      return targets;
    }
  
    private calculateKellyCriterion(winProbability: number, odds: number): number {
      // Kelly Criterion: f = (p * b - q) / b
      // where f = fraction to bet, p = win probability, q = loss probability, b = odds
      const q = 1 - winProbability;
      const kelly = (winProbability * odds - q) / odds;
      
      return Math.max(0, Math.min(0.25, kelly)); // Cap at 25%
    }
  
    // Generate AI prediction with confidence intervals
    generatePrediction(
      analysis: any,
      timeframe: string = '24h'
    ): AIPrediction {
      const baseTarget = analysis.currentPrice * (1 + analysis.expectedReturn);
      const volatility = analysis.volatility || 0.02;
      
      // 95% confidence interval
      const confidenceInterval = {
        lower: baseTarget * (1 - 1.96 * volatility),
        upper: baseTarget * (1 + 1.96 * volatility)
      };
      
      // Scenario analysis
      const scenarios = {
        bullish: {
          target: baseTarget * 1.15,
          probability: 0.25,
          conditions: [
            'Break above resistance',
            'Positive news catalyst',
            'Strong volume confirmation'
          ]
        },
        base: {
          target: baseTarget,
          probability: 0.50,
          conditions: [
            'Normal market conditions',
            'Trend continuation',
            'Average volume'
          ]
        },
        bearish: {
          target: baseTarget * 0.85,
          probability: 0.25,
          conditions: [
            'Break below support',
            'Negative news',
            'Risk-off sentiment'
          ]
        }
      };
      
      return {
        target: baseTarget,
        confidence: analysis.confidence || 75,
        timeframe,
        confidenceInterval,
        scenarios,
        keyFactors: analysis.keyFactors || [],
        riskFactors: analysis.riskFactors || []
      };
    }
  }
  
  export const confidenceScoringService = ConfidenceScoringService.getInstance();