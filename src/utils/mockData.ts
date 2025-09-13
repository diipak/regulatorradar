import type { 
  RSSItem, 
  RegulationAnalysis, 
  StoredRegulation, 
  Subscriber, 
  ActionItem,
  NotificationLog 
} from '../types';

/**
 * Realistic mock RSS items based on recent SEC activity for compelling demo scenarios
 */
export const mockRSSItems: RSSItem[] = [
  {
    title: "SEC Charges Major Cryptocurrency Exchange with $4.3 Billion in Unregistered Securities Offerings",
    link: "https://www.sec.gov/news/press-release/2024-156",
    pubDate: new Date('2024-12-10T14:30:00Z'),
    description: "The Securities and Exchange Commission today announced charges against CryptoGlobal Exchange for conducting $4.3 billion in unregistered securities offerings through its staking-as-a-service program, affecting over 13 million retail investors. The company failed to register these investment contracts and provided misleading information about risks and returns.",
    guid: "sec-2024-156-crypto-global-enforcement"
  },
  {
    title: "Final Rule: AI-Driven Investment Advisory Services Disclosure Requirements",
    link: "https://www.sec.gov/rules/final/2024-089",
    pubDate: new Date('2024-12-08T10:00:00Z'),
    description: "New rules require investment advisers using artificial intelligence or algorithmic trading systems to provide enhanced disclosures about AI decision-making processes, data sources, and potential conflicts of interest. Compliance required by March 15, 2025.",
    guid: "sec-2024-089-ai-advisory-disclosure"
  },
  {
    title: "SEC Emergency Action: Fintech Lending Platform Frozen for $850M Ponzi Scheme",
    link: "https://www.sec.gov/news/press-release/2024-167",
    pubDate: new Date('2024-12-05T16:20:00Z'),
    description: "Emergency enforcement action halts operations of FastCash Lending, which allegedly operated a Ponzi scheme promising 15% annual returns to over 45,000 investors. The platform used new investor funds to pay earlier investors while diverting $200M to executives' personal accounts.",
    guid: "sec-2024-167-fastcash-emergency-action"
  },
  {
    title: "Proposed Rule: Enhanced Cybersecurity Incident Reporting for Payment Processors",
    link: "https://www.sec.gov/rules/proposed/2024-078",
    pubDate: new Date('2024-12-03T11:45:00Z'),
    description: "Proposed amendments would require payment processing companies to report cybersecurity incidents within 4 hours and implement mandatory penetration testing. Public comment period ends February 1, 2025. Estimated compliance costs: $2.3M per firm annually.",
    guid: "sec-2024-078-payment-cybersecurity-proposal"
  },
  {
    title: "SEC Settles with Robo-Advisor for $12M Over Misleading ESG Claims",
    link: "https://www.sec.gov/news/press-release/2024-143",
    pubDate: new Date('2024-11-28T13:15:00Z'),
    description: "WealthBot Technologies agrees to pay $12 million to settle charges of misleading investors about its ESG (Environmental, Social, Governance) investment strategies. The firm marketed portfolios as 'sustainable' while investing in companies with poor environmental records.",
    guid: "sec-2024-143-wealthbot-esg-settlement"
  },
  {
    title: "Final Rule: Real-Time Transaction Monitoring for Digital Asset Platforms",
    link: "https://www.sec.gov/rules/final/2024-091",
    pubDate: new Date('2024-11-25T09:30:00Z'),
    description: "Digital asset trading platforms must implement real-time transaction monitoring systems to detect market manipulation and suspicious trading patterns. Platforms handling over $100M in daily volume must comply by June 1, 2025.",
    guid: "sec-2024-091-digital-asset-monitoring"
  },
  {
    title: "SEC Charges Fintech CEO with $50M Securities Fraud in 'Buy Now, Pay Later' Scheme",
    link: "https://www.sec.gov/news/press-release/2024-134",
    pubDate: new Date('2024-11-20T15:45:00Z'),
    description: "The CEO of PayLater Plus allegedly inflated transaction volumes by 300% and hid $50M in losses from investors during Series C funding round. The scheme involved creating fake merchant partnerships and fabricated user growth metrics to secure $75M in fraudulent investment.",
    guid: "sec-2024-134-paylater-ceo-fraud"
  },
  {
    title: "Emergency Order: Immediate Suspension of High-Frequency Trading Algorithm",
    link: "https://www.sec.gov/news/press-release/2024-159",
    pubDate: new Date('2024-11-18T08:20:00Z'),
    description: "SEC issues emergency order suspending QuickTrade AI's high-frequency trading algorithm after detecting market manipulation affecting $2.1B in trades. The algorithm allegedly created artificial price movements in 47 securities over 6 months.",
    guid: "sec-2024-159-quicktrade-algorithm-suspension"
  }
];

/**
 * Mock action items for different regulation types
 */
export const mockActionItems: ActionItem[] = [
  {
    description: "Review current broker-dealer registration status and determine if registration is required",
    priority: 'high',
    estimatedHours: 8,
    deadline: new Date('2024-02-15'),
    category: 'legal',
    completed: false
  },
  {
    description: "Implement enhanced cybersecurity monitoring systems",
    priority: 'high',
    estimatedHours: 40,
    deadline: new Date('2024-03-01'),
    category: 'technical',
    completed: false
  },
  {
    description: "Update customer onboarding procedures to include enhanced KYC checks",
    priority: 'medium',
    estimatedHours: 16,
    deadline: new Date('2024-02-28'),
    category: 'operational',
    completed: false
  },
  {
    description: "Conduct legal review of digital asset custody practices",
    priority: 'medium',
    estimatedHours: 12,
    category: 'legal',
    completed: false
  },
  {
    description: "Prepare quarterly compliance report for regulatory submission",
    priority: 'low',
    estimatedHours: 6,
    deadline: new Date('2024-04-15'),
    category: 'operational',
    completed: true
  }
];

/**
 * Compelling regulation analyses with realistic business impact scenarios for demo
 */
export const mockRegulationAnalyses: RegulationAnalysis[] = [
  {
    id: "reg-2024-156",
    title: "SEC Charges Major Cryptocurrency Exchange with $4.3 Billion in Unregistered Securities Offerings",
    severityScore: 10,
    regulationType: 'enforcement',
    businessImpactAreas: ['Operations', 'Technology', 'Reporting'],
    estimatedPenalty: 4300000000,
    implementationTimeline: 15,
    plainEnglishSummary: "🚨 CRITICAL ALERT: The SEC just hit a major crypto exchange with a $4.3 billion enforcement action for unregistered securities offerings through staking services. If your fintech offers ANY staking, yield farming, or 'earn' products, you could be next. This affects 13 million users and shows the SEC is targeting retail-focused crypto services. IMMEDIATE legal review required - this could shut down your business overnight.",
    actionItems: [
      {
        description: "URGENT: Emergency legal review of all staking and yield products",
        priority: 'high',
        estimatedHours: 8,
        deadline: new Date('2024-12-12'),
        category: 'legal',
        completed: false
      },
      {
        description: "Suspend new staking product launches pending legal clarity",
        priority: 'high',
        estimatedHours: 2,
        deadline: new Date('2024-12-11'),
        category: 'operational',
        completed: false
      },
      {
        description: "Prepare customer communications about potential service changes",
        priority: 'high',
        estimatedHours: 6,
        deadline: new Date('2024-12-13'),
        category: 'operational',
        completed: false
      },
      {
        description: "Conduct securities law analysis of all crypto products",
        priority: 'high',
        estimatedHours: 24,
        deadline: new Date('2024-12-20'),
        category: 'legal',
        completed: false
      }
    ],
    originalUrl: "https://www.sec.gov/news/press-release/2024-156",
    processedDate: new Date('2024-12-10T14:45:00Z')
  },
  {
    id: "reg-2024-089",
    title: "Final Rule: AI-Driven Investment Advisory Services Disclosure Requirements",
    severityScore: 7,
    regulationType: 'final-rule',
    businessImpactAreas: ['Technology', 'Operations', 'Reporting'],
    estimatedPenalty: 0,
    implementationTimeline: 95,
    plainEnglishSummary: "New AI disclosure rules are now final! If your fintech uses AI for investment advice, robo-advisory, or algorithmic trading, you must disclose how your AI works by March 15, 2025. This includes data sources, decision-making processes, and conflicts of interest. Failure to comply could result in enforcement action and loss of advisory license. Estimated compliance cost: $150K-$500K depending on complexity.",
    actionItems: [
      {
        description: "Audit all AI/ML systems used in investment advisory services",
        priority: 'high',
        estimatedHours: 32,
        deadline: new Date('2025-01-15'),
        category: 'technical',
        completed: false
      },
      {
        description: "Draft AI disclosure documents for client review",
        priority: 'high',
        estimatedHours: 20,
        deadline: new Date('2025-02-01'),
        category: 'legal',
        completed: false
      },
      {
        description: "Update Form ADV to include AI disclosures",
        priority: 'medium',
        estimatedHours: 8,
        deadline: new Date('2025-02-15'),
        category: 'operational',
        completed: false
      },
      {
        description: "Train compliance team on new AI disclosure requirements",
        priority: 'medium',
        estimatedHours: 12,
        deadline: new Date('2025-03-01'),
        category: 'operational',
        completed: false
      }
    ],
    originalUrl: "https://www.sec.gov/rules/final/2024-089",
    processedDate: new Date('2024-12-08T10:15:00Z')
  },
  {
    id: "reg-2024-167",
    title: "SEC Emergency Action: Fintech Lending Platform Frozen for $850M Ponzi Scheme",
    severityScore: 9,
    regulationType: 'enforcement',
    businessImpactAreas: ['Operations', 'Reporting'],
    estimatedPenalty: 850000000,
    implementationTimeline: 7,
    plainEnglishSummary: "🚨 EMERGENCY: The SEC just froze a fintech lending platform for running an $850M Ponzi scheme promising 15% returns. This affects 45,000 investors and shows increased scrutiny of high-yield fintech products. If you offer lending, investment, or high-yield products, expect immediate regulatory attention. The SEC is now looking for similar patterns across the fintech industry.",
    actionItems: [
      {
        description: "Review all marketing materials for yield/return promises",
        priority: 'high',
        estimatedHours: 6,
        deadline: new Date('2024-12-07'),
        category: 'legal',
        completed: false
      },
      {
        description: "Verify all investor funds are properly segregated",
        priority: 'high',
        estimatedHours: 4,
        deadline: new Date('2024-12-06'),
        category: 'operational',
        completed: false
      },
      {
        description: "Prepare documentation showing legitimate business model",
        priority: 'high',
        estimatedHours: 12,
        deadline: new Date('2024-12-10'),
        category: 'legal',
        completed: false
      }
    ],
    originalUrl: "https://www.sec.gov/news/press-release/2024-167",
    processedDate: new Date('2024-12-05T16:35:00Z')
  },
  {
    id: "reg-2024-078",
    title: "Proposed Rule: Enhanced Cybersecurity Incident Reporting for Payment Processors",
    severityScore: 5,
    regulationType: 'proposed-rule',
    businessImpactAreas: ['Technology', 'Operations'],
    estimatedPenalty: 0,
    implementationTimeline: 180,
    plainEnglishSummary: "The SEC wants payment processors to report cyber incidents within 4 hours (currently 72 hours) and conduct mandatory penetration testing. This is still a proposal with comments due February 1, 2025. If finalized, compliance costs estimated at $2.3M annually per firm. Now is the time to influence this rule through public comments.",
    actionItems: [
      {
        description: "Analyze impact of 4-hour reporting requirement on operations",
        priority: 'medium',
        estimatedHours: 8,
        deadline: new Date('2025-01-15'),
        category: 'operational',
        completed: false
      },
      {
        description: "Prepare public comment letter on proposed rule",
        priority: 'medium',
        estimatedHours: 12,
        deadline: new Date('2025-01-25'),
        category: 'legal',
        completed: false
      },
      {
        description: "Assess current penetration testing capabilities",
        priority: 'low',
        estimatedHours: 6,
        deadline: new Date('2025-02-15'),
        category: 'technical',
        completed: false
      }
    ],
    originalUrl: "https://www.sec.gov/rules/proposed/2024-078",
    processedDate: new Date('2024-12-03T12:00:00Z')
  },
  {
    id: "reg-2024-143",
    title: "SEC Settles with Robo-Advisor for $12M Over Misleading ESG Claims",
    severityScore: 6,
    regulationType: 'enforcement',
    businessImpactAreas: ['Operations', 'Reporting'],
    estimatedPenalty: 12000000,
    implementationTimeline: 60,
    plainEnglishSummary: "A robo-advisor just paid $12M for misleading ESG investment claims. They marketed portfolios as 'sustainable' while investing in companies with poor environmental records. If your fintech offers ESG, sustainable, or socially responsible investing, your marketing claims must match your actual investments. The SEC is cracking down on 'greenwashing' in fintech.",
    actionItems: [
      {
        description: "Audit all ESG and sustainability marketing materials",
        priority: 'high',
        estimatedHours: 16,
        deadline: new Date('2024-12-15'),
        category: 'legal',
        completed: false
      },
      {
        description: "Verify ESG portfolio holdings match marketing claims",
        priority: 'high',
        estimatedHours: 12,
        deadline: new Date('2024-12-20'),
        category: 'operational',
        completed: false
      },
      {
        description: "Implement ESG compliance monitoring system",
        priority: 'medium',
        estimatedHours: 24,
        deadline: new Date('2025-01-30'),
        category: 'technical',
        completed: false
      }
    ],
    originalUrl: "https://www.sec.gov/news/press-release/2024-143",
    processedDate: new Date('2024-11-28T13:30:00Z')
  }
];

