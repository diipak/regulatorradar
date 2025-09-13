import type { RSSItem, StoredRegulation, RawRSSItem } from '../types';
import { validateRSSItem, isRelevantToFintech } from './validation';

/**
 * Processes raw RSS feed data into validated RSSItem objects
 */
export function processRSSFeed(rawItems: RawRSSItem[]): RSSItem[] {
  const validItems: RSSItem[] = [];
  
  for (const rawItem of rawItems) {
    const validatedItem = validateRSSItem(rawItem);
    if (validatedItem && isRelevantToFintech(validatedItem)) {
      validItems.push(validatedItem);
    }
  }
  
  return validItems;
}

/**
 * Determines regulation type based on RSS item content
 */
export function determineRegulationType(item: RSSItem): 'enforcement' | 'final-rule' | 'proposed-rule' {
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const content = `${title} ${description}`;
  
  // Check for enforcement actions
  const enforcementKeywords = [
    'charges', 'settles', 'enforcement', 'violation', 'penalty', 'fine',
    'cease and desist', 'administrative proceeding', 'sanctions'
  ];
  
  if (enforcementKeywords.some(keyword => content.includes(keyword))) {
    return 'enforcement';
  }
  
  // Check for final rules
  const finalRuleKeywords = [
    'final rule', 'adopts', 'effective date', 'compliance date',
    'new requirements', 'amendments to'
  ];
  
  if (finalRuleKeywords.some(keyword => content.includes(keyword))) {
    return 'final-rule';
  }
  
  // Default to proposed rule
  return 'proposed-rule';
}

/**
 * Calculates severity score based on regulation type and content
 */
export function calculateSeverityScore(
  regulationType: 'enforcement' | 'final-rule' | 'proposed-rule',
  item: RSSItem
): number {
  let baseScore: number;
  
  // Base scores by type
  switch (regulationType) {
    case 'enforcement':
      baseScore = 8;
      break;
    case 'final-rule':
      baseScore = 5;
      break;
    case 'proposed-rule':
      baseScore = 2;
      break;
  }
  
  // Adjust based on content severity indicators
  const content = `${item.title} ${item.description}`.toLowerCase();
  
  // High impact keywords increase score
  const highImpactKeywords = [
    'cryptocurrency', 'digital asset', 'broker-dealer', 'investment adviser',
    'custody', 'aml', 'kyc', 'consumer protection', 'systemic risk'
  ];
  
  const highImpactMatches = highImpactKeywords.filter(keyword => 
    content.includes(keyword)
  ).length;
  
  // Penalty amount indicators for enforcement
  if (regulationType === 'enforcement') {
    const penaltyMatches = content.match(/\$[\d,]+(?:\.\d+)?\s*(?:million|m)/gi);
    if (penaltyMatches) {
      const amounts = penaltyMatches.map(match => {
        const num = parseFloat(match.replace(/[$,m]/gi, '').replace('million', ''));
        return match.toLowerCase().includes('million') ? num : num / 1000000;
      });
      const maxAmount = Math.max(...amounts);
      
      if (maxAmount >= 10) baseScore = Math.min(10, baseScore + 2);
      else if (maxAmount >= 1) baseScore = Math.min(10, baseScore + 1);
    }
  }
  
  // Adjust for high impact keywords
  if (highImpactMatches >= 3) {
    baseScore = Math.min(10, baseScore + 2);
  } else if (highImpactMatches >= 1) {
    baseScore = Math.min(10, baseScore + 1);
  }
  
  // Urgency indicators
  const urgencyKeywords = ['immediate', 'emergency', 'temporary', 'interim'];
  if (urgencyKeywords.some(keyword => content.includes(keyword))) {
    baseScore = Math.min(10, baseScore + 1);
  }
  
  return Math.max(1, Math.min(10, baseScore));
}

/**
 * Extracts potential penalty amounts from enforcement content
 */
export function extractPenaltyAmount(item: RSSItem): number {
  const content = `${item.title} ${item.description}`;
  
  // Look for dollar amounts
  const dollarMatches = content.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|m|b))?/gi);
  
  if (!dollarMatches) return 0;
  
  const amounts = dollarMatches.map(match => {
    let amount = parseFloat(match.replace(/[$,]/g, ''));
    
    if (match.toLowerCase().includes('billion') || match.toLowerCase().includes('b')) {
      amount *= 1000000000;
    } else if (match.toLowerCase().includes('million') || match.toLowerCase().includes('m')) {
      amount *= 1000000;
    }
    
    return amount;
  });
  
  return Math.max(...amounts, 0);
}

/**
 * Estimates implementation timeline based on regulation type and content
 */
