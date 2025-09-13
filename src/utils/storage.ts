// localStorage utilities for RegulatorRadar
import type { 
  StoredRegulation, 
  Subscriber, 
  UserPreferences, 
  SystemState, 
  NotificationLog,
  SystemError 
} from '../types';
import { validateSubscriber } from './validation';

const STORAGE_KEYS = {
  REGULATIONS: 'regulatorradar_regulations',
  SUBSCRIBERS: 'regulatorradar_subscribers',
  LAST_CHECK: 'regulatorradar_last_check',
  USER_PREFERENCES: 'regulatorradar_user_preferences',
  SYSTEM_STATE: 'regulatorradar_system_state',
  NOTIFICATION_LOGS: 'regulatorradar_notification_logs',
  ERROR_LOGS: 'regulatorradar_error_logs',
} as const;

export const storage = {
  // Generic storage operations
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },

  // Specific data operations
  getRegulations(): StoredRegulation[] {
    return this.get<StoredRegulation[]>(STORAGE_KEYS.REGULATIONS) || [];
  },

  setRegulations(regulations: StoredRegulation[]): boolean {
    return this.set(STORAGE_KEYS.REGULATIONS, regulations);
  },

  addRegulation(regulation: StoredRegulation): boolean {
    const regulations = this.getRegulations();
    const existingIndex = regulations.findIndex(r => r.id === regulation.id);
    
    if (existingIndex >= 0) {
      regulations[existingIndex] = { ...regulation, updatedAt: new Date() };
    } else {
      regulations.push(regulation);
    }
    
    return this.setRegulations(regulations);
  },

  getRegulationById(id: string): StoredRegulation | null {
    const regulations = this.getRegulations();
    return regulations.find(r => r.id === id) || null;
  },

  getSubscribers(): Subscriber[] {
    return this.get<Subscriber[]>(STORAGE_KEYS.SUBSCRIBERS) || [];
  },

  addSubscriber(email: string): boolean {
    const subscribers = this.getSubscribers();
    const existingSubscriber = subscribers.find(s => s.email === email);
    
    if (existingSubscriber) {
      return true; // Already subscribed
    }

    const newSubscriber = validateSubscriber({ email });
    if (!newSubscriber) {
      return false;
    }

    subscribers.push(newSubscriber);
    return this.set(STORAGE_KEYS.SUBSCRIBERS, subscribers);
  },

  removeSubscriber(email: string): boolean {
    const subscribers = this.getSubscribers();
    const filteredSubscribers = subscribers.filter(s => s.email !== email);
    return this.set(STORAGE_KEYS.SUBSCRIBERS, filteredSubscribers);
  },

  getSubscriberByEmail(email: string): Subscriber | null {
    const subscribers = this.getSubscribers();
    return subscribers.find(s => s.email === email) || null;
  },

  updateSubscriberPreferences(email: string, preferences: Partial<Subscriber['preferences']>): boolean {
    const subscribers = this.getSubscribers();
    const subscriberIndex = subscribers.findIndex(s => s.email === email);
    
    if (subscriberIndex >= 0) {
      subscribers[subscriberIndex].preferences = {
        ...subscribers[subscriberIndex].preferences,
        ...preferences
      };
      return this.set(STORAGE_KEYS.SUBSCRIBERS, subscribers);
    }
    
    return false;
  },

  getLastCheck(): Date | null {
    const timestamp = this.get<string>(STORAGE_KEYS.LAST_CHECK);
    return timestamp ? new Date(timestamp) : null;
  },

  setLastCheck(date: Date): boolean {
    return this.set(STORAGE_KEYS.LAST_CHECK, date.toISOString());
  },

  getUserPreferences(): UserPreferences {
    return this.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES) || {
      theme: 'light',
      emailNotifications: true,
      severityFilter: 5,
      autoRefresh: true,
    };
  },

  setUserPreferences(preferences: UserPreferences): boolean {
    return this.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  getSystemState(): SystemState {
    return this.get<SystemState>(STORAGE_KEYS.SYSTEM_STATE) || {
      lastRSSCheck: new Date(0),
      totalRegulationsProcessed: 0,
      activeSubscribers: 0,
      systemHealth: 'healthy',
    };
  },

  updateSystemState(updates: Partial<SystemState>): boolean {
    const currentState = this.getSystemState();
    const newState = { ...currentState, ...updates };
    return this.set(STORAGE_KEYS.SYSTEM_STATE, newState);
  },

  getNotificationLogs(): NotificationLog[] {
    return this.get<NotificationLog[]>(STORAGE_KEYS.NOTIFICATION_LOGS) || [];
  },

  addNotificationLog(log: NotificationLog): boolean {
    const logs = this.getNotificationLogs();
    logs.push(log);
    
    // Keep only last 1000 logs to prevent storage bloat
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    return this.set(STORAGE_KEYS.NOTIFICATION_LOGS, logs);
  },

  getErrorLogs(): SystemError[] {
    return this.get<SystemError[]>(STORAGE_KEYS.ERROR_LOGS) || [];
  },

  addErrorLog(error: SystemError): boolean {
    const logs = this.getErrorLogs();
    logs.push(error);
    
    // Keep only last 500 error logs
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }
    
    return this.set(STORAGE_KEYS.ERROR_LOGS, logs);
  },

  // Utility methods
  clearAllData(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  },

  exportData(): string {
    const data = {
      regulations: this.getRegulations(),
      subscribers: this.getSubscribers(),
      userPreferences: this.getUserPreferences(),
      systemState: this.getSystemState(),
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  },

  getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // Rough estimate of localStorage limit (usually 5-10MB)
      const available = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  },
};