/**
 * Mock stored regulations combining RSS items with analyses
 */
export const mockStoredRegulations: StoredRegulation[] = mockRSSItems.slice(0, 3).map((rssItem, index) => ({
  id: mockRegulationAnalyses[index].id,
  title: rssItem.title,
  originalData: rssItem,
  analysis: mockRegulationAnalyses[index],
  createdAt: rssItem.pubDate,
  updatedAt: rssItem.pubDate,
  notificationsSent: []
}));

/**
 * Mock subscribers for testing
 */
export const mockSubscribers: Subscriber[] = [
  {
    email: "compliance@fintechstartup.com",
    subscribedAt: new Date('2024-01-01T10:00:00Z'),
    preferences: {
      immediateAlerts: true,
      dailyDigest: true,
      severityThreshold: 7
    },
    unsubscribeToken: "token123abc"
  },
  {
    email: "legal@cryptoexchange.com",
    subscribedAt: new Date('2024-01-05T14:30:00Z'),
    preferences: {
      immediateAlerts: true,
      dailyDigest: false,
      severityThreshold: 8
    },
    unsubscribeToken: "token456def"
  },
  {
    email: "ceo@paymentprocessor.com",
    subscribedAt: new Date('2024-01-10T09:15:00Z'),
    preferences: {
      immediateAlerts: false,
      dailyDigest: true,
      severityThreshold: 5
    },
    unsubscribeToken: "token789ghi"
  }
];