export function estimateImplementationTimeline(
  regulationType: 'enforcement' | 'final-rule' | 'proposed-rule',
  item: RSSItem
): number {
  const content = `${item.title} ${item.description}`.toLowerCase();
  
  // Base timelines by type (in days)
  let baseTimeline: number;
  switch (regulationType) {
    case 'enforcement':
      baseTimeline = 30; // Immediate compliance needed
      break;
    case 'final-rule':
      baseTimeline = 180; // 6 months typical implementation
      break;
    case 'proposed-rule':
      baseTimeline = 365; // 1 year for comment and potential implementation
      break;
  }
  
  // Look for specific dates or timeframes
  const dateMatches = content.match(/(?:effective|compliance|implementation).*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi);
  if (dateMatches) {
    // If specific dates are mentioned, calculate days from now
    const today = new Date();
    const dateStrings = dateMatches.map(match => {
      const dateMatch = match.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      return dateMatch ? dateMatch[1] : null;
    }).filter(Boolean);
    
    if (dateStrings.length > 0) {
      const targetDate = new Date(dateStrings[0]!);
      if (!isNaN(targetDate.getTime())) {
        const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0) {
          return daysUntil;
        }
      }
    }
  }
  
  // Look for relative timeframes
  const timeframeMatches = content.match(/(\d+)\s*(day|week|month|year)s?/gi);
  if (timeframeMatches) {
    const timeframes = timeframeMatches.map(match => {
      const parts = match.match(/(\d+)\s*(day|week|month|year)s?/i);
      if (!parts) return 0;
      
      const num = parseInt(parts[1]);
      const unit = parts[2].toLowerCase();
      
      switch (unit) {
        case 'day': return num;
        case 'week': return num * 7;
        case 'month': return num * 30;
        case 'year': return num * 365;
        default: return 0;
      }
    });
    
    if (timeframes.length > 0) {
      return Math.min(...timeframes.filter(t => t > 0));
    }
  }
  
  return baseTimeline;
}

/**
 * Categorizes business impact areas based on content
 */
export function categorizeBusinessImpact(item: RSSItem): ('Operations' | 'Reporting' | 'Technology')[] {
  const content = `${item.title} ${item.description}`.toLowerCase();
  const categories: ('Operations' | 'Reporting' | 'Technology')[] = [];
  
  // Operations keywords
  const operationsKeywords = [
    'compliance', 'procedures', 'policies', 'training', 'supervision',
    'customer', 'client', 'onboarding', 'kyc', 'aml', 'due diligence'
  ];
  
  // Reporting keywords
  const reportingKeywords = [
    'disclosure', 'filing', 'report', 'record', 'documentation',
    'audit', 'examination', 'books and records', 'quarterly', 'annual'
  ];
  
  // Technology keywords
  const technologyKeywords = [
    'cybersecurity', 'system', 'technology', 'data', 'electronic',
    'digital', 'software', 'platform', 'infrastructure', 'security'
  ];
  
  if (operationsKeywords.some(keyword => content.includes(keyword))) {
    categories.push('Operations');
  }
  
  if (reportingKeywords.some(keyword => content.includes(keyword))) {
    categories.push('Reporting');
  }
  
  if (technologyKeywords.some(keyword => content.includes(keyword))) {
    categories.push('Technology');
  }
  
  // Default to Operations if no specific category identified
  if (categories.length === 0) {
    categories.push('Operations');
  }
  
  return categories;
}

/**
 * Generates a unique ID for a regulation based on RSS item
 */
export function generateRegulationId(item: RSSItem): string {
  // Use GUID if available, otherwise generate from title and date
  if (item.guid) {
    return item.guid.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }
  
  const titleSlug = item.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const dateString = item.pubDate.toISOString().split('T')[0];
  
  return `${dateString}-${titleSlug}`;
}

/**
 * Sorts regulations by severity score and date
 */
export function sortRegulationsBySeverity(regulations: StoredRegulation[]): StoredRegulation[] {
  return [...regulations].sort((a, b) => {
    // First sort by severity score (descending)
    if (a.analysis.severityScore !== b.analysis.severityScore) {
      return b.analysis.severityScore - a.analysis.severityScore;
    }
    
    // Then by date (most recent first)
    return b.originalData.pubDate.getTime() - a.originalData.pubDate.getTime();
  });
}

/**
 * Filters regulations by severity threshold
 */
export function filterRegulationsBySeverity(
  regulations: StoredRegulation[], 
  minSeverity: number
): StoredRegulation[] {
  return regulations.filter(reg => reg.analysis.severityScore >= minSeverity);
}

/**
 * Groups regulations by type
 */
export function groupRegulationsByType(regulations: StoredRegulation[]): {
  enforcement: StoredRegulation[];
  'final-rule': StoredRegulation[];
  'proposed-rule': StoredRegulation[];
} {
  return regulations.reduce((groups, regulation) => {
    const type = regulation.analysis.regulationType;
    groups[type].push(regulation);
    return groups;
  }, {
    enforcement: [] as StoredRegulation[],
    'final-rule': [] as StoredRegulation[],
    'proposed-rule': [] as StoredRegulation[]
  });
}

/**
 * Detects duplicate regulations based on GUID or content similarity
 */
export function isDuplicateRegulation(
  newItem: RSSItem, 
  existingRegulations: StoredRegulation[]
): boolean {
  // Check for exact GUID match
  if (newItem.guid) {
    const guidMatch = existingRegulations.some(reg => 
      reg.originalData.guid === newItem.guid
    );
    if (guidMatch) return true;
  }
  
  // Check for URL match
  const urlMatch = existingRegulations.some(reg => 
    reg.originalData.link === newItem.link
  );
  if (urlMatch) return true;
  
  // Check for title similarity (simple approach)
  const titleMatch = existingRegulations.some(reg => {
    const similarity = calculateStringSimilarity(
      reg.originalData.title.toLowerCase(),
      newItem.title.toLowerCase()
    );
    return similarity > 0.9; // 90% similarity threshold
  });
  
  return titleMatch;
}

/**
 * Simple string similarity calculation (Jaccard similarity)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}