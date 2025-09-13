import { describe, it, expect } from 'vitest';
import {
  validateRSSItem,
  validateEmail,
  validateRegulationAnalysis,
  validateSubscriber,
  validateActionItem,
  isRelevantToFintech,
  sanitizeString,
  isValidJSON,
} from '../validation';
import type { RawRSSItem, RegulationAnalysis, Subscriber, ActionItem } from '../../types';

describe('validateRSSItem', () => {
  it('should validate a complete RSS item', () => {
    const rawItem: RawRSSItem = {
      title: 'SEC Charges Crypto Exchange',
      link: 'https://sec.gov/news/123',
      pubDate: '2024-01-15T10:00:00Z',
      description: 'The SEC charged a crypto exchange...',
      guid: 'sec-2024-001',
    };

    const result = validateRSSItem(rawItem);
    
    expect(result).toBeTruthy();
    expect(result?.title).toBe('SEC Charges Crypto Exchange');
    expect(result?.link).toBe('https://sec.gov/news/123');
    expect(result?.guid).toBe('sec-2024-001');
    expect(result?.pubDate).toBeInstanceOf(Date);
  });

  it('should return null for missing required fields', () => {
    const rawItem: RawRSSItem = {
      title: 'SEC Charges Crypto Exchange',
      // missing link and guid
      description: 'The SEC charged a crypto exchange...',
    };

    const result = validateRSSItem(rawItem);
    expect(result).toBeNull();
  });

  it('should handle invalid dates gracefully', () => {
    const rawItem: RawRSSItem = {
      title: 'SEC Charges Crypto Exchange',
      link: 'https://sec.gov/news/123',
      pubDate: 'invalid-date',
      guid: 'sec-2024-001',
    };

    const result = validateRSSItem(rawItem);
    
    expect(result).toBeTruthy();
    expect(result?.pubDate).toBeInstanceOf(Date);
  });

  it('should trim whitespace from strings', () => {
    const rawItem: RawRSSItem = {
      title: '  SEC Charges Crypto Exchange  ',
      link: '  https://sec.gov/news/123  ',
      guid: '  sec-2024-001  ',
      description: '  The SEC charged...  ',
    };

    const result = validateRSSItem(rawItem);
    
    expect(result?.title).toBe('SEC Charges Crypto Exchange');
    expect(result?.link).toBe('https://sec.gov/news/123');
    expect(result?.guid).toBe('sec-2024-001');
    expect(result?.description).toBe('The SEC charged...');
  });
});

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('user123@test-domain.org')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('test.domain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should handle whitespace', () => {
    expect(validateEmail('  test@example.com  ')).toBe(true);
    expect(validateEmail('test @example.com')).toBe(false);
  });
});

describe('validateRegulationAnalysis', () => {
  it('should validate complete regulation analysis', () => {
    const analysis: Partial<RegulationAnalysis> = {
      id: 'reg-2024-001',
      title: 'SEC Crypto Rule',
      severityScore: 8,
      regulationType: 'enforcement',
      originalUrl: 'https://sec.gov/news/123',
      businessImpactAreas: ['Operations'],
      estimatedPenalty: 1000000,
      implementationTimeline: 30,
      plainEnglishSummary: 'Summary text',
      actionItems: [],
    };

    const result = validateRegulationAnalysis(analysis);
    
    expect(result).toBeTruthy();
    expect(result?.severityScore).toBe(8);
    expect(result?.regulationType).toBe('enforcement');
  });

  it('should reject invalid severity scores', () => {
    const analysis: Partial<RegulationAnalysis> = {
      id: 'reg-2024-001',
      title: 'SEC Crypto Rule',
      severityScore: 15, // Invalid: > 10
      regulationType: 'enforcement',
      originalUrl: 'https://sec.gov/news/123',
    };

    const result = validateRegulationAnalysis(analysis);
    expect(result).toBeNull();
  });

  it('should reject invalid regulation types', () => {
    const analysis: Partial<RegulationAnalysis> = {
      id: 'reg-2024-001',
      title: 'SEC Crypto Rule',
      severityScore: 8,
      regulationType: 'invalid-type' as any,
      originalUrl: 'https://sec.gov/news/123',
    };

    const result = validateRegulationAnalysis(analysis);
    expect(result).toBeNull();
  });

  it('should provide defaults for optional fields', () => {
    const analysis: Partial<RegulationAnalysis> = {
      id: 'reg-2024-001',
      title: 'SEC Crypto Rule',
      severityScore: 8,
      regulationType: 'enforcement',
      originalUrl: 'https://sec.gov/news/123',
    };

    const result = validateRegulationAnalysis(analysis);
    
    expect(result?.businessImpactAreas).toEqual([]);
    expect(result?.estimatedPenalty).toBe(0);
    expect(result?.implementationTimeline).toBe(30);
    expect(result?.actionItems).toEqual([]);
  });
});

