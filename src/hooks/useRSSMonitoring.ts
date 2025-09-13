import { useState, useEffect, useCallback } from 'react';
import { rssService, corsProxyService } from '../services';
import type { RSSFetchResult, RSSMonitoringConfig } from '../services/rssService';
import type { ProxyHealthStatus } from '../services/corsProxyService';

export interface RSSMonitoringState {
  isMonitoring: boolean;
  lastResults: RSSFetchResult[];
  config: RSSMonitoringConfig;
  lastCheckTimes: Record<string, Date>;
  nextCheckIn?: number;
  isLoading: boolean;
  error: string | null;
  proxyHealth: ProxyHealthStatus[];
}

export function useRSSMonitoring() {
  const [state, setState] = useState<RSSMonitoringState>({
    isMonitoring: false,
    lastResults: [],
    config: {
      enabledFeeds: ['pressReleases', 'rules', 'proposedRules', 'enforcementActions'],
      checkInterval: 240,
      maxItemsPerFeed: 50,
      corsProxyIndex: 0
    },
    lastCheckTimes: {},
    isLoading: false,
    error: null,
    proxyHealth: []
  });

  /**
   * Updates the monitoring state from RSS service
   */
  const updateState = useCallback(() => {
    const status = rssService.getMonitoringStatus();
    const proxyHealth = corsProxyService.getHealthStatus();
    
    setState(prev => ({
      ...prev,
      isMonitoring: status.isRunning,
      config: status.config,
      lastCheckTimes: status.lastCheckTimes,
      nextCheckIn: status.nextCheckIn,
      proxyHealth
    }));
  }, []);

  /**
   * Starts RSS monitoring
   */
  const startMonitoring = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      rssService.startMonitoring();
      updateState();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start monitoring';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg 
      }));
    }
  }, [updateState]);

  /**
   * Stops RSS monitoring
   */
  const stopMonitoring = useCallback(() => {
    rssService.stopMonitoring();
    updateState();
  }, [updateState]);

  /**
   * Performs a manual RSS fetch
   */
  const fetchNow = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const results = await rssService.fetchAllFeeds();
      
      setState(prev => ({
        ...prev,
        lastResults: results,
        isLoading: false
      }));
      
      updateState();
      
      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch feeds';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg,
        lastResults: []
      }));
      throw error;
    }
  }, [updateState]);

  /**
   * Updates monitoring configuration
   */
  const updateConfig = useCallback((updates: Partial<RSSMonitoringConfig>) => {
    rssService.updateConfig(updates);
    updateState();
  }, [updateState]);

  /**
   * Tests RSS feed connectivity
   */
  const testConnectivity = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await rssService.testConnectivity();
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connectivity test failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg 
      }));
      throw error;
    }
  }, []);

  /**
   * Performs proxy health checks
   */
  const checkProxyHealth = useCallback(async () => {
    try {
      const healthStatus = await corsProxyService.performHealthChecks();
      
      setState(prev => ({
        ...prev,
        proxyHealth: healthStatus
      }));
      
      return healthStatus;
    } catch (error) {
      console.error('Proxy health check failed:', error);
      throw error;
    }
  }, []);

  /**
   * Gets RSS monitoring statistics
   */
  const getStatistics = useCallback(() => {
    const rssStats = rssService.getStatistics();
    const proxyStats = corsProxyService.getStatistics();
    
    return {
      rss: rssStats,
      proxy: proxyStats,
      totalNewItems: state.lastResults.reduce((sum, result) => sum + result.items.length, 0),
      totalErrors: state.lastResults.reduce((sum, result) => sum + result.errors.length, 0),
      successRate: state.lastResults.length > 0 
        ? (state.lastResults.filter(r => r.success).length / state.lastResults.length) * 100
        : 0
    };
  }, [state.lastResults]);

  // Update state on mount and set up periodic updates
  useEffect(() => {
    updateState();
    
    // Update state every minute to keep nextCheckIn accurate
    const interval = setInterval(updateState, 60000);
    
    return () => clearInterval(interval);
  }, [updateState]);

  // Perform initial proxy health check
  useEffect(() => {
    checkProxyHealth().catch(error => {
      console.warn('Initial proxy health check failed:', error);
    });
  }, [checkProxyHealth]);

  return {
    // State
    ...state,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    fetchNow,
    updateConfig,
    testConnectivity,
    checkProxyHealth,
    getStatistics,
    
    // Computed values
    hasErrors: state.error !== null || state.lastResults.some(r => r.errors.length > 0),
    totalNewItems: state.lastResults.reduce((sum, result) => sum + result.items.length, 0),
    healthyProxies: state.proxyHealth.filter(p => p.isHealthy).length
  };
}