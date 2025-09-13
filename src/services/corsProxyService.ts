/**
 * CORS Proxy Service for handling cross-origin RSS feed requests
 * Provides multiple proxy fallbacks and health monitoring
 */

export interface ProxyConfig {
  url: string;
  name: string;
  timeout: number;
  retries: number;
  healthCheck?: string;
}

export interface ProxyHealthStatus {
  proxy: string;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

class CORSProxyService {
  private proxies: ProxyConfig[] = [
    {
      url: 'https://api.allorigins.win/raw?url=',
      name: 'AllOrigins',
      timeout: 10000,
      retries: 2,
      healthCheck: 'https://api.allorigins.win/raw?url=https://httpbin.org/status/200'
    },
    {
      url: 'https://corsproxy.io/?',
      name: 'CORSProxy.io',
      timeout: 15000,
      retries: 2,
      healthCheck: 'https://corsproxy.io/?https://httpbin.org/status/200'
    },
    {
      url: 'https://api.codetabs.com/v1/proxy?quest=',
      name: 'CodeTabs',
      timeout: 12000,
      retries: 1,
      healthCheck: 'https://api.codetabs.com/v1/proxy?quest=https://httpbin.org/status/200'
    }
  ];

  private healthStatus: Map<string, ProxyHealthStatus> = new Map();


  /**
   * Fetches URL through the best available proxy
   */
  async fetchThroughProxy(targetUrl: string, options: RequestInit = {}): Promise<Response> {
    const errors: string[] = [];
    
    // Try proxies in order of preference
    const sortedProxies = this.getSortedProxies();
    
    for (const proxy of sortedProxies) {
      try {
        const response = await this.attemptFetch(proxy, targetUrl, options);
        
        // Update health status on success
        this.updateHealthStatus(proxy.name, true, Date.now());
        
        return response;
      } catch (error) {
        const errorMsg = `${proxy.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        
        // Update health status on failure
        this.updateHealthStatus(proxy.name, false, Date.now(), errorMsg);
        
        console.warn(`Proxy ${proxy.name} failed, trying next...`);
      }
    }

    throw new Error(`All proxies failed. Errors: ${errors.join('; ')}`);
  }

  /**
   * Attempts to fetch through a specific proxy
   */
  private async attemptFetch(proxy: ProxyConfig, targetUrl: string, options: RequestInit): Promise<Response> {
    const proxyUrl = proxy.url + encodeURIComponent(targetUrl);
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), proxy.timeout);
    
    try {
      const response = await fetch(proxyUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'RegulatorRadar/1.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Validate response content type for RSS feeds
      const contentType = response.headers.get('content-type') || '';
      if (targetUrl.includes('.rss') && !this.isValidRSSContentType(contentType)) {
        console.warn(`Unexpected content type for RSS feed: ${contentType}`);
      }

      const responseTime = Date.now() - startTime;
      console.log(`Successfully fetched via ${proxy.name} in ${responseTime}ms`);

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${proxy.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Checks if content type is valid for RSS feeds
   */
  private isValidRSSContentType(contentType: string): boolean {
    const validTypes = [
      'application/rss+xml',
      'application/xml',
      'text/xml',
      'application/atom+xml',
      'text/html' // Some feeds serve as HTML
    ];
    
    return validTypes.some(type => contentType.toLowerCase().includes(type));
  }

  /**
   * Gets proxies sorted by health and preference
   */
  private getSortedProxies(): ProxyConfig[] {
    return [...this.proxies].sort((a, b) => {
      const aHealth = this.healthStatus.get(a.name);
      const bHealth = this.healthStatus.get(b.name);
      
      // Prioritize healthy proxies
      if (aHealth?.isHealthy && !bHealth?.isHealthy) return -1;
      if (!aHealth?.isHealthy && bHealth?.isHealthy) return 1;
      
      // Then by response time
      if (aHealth?.responseTime && bHealth?.responseTime) {
        return aHealth.responseTime - bHealth.responseTime;
      }
      
      // Finally by original order
      return this.proxies.indexOf(a) - this.proxies.indexOf(b);
    });
  }

  /**
   * Updates health status for a proxy
   */
  private updateHealthStatus(proxyName: string, isHealthy: boolean, responseTime: number, error?: string): void {
    this.healthStatus.set(proxyName, {
      proxy: proxyName,
      isHealthy,
      responseTime,
      lastChecked: new Date(),
      error
    });
  }

  /**
   * Performs health checks on all proxies
   */
  async performHealthChecks(): Promise<ProxyHealthStatus[]> {
    console.log('Performing proxy health checks...');
    
    const healthPromises = this.proxies.map(async (proxy) => {
      if (!proxy.healthCheck) {
        return {
          proxy: proxy.name,
          isHealthy: true, // Assume healthy if no health check URL
          responseTime: 0,
          lastChecked: new Date()
        };
      }

      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), proxy.timeout);
        
        const response = await fetch(proxy.healthCheck, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'RegulatorRadar-HealthCheck/1.0'
          }
        });
        
        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        const isHealthy = response.ok;

        const status: ProxyHealthStatus = {
          proxy: proxy.name,
          isHealthy,
          responseTime,
          lastChecked: new Date(),
          error: isHealthy ? undefined : `HTTP ${response.status}`
        };

        this.healthStatus.set(proxy.name, status);
        return status;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        const status: ProxyHealthStatus = {
          proxy: proxy.name,
          isHealthy: false,
          responseTime,
          lastChecked: new Date(),
          error: errorMsg
        };

        this.healthStatus.set(proxy.name, status);
        return status;
      }
    });

    const results = await Promise.allSettled(healthPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          proxy: this.proxies[index].name,
          isHealthy: false,
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Health check failed'
        };
      }
    });
  }

  /**
   * Gets current health status of all proxies
   */
  getHealthStatus(): ProxyHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Gets the best available proxy
   */
  getBestProxy(): ProxyConfig | null {
    const sortedProxies = this.getSortedProxies();
    return sortedProxies.length > 0 ? sortedProxies[0] : null;
  }

  /**
   * Adds a custom proxy configuration
   */
  addProxy(config: ProxyConfig): void {
    this.proxies.push(config);
    console.log(`Added custom proxy: ${config.name}`);
  }

  /**
   * Removes a proxy by name
   */
  removeProxy(name: string): boolean {
    const index = this.proxies.findIndex(p => p.name === name);
    if (index >= 0) {
      this.proxies.splice(index, 1);
      this.healthStatus.delete(name);
      console.log(`Removed proxy: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Gets proxy statistics
   */
  getStatistics(): {
    totalProxies: number;
    healthyProxies: number;
    averageResponseTime: number;
    bestProxy: string | null;
  } {
    const healthStatuses = Array.from(this.healthStatus.values());
    const healthyProxies = healthStatuses.filter(s => s.isHealthy);
    
    const averageResponseTime = healthyProxies.length > 0
      ? healthyProxies.reduce((sum, s) => sum + s.responseTime, 0) / healthyProxies.length
      : 0;

    const bestProxy = this.getBestProxy();

    return {
      totalProxies: this.proxies.length,
      healthyProxies: healthyProxies.length,
      averageResponseTime: Math.round(averageResponseTime),
      bestProxy: bestProxy?.name || null
    };
  }
}

// Export singleton instance
export const corsProxyService = new CORSProxyService();