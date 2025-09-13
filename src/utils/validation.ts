import type { RSSItem, RawRSSItem, RegulationAnalysis, Subscriber, ActionItem } from '../types';

/**
 * Validates and transforms raw RSS item data into typed RSSItem
 */
export function validateRSSItem(rawItem: RawRSSItem): RSSItem | null {
  try {
    // Check required fields
    if (!rawItem.title || !rawItem.link || !rawItem.guid) {
      console.warn('RSS item missing required fields:', rawItem);
      return null;
    }

    // Validate and parse date
    let pubDate: Date;
    if (rawItem.pubDate) {
      pubDate = new Date(rawItem.pubDate);
      if (isNaN(pubDate.getTime())) {
        console.warn('Invalid pubDate in RSS item:', rawItem.pubDate);
        pubDate = new Date(); // Fallback to current date
      }
    } else {
      pubDate = new Date(); // Default to current date if missing
    }

    return {
      title: String(rawItem.title).trim(),
      link: String(rawItem.link).trim(),
      pubDate,
      description: rawItem.description ? String(rawItem.description).trim() : '',
      guid: String(rawItem.guid).trim()
    };
  } catch (error) {
    console.error('Error validating RSS item:', error, rawItem);
    return null;
  }
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates regulation analysis data
 */
export function validateRegulationAnalysis(analysis: Partial<RegulationAnalysis>): RegulationAnalysis | null {
  try {
    if (!analysis.id || !analysis.title || !analysis.originalUrl) {
      console.warn('Regulation analysis missing required fields:', analysis);
      return null;
    }

    // Validate severity score
    const severityScore = Number(analysis.severityScore);
    if (isNaN(severityScore) || severityScore < 1 || severityScore > 10) {
      console.warn('Invalid severity score:', analysis.severityScore);
      return null;
    }

    // Validate regulation type
    const validTypes = ['enforcement', 'final-rule', 'proposed-rule'];
    if (!analysis.regulationType || !validTypes.includes(analysis.regulationType)) {
      console.warn('Invalid regulation type:', analysis.regulationType);
      return null;
    }

    return {
      id: String(analysis.id),
      title: String(analysis.title),
      severityScore,
      regulationType: analysis.regulationType as 'enforcement' | 'final-rule' | 'proposed-rule',
      businessImpactAreas: analysis.businessImpactAreas || [],
      estimatedPenalty: Number(analysis.estimatedPenalty) || 0,
      implementationTimeline: Number(analysis.implementationTimeline) || 30,
      plainEnglishSummary: String(analysis.plainEnglishSummary || ''),
      actionItems: analysis.actionItems || [],
      originalUrl: String(analysis.originalUrl),
      processedDate: analysis.processedDate || new Date()
    };
  } catch (error) {
    console.error('Error validating regulation analysis:', error, analysis);
    return null;
  }
}

/**
 * Validates subscriber data
 */
export function validateSubscriber(subscriber: Partial<Subscriber>): Subscriber | null {
  try {
    if (!subscriber.email || !validateEmail(subscriber.email)) {
      console.warn('Invalid subscriber email:', subscriber.email);
      return null;
    }

    return {
      email: subscriber.email.trim().toLowerCase(),
      subscribedAt: subscriber.subscribedAt || new Date(),
      preferences: {
        immediateAlerts: subscriber.preferences?.immediateAlerts ?? true,
        dailyDigest: subscriber.preferences?.dailyDigest ?? true,
        severityThreshold: subscriber.preferences?.severityThreshold ?? 5
      },
      unsubscribeToken: subscriber.unsubscribeToken || generateUnsubscribeToken()
    };
  } catch (error) {
    console.error('Error validating subscriber:', error, subscriber);
    return null;
  }
}

/**
 * Validates action item data
 */
export function validateActionItem(item: Partial<ActionItem>): ActionItem | null {
  try {
    if (!item.description) {
      console.warn('Action item missing description:', item);
      return null;
    }

    const validPriorities = ['high', 'medium', 'low'];
    const validCategories = ['legal', 'technical', 'operational'];

    return {
      description: String(item.description).trim(),
      priority: (validPriorities.includes(item.priority || '') ? item.priority : 'medium') as 'high' | 'medium' | 'low',
      estimatedHours: Number(item.estimatedHours) || 1,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      category: (validCategories.includes(item.category || '') ? item.category : 'operational') as 'legal' | 'technical' | 'operational',
      completed: Boolean(item.completed)
    };
  } catch (error) {
    console.error('Error validating action item:', error, item);
    return null;
  }
}

/**
 * Filters RSS items based on fintech-relevant keywords
 */
export function isRelevantToFintech(item: RSSItem): boolean {
  const fintechKeywords = [
    'payment', 'digital asset', 'cryptocurrency', 'fintech', 'broker-dealer',
    'investment adviser', 'custody', 'AML', 'KYC', 'consumer protection',
    'bitcoin', 'blockchain', 'crypto', 'digital currency', 'virtual currency',
    'money transmission', 'payment processor', 'electronic payment',
    'mobile payment', 'peer-to-peer', 'p2p', 'lending', 'crowdfunding'
  ];

  const searchText = `${item.title} ${item.description}`.toLowerCase();
  
  return fintechKeywords.some(keyword => 
    searchText.includes(keyword.toLowerCase())
  );
}

/**
 * Generates a unique unsubscribe token
 */
function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validates JSON data structure
 */
export function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}