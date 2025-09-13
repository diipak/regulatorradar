import emailjs from '@emailjs/browser';
import type { 
  RegulationAnalysis, 
  Subscriber, 
  NotificationLog,
  ActionItem 
} from '../types';

/**
 * Email service configuration
 */
interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  fromName: string;
  fromEmail: string;
}

/**
 * Email template data for immediate alerts
 */
interface ImmediateAlertData {
  to_email: string;
  to_name: string;
  regulation_title: string;
  severity_score: number;
  regulation_type: string;
  plain_english_summary: string;
  action_items: string;
  compliance_deadlines: string;
  regulation_url: string;
  unsubscribe_url: string;
  [key: string]: unknown;
}

/**
 * Email template data for daily digest
 */
interface DailyDigestData {
  to_email: string;
  to_name: string;
  digest_date: string;
  total_regulations: number;
  high_priority_count: number;
  regulations_summary: string;
  top_action_items: string;
  unsubscribe_url: string;
  [key: string]: unknown;
}

/**
 * Email sending result
 */
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Email Service for RegulatorRadar
 * 
 * Handles sending immediate alerts and daily digest emails
 * using EmailJS service integration.
 */
class EmailService {
  private config: EmailConfig;
  private initialized: boolean = false;

  constructor() {
    // Default configuration - should be overridden with actual EmailJS credentials
    this.config = {
      serviceId: process.env.VITE_EMAILJS_SERVICE_ID || 'service_default',
      templateId: process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default',
      publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_default',
      fromName: 'RegulatorRadar',
      fromEmail: 'alerts@regulatorradar.com'
    };
  }

