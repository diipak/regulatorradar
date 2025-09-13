import type { Subscriber, NotificationLog } from '../types';

/**
 * Subscriber preferences for notifications
 */
export interface SubscriberPreferences {
  immediateAlerts: boolean;
  dailyDigest: boolean;
  severityThreshold: number; // 1-10 scale
}

/**
 * Subscription result
 */
interface SubscriptionResult {
  success: boolean;
  subscriber?: Subscriber;
  error?: string;
  alreadyExists?: boolean;
}

/**
 * Subscriber statistics
 */
interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  immediateAlertsEnabled: number;
  dailyDigestEnabled: number;
  averageSeverityThreshold: number;
  recentSubscriptions: number; // Last 7 days
}

/**
 * Subscriber Management Service
 * 
 * Handles email subscription management, preferences, and unsubscribe functionality
 * using localStorage for data persistence.
 */
class SubscriberService {
  private readonly STORAGE_KEY = 'regulatorradar_subscribers';
  private readonly LOGS_STORAGE_KEY = 'regulatorradar_notification_logs';
  private readonly MAX_LOGS = 1000; // Maximum notification logs to keep

  /**
   * Subscribe a new email address
   */
  async subscribe(
    email: string, 
    preferences?: Partial<SubscriberPreferences>
  ): Promise<SubscriptionResult> {
    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Check if already subscribed
      const existingSubscriber = this.getSubscriber(email);
      if (existingSubscriber) {
        return {
          success: false,
          error: 'Email address already subscribed',
          alreadyExists: true,
          subscriber: existingSubscriber
        };
      }

      // Create new subscriber
      const subscriber: Subscriber = {
        email: email.toLowerCase().trim(),
        subscribedAt: new Date(),
        preferences: {
          immediateAlerts: preferences?.immediateAlerts ?? true,
          dailyDigest: preferences?.dailyDigest ?? true,
          severityThreshold: preferences?.severityThreshold ?? 5
        },
        unsubscribeToken: this.generateUnsubscribeToken()
      };

      // Save to storage
      const subscribers = this.getAllSubscribers();
      subscribers.push(subscriber);
      this.saveSubscribers(subscribers);

      console.log(`New subscriber added: ${email}`);

      return {
        success: true,
        subscriber
      };

    } catch (error) {
      console.error('Failed to subscribe email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unsubscribe using email address
   */
  async unsubscribe(email: string): Promise<boolean> {
    try {
      const subscribers = this.getAllSubscribers();
      const initialLength = subscribers.length;
      
      const filteredSubscribers = subscribers.filter(
        sub => sub.email.toLowerCase() !== email.toLowerCase()
      );

      if (filteredSubscribers.length === initialLength) {
        console.warn(`Attempted to unsubscribe non-existent email: ${email}`);
        return false;
      }

      this.saveSubscribers(filteredSubscribers);
      console.log(`Unsubscribed: ${email}`);
      return true;

    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Unsubscribe using token
   */
  async unsubscribeByToken(token: string): Promise<boolean> {
    try {
      const subscribers = this.getAllSubscribers();
      const subscriber = subscribers.find(sub => sub.unsubscribeToken === token);

      if (!subscriber) {
        console.warn(`Invalid unsubscribe token: ${token}`);
        return false;
      }

      return await this.unsubscribe(subscriber.email);

    } catch (error) {
      console.error('Failed to unsubscribe by token:', error);
      return false;
    }
  }

  /**
   * Update subscriber preferences
   */
  async updatePreferences(
    email: string, 
    preferences: Partial<SubscriberPreferences>
  ): Promise<boolean> {
    try {
      const subscribers = this.getAllSubscribers();
      const subscriberIndex = subscribers.findIndex(
        sub => sub.email.toLowerCase() === email.toLowerCase()
      );

      if (subscriberIndex === -1) {
        console.warn(`Subscriber not found: ${email}`);
        return false;
      }

      // Update preferences
      subscribers[subscriberIndex].preferences = {
        ...subscribers[subscriberIndex].preferences,
        ...preferences
      };

      this.saveSubscribers(subscribers);
      console.log(`Updated preferences for: ${email}`);
      return true;

    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }

  /**
   * Get subscriber by email
   */
  getSubscriber(email: string): Subscriber | null {
    try {
      const subscribers = this.getAllSubscribers();
      return subscribers.find(
        sub => sub.email.toLowerCase() === email.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Failed to get subscriber:', error);
      return null;
    }
  }

  /**
   * Get all subscribers
   */
  getAllSubscribers(): Subscriber[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const subscribers = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return subscribers.map((sub: any) => ({
        ...sub,
        subscribedAt: new Date(sub.subscribedAt)
      }));

    } catch (error) {
      console.error('Failed to load subscribers:', error);
      return [];
    }
  }

  /**
   * Get subscribers who want immediate alerts
   */
  getImmediateAlertSubscribers(): Subscriber[] {
    return this.getAllSubscribers().filter(
      sub => sub.preferences.immediateAlerts
    );
  }

  /**
   * Get subscribers who want daily digest
   */
  getDailyDigestSubscribers(): Subscriber[] {
    return this.getAllSubscribers().filter(
      sub => sub.preferences.dailyDigest
    );
  }

  /**
   * Get subscribers interested in specific severity level
   */
  getSubscribersBySeverity(severityScore: number): Subscriber[] {
    return this.getAllSubscribers().filter(
      sub => severityScore >= sub.preferences.severityThreshold
    );
  }

  /**
   * Log notification sent to subscriber
   */
  logNotification(log: NotificationLog): void {
    try {
      const logs = this.getNotificationLogs();
      logs.unshift(log); // Add to beginning

      // Keep only the most recent logs
      const trimmedLogs = logs.slice(0, this.MAX_LOGS);
      
      localStorage.setItem(this.LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));

    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Get notification logs
   */
  getNotificationLogs(): NotificationLog[] {
    try {
      const stored = localStorage.getItem(this.LOGS_STORAGE_KEY);
      if (!stored) return [];

      const logs = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        sentAt: new Date(log.sentAt)
      }));

    } catch (error) {
      console.error('Failed to load notification logs:', error);
      return [];
    }
  }

  /**
   * Get notification logs for specific subscriber
   */
  getSubscriberLogs(email: string): NotificationLog[] {
    return this.getNotificationLogs().filter(
      log => log.email.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Get recent notification statistics
   */
  getNotificationStats(days: number = 7): {
    totalSent: number;
    successfulSent: number;
    failedSent: number;
    immediateAlerts: number;
    dailyDigests: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentLogs = this.getNotificationLogs().filter(
      log => log.sentAt >= cutoffDate
    );

    return {
      totalSent: recentLogs.length,
      successfulSent: recentLogs.filter(log => log.status === 'sent').length,
      failedSent: recentLogs.filter(log => log.status === 'failed').length,
      immediateAlerts: recentLogs.filter(log => log.type === 'immediate').length,
      dailyDigests: recentLogs.filter(log => log.type === 'digest').length
    };
  }

  /**
   * Get subscriber statistics
   */
  getSubscriberStats(): SubscriberStats {
    const subscribers = this.getAllSubscribers();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubscriptions = subscribers.filter(
      sub => sub.subscribedAt >= sevenDaysAgo
    ).length;

    const totalThreshold = subscribers.reduce(
      (sum, sub) => sum + sub.preferences.severityThreshold, 0
    );

    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: subscribers.length, // All are considered active in this simple implementation
      immediateAlertsEnabled: subscribers.filter(sub => sub.preferences.immediateAlerts).length,
      dailyDigestEnabled: subscribers.filter(sub => sub.preferences.dailyDigest).length,
      averageSeverityThreshold: subscribers.length > 0 ? totalThreshold / subscribers.length : 0,
      recentSubscriptions
    };
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email is already subscribed
   */
  isSubscribed(email: string): boolean {
    return this.getSubscriber(email) !== null;
  }

  /**
   * Export subscribers data (for backup/migration)
   */
  exportSubscribers(): string {
    const subscribers = this.getAllSubscribers();
    return JSON.stringify(subscribers, null, 2);
  }

  /**
   * Import subscribers data (for backup/migration)
   */
  importSubscribers(data: string): boolean {
    try {
      const subscribers = JSON.parse(data);
      
      // Validate data structure
      if (!Array.isArray(subscribers)) {
        throw new Error('Invalid data format: expected array');
      }

      // Validate each subscriber
      for (const sub of subscribers) {
        if (!sub.email || !sub.subscribedAt || !sub.preferences || !sub.unsubscribeToken) {
          throw new Error('Invalid subscriber data structure');
        }
      }

      this.saveSubscribers(subscribers);
      console.log(`Imported ${subscribers.length} subscribers`);
      return true;

    } catch (error) {
      console.error('Failed to import subscribers:', error);
      return false;
    }
  }

  /**
   * Clear all subscriber data (for testing/reset)
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LOGS_STORAGE_KEY);
    console.log('All subscriber data cleared');
  }

  /**
   * Private helper methods
   */
  private saveSubscribers(subscribers: Subscriber[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscribers));
  }

  private generateUnsubscribeToken(): string {
    return `unsub_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Cleanup old notification logs
   */
  cleanupOldLogs(daysToKeep: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logs = this.getNotificationLogs();
    const initialCount = logs.length;
    
    const filteredLogs = logs.filter(log => log.sentAt >= cutoffDate);
    
    localStorage.setItem(this.LOGS_STORAGE_KEY, JSON.stringify(filteredLogs));
    
    const removedCount = initialCount - filteredLogs.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old notification logs`);
    }
    
    return removedCount;
  }
}

// Export singleton instance
export const subscriberService = new SubscriberService();

// Export types and classes
export { SubscriberService };
export type { SubscriptionResult, SubscriberStats };