/**
 * Mock notification logs
 */
export const mockNotificationLogs: NotificationLog[] = [
  {
    id: "notif-001",
    regulationId: "reg-2024-001",
    email: "compliance@fintechstartup.com",
    type: 'immediate',
    sentAt: new Date('2024-01-15T10:35:00Z'),
    status: 'sent'
  },
  {
    id: "notif-002",
    regulationId: "reg-2024-002",
    email: "legal@cryptoexchange.com",
    type: 'immediate',
    sentAt: new Date('2024-01-10T15:05:00Z'),
    status: 'sent'
  },
  {
    id: "notif-003",
    regulationId: "reg-2024-001",
    email: "ceo@paymentprocessor.com",
    type: 'digest',
    sentAt: new Date('2024-01-16T08:00:00Z'),
    status: 'sent'
  }
];

/**
 * Fintech-relevant keywords for RSS filtering
 */
export const fintechKeywords = [
  'payment', 'digital asset', 'cryptocurrency', 'fintech', 'broker-dealer',
  'investment adviser', 'custody', 'aml', 'kyc', 'consumer protection',
  'bitcoin', 'blockchain', 'crypto', 'digital currency', 'virtual currency',
  'money transmission', 'payment processor', 'electronic payment',
  'mobile payment', 'peer-to-peer', 'p2p', 'lending', 'crowdfunding',
  'robo-advisor', 'algorithmic trading', 'high-frequency trading',
  'alternative trading system', 'ats', 'dark pool', 'market maker',
  'clearing', 'settlement', 'custodian', 'prime brokerage'
];

