import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { storage } from '../utils/storage';
import { useOfflineDetection } from '../hooks/useOfflineDetection';
import type { SystemError as StorageSystemError } from '../types';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: {
    localStorage: ServiceStatus;
    rssFeeds: ServiceStatus;
    emailService: ServiceStatus;
    dataProcessing: ServiceStatus;
    networkConnectivity: ServiceStatus;
  };
  metrics: {
    totalRegulations: number;
    totalSubscribers: number;
    errorRate: number;
    lastUpdate: Date;
    uptime: number;
  };
  errors: StorageSystemError[];
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  message: string;
  lastCheck: Date;
  responseTime?: number;
  details?: any;
}



export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    overall: 'unknown' as any,
    services: {
      localStorage: { status: 'unknown', message: 'Not checked', lastCheck: new Date() },
      rssFeeds: { status: 'unknown', message: 'Not checked', lastCheck: new Date() },
      emailService: { status: 'unknown', message: 'Not checked', lastCheck: new Date() },
      dataProcessing: { status: 'unknown', message: 'Not checked', lastCheck: new Date() },
      networkConnectivity: { status: 'unknown', message: 'Not checked', lastCheck: new Date() }
    },
    metrics: {
      totalRegulations: 0,
      totalSubscribers: 0,
      errorRate: 0,
      lastUpdate: new Date(),
      uptime: 0
    },
    errors: []
  });

  const { isOnline, connectionType, effectiveType } = useOfflineDetection();
  const [startTime] = useState(new Date());

  const checkLocalStorageHealth = (): ServiceStatus => {
    const start = performance.now();
    
    try {
      // Test localStorage functionality
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now(), test: true };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      if (retrieved.test !== true) {
        throw new Error('localStorage read/write test failed');
      }

      // Check storage usage
      const usage = storage.getStorageUsage();
      const responseTime = performance.now() - start;
      
      if (usage.percentage > 90) {
        return {
          status: 'critical',
          message: `Storage almost full (${usage.percentage.toFixed(1)}%)`,
          lastCheck: new Date(),
          responseTime,
          details: usage
        };
      } else if (usage.percentage > 75) {
        return {
          status: 'degraded',
          message: `Storage usage high (${usage.percentage.toFixed(1)}%)`,
          lastCheck: new Date(),
          responseTime,
          details: usage
        };
      }

      return {
        status: 'healthy',
        message: `Storage working (${usage.percentage.toFixed(1)}% used)`,
        lastCheck: new Date(),
        responseTime,
        details: usage
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `localStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date(),
        responseTime: performance.now() - start
      };
    }
  };

  const checkRSSFeedsHealth = (): ServiceStatus => {
    try {
      const systemState = storage.getSystemState();
      const lastCheck = systemState.lastRSSCheck;
      const timeSinceLastCheck = Date.now() - lastCheck.getTime();
      
      // Check if RSS feeds have been checked recently (within 6 hours)
      const sixHours = 6 * 60 * 60 * 1000;
      
      if (timeSinceLastCheck > sixHours) {
        return {
          status: 'degraded',
          message: `RSS feeds not checked for ${Math.round(timeSinceLastCheck / (60 * 60 * 1000))} hours`,
          lastCheck: new Date(),
          details: { lastRSSCheck: lastCheck, timeSinceLastCheck }
        };
      }

      return {
        status: 'healthy',
        message: `RSS feeds checked ${Math.round(timeSinceLastCheck / (60 * 1000))} minutes ago`,
        lastCheck: new Date(),
        details: { lastRSSCheck: lastCheck, regulationsProcessed: systemState.totalRegulationsProcessed }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `RSS health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date()
      };
    }
  };

  const checkEmailServiceHealth = (): ServiceStatus => {
    try {
      // This would normally check EmailJS configuration and connectivity
      // For now, we'll check if the service is configured
      const hasEmailConfig = !!(
        import.meta.env.VITE_EMAILJS_SERVICE_ID &&
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      if (!hasEmailConfig) {
        return {
          status: 'degraded',
          message: 'Email service not configured',
          lastCheck: new Date(),
          details: { configured: false }
        };
      }

      return {
        status: 'healthy',
        message: 'Email service configured',
        lastCheck: new Date(),
        details: { configured: true }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Email service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date()
      };
    }
  };

  const checkDataProcessingHealth = (): ServiceStatus => {
    try {
      const regulations = storage.getRegulations();
      const subscribers = storage.getSubscribers();
      
      return {
        status: 'healthy',
        message: `Processing ${regulations.length} regulations for ${subscribers.length} subscribers`,
        lastCheck: new Date(),
        details: {
          regulationsCount: regulations.length,
          subscribersCount: subscribers.length
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Data processing check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date()
      };
    }
  };

  const checkNetworkConnectivity = (): ServiceStatus => {
    if (!isOnline) {
      return {
        status: 'critical',
        message: 'No network connectivity',
        lastCheck: new Date(),
        details: { online: false }
      };
    }

    return {
      status: 'healthy',
      message: `Connected via ${connectionType} (${effectiveType})`,
      lastCheck: new Date(),
      details: { 
        online: true, 
        connectionType, 
        effectiveType 
      }
    };
  };

  const calculateOverallHealth = (services: SystemHealth['services']): 'healthy' | 'degraded' | 'critical' => {
    const statuses = Object.values(services).map(s => s.status);
    
    if (statuses.includes('critical')) {
      return 'critical';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  };

  const runHealthCheck = () => {
    const services = {
      localStorage: checkLocalStorageHealth(),
      rssFeeds: checkRSSFeedsHealth(),
      emailService: checkEmailServiceHealth(),
      dataProcessing: checkDataProcessingHealth(),
      networkConnectivity: checkNetworkConnectivity()
    };

    const regulations = storage.getRegulations();
    const subscribers = storage.getSubscribers();
    const errors = storage.getErrorLogs();
    
    // Calculate error rate (errors in last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = errors.filter(e => new Date(e.timestamp).getTime() > oneHourAgo);
    const errorRate = recentErrors.length;

    setHealth({
      overall: calculateOverallHealth(services),
      services,
      metrics: {
        totalRegulations: regulations.length,
        totalSubscribers: subscribers.length,
        errorRate,
        lastUpdate: new Date(),
        uptime: Date.now() - startTime.getTime()
      },
      errors: errors.slice(-10) // Last 10 errors
    });
  };

  // Run health check on mount and periodically
  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isOnline]);

  return { health, runHealthCheck };
}

