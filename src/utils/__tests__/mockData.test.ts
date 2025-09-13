import { describe, it, expect, vi } from 'vitest';
import {
  mockRSSItems,
  mockRegulationAnalyses,
  mockStoredRegulations,
  mockSubscribers,
  getMockDataSet,
  loadMockData,
  fintechKeywords,
} from '../mockData';

describe('mockData', () => {
  describe('mockRSSItems', () => {
    it('should have valid RSS items', () => {
      expect(mockRSSItems).toHaveLength(5);
      
      mockRSSItems.forEach(item => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('link');
        expect(item).toHaveProperty('pubDate');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('guid');
        
        expect(typeof item.title).toBe('string');
        expect(typeof item.link).toBe('string');
        expect(item.pubDate).toBeInstanceOf(Date);
        expect(typeof item.description).toBe('string');
        expect(typeof item.guid).toBe('string');
        
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.link).toMatch(/^https?:\/\//);
        expect(item.guid.length).toBeGreaterThan(0);
      });
    });

    it('should contain fintech-relevant content', () => {
      const fintechRelevantItems = mockRSSItems.filter(item => {
        const content = `${item.title} ${item.description}`.toLowerCase();
        return fintechKeywords.some(keyword => content.includes(keyword.toLowerCase()));
      });
      
      expect(fintechRelevantItems.length).toBeGreaterThan(0);
    });
  });

  describe('mockRegulationAnalyses', () => {
    it('should have valid regulation analyses', () => {
      expect(mockRegulationAnalyses).toHaveLength(3);
      
      mockRegulationAnalyses.forEach(analysis => {
        expect(analysis).toHaveProperty('id');
        expect(analysis).toHaveProperty('title');
        expect(analysis).toHaveProperty('severityScore');
        expect(analysis).toHaveProperty('regulationType');
        expect(analysis).toHaveProperty('businessImpactAreas');
        expect(analysis).toHaveProperty('estimatedPenalty');
        expect(analysis).toHaveProperty('implementationTimeline');
        expect(analysis).toHaveProperty('plainEnglishSummary');
        expect(analysis).toHaveProperty('actionItems');
        expect(analysis).toHaveProperty('originalUrl');
        expect(analysis).toHaveProperty('processedDate');
        
        // Validate severity score range
        expect(analysis.severityScore).toBeGreaterThanOrEqual(1);
        expect(analysis.severityScore).toBeLessThanOrEqual(10);
        
        // Validate regulation type
        expect(['enforcement', 'final-rule', 'proposed-rule']).toContain(analysis.regulationType);
        
        // Validate business impact areas
        expect(Array.isArray(analysis.businessImpactAreas)).toBe(true);
        analysis.businessImpactAreas.forEach(area => {
          expect(['Operations', 'Reporting', 'Technology']).toContain(area);
        });
        
        // Validate other fields
        expect(typeof analysis.estimatedPenalty).toBe('number');
        expect(analysis.estimatedPenalty).toBeGreaterThanOrEqual(0);
        expect(typeof analysis.implementationTimeline).toBe('number');
        expect(analysis.implementationTimeline).toBeGreaterThan(0);
        expect(typeof analysis.plainEnglishSummary).toBe('string');
        expect(analysis.plainEnglishSummary.length).toBeGreaterThan(0);
        expect(Array.isArray(analysis.actionItems)).toBe(true);
        expect(analysis.originalUrl).toMatch(/^https?:\/\//);
        expect(analysis.processedDate).toBeInstanceOf(Date);
      });
    });

    it('should have different severity scores', () => {
      const severityScores = mockRegulationAnalyses.map(a => a.severityScore);
      const uniqueScores = new Set(severityScores);
      
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('should have different regulation types', () => {
      const types = mockRegulationAnalyses.map(a => a.regulationType);
      const uniqueTypes = new Set(types);
      
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });

  describe('mockStoredRegulations', () => {
    it('should have valid stored regulations', () => {
      expect(mockStoredRegulations).toHaveLength(3);
      
      mockStoredRegulations.forEach(regulation => {
        expect(regulation).toHaveProperty('id');
        expect(regulation).toHaveProperty('title');
        expect(regulation).toHaveProperty('originalData');
        expect(regulation).toHaveProperty('analysis');
        expect(regulation).toHaveProperty('createdAt');
        expect(regulation).toHaveProperty('updatedAt');
        expect(regulation).toHaveProperty('notificationsSent');
        
        expect(typeof regulation.id).toBe('string');
        expect(typeof regulation.title).toBe('string');
        expect(regulation.createdAt).toBeInstanceOf(Date);
        expect(regulation.updatedAt).toBeInstanceOf(Date);
        expect(Array.isArray(regulation.notificationsSent)).toBe(true);
        
        // Validate originalData structure
        expect(regulation.originalData).toHaveProperty('title');
        expect(regulation.originalData).toHaveProperty('link');
        expect(regulation.originalData).toHaveProperty('pubDate');
        expect(regulation.originalData).toHaveProperty('guid');
        
        // Validate analysis structure
        expect(regulation.analysis).toHaveProperty('id');
        expect(regulation.analysis).toHaveProperty('severityScore');
        expect(regulation.analysis).toHaveProperty('regulationType');
      });
    });

    it('should have matching IDs between regulation and analysis', () => {
      mockStoredRegulations.forEach(regulation => {
        expect(regulation.id).toBe(regulation.analysis.id);
      });
    });
  });

  describe('mockSubscribers', () => {
    it('should have valid subscribers', () => {
      expect(mockSubscribers).toHaveLength(3);
      
      mockSubscribers.forEach(subscriber => {
        expect(subscriber).toHaveProperty('email');
        expect(subscriber).toHaveProperty('subscribedAt');
        expect(subscriber).toHaveProperty('preferences');
        expect(subscriber).toHaveProperty('unsubscribeToken');
        
        // Validate email format
        expect(subscriber.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Validate date
        expect(subscriber.subscribedAt).toBeInstanceOf(Date);
        
        // Validate preferences
        expect(subscriber.preferences).toHaveProperty('immediateAlerts');
        expect(subscriber.preferences).toHaveProperty('dailyDigest');
        expect(subscriber.preferences).toHaveProperty('severityThreshold');
        
        expect(typeof subscriber.preferences.immediateAlerts).toBe('boolean');
        expect(typeof subscriber.preferences.dailyDigest).toBe('boolean');
        expect(typeof subscriber.preferences.severityThreshold).toBe('number');
        expect(subscriber.preferences.severityThreshold).toBeGreaterThanOrEqual(1);
        expect(subscriber.preferences.severityThreshold).toBeLessThanOrEqual(10);
        
        // Validate unsubscribe token
        expect(typeof subscriber.unsubscribeToken).toBe('string');
        expect(subscriber.unsubscribeToken.length).toBeGreaterThan(0);
      });
    });

    it('should have unique email addresses', () => {
      const emails = mockSubscribers.map(s => s.email);
      const uniqueEmails = new Set(emails);
      
      expect(uniqueEmails.size).toBe(emails.length);
    });

    it('should have different preferences', () => {
      const thresholds = mockSubscribers.map(s => s.preferences.severityThreshold);
      const uniqueThresholds = new Set(thresholds);
      
      expect(uniqueThresholds.size).toBeGreaterThan(1);
    });
  });

  describe('fintechKeywords', () => {
    it('should have relevant fintech keywords', () => {
      expect(Array.isArray(fintechKeywords)).toBe(true);
      expect(fintechKeywords.length).toBeGreaterThan(10);
      
      // Check for some expected keywords
      expect(fintechKeywords).toContain('cryptocurrency');
      expect(fintechKeywords).toContain('payment');
      expect(fintechKeywords).toContain('fintech');
      expect(fintechKeywords).toContain('broker-dealer');
      expect(fintechKeywords).toContain('digital asset');
    });

    it('should have lowercase keywords', () => {
      fintechKeywords.forEach(keyword => {
        expect(keyword).toBe(keyword.toLowerCase());
      });
    });
  });

  describe('getMockDataSet', () => {
    it('should return complete mock data set', () => {
      const mockData = getMockDataSet();
      
      expect(mockData).toHaveProperty('regulations');
      expect(mockData).toHaveProperty('subscribers');
      expect(mockData).toHaveProperty('notificationLogs');
      
      expect(Array.isArray(mockData.regulations)).toBe(true);
      expect(Array.isArray(mockData.subscribers)).toBe(true);
      expect(Array.isArray(mockData.notificationLogs)).toBe(true);
      
      expect(mockData.regulations.length).toBeGreaterThan(0);
      expect(mockData.subscribers.length).toBeGreaterThan(0);
    });
  });

  describe('loadMockData', () => {
    it('should not throw when localStorage is available', () => {
      // Mock window and localStorage
      Object.defineProperty(globalThis, 'window', {
        value: {
          localStorage: {
            setItem: vi.fn(),
            getItem: vi.fn(),
            removeItem: vi.fn(),
          },
        },
        writable: true,
      });
      
      expect(() => loadMockData()).not.toThrow();
    });

    it('should handle missing localStorage gracefully', () => {
      // Remove window object
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
      });
      
      expect(() => loadMockData()).not.toThrow();
    });
  });
});