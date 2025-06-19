// Create this new file: lib/services/investor-profiling-service.ts

import { ChatContext } from '@/types/ai-types';

export interface InvestorProfile {
  goals: {
    primary: 'growth' | 'income' | 'preservation' | 'speculation' | 'hedge';
    secondary?: string[];
  };
  timeHorizon: {
    primary: 'day' | 'swing' | 'position' | 'long-term' | 'retirement';
    specificDays?: number;
  };
  riskTolerance: {
    level: 'conservative' | 'moderate' | 'aggressive' | 'dynamic';
    maxDrawdown?: number;
    volatilityComfort?: number;
  };
  experience: {
    years: number;
    assetClasses: string[];
    sophistication: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  };
  preferences: {
    fundamental: boolean;
    technical: boolean;
    quantitative: boolean;
    newsdriven: boolean;
  };
  constraints: {
    ethical?: string[];
    geographic?: string[];
    sector?: string[];
    liquidity?: 'high' | 'medium' | 'low';
  };
}

// Add this type for robust partial merging and completeness logic
export type PartialInvestorProfile = {
  goals?: { primary?: InvestorProfile['goals']['primary']; secondary?: string[] };
  timeHorizon?: { primary?: InvestorProfile['timeHorizon']['primary']; specificDays?: number };
  riskTolerance?: { level?: InvestorProfile['riskTolerance']['level']; maxDrawdown?: number; volatilityComfort?: number };
  experience?: { years?: number; assetClasses?: string[]; sophistication?: InvestorProfile['experience']['sophistication'] };
  preferences?: { fundamental?: boolean; technical?: boolean; quantitative?: boolean; newsdriven?: boolean };
  constraints?: { ethical?: string[]; geographic?: string[]; sector?: string[]; liquidity?: 'high' | 'medium' | 'low' };
};

export class InvestorProfilingService {
  private static instance: InvestorProfilingService;
  
  private constructor() {}
  
  static getInstance(): InvestorProfilingService {
    if (!InvestorProfilingService.instance) {
      InvestorProfilingService.instance = new InvestorProfilingService();
    }
    return InvestorProfilingService.instance;
  }

  analyzeQueryForProfile(query: string): Partial<InvestorProfile> {
    const profile: Partial<InvestorProfile> = {};
    const lowerQuery = query.toLowerCase();

    // Detect investment goals
    if (lowerQuery.includes('grow') || lowerQuery.includes('appreciation')) {
      profile.goals = { primary: 'growth' };
    } else if (lowerQuery.includes('income') || lowerQuery.includes('dividend')) {
      profile.goals = { primary: 'income' };
    } else if (lowerQuery.includes('safe') || lowerQuery.includes('preserve')) {
      profile.goals = { primary: 'preservation' };
    } else if (lowerQuery.includes('trade') || lowerQuery.includes('quick')) {
      profile.goals = { primary: 'speculation' };
    }

    // Detect time horizon
    if (lowerQuery.includes('day trad') || lowerQuery.includes('intraday')) {
      profile.timeHorizon = { primary: 'day' };
    } else if (lowerQuery.includes('swing') || lowerQuery.includes('few days')) {
      profile.timeHorizon = { primary: 'swing' };
    } else if (lowerQuery.includes('long term') || lowerQuery.includes('years')) {
      profile.timeHorizon = { primary: 'long-term' };
    } else if (lowerQuery.includes('retirement') || lowerQuery.includes('pension')) {
      profile.timeHorizon = { primary: 'retirement' };
    }

    // Detect risk tolerance
    if (lowerQuery.includes('conservative') || lowerQuery.includes('low risk')) {
      profile.riskTolerance = { level: 'conservative' };
    } else if (lowerQuery.includes('moderate risk') || lowerQuery.includes('balanced')) {
      profile.riskTolerance = { level: 'moderate' };
    } else if (lowerQuery.includes('aggressive') || lowerQuery.includes('high risk')) {
      profile.riskTolerance = { level: 'aggressive' };
    }

    return profile;
  }

  generateProfilingQuestions(existingProfile?: PartialInvestorProfile): string[] {
    const questions: string[] = [];

    if (!existingProfile?.goals) {
      questions.push(
        "🎯 What's your primary investment goal? (Choose one)",
        "• Growth - Build wealth over time",
        "• Income - Generate regular cash flow",
        "• Preservation - Protect existing capital",
        "• Speculation - Short-term trading profits",
        "• Hedging - Protect other investments"
      );
    }

    if (!existingProfile?.timeHorizon) {
      questions.push(
        "\n⏰ What's your investment time horizon?",
        "• Day trading (close positions daily)",
        "• Swing trading (days to weeks)",
        "• Position trading (weeks to months)",
        "• Long-term investing (1-5 years)",
        "• Retirement planning (5+ years)"
      );
    }

    if (!existingProfile?.riskTolerance) {
      questions.push(
        "\n📊 How would you describe your risk tolerance?",
        "• Conservative - Minimal volatility, capital preservation focus",
        "• Moderate - Balanced approach, some volatility acceptable",
        "• Aggressive - High volatility okay for higher returns",
        "• Dynamic - Varies based on market conditions"
      );
    }

    if (questions.length === 0 && !existingProfile?.experience) {
      questions.push(
        "\n🎓 What's your investing experience level?",
        "• Beginner (< 1 year)",
        "• Intermediate (1-5 years)",
        "• Advanced (5-10 years)",
        "• Professional (10+ years)"
      );
    }

    return questions;
  }

  calculateRiskScore(profile: InvestorProfile): number {
    let score = 50; // Base score

    // Adjust based on risk tolerance
    switch (profile.riskTolerance.level) {
      case 'conservative': score -= 20; break;
      case 'aggressive': score += 20; break;
      case 'dynamic': score += 10; break;
    }

    // Adjust based on time horizon
    switch (profile.timeHorizon.primary) {
      case 'day': score += 15; break;
      case 'swing': score += 10; break;
      case 'position': score += 5; break;
      case 'retirement': score -= 10; break;
    }

    // Adjust based on experience
    switch (profile.experience.sophistication) {
      case 'beginner': score -= 15; break;
      case 'professional': score += 15; break;
      case 'advanced': score += 10; break;
    }

    return Math.max(0, Math.min(100, score));
  }

  generatePersonalizedRecommendations(
    profile: InvestorProfile,
    assetType: string
  ): string {
    const riskScore = this.calculateRiskScore(profile);
    
    let recommendations = `\n📋 **Personalized Recommendations for Your Profile:**\n\n`;
    
    // Goal-based recommendations
    switch (profile.goals.primary) {
      case 'growth':
        recommendations += `🎯 **Growth Strategy:**\n`;
        recommendations += `• Focus on companies with strong earnings growth\n`;
        recommendations += `• Consider growth sectors: Technology, Healthcare, Consumer Discretionary\n`;
        recommendations += `• Allocation: 70-80% growth stocks, 20-30% stability\n\n`;
        break;
      case 'income':
        recommendations += `💰 **Income Strategy:**\n`;
        recommendations += `• Prioritize dividend-paying stocks (yield > 3%)\n`;
        recommendations += `• Consider REITs, utility stocks, preferred shares\n`;
        recommendations += `• Monthly income funds and covered call strategies\n\n`;
        break;
      case 'preservation':
        recommendations += `🛡️ **Capital Preservation Strategy:**\n`;
        recommendations += `• Focus on investment-grade bonds and blue-chip stocks\n`;
        recommendations += `• Consider defensive sectors: Utilities, Consumer Staples\n`;
        recommendations += `• Maintain 40-50% in fixed income securities\n\n`;
        break;
    }

    // Risk-based position sizing
    recommendations += `📊 **Position Sizing (Risk Score: ${riskScore}/100):**\n`;
    if (riskScore < 30) {
      recommendations += `• Maximum position size: 3-5% of portfolio\n`;
      recommendations += `• Stop loss: 5-7% below entry\n`;
      recommendations += `• Focus on blue-chip, large-cap securities\n\n`;
    } else if (riskScore < 70) {
      recommendations += `• Maximum position size: 5-8% of portfolio\n`;
      recommendations += `• Stop loss: 8-10% below entry\n`;
      recommendations += `• Mix of large and mid-cap opportunities\n\n`;
    } else {
      recommendations += `• Maximum position size: 8-12% of portfolio\n`;
      recommendations += `• Stop loss: 10-15% below entry\n`;
      recommendations += `• Can include small-cap and speculative positions\n\n`;
    }

    // Time horizon specific advice
    recommendations += `⏰ **Time Horizon Optimization:**\n`;
    switch (profile.timeHorizon.primary) {
      case 'day':
        recommendations += `• Use 1-min to 15-min charts for entry/exit\n`;
        recommendations += `• Focus on liquid securities with tight spreads\n`;
        recommendations += `• Set alerts for key support/resistance levels\n`;
        break;
      case 'swing':
        recommendations += `• Use daily and 4-hour charts for analysis\n`;
        recommendations += `• Hold positions 2-10 days on average\n`;
        recommendations += `• Focus on momentum and trend reversals\n`;
        break;
      case 'long-term':
        recommendations += `• Use weekly and monthly charts for perspective\n`;
        recommendations += `• Focus on fundamental value and growth metrics\n`;
        recommendations += `• Rebalance quarterly, not daily\n`;
        break;
    }

    return recommendations;
  }

  // --- Robust profile merging and completeness check ---
  mergeProfiles(base: PartialInvestorProfile = {}, update: PartialInvestorProfile = {}): PartialInvestorProfile {
    return {
      ...base,
      ...update,
      goals: { ...(base.goals || {}), ...(update.goals || {}) },
      timeHorizon: { ...(base.timeHorizon || {}), ...(update.timeHorizon || {}) },
      riskTolerance: { ...(base.riskTolerance || {}), ...(update.riskTolerance || {}) },
      experience: { ...(base.experience || {}), ...(update.experience || {}) },
      preferences: { ...(base.preferences || {}), ...(update.preferences || {}) },
      constraints: { ...(base.constraints || {}), ...(update.constraints || {}) }
    };
  }

  isProfileComplete(profile: PartialInvestorProfile): boolean {
    return !!(
      profile.goals?.primary &&
      profile.timeHorizon?.primary &&
      profile.riskTolerance?.level
    );
  }
}

export const investorProfilingService = InvestorProfilingService.getInstance();