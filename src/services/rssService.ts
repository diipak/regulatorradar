import Parser from 'rss-parser';
import type { RSSItem, RawRSSItem } from '../types';
import { processRSSFeed, isDuplicateRegulation } from '../utils/dataProcessing';
import { storage } from '../utils/storage';

// RSS Parser instance
const parser = new Parser({
  customFields: {
    item: ['guid', 'pubDate', 'description']
  }
});

// SEC RSS feed URLs
const SEC_RSS_FEEDS = {
  pressReleases: 'https://www.sec.gov/news/pressreleases.rss',
  rules: 'https://www.sec.gov/rules/final.rss',
  proposedRules: 'https://www.sec.gov/rules/proposed.rss',
  enforcementActions: 'https://www.sec.gov/litigation/litreleases.rss'
};

// CORS proxy URLs for development (multiple fallbacks)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

export interface RSSFetchResult {
  success: boolean;
  items: RSSItem[];
  errors: string[];
  source: string;
}

export interface RSSMonitoringConfig {
  enabledFeeds: (keyof typeof SEC_RSS_FEEDS)[];
  checkInterval: number; // minutes
  maxItemsPerFeed: number;
  corsProxyIndex: number;
}

class RSSService {
  private config: RSSMonitoringConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private lastCheckTimes: Map<string, Date> = new Map();

  constructor() {
    this.config = {
      enabledFeeds: ['pressReleases', 'rules', 'proposedRules', 'enforcementActions'],
      checkInterval: 240, // 4 hours in minutes
      maxItemsPerFeed: 50,
      corsProxyIndex: 0
    };
  }

