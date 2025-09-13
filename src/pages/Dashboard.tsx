import React, { useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  // Simplified Dashboard with mock data for demo
  const mockRegulations = [
    {
      id: '1',
      title: 'SEC Crypto Enforcement Action - $4.3B Penalty',
      description: 'Major enforcement action against DeFi platform for unregistered securities offerings',
      severity: 9,
      type: 'enforcement',
      date: '2024-12-15',
      penalty: 4300000000,
      summary: 'The SEC has imposed a record $4.3 billion penalty on a major DeFi platform for offering unregistered securities. This action significantly impacts the crypto lending space.'
    },
    {
      id: '2', 
      title: 'AI Disclosure Requirements for Trading Systems',
      description: 'New rules requiring disclosure of AI systems in algorithmic trading',
      severity: 6,
      type: 'final-rule',
      date: '2024-12-10',
      penalty: null,
      summary: 'Financial institutions must now disclose their use of AI systems in trading algorithms and provide transparency reports.'
    },
    {
      id: '3',
      title: 'Enhanced Cybersecurity Standards',
      description: 'Proposed enhanced cybersecurity requirements for fintech companies',
      severity: 4,
      type: 'proposed-rule',
      date: '2024-12-08',
      penalty: null,
      summary: 'New proposed rules would require enhanced cybersecurity measures and incident reporting for fintech companies.'
    }
  ];

  const [selectedRegulation, setSelectedRegulation] = useState<typeof mockRegulations[0] | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Regulatory Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor and manage regulatory compliance for your fintech operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regulations List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Regulatory Alerts ({mockRegulations.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {mockRegulations.map((regulation) => (
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(regulation.severity)}`}>
                          {getSeverityIcon(regulation.severity)}
                          {getSeverityLabel(regulation.severity)} ({regulation.severity}/10)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(regulation.type)}`}>
                          {regulation.type === 'enforcement' ? 'Enforcement' : 
                           regulation.type === 'final-rule' ? 'Final Rule' : 'Proposed Rule'}
                        </span>
                        {regulation.penalty && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            {formatMoney(regulation.penalty)} Penalty
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{regulation.title}</h3>
                      <p className="text-gray-600 text-sm">{regulation.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{regulation.date}</p>
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
                    <p className="text-gray-600 text-sm">{selectedRegulation.summary}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Severity:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedRegulation.severity)}`}>
                          {getSeverityIcon(selectedRegulation.severity)}
                          {getSeverityLabel(selectedRegulation.severity)} ({selectedRegulation.severity}/10)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedRegulation.type)}`}>
                          {selectedRegulation.type === 'enforcement' ? 'Enforcement' : 
                           selectedRegulation.type === 'final-rule' ? 'Final Rule' : 'Proposed Rule'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date:</span>
                        <span className="text-sm text-gray-900">{selectedRegulation.date}</span>
                      </div>
                      {selectedRegulation.penalty && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Penalty:</span>
                          <span className="text-sm font-medium text-red-600">{formatMoney(selectedRegulation.penalty)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Full Details
                    </button>
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