/**
 * Professional email templates for compelling demo scenarios
 */
export const emailTemplates = {
  immediateAlert: {
    subject: "🚨 URGENT: {{regulation_title}} - Action Required Within {{timeline}} Days",
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RegulatorRadar Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">⚡ RegulatorRadar Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Critical Regulatory Development Detected</p>
    </div>

    <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 10px;">🚨</span>
            <strong style="color: #856404; font-size: 18px;">SEVERITY {{severity_score}}/10 - IMMEDIATE ACTION REQUIRED</strong>
        </div>
        <p style="margin: 0; color: #856404; font-weight: 500;">Timeline: {{timeline}} days to implement changes</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0; font-size: 20px;">{{regulation_title}}</h2>
        
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">{{regulation_type}}</span>
            <span style="background: #6c757d; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Published: {{pub_date}}</span>
        </div>

        <div style="background: white; border-left: 4px solid #007bff; padding: 20px; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #007bff;">What This Means for Your Business:</h3>
            <p style="margin-bottom: 0; font-size: 16px; line-height: 1.7;">{{plain_english_summary}}</p>
        </div>
    </div>

    <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #dc3545; display: flex; align-items: center;">
            <span style="margin-right: 8px;">⚡</span>
            Immediate Actions Required:
        </h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            {{action_items}}
        </div>
    </div>

    <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="margin-top: 0; color: #0056b3;">💡 RegulatorRadar Recommendation:</h4>
        <p style="margin-bottom: 0;">Don't wait - regulatory enforcement is increasing. Companies that act quickly often avoid penalties and gain competitive advantages. Our analysis shows similar regulations typically result in $\{{estimated_penalty}} average penalties for non-compliance.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Full Analysis & Action Plan</a>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{original_url}}" style="color: #6c757d; text-decoration: none; font-size: 14px;">📄 Read Original SEC Document</a>
    </div>

    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

    <div style="text-align: center; color: #6c757d; font-size: 12px;">
        <p><strong>RegulatorRadar</strong> - Your AI-Powered Regulatory Intelligence Platform</p>
        <p>This alert was triggered because the regulation scored {{severity_score}}/10 on our proprietary impact assessment.</p>
        <p><a href="{{preferences_url}}" style="color: #007bff;">Manage Preferences</a> | <a href="{{unsubscribe_url}}" style="color: #6c757d;">Unsubscribe</a></p>
    </div>

</body>
</html>
    `
  },
  dailyDigest: {
    subject: "📊 RegulatorRadar Daily Brief - {{date}} | {{high_priority_count}} High-Priority Alerts",
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RegulatorRadar Daily Brief</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">📊 Daily Regulatory Brief</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">{{date}} | Powered by RegulatorRadar AI</p>
    </div>

    <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background: #dc3545; color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700;">{{high_priority_count}}</div>
            <div style="font-size: 12px; opacity: 0.9;">High Priority</div>
        </div>
        <div style="flex: 1; background: #ffc107; color: #212529; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700;">{{medium_priority_count}}</div>
            <div style="font-size: 12px; opacity: 0.8;">Medium Priority</div>
        </div>
        <div style="flex: 1; background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700;">{{total_count}}</div>
            <div style="font-size: 12px; opacity: 0.9;">Total Alerts</div>
        </div>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h2 style="margin-top: 0; color: #495057; font-size: 18px;">🎯 Today's Key Developments</h2>
        {{regulations_list}}
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #856404;">💡 AI Insights & Trends</h3>
        <ul style="margin: 0; padding-left: 20px; color: #856404;">
            <li>Enforcement actions up 23% this quarter - focus on crypto and AI disclosures</li>
            <li>New cybersecurity rules affecting 78% of fintech companies</li>
            <li>Average compliance timeline decreased to 90 days (was 180 days)</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 25px 0;">
        <a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Full Dashboard</a>
    </div>

    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 25px 0;">

    <div style="text-align: center; color: #6c757d; font-size: 12px;">
        <p><strong>RegulatorRadar</strong> - Regulatory Intelligence for Fintech Leaders</p>
        <p>Delivered daily at 9:00 AM EST | <a href="{{preferences_url}}" style="color: #007bff;">Manage Preferences</a> | <a href="{{unsubscribe_url}}" style="color: #6c757d;">Unsubscribe</a></p>
    </div>

</body>
</html>
    `
  },
  weeklyExecutiveSummary: {
    subject: "📈 Executive Brief: Weekly Regulatory Intelligence Report",
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RegulatorRadar Executive Brief</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 700;">📈 Executive Regulatory Brief</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Week of {{week_date}} | Strategic Intelligence for Leadership</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
        <h2 style="margin-top: 0; color: #495057;">🎯 Executive Summary</h2>
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 0;">This week saw significant regulatory developments affecting fintech operations, with particular focus on AI disclosure requirements and cryptocurrency enforcement. Our analysis indicates increased regulatory velocity requiring immediate strategic attention.</p>
    </div>

    <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #dc3545;">⚡ Critical Actions This Week</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <strong>1. AI Disclosure Compliance (Due: March 15, 2025)</strong>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Investment advisers must now disclose AI usage. Estimated cost: $150K-$500K</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <strong>2. Crypto Staking Review (URGENT)</strong>
            <p style="margin: 5px 0 0 0; color: #6c757d;">$4.3B enforcement action signals crackdown on staking services</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <strong>3. ESG Marketing Audit</strong>
            <p style="margin: 5px 0 0 0; color: #6c757d;">$12M settlement for misleading ESG claims - review all sustainability marketing</p>
        </div>
    </div>

    <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #0056b3;">📊 Regulatory Trend Analysis</h3>
        <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Enforcement Velocity:</strong> 34% increase in fintech enforcement actions</li>
            <li><strong>Penalty Amounts:</strong> Average penalties up 67% year-over-year</li>
            <li><strong>Compliance Timelines:</strong> Shortened from 180 to 90 days average</li>
            <li><strong>Focus Areas:</strong> AI/ML disclosures, crypto services, ESG claims</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">View Full Analysis</a>
        <a href="{{schedule_call_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Schedule Strategy Call</a>
    </div>

    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

    <div style="text-align: center; color: #6c757d; font-size: 12px;">
        <p><strong>RegulatorRadar</strong> - Strategic Regulatory Intelligence</p>
        <p>Confidential Executive Brief | <a href="{{preferences_url}}" style="color: #007bff;">Manage Preferences</a></p>
    </div>

</body>
</html>
    `
  }
};

/**
 * Utility function to get mock data for development
 */
export function getMockDataSet(): {
  regulations: StoredRegulation[];
  subscribers: Subscriber[];
  notificationLogs: NotificationLog[];
} {
  return {
    regulations: mockStoredRegulations,
    subscribers: mockSubscribers,
    notificationLogs: mockNotificationLogs
  };
}

/**
 * Utility function to populate localStorage with mock data
 */
export function loadMockData(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    const mockData = getMockDataSet();
    
    localStorage.setItem('regulatorradar_regulations', JSON.stringify(mockData.regulations));
    localStorage.setItem('regulatorradar_subscribers', JSON.stringify(mockData.subscribers));
    localStorage.setItem('regulatorradar_notification_logs', JSON.stringify(mockData.notificationLogs));
    localStorage.setItem('regulatorradar_last_check', new Date().toISOString());
    localStorage.setItem('regulatorradar_demo_mode', 'true');
    localStorage.setItem('regulatorradar_user_preferences', JSON.stringify({
      theme: 'light',
      emailNotifications: true,
      severityFilter: 5,
      autoRefresh: true
    }));
    localStorage.setItem('regulatorradar_system_state', JSON.stringify({
      lastRSSCheck: new Date(),
      totalRegulationsProcessed: mockData.regulations.length,
      activeSubscribers: mockData.subscribers.length,
      systemHealth: 'healthy'
    }));
    
    console.log('✅ Demo data loaded successfully');
  }
}