import React, { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { subscriberService } from '../services/subscriberService';
import { emailService } from '../services/emailService';

const Subscribe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    immediateAlerts: true,
    dailyDigest: true,
    severityThreshold: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      if (!emailService.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Add subscriber
      const subscriber = await subscriberService.addSubscriber(email, preferences);
      
      // Send test email to verify configuration
      const testResult = await emailService.sendTestEmail(email);
      
      if (testResult.success) {
        setSuccess(true);
        setEmail('');
      } else {
        throw new Error('Failed to send confirmation email. Please check your email configuration.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      setError('Please enter your email address to unsubscribe');
      return;
    }

    try {
      setLoading(true);
      await subscriberService.removeSubscriber(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-900 mb-2">Success!</h2>
          <p className="text-green-700 mb-4">
            You've been successfully subscribed to RegulatorRadar alerts. 
            Check your email for a confirmation message.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Subscribe Another Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Stay Informed with RegulatorRadar
        </h1>
        <p className="text-lg text-gray-600">
          Get instant alerts about SEC regulatory changes that affect your fintech business.
          Never miss a critical compliance update again.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@company.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.immediateAlerts}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    immediateAlerts: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Immediate alerts for high-priority regulations (severity 8+)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.dailyDigest}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    dailyDigest: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Daily digest of all regulatory updates
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Severity Level: {preferences.severityThreshold}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={preferences.severityThreshold}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  severityThreshold: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (1)</span>
                <span>Medium (5)</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !email}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Subscribing...' : 'Subscribe to Alerts'}
            </button>
            
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading || !email}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Unsubscribe
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">What you'll receive:</h4>
            <ul className="space-y-1">
              <li>• Instant alerts for high-severity enforcement actions</li>
              <li>• Plain English summaries of complex regulations</li>
              <li>• Specific action items with implementation timelines</li>
              <li>• Penalty information and compliance deadlines</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              We respect your privacy. Unsubscribe at any time. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;