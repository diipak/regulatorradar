import { emailService } from './emailService';
import { subscriberService } from './subscriberService';
import type { RegulationAnalysis, NotificationLog } from '../types';

/**
 * Notification processing result
 */
interface NotificationResult {
  success: boolean;
  totalSent: number;
  successfulSent: number;
  failedSent: number;
  logs: NotificationLog[];
  errors: string[];
}

/**
 * Notification scheduling configuration
 */
interface NotificationConfig {
  immediateAlertThreshold: number; // Severity threshold for immediate alerts
  dailyDigestTime: string; // Time to send daily digest (HH:MM format)
  maxEmailsPerBatch: number; // Rate limiting
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Notification Service
 * 
 * Orchestrates email notifications by coordinating between email service
 * and subscriber service. Handles immediate alerts and daily digests.
 */
class NotificationService {
  private config: NotificationConfig;
  private dailyDigestTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.config = {
      immediateAlertThreshold: 7, // Send immediate alerts for severity 7+
      dailyDigestTime: '09:00', // 9 AM daily digest
      maxEmailsPerBatch: 10,
      retryAttempts: 3,
      retryDelay: 5000 // 5 seconds
    };
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize email service
      await emailService.initialize();
      
      // Schedule daily digest
      this.scheduleDailyDigest();
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Process new regulation for immediate alerts
   */
  async processImmediateAlert(regulation: RegulationAnalysis): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      totalSent: 0,
      successfulSent: 0,
      failedSent: 0,
      logs: [],
      errors: []
    };

    try {
      // Check if regulation meets immediate alert threshold
      if (regulation.severityScore < this.config.immediateAlertThreshold) {
        result.success = true;
        return result;
      }

      // Get subscribers who want immediate alerts and meet severity threshold
      const subscribers = subscriberService.getImmediateAlertSubscribers()
        .filter(sub => regulation.severityScore >= sub.preferences.severityThreshold);

      if (subscribers.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Sending immediate alerts for regulation: ${regulation.title} to ${subscribers.length} subscribers`);

      // Send emails in batches to avoid rate limiting
      const batches = this.createBatches(subscribers, this.config.maxEmailsPerBatch);
      
      for (const batch of batches) {
        const batchResults = await this.sendImmediateAlertBatch(regulation, batch);
        
        result.logs.push(...batchResults.logs);
        result.totalSent += batchResults.totalSent;
        result.successfulSent += batchResults.successfulSent;
        result.failedSent += batchResults.failedSent;
        result.errors.push(...batchResults.errors);

        // Delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(2000);
        }
      }

      result.success = true;
      console.log(`Immediate alert processing complete: ${result.successfulSent}/${result.totalSent} sent successfully`);

    } catch (error) {
      console.error('Failed to process immediate alert:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Send daily digest to all subscribers
   */
  async sendDailyDigest(regulations: RegulationAnalysis[]): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      totalSent: 0,
      successfulSent: 0,
      failedSent: 0,
      logs: [],
      errors: []
    };

    try {
      // Get subscribers who want daily digest
      const subscribers = subscriberService.getDailyDigestSubscribers();

      if (subscribers.length === 0) {
        result.success = true;
        return result;
      }

      console.log(`Sending daily digest to ${subscribers.length} subscribers`);

      // Send emails in batches
      const batches = this.createBatches(subscribers, this.config.maxEmailsPerBatch);
      
      for (const batch of batches) {
        const batchResults = await this.sendDailyDigestBatch(regulations, batch);
        
        result.logs.push(...batchResults.logs);
        result.totalSent += batchResults.totalSent;
        result.successfulSent += batchResults.successfulSent;
        result.failedSent += batchResults.failedSent;
        result.errors.push(...batchResults.errors);

        // Delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(3000);
        }
      }

      result.success = true;
      console.log(`Daily digest processing complete: ${result.successfulSent}/${result.totalSent} sent successfully`);

    } catch (error) {
      console.error('Failed to send daily digest:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(email: string): Promise<boolean> {
    try {
      const result = await emailService.sendTestEmail(email);
      
      if (result.success) {
        console.log(`Test email sent successfully to ${email}`);
        return true;
      } else {
        console.error(`Failed to send test email to ${email}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(days: number = 7): {
    emailStats: ReturnType<typeof subscriberService.getNotificationStats>;
    subscriberStats: ReturnType<typeof subscriberService.getSubscriberStats>;
    serviceStatus: ReturnType<typeof emailService.getConfigStatus>;
  } {
    return {
      emailStats: subscriberService.getNotificationStats(days),
      subscriberStats: subscriberService.getSubscriberStats(),
      serviceStatus: emailService.getConfigStatus()
    };
  }

  /**
   * Schedule daily digest emails
   */
  private scheduleDailyDigest(): void {
    // Clear existing timer
    if (this.dailyDigestTimer) {
      clearTimeout(this.dailyDigestTimer);
    }

    // Calculate next digest time
    const now = new Date();
    const [hours, minutes] = this.config.dailyDigestTime.split(':').map(Number);
    
    const nextDigest = new Date();
    nextDigest.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextDigest <= now) {
      nextDigest.setDate(nextDigest.getDate() + 1);
    }

    const msUntilDigest = nextDigest.getTime() - now.getTime();

    console.log(`Next daily digest scheduled for: ${nextDigest.toLocaleString()}`);

    this.dailyDigestTimer = setTimeout(async () => {
      try {
        // Get regulations from the last 24 hours
        const regulations = this.getRecentRegulations(24);
        
        if (regulations.length > 0) {
          await this.sendDailyDigest(regulations);
        }
        
        // Schedule next digest
        this.scheduleDailyDigest();
        
      } catch (error) {
        console.error('Daily digest failed:', error);
        // Still schedule next digest even if this one failed
        this.scheduleDailyDigest();
      }
    }, msUntilDigest);
  }

  /**
   * Send immediate alert batch
   */
  private async sendImmediateAlertBatch(
    regulation: RegulationAnalysis,
    subscribers: any[]
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      totalSent: 0,
      successfulSent: 0,
      failedSent: 0,
      logs: [],
      errors: []
    };

    for (const subscriber of subscribers) {
      let attempts = 0;
      let emailResult;

      // Retry logic
      while (attempts < this.config.retryAttempts) {
        try {
          emailResult = await emailService.sendImmediateAlert(regulation, subscriber);
          break;
        } catch (error) {
          attempts++;
          if (attempts < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay);
          } else {
            emailResult = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            };
          }
        }
      }

