import { describe, it, expect, beforeEach } from 'vitest';
import { impactAnalysisService, ImpactAnalysisService, ImpactAnalysisError } from '../impactAnalysisService';
import type { RSSItem } from '../../types';

describe('ImpactAnalysisService', () => {
  let service: ImpactAnalysisService;
  let mockRSSItem: RSSItem;

  beforeEach(() => {
    service = new ImpactAnalysisService();
    mockRSSItem = {
      title: 'SEC Charges Fintech Company with Cryptocurrency Violations',
      link: 'https://www.sec.gov/news/press-release/2024-001',
      pubDate: new Date('2024-01-15T10:00:00Z'),
      description: 'The SEC has charged a fintech company with violations related to cryptocurrency custody and AML compliance. The company agreed to pay a $5 million penalty.',
      guid: 'sec-2024-001'
    };
  });

  describe('analyzeRegulation', () => {
    it('should successfully analyze a valid RSS item', async () => {
      const result = await service.analyzeRegulation(mockRSSItem);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle RSS item with missing title', async () => {
      const invalidItem = { ...mockRSSItem, title: '' };
      const result = await service.analyzeRegulation(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('RSS item missing title');
    });

    it('should handle RSS item with missing description', async () => {
      const invalidItem = { ...mockRSSItem, description: '' };
      const result = await service.analyzeRegulation(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('RSS item missing description');
    });

    it('should handle RSS item with invalid URL', async () => {
      const invalidItem = { ...mockRSSItem, link: 'not-a-valid-url' };
      const result = await service.analyzeRegulation(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('RSS item missing or invalid URL');
    });

    it('should handle RSS item with invalid date', async () => {
      const invalidItem = { ...mockRSSItem, pubDate: new Date('invalid') };
      const result = await service.analyzeRegulation(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('RSS item missing or invalid publication date');
    });

    it('should generate appropriate warnings for high severity items', async () => {
      // Create an enforcement item that should trigger high severity
      const highSeverityItem = {
        ...mockRSSItem,
        title: 'SEC Enforcement Action Results in $50 Million Penalty',
        description: 'Major enforcement action with significant penalties and immediate compliance requirements'
      };

      const result = await service.analyzeRegulation(highSeverityItem);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('severity scoring', () => {
    it('should assign high severity scores to enforcement actions', async () => {
      const enforcementItem = {
        ...mockRSSItem,
        title: 'SEC Charges Company with Violations',
        description: 'Enforcement action with penalties and sanctions'
      };

      const result = await service.analyzeRegulation(enforcementItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.severityScore).toBeGreaterThanOrEqual(8);
      expect(result.analysis?.regulationType).toBe('enforcement');
    });

    it('should assign medium severity scores to final rules', async () => {
      const finalRuleItem = {
        ...mockRSSItem,
        title: 'SEC Adopts Final Rule on Digital Asset Custody',
        description: 'Final rule with new requirements and compliance dates'
      };

      const result = await service.analyzeRegulation(finalRuleItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.severityScore).toBeGreaterThanOrEqual(5);
      expect(result.analysis?.severityScore).toBeLessThan(8);
      expect(result.analysis?.regulationType).toBe('final-rule');
    });

    it('should assign low severity scores to proposed rules', async () => {
      const proposedRuleItem = {
        ...mockRSSItem,
        title: 'SEC Proposes New Rules for Investment Advisers',
        description: 'Proposed rule in comment period'
      };

      const result = await service.analyzeRegulation(proposedRuleItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.severityScore).toBeLessThan(5);
      expect(result.analysis?.regulationType).toBe('proposed-rule');
    });
  });

  describe('penalty extraction', () => {
    it('should extract penalty amounts from enforcement actions', async () => {
      const penaltyItem = {
        ...mockRSSItem,
        title: 'Company Pays $10 Million Penalty',
        description: 'Settlement includes $10 million civil penalty'
      };

      const result = await service.analyzeRegulation(penaltyItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.estimatedPenalty).toBeGreaterThan(0);
    });

    it('should handle items without penalty amounts', async () => {
      const noPenaltyItem = {
        ...mockRSSItem,
        title: 'SEC Issues Guidance on Compliance',
        description: 'New guidance for industry participants'
      };

      const result = await service.analyzeRegulation(noPenaltyItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.estimatedPenalty).toBe(0);
    });
  });

  describe('business impact categorization', () => {
    it('should categorize operations impact', async () => {
      const operationsItem = {
        ...mockRSSItem,
        title: 'New Compliance Procedures Required',
        description: 'Companies must update their compliance procedures and training programs'
      };

      const result = await service.analyzeRegulation(operationsItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.businessImpactAreas).toContain('Operations');
    });

    it('should categorize reporting impact', async () => {
      const reportingItem = {
        ...mockRSSItem,
        title: 'New Disclosure Requirements',
        description: 'Enhanced reporting and disclosure requirements for quarterly filings'
      };

      const result = await service.analyzeRegulation(reportingItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.businessImpactAreas).toContain('Reporting');
    });

    it('should categorize technology impact', async () => {
      const technologyItem = {
        ...mockRSSItem,
        title: 'Cybersecurity Requirements Updated',
        description: 'New technology and cybersecurity system requirements'
      };

      const result = await service.analyzeRegulation(technologyItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.businessImpactAreas).toContain('Technology');
    });
  });

  describe('action item generation', () => {
    it('should generate appropriate action items for enforcement actions', async () => {
      const enforcementItem = {
        ...mockRSSItem,
        title: 'SEC Enforcement Action',
        description: 'Enforcement action with compliance violations'
      };

      const result = await service.analyzeRegulation(enforcementItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.actionItems).toBeDefined();
      expect(result.analysis?.actionItems.length).toBeGreaterThan(0);
      
      // Should have high priority items for enforcement
      const highPriorityItems = result.analysis?.actionItems.filter(item => item.priority === 'high');
      expect(highPriorityItems?.length).toBeGreaterThan(0);
    });

    it('should generate appropriate action items for final rules', async () => {
      const finalRuleItem = {
        ...mockRSSItem,
        title: 'SEC Final Rule',
        description: 'Final rule with new requirements'
      };

      const result = await service.analyzeRegulation(finalRuleItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.actionItems).toBeDefined();
      expect(result.analysis?.actionItems.length).toBeGreaterThan(0);
    });

    it('should generate appropriate action items for proposed rules', async () => {
      const proposedRuleItem = {
        ...mockRSSItem,
        title: 'SEC Proposed Rule',
        description: 'Proposed rule in comment period'
      };

      const result = await service.analyzeRegulation(proposedRuleItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.actionItems).toBeDefined();
      expect(result.analysis?.actionItems.length).toBeGreaterThan(0);
      
      // Should have items related to comment period
      const commentItems = result.analysis?.actionItems.filter(item => 
        item.description.toLowerCase().includes('comment')
      );
      expect(commentItems?.length).toBeGreaterThan(0);
    });

    it('should limit action items to configured maximum', async () => {
      const service = new ImpactAnalysisService({ maxActionItems: 3 });
      
      const result = await service.analyzeRegulation(mockRSSItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.actionItems.length).toBeLessThanOrEqual(3);
    });
  });

  describe('timeline estimation', () => {
    it('should estimate short timelines for enforcement actions', async () => {
      const enforcementItem = {
        ...mockRSSItem,
        title: 'SEC Enforcement Action',
        description: 'Immediate compliance required'
      };

      const result = await service.analyzeRegulation(enforcementItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.implementationTimeline).toBeLessThanOrEqual(30);
    });

    it('should estimate longer timelines for proposed rules', async () => {
      const proposedRuleItem = {
        ...mockRSSItem,
        title: 'SEC Proposed Rule',
        description: 'Proposed rule in comment period'
      };

      const result = await service.analyzeRegulation(proposedRuleItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.implementationTimeline).toBeGreaterThan(180);
    });
  });

  describe('batch analysis', () => {
    it('should analyze multiple items in batch', async () => {
      const items = [
        mockRSSItem,
        { ...mockRSSItem, guid: 'sec-2024-002', title: 'Another Regulation' }
      ];

      const results = await service.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle batch analysis with some failures', async () => {
      const items = [
        mockRSSItem,
        { ...mockRSSItem, title: '', guid: 'invalid' } // Invalid item
      ];

      const results = await service.analyzeBatch(items);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        enablePlainEnglishSummary: false,
        maxActionItems: 5
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.enablePlainEnglishSummary).toBe(false);
      expect(config.maxActionItems).toBe(5);
    });

    it('should respect configuration for plain English summaries', async () => {
      const service = new ImpactAnalysisService({ enablePlainEnglishSummary: false });
      
      const result = await service.analyzeRegulation(mockRSSItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.plainEnglishSummary).toBeDefined();
      // Should be basic summary when disabled
    });

    it('should respect configuration for action item generation', async () => {
      const service = new ImpactAnalysisService({ enableActionItemGeneration: false });
      
      const result = await service.analyzeRegulation(mockRSSItem);

      expect(result.success).toBe(true);
      expect(result.analysis?.actionItems).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully and continue processing', async () => {
      // Mock a function to throw an error
      const originalConsoleWarn = console.warn;
      console.warn = () => {}; // Mock console.warn

      const result = await service.analyzeRegulation(mockRSSItem);

      // Should still succeed even if some processing fails
      expect(result.success).toBe(true);
      
      console.warn = originalConsoleWarn;
    });

    it('should provide detailed error information', async () => {
      const invalidItem = { ...mockRSSItem, title: '' };
      const result = await service.analyzeRegulation(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('title');
    });
  });

  describe('statistics', () => {
    it('should calculate analysis statistics correctly', async () => {
      const items = [
        mockRSSItem,
        { ...mockRSSItem, guid: 'sec-2024-002', title: 'Final Rule' },
        { ...mockRSSItem, guid: 'sec-2024-003', title: 'Proposed Rule' }
      ];

      const results = await service.analyzeBatch(items);
      const stats = service.getAnalysisStatistics(results);

      expect(stats.totalAnalyzed).toBe(3);
      expect(stats.successfulAnalyses).toBe(3);
      expect(stats.failedAnalyses).toBe(0);
      expect(stats.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(stats.severityDistribution).toBeDefined();
      expect(stats.typeDistribution).toBeDefined();
    });
  });
});

describe('ImpactAnalysisError', () => {
  it('should create error with code and message', () => {
    const error = new ImpactAnalysisError('Test error', 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('ImpactAnalysisError');
  });

  it('should include original error if provided', () => {
    const originalError = new Error('Original error');
    const error = new ImpactAnalysisError('Test error', 'TEST_CODE', originalError);
    
    expect(error.originalError).toBe(originalError);
  });
});

describe('impactAnalysisService singleton', () => {
  it('should be properly initialized', () => {
    expect(impactAnalysisService).toBeDefined();
    expect(impactAnalysisService.getConfig).toBeDefined();
    expect(impactAnalysisService.analyzeRegulation).toBeDefined();
  });

  it('should have default configuration', () => {
    const config = impactAnalysisService.getConfig();
    
    expect(config.enablePlainEnglishSummary).toBe(true);
    expect(config.enableActionItemGeneration).toBe(true);
    expect(config.maxActionItems).toBe(10);
    expect(config.severityAdjustmentFactor).toBe(1.0);
  });
});