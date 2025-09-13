import React, { useState } from 'react';
import { subscriberService } from '../services/subscriberService';
import { emailService } from '../services/emailService';
import type { SubscriberPreferences } from '../services/subscriberService';

const EmailSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState<SubscriberPreferences>({
    immediateAlerts: true,
    dailyDigest: true,
    severityThreshold: 5
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await subscriberService.subscribe(email, preferences);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully subscribed ${email}! You'll receive notifications based on your preferences.`
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to subscribe'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email || !subscriberService.validateEmail(email)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address first'
      });
      return;
    }

    setTestEmailLoading(true);
    setMessage(null);

    try {
      const success = await emailService.sendTestEmail(email);
      
      if (success) {
        setMessage({
          type: 'success',
          text: `Test email sent to ${email}! Check your inbox.`
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to send test email. Please check EmailJS configuration.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send test email'
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const subscriberStats = subscriberService.getSubscriberStats();
  const emailConfig = emailService.getConfigStatus();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Email Notifications
        </h2>
        <p className="text-gray-600 mb-6">
          Subscribe to receive immediate alerts for high-priority regulations and daily digest emails.
        </p>

        {/* Service Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Service Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">EmailJS Configured:</span>
              <span className={`ml-2 font-medium ${emailConfig.configured ? 'text-green-600' : 'text-red-600'}`}>
                {emailConfig.configured ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Subscribers:</span>
              <span className="ml-2 font-medium text-blue-600">{subscriberStats.totalSubscribers}</span>
            </div>
            <div>
              <span className="text-gray-600">Immediate Alerts:</span>
              <span className="ml-2 font-medium text-green-600">{subscriberStats.immediateAlertsEnabled}</span>
            </div>
            <div>
              <span className="text-gray-600">Daily Digest:</span>
              <span className="ml-2 font-medium text-purple-600">{subscriberStats.dailyDigestEnabled}</span>
            </div>
          </div>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Notification Preferences</h4>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="immediateAlerts"
                checked={preferences.immediateAlerts}
                onChange={(e) => setPreferences(prev => ({ ...prev, immediateAlerts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="immediateAlerts" className="ml-2 text-sm text-gray-700">
                Immediate alerts for high-priority regulations (severity 7+)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dailyDigest"
                checked={preferences.dailyDigest}
                onChange={(e) => setPreferences(prev => ({ ...prev, dailyDigest: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="dailyDigest" className="ml-2 text-sm text-gray-700">
                Daily digest email (9 AM)
              </label>
            </div>

            <div>
              <label htmlFor="severityThreshold" className="block text-sm text-gray-700 mb-1">
                Minimum severity threshold: {preferences.severityThreshold}
              </label>
              <input
                type="range"
                id="severityThreshold"
                min="1"
                max="10"
                value={preferences.severityThreshold}
                onChange={(e) => setPreferences(prev => ({ ...prev, severityThreshold: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (1)</span>
                <span>Medium (5)</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
            
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testEmailLoading || !email}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testEmailLoading ? 'Sending...' : 'Test Email'}
            </button>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Configuration Help */}
        {!emailConfig.configured && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">EmailJS Configuration Required</h4>
            <p className="text-sm text-yellow-700">
              To enable email notifications, configure EmailJS with your service credentials:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
              <li>Set VITE_EMAILJS_SERVICE_ID environment variable</li>
              <li>Set VITE_EMAILJS_TEMPLATE_ID environment variable</li>
              <li>Set VITE_EMAILJS_PUBLIC_KEY environment variable</li>
            </ul>
          </div>
        )}
      </div>

      {/* Current Subscribers */}
      {subscriberStats.totalSubscribers > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{subscriberStats.totalSubscribers}</div>
              <div className="text-sm text-gray-600">Total Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{subscriberStats.immediateAlertsEnabled}</div>
              <div className="text-sm text-gray-600">Immediate Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{subscriberStats.dailyDigestEnabled}</div>
              <div className="text-sm text-gray-600">Daily Digest</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{subscriberStats.averageSeverityThreshold.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Threshold</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSubscription;