import React, { useState, useEffect } from 'react';

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  offlineDuration: number;
  lastOnlineTime: Date | null;
  connectionType: string;
  effectiveType: string;
}

export interface OfflineOptions {
  pingUrl?: string;
  pingInterval?: number;
  timeout?: number;
  onOnline?: () => void;
  onOffline?: () => void;
}

/**
 * Hook for detecting online/offline status with enhanced features
 */
export function useOfflineDetection(options: OfflineOptions = {}) {
  const {
    pingUrl = '/favicon.ico',
    pingInterval = 30000, // 30 seconds
    timeout = 5000,
    onOnline,
    onOffline
  } = options;

  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineDuration: 0,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    connectionType: getConnectionType(),
    effectiveType: getEffectiveType()
  });

  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);

  // Update connection info
  function getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.type || 'unknown';
  }

  function getEffectiveType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  // Enhanced online check with actual network request
  const checkOnlineStatus = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  // Handle online/offline transitions
  const handleOnline = async () => {
    const actuallyOnline = await checkOnlineStatus();
    
    if (actuallyOnline) {
      const now = new Date();
      const duration = offlineStartTime ? now.getTime() - offlineStartTime.getTime() : 0;
      
      setState(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline,
        offlineDuration: duration,
        lastOnlineTime: now,
        connectionType: getConnectionType(),
        effectiveType: getEffectiveType()
      }));
      
      setOfflineStartTime(null);
      onOnline?.();
    }
  };

  const handleOffline = () => {
    const now = new Date();
    
    setState(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true
    }));
    
    setOfflineStartTime(now);
    onOffline?.();
  };

  // Periodic connectivity check
  useEffect(() => {
    const interval = setInterval(async () => {
      const isActuallyOnline = await checkOnlineStatus();
      
      setState(prev => {
        if (prev.isOnline !== isActuallyOnline) {
          if (isActuallyOnline) {
            handleOnline();
          } else {
            handleOffline();
          }
        }
        
        return {
          ...prev,
          connectionType: getConnectionType(),
          effectiveType: getEffectiveType()
        };
      });
    }, pingInterval);

    return () => clearInterval(interval);
  }, [pingInterval, timeout]);

  // Browser online/offline events
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change events
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const handleConnectionChange = () => {
      setState(prev => ({
        ...prev,
        connectionType: getConnectionType(),
        effectiveType: getEffectiveType()
      }));
    };

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return state;
}



/**
 * Higher-order component for offline-aware components
 */
export function withOfflineSupport<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<P>
) {
  return function OfflineAwareComponent(props: P) {
    const { isOnline } = useOfflineDetection();

    if (!isOnline && fallbackComponent) {
      const FallbackComponent = fallbackComponent;
      return React.createElement(FallbackComponent, props);
    }

    return React.createElement(Component, props);
  };
}

/**
 * Hook for offline-aware data fetching
 */
export function useOfflineAwareFetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: {
    refetchOnReconnect?: boolean;
    staleTime?: number;
  } = {}
) {
  const { refetchOnReconnect = true, staleTime = 300000 } = options; // 5 minutes default
  const { isOnline, wasOffline } = useOfflineDetection();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Load from cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < staleTime) {
          setData(cachedData);
          setLastFetch(new Date(timestamp));
        }
      }
    } catch (e) {
      console.warn('Failed to load cached data:', e);
    }
  }, [cacheKey, staleTime]);

  // Fetch data
  const fetchData = async (force = false) => {
    if (!isOnline && !force) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setLastFetch(new Date());

      // Cache the result
      try {
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache data:', e);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && refetchOnReconnect) {
      fetchData();
    }
  }, [isOnline, wasOffline, refetchOnReconnect]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch: () => fetchData(true),
    isStale: lastFetch ? Date.now() - lastFetch.getTime() > staleTime : true
  };
}