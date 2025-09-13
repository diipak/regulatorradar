import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from '../emailService';
import type { RegulationAnalysis, Subscriber } from '../../types';

describe('EmailService', () => {
  let service: EmailService;
  
  beforeEach(() => {
    service = new EmailService();
  });

  const mockRegulation: RegulationAnalysis = {
    id: 'reg-123',
    title: 'Test SEC Regulation',
    severityScore: 8,
    regulationType: 'enforcement',
    businessImpactAreas: ['Operations', 'Technology'],
    estimatedPenalty: 500000,
    implementationTimeline: 90,
    plainEnglishSummary: 'The SEC has taken enforcement action against a company for AML violations.',
    actionItems: [
      {
        description: 'Review compliance procedures',
        priority: 'high',
        estimatedHours: 4,
        category: 'legal',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ],
    originalUrl: 'https://www.sec.gov/enforce/example',
    processedDate: new Date()
  };

  const mockSubscriber: Subscriber = {
    email: 'test@example.com',
    subscribedAt: new Date(),
    preferences: {
      immediateAlerts: true,
      dailyDigest: true,
      severityThreshold: 5
    },
    unsubscribeToken: 'test-token-123'
  };

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const status = service.getConfigStatus();
      expect(status.initialized).toBe(false);
      expect(status.configured).toBe(false);
    });
  });

  describe('sendImmediateAlert', () => {
    it('should not send alert if subscriber disabled immediate alerts', async () => {
      const subscriberNoAlerts = {
        ...mockSubscriber,
        preferences: { ...mockSubscriber.preferences, immediateAlerts: false }
      };

      const result = await service.sendImmediateAlert(mockRegulation, subscriberNoAlerts);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled immediate alerts');
    });

    it('should not send alert if regulation below severity threshold', async () => {
      const lowSeverityRegulation = { ...mockRegulation, severityScore: 3 };
      
      const result = await service.sendImmediateAlert(lowSeverityRegulation, mockSubscriber);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('below subscriber severity threshold');
    });
  });

  describe('sendDailyDigest', () => {
    it('should not send digest if subscriber disabled daily digest', async () => {
      const subscriberNoDigest = {
        ...mockSubscriber,
        preferences: { ...mockSubscriber.preferences, dailyDigest: false }
      };

      const result = await service.sendDailyDigest([mockRegulation], subscriberNoDigest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled daily digest');
    });

    it('should not send digest if no regulations meet threshold', async () => {
      const lowSeverityRegulation = { ...mockRegulation, severityScore: 3 };
      
      const result = await service.sendDailyDigest([lowSeverityRegulation], mockSubscriber);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No regulations meet subscriber severity threshold');
    });
  });

  describe('email validation', () => {
    it('should validate correct email addresses', () => {
      expect(service.validateEmail('test@example.com')).toBe(true);
      expect(service.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(service.validateEmail('invalid')).toBe(false);
      expect(service.validateEmail('test@')).toBe(false);
      expect(service.validateEmail('@example.com')).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      service.updateConfig({
        serviceId: 'new-service-id',
        templateId: 'new-template-id'
      });

      const status = service.getConfigStatus();
      expect(status.serviceId).toBe('new-service-id');
    });

    it('should detect if service is configured', () => {
      expect(service.isConfigured()).toBe(false);
      
      service.updateConfig({
        serviceId: 'real-service-id',
        templateId: 'real-template-id',
        publicKey: 'real-public-key'
      });
      
      expect(service.isConfigured()).toBe(true);
    });
  });
});