  /**
   * Initialize EmailJS with configuration
   */
  async initialize(config?: Partial<EmailConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      emailjs.init(this.config.publicKey);
      this.initialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      throw new Error('Email service initialization failed');
    }
  }

  /**
   * Send immediate alert for high-priority regulations
   */
  async sendImmediateAlert(
    regulation: RegulationAnalysis,
    subscriber: Subscriber
  ): Promise<EmailResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check if subscriber wants immediate alerts
      if (!subscriber.preferences.immediateAlerts) {
        return {
          success: false,
          error: 'Subscriber has disabled immediate alerts',
          timestamp: new Date()
        };
      }

      // Check severity threshold
      if (regulation.severityScore < subscriber.preferences.severityThreshold) {
        return {
          success: false,
          error: 'Regulation below subscriber severity threshold',
          timestamp: new Date()
        };
      }

      // Prepare email data
      const emailData: ImmediateAlertData = {
        to_email: subscriber.email,
        to_name: this.extractNameFromEmail(subscriber.email),
        regulation_title: regulation.title,
        severity_score: regulation.severityScore,
        regulation_type: this.formatRegulationType(regulation.regulationType),
        plain_english_summary: regulation.plainEnglishSummary,
        action_items: this.formatActionItems(regulation.actionItems),
        compliance_deadlines: this.formatComplianceDeadlines(regulation.actionItems),
        regulation_url: regulation.originalUrl,
        unsubscribe_url: this.generateUnsubscribeUrl(subscriber.unsubscribeToken)
      };

      // Send email via EmailJS
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        emailData
      );

      return {
        success: true,
        messageId: response.text,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Failed to send immediate alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send daily digest email
   */
  async sendDailyDigest(
    regulations: RegulationAnalysis[],
    subscriber: Subscriber
  ): Promise<EmailResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check if subscriber wants daily digest
      if (!subscriber.preferences.dailyDigest) {
        return {
          success: false,
          error: 'Subscriber has disabled daily digest',
          timestamp: new Date()
        };
      }

      // Filter regulations by severity threshold
      const relevantRegulations = regulations.filter(
        reg => reg.severityScore >= subscriber.preferences.severityThreshold
      );

      if (relevantRegulations.length === 0) {
        return {
          success: false,
          error: 'No regulations meet subscriber severity threshold',
          timestamp: new Date()
        };
      }

      // Prepare digest data
      const highPriorityRegulations = relevantRegulations.filter(reg => reg.severityScore >= 7);
      
      const emailData: DailyDigestData = {
        to_email: subscriber.email,
        to_name: this.extractNameFromEmail(subscriber.email),
        digest_date: new Date().toLocaleDateString(),
        total_regulations: relevantRegulations.length,
        high_priority_count: highPriorityRegulations.length,
        regulations_summary: this.formatRegulationsSummary(relevantRegulations),
        top_action_items: this.formatTopActionItems(relevantRegulations),
        unsubscribe_url: this.generateUnsubscribeUrl(subscriber.unsubscribeToken)
      };

      // Send digest email
      const response = await emailjs.send(
        this.config.serviceId,
        'template_daily_digest', // Different template for digest
        emailData
      );

      return {
        success: true,
        messageId: response.text,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Failed to send daily digest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(email: string): Promise<EmailResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const testData = {
        to_email: email,
        to_name: this.extractNameFromEmail(email),
        regulation_title: 'Test Regulation - EmailJS Configuration Check',
        severity_score: 8,
        regulation_type: 'Test',
        plain_english_summary: 'This is a test email to verify your EmailJS configuration is working correctly.',
        action_items: '• Verify email delivery\n• Check formatting\n• Confirm unsubscribe link',
        compliance_deadlines: 'No deadlines for test email',
        regulation_url: 'https://regulatorradar.com/test',
        unsubscribe_url: 'https://regulatorradar.com/unsubscribe/test'
      };

      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        testData
      );

      return {
        success: true,
        messageId: response.text,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Failed to send test email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Batch send emails to multiple subscribers
   */
  async sendBatchEmails(
    regulations: RegulationAnalysis[],
    subscribers: Subscriber[],
    type: 'immediate' | 'digest'
  ): Promise<NotificationLog[]> {
    const results: NotificationLog[] = [];

    for (const subscriber of subscribers) {
      for (const regulation of regulations) {
        try {
          let emailResult: EmailResult;

          if (type === 'immediate') {
            emailResult = await this.sendImmediateAlert(regulation, subscriber);
          } else {
            emailResult = await this.sendDailyDigest(regulations, subscriber);
            break; // Only send one digest per subscriber
          }

          // Create notification log entry
          const logEntry: NotificationLog = {
            id: this.generateLogId(),
            regulationId: regulation.id,
            email: subscriber.email,
            type: type,
            sentAt: emailResult.timestamp,
            status: emailResult.success ? 'sent' : 'failed'
          };

          results.push(logEntry);

          // Add delay between emails to avoid rate limiting
          await this.delay(1000);

        } catch (error) {
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          
          const logEntry: NotificationLog = {
            id: this.generateLogId(),
            regulationId: regulation.id,
            email: subscriber.email,
            type: type,
            sentAt: new Date(),
            status: 'failed'
          };

          results.push(logEntry);
        }
      }
    }

    return results;
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return this.config.serviceId !== 'service_default' &&
           this.config.templateId !== 'template_default' &&
           this.config.publicKey !== 'public_key_default';
  }

  /**
   * Get current configuration status
   */
  getConfigStatus(): {
    configured: boolean;
    initialized: boolean;
    serviceId: string;
    hasTemplateId: boolean;
  } {
    return {
      configured: this.isConfigured(),
      initialized: this.initialized,
      serviceId: this.config.serviceId,
      hasTemplateId: this.config.templateId !== 'template_default'
    };
  }

  /**
   * Helper methods
   */
  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  private formatRegulationType(type: string): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatActionItems(actionItems: ActionItem[]): string {
    if (!actionItems || actionItems.length === 0) {
      return 'No specific action items identified.';
    }

    return actionItems
      .slice(0, 5) // Limit to top 5 for email
      .map((item, index) => {
        const priority = item.priority.toUpperCase();
        const hours = item.estimatedHours ? ` (${item.estimatedHours}h)` : '';
        return `${index + 1}. [${priority}] ${item.description}${hours}`;
      })
      .join('\n');
  }

  private formatComplianceDeadlines(actionItems: ActionItem[]): string {
    const itemsWithDeadlines = actionItems.filter(item => item.deadline);
    
    if (itemsWithDeadlines.length === 0) {
      return 'No specific compliance deadlines identified.';
    }

    return itemsWithDeadlines
      .map(item => {
        const deadline = item.deadline!.toLocaleDateString();
        return `• ${item.description} - Due: ${deadline}`;
      })
      .join('\n');
  }

  private formatRegulationsSummary(regulations: RegulationAnalysis[]): string {
    return regulations
      .slice(0, 10) // Limit to top 10 for digest
      .map((reg, index) => {
        const severity = reg.severityScore >= 8 ? 'HIGH' : 
                        reg.severityScore >= 5 ? 'MEDIUM' : 'LOW';
        return `${index + 1}. [${severity}] ${reg.title}`;
      })
      .join('\n');
  }

  private formatTopActionItems(regulations: RegulationAnalysis[]): string {
    const allActionItems = regulations
      .flatMap(reg => reg.actionItems)
      .filter(item => item.priority === 'high')
      .slice(0, 8); // Top 8 high-priority items

    if (allActionItems.length === 0) {
      return 'No high-priority action items identified.';
    }

    return allActionItems
      .map((item, index) => `${index + 1}. ${item.description}`)
      .join('\n');
  }

  private generateUnsubscribeUrl(token: string): string {
    return `${window.location.origin}/unsubscribe?token=${token}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
    this.initialized = false; // Force re-initialization
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types and classes
export { EmailService };
export type { EmailConfig, EmailResult, ImmediateAlertData, DailyDigestData };