  /**
   * Fetches RSS feed with CORS proxy fallback
   */
  private async fetchWithProxy(url: string): Promise<string> {
    const errors: string[] = [];
    
    // Try each CORS proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyIndex = (this.config.corsProxyIndex + i) % CORS_PROXIES.length;
      const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(url);
      
      try {
        console.log(`Attempting to fetch ${url} via proxy ${proxyIndex + 1}/${CORS_PROXIES.length}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'RegulatorRadar/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        
        // Basic validation that we got XML/RSS content
        if (!text.includes('<rss') && !text.includes('<feed')) {
          throw new Error('Response does not appear to be RSS/XML content');
        }

        // Update successful proxy index for future requests
        this.config.corsProxyIndex = proxyIndex;
        console.log(`Successfully fetched RSS feed via proxy ${proxyIndex + 1}`);
        
        return text;
      } catch (error) {
        const errorMsg = `Proxy ${proxyIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    }

    throw new Error(`All CORS proxies failed. Errors: ${errors.join('; ')}`);
  }

  /**
   * Parses RSS feed content
   */
  private async parseRSSContent(content: string): Promise<RawRSSItem[]> {
    try {
      const feed = await parser.parseString(content);
      
      return feed.items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || '',
        description: item.contentSnippet || item.content || item.description || '',
        guid: item.guid || (item as any).id || item.link || ''
      }));
    } catch (error) {
      console.error('RSS parsing error:', error);
      throw new Error(`Failed to parse RSS content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches and processes a single RSS feed
   */
  async fetchFeed(feedName: keyof typeof SEC_RSS_FEEDS): Promise<RSSFetchResult> {
    const feedUrl = SEC_RSS_FEEDS[feedName];
    const result: RSSFetchResult = {
      success: false,
      items: [],
      errors: [],
      source: feedName
    };

    try {
      console.log(`Fetching RSS feed: ${feedName} (${feedUrl})`);
      
      // Fetch RSS content
      const content = await this.fetchWithProxy(feedUrl);
      
      // Parse RSS content
      const rawItems = await this.parseRSSContent(content);
      
      // Limit items to prevent overwhelming the system
      const limitedItems = rawItems.slice(0, this.config.maxItemsPerFeed);
      
      // Process and validate items
      const processedItems = processRSSFeed(limitedItems);
      
      // Filter for new items (not already processed)
      const existingRegulations = storage.getRegulations();
      const newItems = processedItems.filter(item => 
        !isDuplicateRegulation(item, existingRegulations)
      );

      result.success = true;
      result.items = newItems;
      
      console.log(`Successfully processed ${newItems.length} new items from ${feedName} (${processedItems.length} total, ${rawItems.length} raw)`);
      
      // Update last check time
      this.lastCheckTimes.set(feedName, new Date());
      
    } catch (error) {
      const errorMsg = `Failed to fetch ${feedName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Fetches all enabled RSS feeds
   */
  async fetchAllFeeds(): Promise<RSSFetchResult[]> {
    console.log('Starting RSS feed monitoring cycle...');
    
    const results: RSSFetchResult[] = [];
    
    // Fetch feeds in parallel for better performance
    const fetchPromises = this.config.enabledFeeds.map(feedName => 
      this.fetchFeed(feedName)
    );
    
    const feedResults = await Promise.allSettled(fetchPromises);
    
    feedResults.forEach((result, index) => {
      const feedName = this.config.enabledFeeds[index];
      
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Feed ${feedName} failed:`, result.reason);
        results.push({
          success: false,
          items: [],
          errors: [`Feed fetch failed: ${result.reason}`],
          source: feedName
        });
      }
    });

    // Update system state
    const totalNewItems = results.reduce((sum, result) => sum + result.items.length, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
    
    storage.updateSystemState({
      lastRSSCheck: new Date(),
      systemHealth: totalErrors > results.length / 2 ? 'degraded' : 'healthy'
    });

    console.log(`RSS monitoring cycle complete. Found ${totalNewItems} new items across ${results.length} feeds.`);
    
    return results;
  }

  /**
   * Starts automated RSS monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('RSS monitoring is already running');
      return;
    }

    console.log(`Starting RSS monitoring with ${this.config.checkInterval} minute intervals`);
    
    this.isMonitoring = true;
    
    // Initial fetch
    this.fetchAllFeeds().catch(error => {
      console.error('Initial RSS fetch failed:', error);
    });

    // Set up interval for subsequent fetches
    this.monitoringInterval = setInterval(() => {
      this.fetchAllFeeds().catch(error => {
        console.error('Scheduled RSS fetch failed:', error);
      });
    }, this.config.checkInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Stops automated RSS monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('RSS monitoring is not running');
      return;
    }

    console.log('Stopping RSS monitoring');
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Gets monitoring status
   */
  getMonitoringStatus(): {
    isRunning: boolean;
    config: RSSMonitoringConfig;
    lastCheckTimes: Record<string, Date>;
    nextCheckIn?: number; // minutes
  } {
    const nextCheckIn = this.isMonitoring && this.lastCheckTimes.size > 0
      ? Math.max(0, this.config.checkInterval - 
          Math.floor((Date.now() - Math.max(...Array.from(this.lastCheckTimes.values()).map(d => d.getTime()))) / (1000 * 60)))
      : undefined;

    return {
      isRunning: this.isMonitoring,
      config: { ...this.config },
      lastCheckTimes: Object.fromEntries(this.lastCheckTimes),
      nextCheckIn
    };
  }

  /**
   * Updates monitoring configuration
   */
  updateConfig(updates: Partial<RSSMonitoringConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart monitoring if it's running and interval changed
    if (this.isMonitoring && updates.checkInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
    
    console.log('RSS monitoring config updated:', this.config);
  }

  /**
   * Tests RSS feed connectivity
   */
  async testConnectivity(): Promise<{
    success: boolean;
    results: Array<{
      feed: string;
      success: boolean;
      responseTime: number;
      error?: string;
    }>;
  }> {
    console.log('Testing RSS feed connectivity...');
    
    const testResults = [];
    
    for (const feedName of this.config.enabledFeeds) {
      const startTime = Date.now();
      
      try {
        const result = await this.fetchFeed(feedName);
        const responseTime = Date.now() - startTime;
        
        testResults.push({
          feed: feedName,
          success: result.success,
          responseTime,
          error: result.errors.length > 0 ? result.errors.join('; ') : undefined
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        testResults.push({
          feed: feedName,
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = testResults.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      results: testResults
    };
  }

  /**
   * Gets RSS feed statistics
   */
  getStatistics(): {
    totalFeeds: number;
    enabledFeeds: number;
    lastCheckTimes: Record<string, Date>;
    averageResponseTime?: number;
    successRate?: number;
  } {
    return {
      totalFeeds: Object.keys(SEC_RSS_FEEDS).length,
      enabledFeeds: this.config.enabledFeeds.length,
      lastCheckTimes: Object.fromEntries(this.lastCheckTimes),
      // Additional stats would be calculated from historical data
    };
  }
}

// Export singleton instance
export const rssService = new RSSService();

// Export types and constants
export { SEC_RSS_FEEDS, CORS_PROXIES };