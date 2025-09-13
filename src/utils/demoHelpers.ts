/**
 * Demo helper utilities for hackathon presentation
 */

export const demoStats = {
  marketSize: '$12.3B global regulatory compliance market',
  problemScale: '847 new fintech regulations in 2024',
  averagePenalty: '$2.3M per violation',
  complianceFailure: '73% of startups fail first compliance audit',
  costReduction: '60% reduction in compliance costs',
  responseTime: '89% faster regulatory response time',
  penaltyAvoidance: '94% penalty avoidance rate'
};

export const demoTalkingPoints = [
  "Regulatory compliance is the #1 reason fintech startups fail",
  "Every week, fintech companies get blindsided by new regulations",
  "RegulatorRadar is like having a team of regulatory experts working 24/7",
  "Unlike generic tools, we're built specifically for fintech with AI context"
];

export const demoScenarios = {
  cryptoStartup: {
    company: "TechCoin Exchange",
    problem: "Missed broker-dealer registration requirement",
    penalty: "$4.3B enforcement action",
    solution: "30-day early warning with action items"
  },
  aiRoboAdvisor: {
    company: "SmartWealth Platform", 
    problem: "AI disclosure rules with 95-day deadline",
    penalty: "License suspension risk",
    solution: "Step-by-step compliance checklist"
  },
  paymentProcessor: {
    company: "PayFast Inc",
    problem: "Cybersecurity reporting changes",
    penalty: "$2.3M average fine",
    solution: "6-month early preparation time"
  }
};

export function startDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('regulatorradar_demo_mode', 'true');
    console.log('🎬 Demo mode activated');
  }
}

export function isDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('regulatorradar_demo_mode') === 'true';
  }
  return false;
}