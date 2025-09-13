import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubscriberService } from '../subscriberService';

describe('SubscriberService', () => {
  let service: SubscriberService;
  
  beforeEach(() => {
    service = new SubscriberService();
    // Clear localStorage before each test
    service.clearAllData();
  });

  afterEach(() => {
    // Clean up after each test
    service.clearAllData();
  });

  describe('subscribe', () => {
    it('should successfully subscribe a new email', async () => {
      const result = await service.subscribe('test@example.com');
      
      expect(result.success).toBe(true);
      expect(result.subscriber).toBeDefined();
      expect(result.subscriber!.email).toBe('test@example.com');
      expect(result.subscriber!.preferences.immediateAlerts).toBe(true);
      expect(result.subscriber!.preferences.dailyDigest).toBe(true);
      expect(result.subscriber!.preferences.severityThreshold).toBe(5);
      expect(result.subscriber!.unsubscribeToken).toBeTruthy();
    });

    it('should subscribe with custom preferences', async () => {
      const preferences = {
        immediateAlerts: false,
        dailyDigest: true,
        severityThreshold: 8
      };

      const result = await service.subscribe('test@example.com', preferences);
      
      expect(result.success).toBe(true);
      expect(result.subscriber!.preferences.immediateAlerts).toBe(false);
      expect(result.subscriber!.preferences.dailyDigest).toBe(true);
      expect(result.subscriber!.preferences.severityThreshold).toBe(8);
    });

    it('should reject invalid email addresses', async () => {
      const result = await service.subscribe('invalid-email');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address format');
    });

    it('should reject duplicate subscriptions', async () => {
      await service.subscribe('test@example.com');
      const result = await service.subscribe('test@example.com');
      
      expect(result.success).toBe(false);
      expect(result.alreadyExists).toBe(true);
      expect(result.error).toContain('already subscribed');
    });

    it('should normalize email addresses', async () => {
      const result = await service.subscribe('  TEST@EXAMPLE.COM  ');
      
      expect(result.success).toBe(true);
      expect(result.subscriber!.email).toBe('test@example.com');
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await service.subscribe('test1@example.com');
      await service.subscribe('test2@example.com');
    });

    it('should successfully unsubscribe existing email', async () => {
      const result = await service.unsubscribe('test1@example.com');
      
      expect(result).toBe(true);
      expect(service.getSubscriber('test1@example.com')).toBeNull();
      expect(service.getSubscriber('test2@example.com')).toBeTruthy();
    });

    it('should handle unsubscribing non-existent email', async () => {
      const result = await service.unsubscribe('nonexistent@example.com');
      
      expect(result).toBe(false);
    });

    it('should unsubscribe by token', async () => {
      const subscriber = service.getSubscriber('test1@example.com')!;
      const result = await service.unsubscribeByToken(subscriber.unsubscribeToken);
      
      expect(result).toBe(true);
      expect(service.getSubscriber('test1@example.com')).toBeNull();
    });

    it('should handle invalid unsubscribe token', async () => {
      const result = await service.unsubscribeByToken('invalid-token');
      
      expect(result).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    beforeEach(async () => {
      await service.subscribe('test@example.com');
    });

    it('should update subscriber preferences', async () => {
      const result = await service.updatePreferences('test@example.com', {
        immediateAlerts: false,
        severityThreshold: 9
      });
      
      expect(result).toBe(true);
      
      const subscriber = service.getSubscriber('test@example.com')!;
      expect(subscriber.preferences.immediateAlerts).toBe(false);
      expect(subscriber.preferences.severityThreshold).toBe(9);
      expect(subscriber.preferences.dailyDigest).toBe(true); // Should remain unchanged
    });

    it('should handle updating non-existent subscriber', async () => {
      const result = await service.updatePreferences('nonexistent@example.com', {
        immediateAlerts: false
      });
      
      expect(result).toBe(false);
    });
  });

  describe('getSubscribers', () => {
    beforeEach(async () => {
      await service.subscribe('immediate@example.com', { 
        immediateAlerts: true, 
        dailyDigest: false,
        severityThreshold: 6
      });
      await service.subscribe('digest@example.com', { 
        immediateAlerts: false, 
        dailyDigest: true,
        severityThreshold: 8
      });
      await service.subscribe('both@example.com', { 
        immediateAlerts: true, 
        dailyDigest: true,
        severityThreshold: 5
      });
    });

    it('should get all subscribers', () => {
      const subscribers = service.getAllSubscribers();
      expect(subscribers).toHaveLength(3);
    });

    it('should get immediate alert subscribers', () => {
      const subscribers = service.getImmediateAlertSubscribers();
      expect(subscribers).toHaveLength(2);
      expect(subscribers.map(s => s.email)).toContain('immediate@example.com');
      expect(subscribers.map(s => s.email)).toContain('both@example.com');
    });

    it('should get daily digest subscribers', () => {
      const subscribers = service.getDailyDigestSubscribers();
      expect(subscribers).toHaveLength(2);
      expect(subscribers.map(s => s.email)).toContain('digest@example.com');
      expect(subscribers.map(s => s.email)).toContain('both@example.com');
    });

    it('should get subscribers by severity threshold', () => {
      const highSeveritySubscribers = service.getSubscribersBySeverity(7);
      expect(highSeveritySubscribers).toHaveLength(2); // severity 6 and 5 qualify
      
      const veryHighSeveritySubscribers = service.getSubscribersBySeverity(9);
      expect(veryHighSeveritySubscribers).toHaveLength(1); // only severity 8 qualifies
    });
  });

  describe('notification logging', () => {
    it('should log notifications', () => {
      const log = {
        id: 'test-log-1',
        regulationId: 'reg-123',
        email: 'test@example.com',
        type: 'immediate' as const,
        sentAt: new Date(),
        status: 'sent' as const
      };

      service.logNotification(log);
      
      const logs = service.getNotificationLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('test-log-1');
    });

    it('should get subscriber-specific logs', () => {
      const log1 = {
        id: 'test-log-1',
        regulationId: 'reg-123',
        email: 'test1@example.com',
        type: 'immediate' as const,
        sentAt: new Date(),
        status: 'sent' as const
      };

      const log2 = {
        id: 'test-log-2',
        regulationId: 'reg-124',
        email: 'test2@example.com',
        type: 'digest' as const,
        sentAt: new Date(),
        status: 'sent' as const
      };

      service.logNotification(log1);
      service.logNotification(log2);
      
      const subscriber1Logs = service.getSubscriberLogs('test1@example.com');
      expect(subscriber1Logs).toHaveLength(1);
      expect(subscriber1Logs[0].id).toBe('test-log-1');
    });

    it('should get notification statistics', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Add some test logs
      service.logNotification({
        id: 'log-1',
        regulationId: 'reg-1',
        email: 'test@example.com',
        type: 'immediate',
        sentAt: now,
        status: 'sent'
      });

      service.logNotification({
        id: 'log-2',
        regulationId: 'reg-2',
        email: 'test@example.com',
        type: 'digest',
        sentAt: yesterday,
        status: 'failed'
      });

      const stats = service.getNotificationStats(7);
      expect(stats.totalSent).toBe(2);
      expect(stats.successfulSent).toBe(1);
      expect(stats.failedSent).toBe(1);
      expect(stats.immediateAlerts).toBe(1);
      expect(stats.dailyDigests).toBe(1);
    });
  });

  describe('subscriber statistics', () => {
    beforeEach(async () => {
      await service.subscribe('test1@example.com', { immediateAlerts: true, dailyDigest: false, severityThreshold: 6 });
      await service.subscribe('test2@example.com', { immediateAlerts: false, dailyDigest: true, severityThreshold: 8 });
      await service.subscribe('test3@example.com', { immediateAlerts: true, dailyDigest: true, severityThreshold: 5 });
    });

    it('should calculate subscriber statistics', () => {
      const stats = service.getSubscriberStats();
      
      expect(stats.totalSubscribers).toBe(3);
      expect(stats.activeSubscribers).toBe(3);
      expect(stats.immediateAlertsEnabled).toBe(2);
      expect(stats.dailyDigestEnabled).toBe(2);
      expect(stats.averageSeverityThreshold).toBeCloseTo(6.33, 1);
    });
  });

  describe('data management', () => {
    beforeEach(async () => {
      await service.subscribe('test1@example.com');
      await service.subscribe('test2@example.com');
    });

    it('should export subscriber data', () => {
      const exported = service.exportSubscribers();
      const data = JSON.parse(exported);
      
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].email).toBeTruthy();
    });

    it('should import subscriber data', () => {
      const testData = JSON.stringify([
        {
          email: 'imported@example.com',
          subscribedAt: new Date().toISOString(),
          preferences: {
            immediateAlerts: true,
            dailyDigest: false,
            severityThreshold: 7
          },
          unsubscribeToken: 'test-token'
        }
      ]);

      const result = service.importSubscribers(testData);
      expect(result).toBe(true);
      
      const subscriber = service.getSubscriber('imported@example.com');
      expect(subscriber).toBeTruthy();
      expect(subscriber!.preferences.severityThreshold).toBe(7);
    });

    it('should handle invalid import data', () => {
      const result = service.importSubscribers('invalid json');
      expect(result).toBe(false);
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
      expect(service.validateEmail('test.example.com')).toBe(false);
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup old logs', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      // Add old and recent logs
      service.logNotification({
        id: 'old-log',
        regulationId: 'reg-1',
        email: 'test@example.com',
        type: 'immediate',
        sentAt: oldDate,
        status: 'sent'
      });

      service.logNotification({
        id: 'recent-log',
        regulationId: 'reg-2',
        email: 'test@example.com',
        type: 'digest',
        sentAt: recentDate,
        status: 'sent'
      });

      const removedCount = service.cleanupOldLogs(30); // Keep 30 days
      expect(removedCount).toBe(1);
      
      const remainingLogs = service.getNotificationLogs();
      expect(remainingLogs).toHaveLength(1);
      expect(remainingLogs[0].id).toBe('recent-log');
    });
  });
});