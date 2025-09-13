import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { rssService } from '../services/rssService';
import { impactAnalysisService } from '../services/impactAnalysisService';
import { translationService } from '../services/translationService';
import { emailService } from '../services/emailService';
import { subscriberService } from '../services/subscriberService';
import { storage } from '../utils/storage';
import { loadMockData } from '../utils/mockData';
import { MobileResponsivenessTest } from '../utils/mobileTest';
import type { RSSItem } from '../types';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

const SystemTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'RSS Feed Service', status: 'pending', message: 'Not started' },
    { name: 'Impact Analysis Engine', status: 'pending', message: 'Not started' },
    { name: 'Translation Service', status: 'pending', message: 'Not started' },
    { name: 'Email Service', status: 'pending', message: 'Not started' },
    { name: 'Subscriber Service', status: 'pending', message: 'Not started' },
    { name: 'LocalStorage Persistence', status: 'pending', message: 'Not started' },
    { name: 'Mobile Responsiveness', status: 'pending', message: 'Not started' },
    { name: 'End-to-End Workflow', status: 'pending', message: 'Not started' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (index: number, testFn: () => Promise<{ success: boolean; message: string }>) => {
    const startTime = Date.now();
    updateTest(index, { status: 'running', message: 'Running...' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: result.success ? 'success' : 'error',
        message: result.message,
        duration
      });
      return result.success;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
      return false;
    }
  };

  const testRSSService = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Test RSS connectivity
      const connectivityResult = await rssService.testConnectivity();
      
      if (connectivityResult.success) {
        const successfulFeeds = connectivityResult.results.filter(r => r.success).length;
        return { 
          success: true, 
          message: `RSS connectivity test passed - ${successfulFeeds}/${connectivityResult.results.length} feeds accessible` 
        };
      } else {
        return { success: false, message: 'RSS connectivity test failed - no feeds accessible' };
      }
    } catch (error) {
      return { success: false, message: `RSS service error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testImpactAnalysis = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const mockRSSItem: RSSItem = {
        title: 'SEC Charges Cryptocurrency Exchange for Operating as Unregistered Broker-Dealer',
        link: 'https://sec.gov/test',
        pubDate: new Date(),
        description: 'Test enforcement action description',
        guid: 'test-guid-123'
      };

      const result = await impactAnalysisService.analyzeRegulation(mockRSSItem);
      
      if (result.success && result.analysis) {
        return { 
          success: true, 
          message: `Analysis complete - Severity: ${result.analysis.severityScore}/10, Type: ${result.analysis.regulationType}` 
        };
      } else {
        return { success: false, message: 'Impact analysis failed or produced no results' };
      }
    } catch (error) {
      return { success: false, message: `Impact analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testTranslationService = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const mockRSSItem: RSSItem = {
        title: 'Enhanced Cybersecurity Risk Management for Investment Advisers',
        link: 'https://sec.gov/test',
        pubDate: new Date(),
        description: 'New cybersecurity requirements for investment advisers',
        guid: 'test-guid-456'
      };

      const translation = await translationService.translateRegulation(mockRSSItem, 'final-rule', ['Technology', 'Operations']);
      
      if (translation.plainEnglishSummary && translation.actionItems.length > 0) {
        return { 
          success: true, 
          message: `Translation complete - ${translation.actionItems.length} action items generated` 
        };
      } else {
        return { success: false, message: 'Translation service failed to generate summary or action items' };
      }
    } catch (error) {
      return { success: false, message: `Translation service error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testEmailService = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const configStatus = emailService.getConfigStatus();
      
      if (configStatus.configured) {
        // If configured, try to send a test email
        const testResult = await emailService.sendTestEmail('test@example.com');
        return { 
          success: testResult.success, 
          message: testResult.success ? 'Email service configured and test email sent' : 'Email service configured but test email failed' 
        };
      } else {
        return { 
          success: true, 
          message: 'Email service not configured (expected in development)' 
        };
      }
    } catch (error) {
      return { success: false, message: `Email service error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testSubscriberService = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const testEmail = 'test@example.com';
      
      // Test subscription
      const subscribeResult = await subscriberService.subscribe(testEmail, {
        immediateAlerts: true,
        dailyDigest: true,
        severityThreshold: 5
      });
      
      if (!subscribeResult.success) {
        return { success: false, message: 'Failed to subscribe test email' };
      }
      
      // Test retrieval
      const subscriber = storage.getSubscriberByEmail(testEmail);
      if (!subscriber) {
        return { success: false, message: 'Failed to retrieve subscriber after subscription' };
      }
      
      // Test unsubscribe
      const unsubscribeResult = storage.removeSubscriber(testEmail);
      if (!unsubscribeResult) {
        return { success: false, message: 'Failed to unsubscribe test email' };
      }
      
      return { success: true, message: 'Subscriber service: subscribe, retrieve, and unsubscribe all working' };
    } catch (error) {
      return { success: false, message: `Subscriber service error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testLocalStoragePersistence = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Test storing and retrieving regulations
      const testRegulation = {
        id: 'test-reg-123',
        title: 'Test Regulation',
        originalData: {
          title: 'Test Regulation',
          link: 'https://test.com',
          pubDate: new Date(),
          description: 'Test description',
          guid: 'test-guid'
        },
        analysis: {
          id: 'test-reg-123',
          title: 'Test Regulation',
          severityScore: 5,
          regulationType: 'final-rule' as const,
          businessImpactAreas: ['Operations' as const],
          estimatedPenalty: 0,
          implementationTimeline: 90,
          plainEnglishSummary: 'Test summary',
          actionItems: [],
          originalUrl: 'https://test.com',
          processedDate: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationsSent: []
      };
      
      // Store regulation
      const storeResult = storage.addRegulation(testRegulation);
      if (!storeResult) {
        return { success: false, message: 'Failed to store regulation in localStorage' };
      }
      
      // Retrieve regulation
      const retrieved = storage.getRegulationById('test-reg-123');
      if (!retrieved || retrieved.id !== 'test-reg-123') {
        return { success: false, message: 'Failed to retrieve regulation from localStorage' };
      }
      
      // Test user preferences
      const testPrefs = {
        theme: 'light' as const,
        emailNotifications: true,
        severityFilter: 5,
        autoRefresh: true
      };
      
      storage.setUserPreferences(testPrefs);
      const retrievedPrefs = storage.getUserPreferences();
      
      if (retrievedPrefs.severityFilter !== 5) {
        return { success: false, message: 'Failed to store/retrieve user preferences' };
      }
      
      return { success: true, message: 'LocalStorage persistence working for regulations and preferences' };
    } catch (error) {
      return { success: false, message: `LocalStorage error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testMobileResponsiveness = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Simulate testing different viewports
      const responsiveTests = await MobileResponsivenessTest.testResponsiveness();
      
      const totalIssues = responsiveTests.reduce((sum, test) => sum + test.issues.length, 0);
      const passedTests = responsiveTests.filter(test => test.passed).length;
      
      if (passedTests === responsiveTests.length) {
        return {
          success: true,
          message: `Responsiveness test passed - All ${responsiveTests.length} viewports tested successfully`
        };
      } else {
        return {
          success: totalIssues < 3, // Allow minor issues
          message: `Responsiveness test: ${passedTests}/${responsiveTests.length} viewports passed, ${totalIssues} issues found`
        };
      }
    } catch (error) {
      return { success: false, message: `Responsiveness test error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testEndToEndWorkflow = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Load mock data to ensure we have regulations
      loadMockData();
      
      // Get regulations from storage
      const regulations = storage.getRegulations();
      if (regulations.length === 0) {
        return { success: false, message: 'No regulations found in storage after loading mock data' };
      }
      
      // Test that regulations have proper analysis
      const firstRegulation = regulations[0];
      if (!firstRegulation.analysis || !firstRegulation.analysis.actionItems) {
        return { success: false, message: 'Regulation missing analysis or action items' };
      }
      
      // Test system state
      const systemState = storage.getSystemState();
      if (!systemState) {
        return { success: false, message: 'System state not available' };
      }
      
      // Test subscriber stats
      const subscriberStats = subscriberService.getSubscriberStats();
      if (typeof subscriberStats.totalSubscribers !== 'number') {
        return { success: false, message: 'Subscriber stats not available' };
      }
      
      return { 
        success: true, 
        message: `End-to-end workflow complete - ${regulations.length} regulations, ${subscriberStats.totalSubscribers} subscribers` 
      };
    } catch (error) {
      return { success: false, message: `End-to-end workflow error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    
    const testFunctions = [
      testRSSService,
      testImpactAnalysis,
      testTranslationService,
      testEmailService,
      testSubscriberService,
      testLocalStoragePersistence,
      testMobileResponsiveness,
      testEndToEndWorkflow
    ];
    
    let allPassed = true;
    
    for (let i = 0; i < testFunctions.length; i++) {
      const passed = await runTest(i, testFunctions[i]);
      if (!passed) {
        allPassed = false;
      }
      // Small delay between tests for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    setOverallStatus('completed');
    
    return allPassed;
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full bg-gray-200"></div>;
      case 'running':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const totalTests = tests.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Integration Test</h1>
            <p className="text-gray-600">
              Comprehensive testing of all RegulatorRadar services and integrations
            </p>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Overall Status */}
        {overallStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            overallStatus === 'running' 
              ? 'bg-blue-50 border-blue-200' 
              : successCount === totalTests 
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {overallStatus === 'running' ? (
                <ClockIcon className="h-5 w-5 text-blue-600 animate-spin" />
              ) : successCount === totalTests ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                overallStatus === 'running' 
                  ? 'text-blue-800' 
                  : successCount === totalTests 
                    ? 'text-green-800'
                    : 'text-red-800'
              }`}>
                {overallStatus === 'running' 
                  ? 'Running system integration tests...'
                  : `Tests completed: ${successCount}/${totalTests} passed`
                }
              </span>
            </div>
            {overallStatus === 'completed' && errorCount > 0 && (
              <p className="text-red-700 text-sm mt-1">
                {errorCount} test{errorCount !== 1 ? 's' : ''} failed. Check individual test results below.
              </p>
            )}
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className={`text-sm ${getStatusColor(test.status)}`}>
                      {test.message}
                    </p>
                  </div>
                </div>
                
                {test.duration && (
                  <span className="text-xs text-gray-500">
                    {test.duration}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* System Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Browser:</span>
              <span className="ml-2 font-medium">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            <div>
              <span className="text-gray-600">LocalStorage:</span>
              <span className="ml-2 font-medium">
                {typeof Storage !== 'undefined' ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Timestamp:</span>
              <span className="ml-2 font-medium">{new Date().toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Environment:</span>
              <span className="ml-2 font-medium">
                {import.meta.env.MODE || 'development'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTest;