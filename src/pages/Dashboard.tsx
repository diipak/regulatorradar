import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { rssService } from '../services/rssService';
import { regulationProcessingService } from '../services/regulationProcessingService';
import { storage } from '../utils/storage';
import type { RegulationAnalysis } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import SystemStatus from '../components/SystemStatus';

const Dashboard: React.FC = () => {
  const [regulations, setRegulations] = useState<RegulationAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Load existing regulations and start monitoring
  useEffect(() => {
    loadRegulations();
    startRSSMonitoring();
  }, []);

  const loadRegulations = () => {
    try {
      const storedRegulations = storage.getRegulations();
      setRegulations(storedRegulations);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load regulations:', err);
      setError('Failed to load regulations');
      setLoading(false);
    }
  };

  const startRSSMonitoring = async () => {
    try {
      setIsMonitoring(true);
      
      // Start RSS monitoring service
      rssService.startMonitoring();
      
      // Fetch initial data if we don't have any
      if (storage.getRegulations().length === 0) {
        console.log('No existing regulations found, fetching initial data...');
        await fetchLatestRegulations();
      }
      
    } catch (err) {
      console.error('Failed to start RSS monitoring:', err);
      setError('Failed to start monitoring');
    }
  };

  const fetchLatestRegulations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from RSS feeds
      const rssResults = await rssService.fetchAllFeeds();
      
      // Process new regulations
      for (const result of rssResults) {
        if (result.success && result.items.length > 0) {
          for (const item of result.items) {
            try {
              const analysis = await regulationProcessingService.processRegulation(item);
              storage.addRegulation(analysis);
            } catch (processError) {
              console.error('Failed to process regulation:', processError);
            }
          }
        }
      }
      
      // Reload regulations from storage
      loadRegulations();
      
    } catch (err) {
      console.error('Failed to fetch regulations:', err);
      setError('Failed to fetch latest regulations');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced demo data for impressive presentation
  const mockRegulations = [
    {
      id: '1',
      title: 'SEC Crypto Enforcement Action - $4.3B Penalty',
      description: 'Major enforcement action against DeFi platform for unregistered securities offerings',
      severity: 9,
      type: 'enforcement',
      date: '2024-12-15',
      penalty: 4300000000,
      summary: 'The SEC has imposed a record $4.3 billion penalty on a major DeFi platform for offering unregistered securities. This action significantly impacts the crypto lending space and requires immediate compliance review.'
    },
    {
      id: '2', 
      title: 'AI Disclosure Requirements for Trading Systems',
      description: 'New rules requiring disclosure of AI systems in algorithmic trading',
      severity: 7,
      type: 'final-rule',
      date: '2024-12-10',
      penalty: null,
      summary: 'Financial institutions must now disclose their use of AI systems in trading algorithms and provide transparency reports. Implementation deadline: March 2025.'
    },
    {
      id: '3',
      title: 'Enhanced Cybersecurity Standards for Fintech',
      description: 'Proposed enhanced cybersecurity requirements for fintech companies',
      severity: 6,
      type: 'proposed-rule',
      date: '2024-12-08',
      penalty: null,
      summary: 'New proposed rules would require enhanced cybersecurity measures and incident reporting for fintech companies. Comment period ends January 2025.'
    },
    {
      id: '4',
      title: 'Digital Asset Custody Rule Updates',
      description: 'SEC updates custody requirements for digital asset investment advisers',
      severity: 8,
      type: 'final-rule',
      date: '2024-12-05',
      penalty: null,
      summary: 'Investment advisers managing digital assets must comply with enhanced custody requirements. Affects crypto funds and digital asset managers.'
    },
    {
      id: '5',
      title: 'Payment Processing AML Enforcement',
      description: 'FinCEN enforcement action against payment processor for AML violations',
      severity: 7,
      type: 'enforcement',
      date: '2024-12-03',
      penalty: 850000000,
      summary: 'Major payment processor fined $850M for inadequate anti-money laundering controls. Highlights importance of robust AML compliance programs.'
    },
    {
      id: '6',
      title: 'Open Banking Security Standards',
      description: 'Proposed security standards for open banking API implementations',
      severity: 5,
      type: 'proposed-rule',
      date: '2024-12-01',
      penalty: null,
      summary: 'New security standards proposed for financial institutions implementing open banking APIs. Focus on data protection and consumer privacy.'
    }
  ];

  const [selectedRegulation, setSelectedRegulation] = useState<RegulationAnalysis | null>(null);

  // Use real data if available, otherwise fall back to enhanced mock data
  const displayRegulations = regulations.length > 0 ? regulations : mockRegulations.map(mock => ({
    id: mock.id,
    title: mock.title,
    severityScore: mock.severity,
    regulationType: mock.type as 'enforcement' | 'final-rule' | 'proposed-rule',
    businessImpactAreas: ['Operations', 'Legal', 'Technology'],
    estimatedPenalty: mock.penalty || 0,
    implementationTimeline: mock.severity >= 8 ? 30 : mock.severity >= 6 ? 90 : 180,
    plainEnglishSummary: mock.summary,
    actionItems: [
      {
        description: mock.severity >= 8 ? 'Immediate legal review required' : 'Review current compliance procedures',
        priority: mock.severity >= 8 ? 'high' : mock.severity >= 6 ? 'medium' : 'low',
        estimatedHours: mock.severity >= 8 ? 40 : 20,
        category: 'legal',
        deadline: new Date(Date.now() + (mock.severity >= 8 ? 7 : 30) * 24 * 60 * 60 * 1000)
      },
      {
        description: mock.severity >= 7 ? 'Update policies and procedures' : 'Monitor for further developments',
        priority: mock.severity >= 7 ? 'high' : 'medium',
        estimatedHours: mock.severity >= 7 ? 24 : 8,
        category: 'operational',
        deadline: new Date(Date.now() + (mock.severity >= 7 ? 14 : 60) * 24 * 60 * 60 * 1000)
      },
      {
        description: mock.severity >= 6 ? 'Assess technology compliance requirements' : 'Document for future reference',
        priority: mock.severity >= 6 ? 'medium' : 'low',
        estimatedHours: mock.severity >= 6 ? 16 : 4,
        category: 'technical'
      }
    ],
    originalUrl: `https://www.sec.gov/rules/regulation-${mock.id}`,
    processedDate: new Date(mock.date),
    notificationsSent: []
  }));

  const getSeverityColor = (score: number): string => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getSeverityIcon = (score: number) => {
    if (score >= 8) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (score >= 5) return <ClockIcon className="h-4 w-4" />;
    return <CheckCircleIcon className="h-4 w-4" />;
  };

  const getSeverityLabel = (score: number): string => {
    if (score >= 8) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'enforcement': return 'bg-red-50 text-red-700 border-red-200';
      case 'final-rule': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'proposed-rule': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading regulatory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Regulatory Dashboard</h1>
            <p className="mt-2 text-gray-600">Monitor and manage regulatory compliance for your fintech operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            <button
              onClick={fetchLatestRegulations}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {regulations.length === 0 && !loading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">No regulations loaded. Using demo data. Click "Refresh Data" to fetch from SEC feeds.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regulations List */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Status */}
          <SystemStatus />
          
          {/* Regulations */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Regulatory Alerts ({displayRegulations.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {displayRegulations.map((regulation) => (
                <div
                  key={regulation.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRegulation?.id === regulation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedRegulation(regulation)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(regulation.severityScore)}`}>
                          {getSeverityIcon(regulation.severityScore)}
                          {getSeverityLabel(regulation.severityScore)} ({regulation.severityScore}/10)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(regulation.regulationType)}`}>
                          {regulation.regulationType === 'enforcement' ? 'Enforcement' : 
                           regulation.regulationType === 'final-rule' ? 'Final Rule' : 'Proposed Rule'}
                        </span>
                        {regulation.estimatedPenalty > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            {formatMoney(regulation.estimatedPenalty)} Penalty
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{regulation.title}</h3>
                      <p className="text-gray-600 text-sm">{regulation.plainEnglishSummary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{regulation.processedDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regulation Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Alert Details</h2>
            </div>
            
            <div className="p-6">
              {selectedRegulation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{selectedRegulation.title}</h3>
                    <p className="text-gray-600 text-sm">{selectedRegulation.plainEnglishSummary}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Severity:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedRegulation.severityScore)}`}>
                          {getSeverityIcon(selectedRegulation.severityScore)}
                          {getSeverityLabel(selectedRegulation.severityScore)} ({selectedRegulation.severityScore}/10)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedRegulation.regulationType)}`}>
                          {selectedRegulation.regulationType === 'enforcement' ? 'Enforcement' : 
                           selectedRegulation.regulationType === 'final-rule' ? 'Final Rule' : 'Proposed Rule'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date:</span>
                        <span className="text-sm text-gray-900">{selectedRegulation.processedDate.toLocaleDateString()}</span>
                      </div>
                      {selectedRegulation.estimatedPenalty > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Penalty:</span>
                          <span className="text-sm font-medium text-red-600">{formatMoney(selectedRegulation.estimatedPenalty)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedRegulation.actionItems.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        {selectedRegulation.actionItems.slice(0, 3).map((item, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{item.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <a 
                      href={selectedRegulation.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Original Document
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Select an alert to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;