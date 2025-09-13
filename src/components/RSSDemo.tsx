import { useState } from 'react';
import { useRSSMonitoring } from '../hooks/useRSSMonitoring';
import { loadMockData } from '../utils/mockData';

export function RSSDemo() {
  const {
    isMonitoring,
    lastResults,
    isLoading,
    error,
    totalNewItems,
    healthyProxies,
    proxyHealth,
    startMonitoring,
    stopMonitoring,
    fetchNow,
    testConnectivity,
    checkProxyHealth,
    getStatistics
  } = useRSSMonitoring();

  const [testResults, setTestResults] = useState<any>(null);

  const handleLoadMockData = () => {
    loadMockData();
    alert('Mock data loaded into localStorage! Check the browser console for details.');
  };

  const handleTestConnectivity = async () => {
    try {
      const results = await testConnectivity();
      setTestResults(results);
    } catch (error) {
      console.error('Connectivity test failed:', error);
    }
  };

  const handleFetchNow = async () => {
    try {
      await fetchNow();
    } catch (error) {
      console.error('Manual fetch failed:', error);
    }
  };

  const stats = getStatistics();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">RSS Feed Monitoring Demo</h1>
      
      {/* Status Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Monitoring Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
              {isMonitoring ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalNewItems}</div>
            <div className="text-sm text-gray-600">New Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{healthyProxies}</div>
            <div className="text-sm text-gray-600">Healthy Proxies</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'ERROR' : 'OK'}
            </div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            disabled={isLoading}
            className={`px-4 py-2 rounded font-medium ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Loading...' : isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          
          <button
            onClick={handleFetchNow}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
          >
            Fetch Now
          </button>
          
          <button
            onClick={handleTestConnectivity}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium disabled:opacity-50"
          >
            Test Connectivity
          </button>
          
          <button
            onClick={checkProxyHealth}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium disabled:opacity-50"
          >
            Check Proxy Health
          </button>
          
          <button
            onClick={handleLoadMockData}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
          >
            Load Mock Data
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">RSS Feeds</div>
            <div>{stats.rss.enabledFeeds}/{stats.rss.totalFeeds} enabled</div>
          </div>
          <div>
            <div className="font-medium">Success Rate</div>
            <div>{stats.successRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="font-medium">Proxy Response</div>
            <div>{stats.proxy.averageResponseTime}ms avg</div>
          </div>
          <div>
            <div className="font-medium">Best Proxy</div>
            <div>{stats.proxy.bestProxy || 'None'}</div>
          </div>
        </div>
      </div>

      {/* Proxy Health */}
      {proxyHealth.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Proxy Health</h2>
          <div className="space-y-2">
            {proxyHealth.map((proxy) => (
              <div key={proxy.proxy} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="font-medium">{proxy.proxy}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">{proxy.responseTime}ms</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    proxy.isHealthy 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {proxy.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connectivity Test Results</h2>
          <div className="space-y-2">
            {testResults.results.map((result: any) => (
              <div key={result.feed} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="font-medium">{result.feed}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">{result.responseTime}ms</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                {result.error && (
                  <div className="text-xs text-red-600 max-w-xs truncate">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {lastResults.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Fetch Results</h2>
          <div className="space-y-4">
            {lastResults.map((result, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.source}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Found {result.items.length} new items
                </div>
                {result.errors.length > 0 && (
                  <div className="text-sm text-red-600 mt-1">
                    Errors: {result.errors.join(', ')}
                  </div>
                )}
                {result.items.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Recent items:</div>
                    <ul className="text-sm text-gray-600 ml-4">
                      {result.items.slice(0, 3).map((item, itemIndex) => (
                        <li key={itemIndex} className="truncate">
                          • {item.title}
                        </li>
                      ))}
                      {result.items.length > 3 && (
                        <li className="text-gray-500">... and {result.items.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}