      // Create log entry
      const logEntry: NotificationLog = {
        id: this.generateLogId(),
        regulationId: regulation.id,
        email: subscriber.email,
        type: 'immediate',
        sentAt: emailResult!.timestamp,
        status: emailResult!.success ? 'sent' : 'failed'
      };

      result.logs.push(logEntry);
      subscriberService.logNotification(logEntry);

      result.totalSent++;
      if (emailResult!.success) {
        result.successfulSent++;
      } else {
        result.failedSent++;
        result.errors.push(`Failed to send to ${subscriber.email}: ${emailResult!.error}`);
      }

      // Small delay between individual emails
      await this.delay(500);
    }

    return result;
  }

  /**
   * Send daily digest batch
   */
  private async sendDailyDigestBatch(
    regulations: RegulationAnalysis[],
    subscribers: any[]
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      totalSent: 0,
      successfulSent: 0,
      failedSent: 0,
      logs: [],
      errors: []
    };

    for (const subscriber of subscribers) {
      let attempts = 0;
      let emailResult;

      // Retry logic
      while (attempts < this.config.retryAttempts) {
        try {
          emailResult = await emailService.sendDailyDigest(regulations, subscriber);
          break;
        } catch (error) {
          attempts++;
          if (attempts < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay);
          } else {
            emailResult = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            };
          }
        }
      }

      // Create log entry
      const logEntry: NotificationLog = {
        id: this.generateLogId(),
        regulationId: regulations[0]?.id || 'digest',
        email: subscriber.email,
        type: 'digest',
        sentAt: emailResult!.timestamp,
        status: emailResult!.success ? 'sent' : 'failed'
      };

      result.logs.push(logEntry);
      subscriberService.logNotification(logEntry);

      result.totalSent++;
      if (emailResult!.success) {
        result.successfulSent++;
      } else {
        result.failedSent++;
        result.errors.push(`Failed to send to ${subscriber.email}: ${emailResult!.error}`);
      }

      // Small delay between individual emails
      await this.delay(500);
    }

    return result;
  }

  /**
   * Helper methods
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRecentRegulations(_hours: number): RegulationAnalysis[] {
    // This would typically fetch from a database or storage
    // For now, return empty array as this is a demo implementation
    // In a real implementation, this would integrate with the regulation storage service
    return [];
  }

  /**
   * Update notification configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reschedule daily digest if time changed
    if (config.dailyDigestTime) {
      this.scheduleDailyDigest();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Stop all scheduled notifications
   */
  stop(): void {
    if (this.dailyDigestTimer) {
      clearTimeout(this.dailyDigestTimer);
      this.dailyDigestTimer = null;
    }
    console.log('Notification service stopped');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types and classes
export { NotificationService };
export type { NotificationResult, NotificationConfig };