describe('validateSubscriber', () => {
  it('should validate complete subscriber', () => {
    const subscriber: Partial<Subscriber> = {
      email: 'test@example.com',
      preferences: {
        immediateAlerts: true,
        dailyDigest: false,
        severityThreshold: 7,
      },
    };

    const result = validateSubscriber(subscriber);
    
    expect(result).toBeTruthy();
    expect(result?.email).toBe('test@example.com');
    expect(result?.preferences.severityThreshold).toBe(7);
    expect(result?.unsubscribeToken).toBeTruthy();
  });

  it('should reject invalid email', () => {
    const subscriber: Partial<Subscriber> = {
      email: 'invalid-email',
    };

    const result = validateSubscriber(subscriber);
    expect(result).toBeNull();
  });

  it('should provide default preferences', () => {
    const subscriber: Partial<Subscriber> = {
      email: 'test@example.com',
    };

    const result = validateSubscriber(subscriber);
    
    expect(result?.preferences.immediateAlerts).toBe(true);
    expect(result?.preferences.dailyDigest).toBe(true);
    expect(result?.preferences.severityThreshold).toBe(5);
  });

  it('should normalize email to lowercase', () => {
    const subscriber: Partial<Subscriber> = {
      email: 'TEST@EXAMPLE.COM',
    };

    const result = validateSubscriber(subscriber);
    expect(result?.email).toBe('test@example.com');
  });
});

describe('validateActionItem', () => {
  it('should validate complete action item', () => {
    const item: Partial<ActionItem> = {
      description: 'Review compliance procedures',
      priority: 'high',
      estimatedHours: 8,
      category: 'legal',
      deadline: new Date('2024-02-15'),
    };

    const result = validateActionItem(item);
    
    expect(result).toBeTruthy();
    expect(result?.description).toBe('Review compliance procedures');
    expect(result?.priority).toBe('high');
    expect(result?.category).toBe('legal');
  });

  it('should reject missing description', () => {
    const item: Partial<ActionItem> = {
      priority: 'high',
      estimatedHours: 8,
    };

    const result = validateActionItem(item);
    expect(result).toBeNull();
  });

  it('should provide defaults for invalid values', () => {
    const item: Partial<ActionItem> = {
      description: 'Review compliance',
      priority: 'invalid' as any,
      category: 'invalid' as any,
    };

    const result = validateActionItem(item);
    
    expect(result?.priority).toBe('medium');
    expect(result?.category).toBe('operational');
    expect(result?.estimatedHours).toBe(1);
    expect(result?.completed).toBe(false);
  });
});

describe('isRelevantToFintech', () => {
  it('should identify fintech-relevant content', () => {
    const fintechItem = {
      title: 'SEC Charges Cryptocurrency Exchange',
      description: 'Digital asset trading platform violated broker-dealer rules',
      link: 'https://sec.gov/news/123',
      pubDate: new Date(),
      guid: 'test-guid',
    };

    expect(isRelevantToFintech(fintechItem)).toBe(true);
  });

  it('should reject non-fintech content', () => {
    const nonFintechItem = {
      title: 'SEC Updates Corporate Disclosure Rules',
      description: 'New requirements for quarterly earnings reports',
      link: 'https://sec.gov/news/456',
      pubDate: new Date(),
      guid: 'test-guid-2',
    };

    expect(isRelevantToFintech(nonFintechItem)).toBe(false);
  });

  it('should be case insensitive', () => {
    const item = {
      title: 'BITCOIN Trading Platform Enforcement',
      description: 'CRYPTOCURRENCY exchange violations',
      link: 'https://sec.gov/news/789',
      pubDate: new Date(),
      guid: 'test-guid-3',
    };

    expect(isRelevantToFintech(item)).toBe(true);
  });
});

describe('utility functions', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
      expect(sanitizeString('Normal text')).toBe('Normal text');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(1500);
      const result = sanitizeString(longString);
      expect(result.length).toBe(1000);
    });
  });

  describe('isValidJSON', () => {
    it('should validate correct JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJSON('invalid json')).toBe(false);
      expect(isValidJSON('{"key": value}')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });
});