const SystemHealthMonitor: React.FC = () => {
  const { health, runHealthCheck } = useSystemHealth();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(health.overall)}
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(health.overall)}`}>
            {health.overall.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={runHealthCheck}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Refresh health check"
          >
            <ClockIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{health.metrics.totalRegulations}</div>
          <div className="text-sm text-gray-600">Regulations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{health.metrics.totalSubscribers}</div>
          <div className="text-sm text-gray-600">Subscribers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{health.metrics.errorRate}</div>
          <div className="text-sm text-gray-600">Errors/Hour</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{formatUptime(health.metrics.uptime)}</div>
          <div className="text-sm text-gray-600">Uptime</div>
        </div>
      </div>

      {/* Service Status */}
      {isExpanded && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
          
          <div className="grid gap-3">
            {Object.entries(health.services).map(([serviceName, service]) => (
              <div key={serviceName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-600">{service.message}</div>
                  </div>
                </div>
                
                <div className="text-right text-xs text-gray-500">
                  {service.responseTime && (
                    <div>{service.responseTime.toFixed(0)}ms</div>
                  )}
                  <div>{service.lastCheck.toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Errors */}
          {health.errors.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Errors</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {health.errors.map((error) => (
                  <div key={error.id} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-800">{error.source}</span>
                      <span className="text-red-600">{new Date(error.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-red-700">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;