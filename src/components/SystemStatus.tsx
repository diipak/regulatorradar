import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { rssService } from '../services/rssService';
import { emailService } from '../services/emailService';
import { storage } from '../utils/storage';

interface SystemStatusProps {
  className?: string;
}

interface StatusItem {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  details?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkSystemStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    const statusItems: StatusItem[] = [];

    try {
      // Check RSS Service
      const rssStatus = rssService.getMonitoringStatus();
      statusItems.push({
        name: 'RSS Monitoring',
        status: rssStatus.isRunning ? 'healthy' : 'warning',
        message: rssStatus.isRunning ? 'Active' : 'Inactive',
        details: rssStatus.isRunning 
          ? `Next check in ${rssStatus.nextCheckIn || 0} minutes`
          : 'RSS monitoring is not running'
      });

      // Check RSS Connectivity
      try {
        const connectivityTest = await rssService.testConnectivity();
        const successfulFeeds = connectivityTest.results.filter(r => r.success).length;
        const totalFeeds = connectivityTest.results.length;
        
        statusItems.push({
          name: 'RSS Feeds',
          status: successfulFeeds > 0 ? 'healthy' : 'error',
          message: `${successfulFeeds}/${totalFeeds} feeds accessible`,
          details: connectivityTest.results
            .filter(r => !r.success)
            .map(r => `${r.feed}: ${r.error}`)
            .join('; ') || 'All feeds accessible'
        });
      } catch (error) {
        statusItems.push({
          name: 'RSS Feeds',
          status: 'error',
          message: 'Connection test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Check Email Service
      const emailConfig = emailService.getConfigStatus();
      statusItems.push({
        name: 'Email Service',
        status: emailConfig.configured ? 'healthy' : 'warning',
        message: emailConfig.configured ? 'Configured' : 'Not configured',
        details: emailConfig.configured 
          ? `Service: ${emailConfig.serviceId}`
          : 'EmailJS credentials not set'
      });

      // Check Data Storage
      try {
        const regulations = storage.getRegulations();
        const systemState = storage.getSystemState();
        
        statusItems.push({
          name: 'Data Storage',
          status: 'healthy',
          message: `${regulations.length} regulations stored`,
          details: `Last RSS check: ${systemState.lastRSSCheck?.toLocaleString() || 'Never'}`
        });
      } catch (error) {
        statusItems.push({
          name: 'Data Storage',
          status: 'error',
          message: 'Storage error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Check Subscribers
      try {
        const subscribers = storage.getSubscribers();
        statusItems.push({
          name: 'Subscribers',
          status: 'healthy',
          message: `${subscribers.length} active subscribers`,
          details: subscribers.length > 0 
            ? `Latest: ${subscribers[subscribers.length - 1]?.email}`
            : 'No subscribers yet'
        });
      } catch (error) {
        statusItems.push({
          name: 'Subscribers',
          status: 'warning',
          message: 'Subscriber data unavailable',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      statusItems.push({
        name: 'System Check',
        status: 'error',
        message: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setStatus(statusItems);
    setLastCheck(new Date());
    setLoading(false);
  };

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const overallStatus = status.length > 0 
    ? status.some(s => s.status === 'error') ? 'error'
    : status.some(s => s.status === 'warning') ? 'warning'
    : 'healthy'
    : 'unknown';

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <span className={`text-sm font-medium ${
              overallStatus === 'healthy' ? 'text-green-700' :
              overallStatus === 'warning' ? 'text-yellow-700' :
              overallStatus === 'error' ? 'text-red-700' : 'text-gray-700'
            }`}>
              {overallStatus === 'healthy' ? 'All Systems Operational' :
               overallStatus === 'warning' ? 'Some Issues Detected' :
               overallStatus === 'error' ? 'System Errors' : 'Checking...'}
            </span>
          </div>
        </div>
        {lastCheck && (
          <p className="text-xs text-gray-500 mt-1">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-4">
            <ClockIcon className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">Checking system status...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {status.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.message}</span>
                </div>
                {item.details && (
                  <p className="text-xs text-gray-500 mt-1 ml-7">{item.details}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={checkSystemStatus}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;