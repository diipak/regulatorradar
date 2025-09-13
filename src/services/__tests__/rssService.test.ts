import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rssService } from '../rssService';

// Mock fetch globally
(globalThis as any).fetch = vi.fn();

// Mock the storage utility
vi.mock('../../utils/storage', () => ({
  storage: {
    getRegulations: vi.fn(() => []),
    updateSystemState: vi.fn(() => true)
  }
}));

// Mock the validation utilities
vi.mock('../../utils/validation', () => ({
  validateRSSItem: vi.fn((item: any) => ({
    title: item.title || 'Test Title',
    link: item.link || 'https://test.com',
    pubDate: new Date(item.pubDate || '2024-01-15'),
    description: item.description || 'Test description',
    guid: item.guid || 'test-guid'
  })),
  isRelevantToFintech: vi.fn(() => true)
}));

// Mock the data processing utilities
vi.mock('../../utils/dataProcessing', () => ({
  processRSSFeed: vi.fn((items: any[]) => items.map((item: any) => ({
    title: item.title || 'Test Title',
    link: item.link || 'https://test.com',
    pubDate: new Date(item.pubDate || '2024-01-15'),
    description: item.description || 'Test description',
    guid: item.guid || 'test-guid'
  }))),
  isDuplicateRegulation: vi.fn(() => false)
}));

describe('RSSService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rssService.stopMonitoring(); // Ensure clean state
  });

  afterEach(() => {
    rssService.stopMonitoring(); // Clean up after tests
  });

  describe('fetchFeed', () => {
    it('should successfully fetch and parse RSS feed', async () => {
      // Mock successful RSS response
      const mockRSSContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>SEC Press Releases</title>
            <item>
              <title>SEC Charges Crypto Exchange</title>
              <link>https://sec.gov/news/123</link>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
              <description>The SEC charged a cryptocurrency exchange...</description>
              <guid>sec-2024-001</guid>
            </item>
          </channel>
        </rss>`;

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockRSSContent),
        headers: new Headers({ 'content-type': 'application/rss+xml' })
      } as Response);

      const result = await rssService.fetchFeed('pressReleases');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('SEC Charges Crypto Exchange');
      expect(result.errors).toHaveLength(0);
      expect(result.source).toBe('pressReleases');
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await rssService.fetchFeed('pressReleases');

      expect(result.success).toBe(false);
      expect(result.items).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Network error');
    });

    it('should handle invalid RSS content', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Invalid XML content'),
        headers: new Headers({ 'content-type': 'text/html' })
      } as Response);

      const result = await rssService.fetchFeed('pressReleases');

      expect(result.success).toBe(false);
      expect(result.items).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should limit items per feed', async () => {
      // Create RSS with many items
      const manyItems = Array.from({ length: 100 }, (_, i) => `
        <item>
          <title>Item ${i}</title>
          <link>https://sec.gov/news/${i}</link>
          <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
          <guid>item-${i}</guid>
        </item>
      `).join('');

      const mockRSSContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>SEC Press Releases</title>
            ${manyItems}
          </channel>
        </rss>`;

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockRSSContent),
        headers: new Headers({ 'content-type': 'application/rss+xml' })
      } as Response);

      const result = await rssService.fetchFeed('pressReleases');

      expect(result.success).toBe(true);
      // Should be limited to maxItemsPerFeed (50 by default)
      expect(result.items.length).toBeLessThanOrEqual(50);
    });
  });

  describe('monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(rssService.getMonitoringStatus().isRunning).toBe(false);

      rssService.startMonitoring();
      expect(rssService.getMonitoringStatus().isRunning).toBe(true);

      rssService.stopMonitoring();
      expect(rssService.getMonitoringStatus().isRunning).toBe(false);
    });

    it('should not start monitoring if already running', () => {
      rssService.startMonitoring();
      const consoleSpy = vi.spyOn(console, 'log');
      
      rssService.startMonitoring(); // Try to start again
      
      expect(consoleSpy).toHaveBeenCalledWith('RSS monitoring is already running');
      
      rssService.stopMonitoring();
      consoleSpy.mockRestore();
    });

    it('should update configuration', () => {
      const newConfig = { checkInterval: 120, maxItemsPerFeed: 25 };
      
      rssService.updateConfig(newConfig);
      
      const status = rssService.getMonitoringStatus();
      expect(status.config.checkInterval).toBe(120);
      expect(status.config.maxItemsPerFeed).toBe(25);
    });
  });

  describe('testConnectivity', () => {
    it('should test connectivity to all feeds', async () => {
      // Mock successful responses for all feeds with proper RSS format
      const validRSS = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Test Item</title>
              <link>https://test.com</link>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
              <guid>test-guid</guid>
            </item>
          </channel>
        </rss>`;

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(validRSS),
        headers: new Headers({ 'content-type': 'application/rss+xml' })
      } as Response);

      const result = await rssService.testConnectivity();

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(r => typeof r.responseTime === 'number')).toBe(true);
    });

    it('should handle connectivity failures', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Connection failed'));

      const result = await rssService.testConnectivity();

      expect(result.success).toBe(false);
      expect(result.results.every(r => !r.success)).toBe(true);
      expect(result.results.every(r => r.error)).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return monitoring statistics', () => {
      const stats = rssService.getStatistics();

      expect(stats).toHaveProperty('totalFeeds');
      expect(stats).toHaveProperty('enabledFeeds');
      expect(stats).toHaveProperty('lastCheckTimes');
      expect(typeof stats.totalFeeds).toBe('number');
      expect(typeof stats.enabledFeeds).toBe('number');
      expect(stats.totalFeeds).toBeGreaterThan(0);
    });
  });
});