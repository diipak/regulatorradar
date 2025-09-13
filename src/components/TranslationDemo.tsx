import React, { useState } from 'react';
import { translationService } from '../services/translationService';
import type { RSSItem, RegulationType, BusinessImpactArea, TranslationResult } from '../types';

const TranslationDemo: React.FC = () => {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleRegulations: { item: RSSItem; type: RegulationType; areas: BusinessImpactArea[] }[] = [
    {
      item: {
        title: 'SEC Charges Fintech Company with AML Violations',
        description: 'The Securities and Exchange Commission today announced charges against XYZ Fintech for failing to implement adequate anti-money laundering procedures pursuant to federal regulations. The company shall pay a civil penalty of $500,000 and must implement remedial measures within 90 days.',
        link: 'https://www.sec.gov/enforce/example',
        pubDate: new Date('2024-01-15'),
        guid: 'enforcement-123'
      },
      type: 'enforcement',
      areas: ['Operations', 'Technology']
    },
    {
      item: {
        title: 'Final Rule: Enhanced Disclosure Requirements for Digital Asset Platforms',
        description: 'The Commission hereby adopts final rules requiring digital asset trading platforms to provide enhanced disclosures to customers. Compliance with these requirements shall be mandatory effective 180 days from publication.',
        link: 'https://www.sec.gov/rules/final/example',
        pubDate: new Date('2024-01-10'),
        guid: 'final-rule-456'
      },
      type: 'final-rule',
      areas: ['Reporting', 'Technology']
    },
    {
      item: {
        title: 'Proposed Rule: Custody Requirements for Investment Advisers',
        description: 'The Commission proposes new custody requirements for investment advisers managing digital assets. Comments must be submitted within 60 days of publication.',
        link: 'https://www.sec.gov/rules/proposed/example',
        pubDate: new Date('2024-01-05'),
        guid: 'proposed-rule-789'
      },
      type: 'proposed-rule',
      areas: ['Operations']
    }
  ];

  const handleTranslate = async (index: number) => {
    setLoading(true);
    try {
      const { item, type, areas } = sampleRegulations[index];
      const translationResult = await translationService.translateRegulation(item, type, areas);
      setResult(translationResult);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Plain English Translation Service Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This service converts complex regulatory language into business-friendly explanations
          with specific action items and compliance deadlines.
        </p>

        <div className="grid gap-4 mb-6">
          {sampleRegulations.map((reg, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{reg.item.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{reg.item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    reg.type === 'enforcement' ? 'bg-red-100 text-red-800' :
                    reg.type === 'final-rule' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {reg.type.replace('-', ' ')}
                  </span>
                  {reg.areas.map(area => (
                    <span key={area} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                      {area}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleTranslate(index)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {result && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Translation Result</h3>
            
            <div className="space-y-6">
              {/* Plain English Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Plain English Summary</h4>
                <p className="text-blue-800">{result.plainEnglishSummary}</p>
                <div className="mt-2 text-sm text-blue-600">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>

              {/* Business Impact Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Business Impact</h4>
                <p className="text-purple-800">{result.businessImpactSummary}</p>
              </div>

              {/* Action Items */}
              {result.actionItems.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Action Items</h4>
                  <div className="space-y-3">
                    {result.actionItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white rounded border">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-900 mb-1">{item.description}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Est. {item.estimatedHours}h</span>
                            <span className="capitalize">{item.category}</span>
                            {item.deadline && (
                              <span>Due: {item.deadline.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Requirements */}
              {result.keyRequirements.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">Key Requirements</h4>
                  <ul className="space-y-2">
                    {result.keyRequirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-orange-800">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compliance Deadlines */}
              {result.complianceDeadlines.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3">Compliance Deadlines</h4>
                  <div className="space-y-2">
                    {result.complianceDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-red-800">{deadline.description}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(deadline.priority)}`}>
                            {deadline.priority}
                          </span>
                          {deadline.date && (
                            <span className="text-sm text-red-600">
                              {deadline.date.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Processing Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="ml-2 font-medium">{result.processingTime}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence Score:</span>
                    <span className="ml-2 font-medium">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationDemo;