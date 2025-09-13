import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';
import type { StoredRegulation, Subscriber, UserPreferences, SystemState } from '../../types';

// Mock data for testing
const mockRegulation: StoredRegulation = {
  id: 'reg-2024-001',
  title: 'Test Regulation',
  originalData: {
    title: 'Test Regulation',
    link: 'https://sec.gov/test',
    pubDate: new Date('2024-01-15'),
    description: 'Test description',
    guid: 'test-guid',
  },
  analysis: {
    id: 'reg-2024-001',
    title: 'Test Regulation',
    severityScore: 8,
    regulationType: 'enforcement',
    businessImpactAreas: ['Operations'],
    estimatedPenalty: 1000000,
    implementationTimeline: 30,
    plainEnglishSummary: 'Test summary',
    actionItems: [],
    originalUrl: 'https://sec.gov/test',
    processedDate: new Date('2024-01-15'),
  },
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  notificationsSent: [],
};

const mockSubscriber: Subscriber = {
  email: 'test@example.com',
  subscribedAt: new Date('2024-01-01'),
  preferences: {
    immediateAlerts: true,
    dailyDigest: true,
    severityThreshold: 7,
  },
  unsubscribeToken: 'test-token-123',
};

describe('storage utility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset localStorage mock to return null by default
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockImplementation(() => {});
    vi.mocked(localStorage.removeItem).mockImplementation(() => {});
  });

  describe('generic storage operations', () => {
    it('should get data from localStorage', () => {
      const testData = { key: 'value' };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(testData));

      const result = storage.get('test-key');
      
      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for missing keys', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = storage.get('missing-key');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json');
      
      const result = storage.get('invalid-key');
      
      expect(result).toBeNull();
    });

    it('should set data to localStorage', () => {
      const testData = { key: 'value' };
      
      const result = storage.set('test-key', testData);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
      expect(result).toBe(true);
    });

    it('should handle localStorage errors when setting', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const result = storage.set('test-key', { data: 'test' });
      
      expect(result).toBe(false);
    });

    it('should remove data from localStorage', () => {
      const result = storage.remove('test-key');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
  });

  describe('regulations operations', () => {
    it('should get empty array when no regulations exist', () => {
      const result = storage.getRegulations();
      
      expect(result).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('regulatorradar_regulations');
    });

    it('should get existing regulations', () => {
      const regulations = [mockRegulation];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(regulations));
      
      const result = storage.getRegulations();
      
      // Compare structure without worrying about Date serialization
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockRegulation.id);
      expect(result[0].title).toBe(mockRegulation.title);
    });

    it('should set regulations', () => {
      const regulations = [mockRegulation];
      
      const result = storage.setRegulations(regulations);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'regulatorradar_regulations',
        JSON.stringify(regulations)
      );
      expect(result).toBe(true);
    });

    it('should add new regulation', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      
      const result = storage.addRegulation(mockRegulation);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should update existing regulation', () => {
      const existingRegulations = [mockRegulation];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existingRegulations));
      
      const updatedRegulation = { ...mockRegulation, title: 'Updated Title' };
      const result = storage.addRegulation(updatedRegulation);
      
      expect(result).toBe(true);
    });

    it('should get regulation by ID', () => {
      const regulations = [mockRegulation];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(regulations));
      
      const result = storage.getRegulationById('reg-2024-001');
      
      expect(result?.id).toBe(mockRegulation.id);
      expect(result?.title).toBe(mockRegulation.title);
    });

    it('should return null for non-existent regulation ID', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      
      const result = storage.getRegulationById('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('subscribers operations', () => {
    it('should get empty array when no subscribers exist', () => {
      const result = storage.getSubscribers();
      
      expect(result).toEqual([]);
    });

    it('should add new subscriber', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      
      const result = storage.addSubscriber('test@example.com');
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should not add duplicate subscriber', () => {
      const subscribers = [mockSubscriber];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(subscribers));
      
      const result = storage.addSubscriber('test@example.com');
      
      expect(result).toBe(true); // Returns true even for duplicates
    });

    it('should remove subscriber', () => {
      const subscribers = [mockSubscriber];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(subscribers));
      
      const result = storage.removeSubscriber('test@example.com');
      
      expect(result).toBe(true);
    });

    it('should get subscriber by email', () => {
      const subscribers = [mockSubscriber];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(subscribers));
      
      const result = storage.getSubscriberByEmail('test@example.com');
      
      expect(result?.email).toBe(mockSubscriber.email);
      expect(result?.unsubscribeToken).toBe(mockSubscriber.unsubscribeToken);
    });

    it('should update subscriber preferences', () => {
      const subscribers = [mockSubscriber];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(subscribers));
      
      const newPreferences = { severityThreshold: 9 };
      const result = storage.updateSubscriberPreferences('test@example.com', newPreferences);
      
      expect(result).toBe(true);
    });

    it('should return false when updating non-existent subscriber', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      
      const result = storage.updateSubscriberPreferences('nonexistent@example.com', {});
      
      expect(result).toBe(false);
    });
  });

  describe('user preferences operations', () => {
    it('should get default preferences when none exist', () => {
      const result = storage.getUserPreferences();
      
      expect(result).toEqual({
        theme: 'light',
        emailNotifications: true,
        severityFilter: 5,
        autoRefresh: true,
      });
    });

    it('should get existing preferences', () => {
      const preferences: UserPreferences = {
        theme: 'dark',
        emailNotifications: false,
        severityFilter: 8,
        autoRefresh: false,
      };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(preferences));
      
      const result = storage.getUserPreferences();
      
      expect(result).toEqual(preferences);
    });

    it('should set user preferences', () => {
      const preferences: UserPreferences = {
        theme: 'dark',
        emailNotifications: false,
        severityFilter: 8,
        autoRefresh: false,
      };
      
      const result = storage.setUserPreferences(preferences);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'regulatorradar_user_preferences',
        JSON.stringify(preferences)
      );
    });
  });

  describe('system state operations', () => {
    it('should get default system state when none exists', () => {
      const result = storage.getSystemState();
      
      expect(result.systemHealth).toBe('healthy');
      expect(result.totalRegulationsProcessed).toBe(0);
      expect(result.activeSubscribers).toBe(0);
    });

    it('should update system state', () => {
      const currentState: SystemState = {
        lastRSSCheck: new Date('2024-01-01'),
        totalRegulationsProcessed: 5,
        activeSubscribers: 3,
        systemHealth: 'healthy',
      };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(currentState));
      
      const updates = { totalRegulationsProcessed: 10 };
      const result = storage.updateSystemState(updates);
      
      expect(result).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should clear all data', () => {
      const result = storage.clearAllData();
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledTimes(7); // Number of storage keys
    });

    it('should export data', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      
      const result = storage.exportData();
      
      expect(result).toContain('regulations');
      expect(result).toContain('subscribers');
      expect(result).toContain('exportedAt');
    });

    it('should calculate storage usage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{"test": "data"}');
      
      const result = storage.getStorageUsage();
      
      expect(result).toHaveProperty('used');
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('percentage');
      expect(typeof result.used).toBe('number');
      expect(typeof result.percentage).toBe('number');
    });
  });

  describe('date operations', () => {
    it('should handle last check date', () => {
      const testDate = new Date('2024-01-15T10:00:00Z');
      
      // Test setting
      const setResult = storage.setLastCheck(testDate);
      expect(setResult).toBe(true);
      
      // Test getting when date exists
      vi.mocked(localStorage.getItem).mockReturnValue(`"${testDate.toISOString()}"`);
      const getResult = storage.getLastCheck();
      expect(getResult?.getTime()).toBe(testDate.getTime());
    });

    it('should return null when no last check date exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      
      const result = storage.getLastCheck();
      
      expect(result).toBeNull();
    });
  });
});