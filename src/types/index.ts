// Core data types for RegulatorRadar

export interface RSSItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  guid: string;
}

export type RegulationType = 'enforcement' | 'final-rule' | 'proposed-rule';
export type BusinessImpactArea = 'Operations' | 'Reporting' | 'Technology';
export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemCategory = 'legal' | 'technical' | 'operational';

export interface ActionItem {
  description: string;
  priority: ActionItemPriority;
  estimatedHours: number;
  deadline?: Date;
  category: ActionItemCategory;
  completed?: boolean;
}

export interface RegulationAnalysis {
  id: string;
  title: string;
  severityScore: number; // 1-10
  regulationType: RegulationType;
  businessImpactAreas: BusinessImpactArea[];
  estimatedPenalty: number;
  implementationTimeline: number; // days
  plainEnglishSummary: string;
  actionItems: ActionItem[];
  originalUrl: string;
  processedDate: Date;
}

export interface Subscriber {
  email: string;
  subscribedAt: Date;
  preferences: {
    immediateAlerts: boolean;
    dailyDigest: boolean;
    severityThreshold: number;
  };
  unsubscribeToken: string;
}

export interface SystemState {
  lastRSSCheck: Date;
  totalRegulationsProcessed: number;
  activeSubscribers: number;
  systemHealth: 'healthy' | 'degraded' | 'error';
}

export interface NotificationLog {
  id: string;
  regulationId: string;
  email: string;
  type: 'immediate' | 'digest';
  sentAt: Date;
  status: 'sent' | 'failed' | 'bounced';
}

export interface StoredRegulation {
  id: string;
  title: string;
  originalData: RSSItem;
  analysis: RegulationAnalysis;
  createdAt: Date;
  updatedAt: Date;
  notificationsSent: NotificationLog[];
}

export interface SystemError {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  details?: any;
}

export interface SystemMetrics {
  regulationsProcessed: number;
  emailsSent: number;
  apiResponseTime: number;
  errorRate: number;
  subscriberCount: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  severityFilter: number;
  autoRefresh: boolean;
}

// Raw RSS feed item before processing
export interface RawRSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string;
  [key: string]: any;
}

// Translation service types
export interface ComplianceDeadline {
  description: string;
  date?: Date;
  estimatedDate?: Date;
  priority: ActionItemPriority;
  source: string;
}

export interface TranslationResult {
  plainEnglishSummary: string;
  actionItems: ActionItem[];
  complianceDeadlines: ComplianceDeadline[];
  keyRequirements: string[];
  businessImpactSummary: string;
  confidence: number; // 0-1 score for translation quality
  processingTime: number;
}