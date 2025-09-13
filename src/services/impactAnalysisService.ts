import type { 
  RSSItem, 
  RegulationAnalysis, 
  RegulationType, 
  BusinessImpactArea, 
  ActionItem,
  ActionItemPriority
} from '../types';
import { 
  determineRegulationType,
  calculateSeverityScore,
  extractPenaltyAmount,
  estimateImplementationTimeline,
  categorizeBusinessImpact,
  generateRegulationId
} from '../utils/dataProcessing';
import { translationService } from './translationService';

/**
 * Error types for impact analysis failures
 */
class ImpactAnalysisError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;
  
  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = 'ImpactAnalysisError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Configuration for impact analysis
 */
interface ImpactAnalysisConfig {
  enablePlainEnglishSummary: boolean;
  enableActionItemGeneration: boolean;
  maxActionItems: number;
  severityAdjustmentFactor: number;
}

/**
 * Result of impact analysis with error handling
 */
interface ImpactAnalysisResult {
  success: boolean;
  analysis?: RegulationAnalysis;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

/**
 * Impact Analysis Engine Service
 * 
 * Provides comprehensive analysis of regulatory changes including:
 * - Severity scoring based on regulation type and content
 * - Business impact categorization
 * - Penalty amount extraction
 * - Implementation timeline estimation
 * - Plain English translation
 * - Action item generation
 */
class ImpactAnalysisService {
  private config: ImpactAnalysisConfig;

  constructor(config?: Partial<ImpactAnalysisConfig>) {
    this.config = {
      enablePlainEnglishSummary: true,
      enableActionItemGeneration: true,
      maxActionItems: 10,
      severityAdjustmentFactor: 1.0,
      ...config
    };
  }

  /**
   * Performs complete impact analysis on a regulatory item
   */
  async analyzeRegulation(item: RSSItem): Promise<ImpactAnalysisResult> {
    const startTime = Date.now();
    const result: ImpactAnalysisResult = {
      success: false,
      errors: [],
      warnings: [],
      processingTime: 0
    };

    try {
      // Validate input
      this.validateRSSItem(item);

      // Determine regulation type
      const regulationType = this.determineRegulationType(item);

      // Calculate severity score
      const severityScore = this.calculateSeverityScore(regulationType, item);

      // Extract penalty amount (for enforcement actions)
      const estimatedPenalty = this.extractPenaltyAmount(item);

      // Estimate implementation timeline
      const implementationTimeline = this.estimateImplementationTimeline(regulationType, item);

      // Categorize business impact areas
      const businessImpactAreas = this.categorizeBusinessImpact(item);

      // Use translation service for enhanced plain English summary and action items
      let plainEnglishSummary: string;
      let actionItems: ActionItem[];

      if (this.config.enablePlainEnglishSummary || this.config.enableActionItemGeneration) {
        try {
          const translationResult = await translationService.translateRegulation(
            item, 
            regulationType, 
            businessImpactAreas
          );
          
          plainEnglishSummary = this.config.enablePlainEnglishSummary 
            ? translationResult.plainEnglishSummary 
            : this.generateBasicSummary(item, regulationType);
            
          actionItems = this.config.enableActionItemGeneration 
            ? translationResult.actionItems 
            : [];

          // Add translation warnings if confidence is low
          if (translationResult.confidence < 0.6) {
            result.warnings.push('Translation confidence is low - manual review recommended');
          }

        } catch (translationError) {
          console.warn('Translation service failed, using fallback:', translationError);
          plainEnglishSummary = this.config.enablePlainEnglishSummary
            ? await this.generatePlainEnglishSummary(item, regulationType)
            : this.generateBasicSummary(item, regulationType);
          actionItems = this.config.enableActionItemGeneration
            ? await this.generateActionItems(item, regulationType, businessImpactAreas)
            : [];
        }
      } else {
        plainEnglishSummary = this.generateBasicSummary(item, regulationType);
        actionItems = [];
      }

      // Create analysis result
      const analysis: RegulationAnalysis = {
        id: generateRegulationId(item),
        title: item.title,
        severityScore,
        regulationType,
        businessImpactAreas,
        estimatedPenalty,
        implementationTimeline,
        plainEnglishSummary,
        actionItems,
        originalUrl: item.link,
        processedDate: new Date()
      };

      result.success = true;
      result.analysis = analysis;

      // Add warnings for potential issues
      this.addAnalysisWarnings(result, analysis, item);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis';
      result.errors.push(errorMessage);
      
      if (error instanceof ImpactAnalysisError) {
        console.error(`Impact Analysis Error [${error.code}]:`, error.message, error.originalError);
      } else {
        console.error('Unexpected error during impact analysis:', error);
      }
    } finally {
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Validates RSS item for analysis
   */
  private validateRSSItem(item: RSSItem): void {
    if (!item.title || item.title.trim().length === 0) {
      throw new ImpactAnalysisError('RSS item missing title', 'MISSING_TITLE');
    }

    if (!item.description || item.description.trim().length === 0) {
      throw new ImpactAnalysisError('RSS item missing description', 'MISSING_DESCRIPTION');
    }

    if (!item.link || !this.isValidUrl(item.link)) {
      throw new ImpactAnalysisError('RSS item missing or invalid URL', 'INVALID_URL');
    }

    if (!item.pubDate || isNaN(item.pubDate.getTime())) {
      throw new ImpactAnalysisError('RSS item missing or invalid publication date', 'INVALID_DATE');
    }
  }

  /**
   * Determines regulation type with enhanced logic
   */
  private determineRegulationType(item: RSSItem): RegulationType {
    try {
      return determineRegulationType(item);
    } catch (error) {
      console.warn('Error determining regulation type, defaulting to proposed-rule:', error);
      return 'proposed-rule';
    }
  }

  /**
   * Calculates severity score with configuration adjustments
   */
  private calculateSeverityScore(regulationType: RegulationType, item: RSSItem): number {
    try {
      const baseScore = calculateSeverityScore(regulationType, item);
      const adjustedScore = Math.round(baseScore * this.config.severityAdjustmentFactor);
      return Math.max(1, Math.min(10, adjustedScore));
    } catch (error) {
      console.warn('Error calculating severity score, using default:', error);
      // Return default scores based on type
      switch (regulationType) {
        case 'enforcement': return 8;
        case 'final-rule': return 5;
        case 'proposed-rule': return 2;
        default: return 3;
      }
    }
  }

  /**
   * Extracts penalty amount with enhanced error handling
   */
  private extractPenaltyAmount(item: RSSItem): number {
    try {
      return extractPenaltyAmount(item);
    } catch (error) {
      console.warn('Error extracting penalty amount:', error);
      return 0;
    }
  }

  /**
   * Estimates implementation timeline with fallback logic
   */
  private estimateImplementationTimeline(regulationType: RegulationType, item: RSSItem): number {
    try {
      return estimateImplementationTimeline(regulationType, item);
    } catch (error) {
      console.warn('Error estimating timeline, using defaults:', error);
      // Return default timelines
      switch (regulationType) {
        case 'enforcement': return 30;
        case 'final-rule': return 180;
        case 'proposed-rule': return 365;
        default: return 90;
      }
    }
  }

  /**
   * Categorizes business impact with error handling
   */
  private categorizeBusinessImpact(item: RSSItem): BusinessImpactArea[] {
    try {
      return categorizeBusinessImpact(item);
    } catch (error) {
      console.warn('Error categorizing business impact, using default:', error);
      return ['Operations']; // Default fallback
    }
  }

  /**
   * Generates plain English summary
   */
  private async generatePlainEnglishSummary(item: RSSItem, regulationType: RegulationType): Promise<string> {
    try {
      // For now, use rule-based approach
      // In future, this could integrate with AI services
      return this.generateRuleBasedSummary(item, regulationType);
    } catch (error) {
      console.warn('Error generating plain English summary:', error);
      return this.generateBasicSummary(item, regulationType);
    }
  }

  /**
   * Generates rule-based plain English summary
   */
  private generateRuleBasedSummary(item: RSSItem, regulationType: RegulationType): string {
    const title = item.title;
    const description = item.description;
    
    let summary = '';
    
    switch (regulationType) {
      case 'enforcement':
        summary = `The SEC has taken enforcement action regarding ${this.extractMainSubject(title)}. `;
        summary += `This enforcement action may involve penalties or sanctions. `;
        summary += `Companies in similar situations should review their compliance practices immediately. `;
        break;
        
      case 'final-rule':
        summary = `The SEC has finalized new rules regarding ${this.extractMainSubject(title)}. `;
        summary += `These rules are now in effect and require compliance. `;
        summary += `Companies must update their procedures and systems to meet the new requirements. `;
        break;
        
      case 'proposed-rule':
        summary = `The SEC has proposed new rules regarding ${this.extractMainSubject(title)}. `;
        summary += `This is currently in the comment period and not yet final. `;
        summary += `Companies should monitor developments and prepare for potential implementation. `;
        break;
    }
    
    // Add key details from description
    const keyPoints = this.extractKeyPoints(description);
    if (keyPoints.length > 0) {
      summary += `Key points include: ${keyPoints.join(', ')}.`;
    }
    
    return summary.trim();
  }

  /**
   * Generates basic fallback summary
   */
  private generateBasicSummary(item: RSSItem, regulationType: RegulationType): string {
    const typeDescription = {
      'enforcement': 'enforcement action',
      'final-rule': 'final rule',
      'proposed-rule': 'proposed rule'
    }[regulationType];
    
    return `The SEC has issued a ${typeDescription}: ${item.title}. Please review the full details and assess impact on your organization.`;
  }

  /**
   * Generates action items based on regulation analysis
   */
  private async generateActionItems(
    item: RSSItem, 
    regulationType: RegulationType, 
    businessImpactAreas: BusinessImpactArea[]
  ): Promise<ActionItem[]> {
    try {
      const actionItems: ActionItem[] = [];
      
      // Generate type-specific action items
      switch (regulationType) {
        case 'enforcement':
          actionItems.push(...this.generateEnforcementActionItems(item, businessImpactAreas));
          break;
        case 'final-rule':
          actionItems.push(...this.generateFinalRuleActionItems(item, businessImpactAreas));
          break;
        case 'proposed-rule':
          actionItems.push(...this.generateProposedRuleActionItems(item, businessImpactAreas));
          break;
      }
      
      // Add general action items
      actionItems.push(...this.generateGeneralActionItems());
      
      // Limit to max action items and sort by priority
      return actionItems
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, this.config.maxActionItems);
        
    } catch (error) {
      console.warn('Error generating action items:', error);
      return this.generateFallbackActionItems(regulationType);
    }
  }

  /**
   * Generates enforcement-specific action items
   */
  private generateEnforcementActionItems(_item: RSSItem, impactAreas: BusinessImpactArea[]): ActionItem[] {
    const items: ActionItem[] = [
      {
        description: 'Review current compliance procedures for similar risks',
        priority: 'high',
        estimatedHours: 4,
        category: 'legal',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      },
      {
        description: 'Conduct internal audit of related business practices',
        priority: 'high',
        estimatedHours: 8,
        category: 'operational'
      },
      {
        description: 'Update risk management procedures based on enforcement lessons',
        priority: 'medium',
        estimatedHours: 6,
        category: 'operational'
      }
    ];

    // Add impact-area specific items
    if (impactAreas.includes('Technology')) {
      items.push({
        description: 'Review technology systems for compliance gaps',
        priority: 'high',
        estimatedHours: 12,
        category: 'technical'
      });
    }

    return items;
  }

  /**
   * Generates final rule action items
   */
  private generateFinalRuleActionItems(_item: RSSItem, impactAreas: BusinessImpactArea[]): ActionItem[] {
    const items: ActionItem[] = [
      {
        description: 'Review new rule requirements and assess compliance gaps',
        priority: 'high',
        estimatedHours: 6,
        category: 'legal'
      },
      {
        description: 'Update policies and procedures to meet new requirements',
        priority: 'high',
        estimatedHours: 16,
        category: 'operational'
      },
      {
        description: 'Train staff on new compliance requirements',
        priority: 'medium',
        estimatedHours: 8,
        category: 'operational'
      }
    ];

    // Add impact-area specific items
    if (impactAreas.includes('Reporting')) {
      items.push({
        description: 'Update reporting systems and procedures',
        priority: 'high',
        estimatedHours: 20,
        category: 'technical'
      });
    }

    if (impactAreas.includes('Technology')) {
      items.push({
        description: 'Implement technical changes required by new rule',
        priority: 'medium',
        estimatedHours: 40,
        category: 'technical'
      });
    }

    return items;
  }

  /**
   * Generates proposed rule action items
   */
  private generateProposedRuleActionItems(_item: RSSItem, _impactAreas: BusinessImpactArea[]): ActionItem[] {
    return [
      {
        description: 'Review proposed rule and assess potential impact',
        priority: 'medium',
        estimatedHours: 4,
        category: 'legal'
      },
      {
        description: 'Prepare comment letter if rule affects business',
        priority: 'medium',
        estimatedHours: 8,
        category: 'legal'
      },
      {
        description: 'Monitor rule development and comment period',
        priority: 'low',
        estimatedHours: 2,
        category: 'legal'
      },
      {
        description: 'Begin preliminary planning for potential implementation',
        priority: 'low',
        estimatedHours: 6,
        category: 'operational'
      }
    ];
  }

  /**
   * Generates general action items applicable to all regulation types
   */
  private generateGeneralActionItems(): ActionItem[] {
    return [
      {
        description: 'Document regulation in compliance tracking system',
        priority: 'medium',
        estimatedHours: 1,
        category: 'operational'
      },
      {
        description: 'Share regulation summary with relevant team members',
        priority: 'medium',
        estimatedHours: 1,
        category: 'operational'
      }
    ];
  }

  /**
   * Generates fallback action items when generation fails
   */
  private generateFallbackActionItems(_regulationType: RegulationType): ActionItem[] {
    return [
      {
        description: 'Review regulation details and assess business impact',
        priority: 'high',
        estimatedHours: 4,
        category: 'legal'
      },
      {
        description: 'Consult with legal counsel if needed',
        priority: 'medium',
        estimatedHours: 2,
        category: 'legal'
      }
    ];
  }

  /**
   * Adds warnings to analysis result based on potential issues
   */
  private addAnalysisWarnings(result: ImpactAnalysisResult, analysis: RegulationAnalysis, item: RSSItem): void {
    // Warn about high severity items
    if (analysis.severityScore >= 8) {
      result.warnings.push('High severity regulation requires immediate attention');
    }

    // Warn about large penalties
    if (analysis.estimatedPenalty > 1000000) {
      result.warnings.push('Significant penalty amounts identified in enforcement action');
    }

    // Warn about short implementation timelines
    if (analysis.implementationTimeline < 30) {
      result.warnings.push('Short implementation timeline may require urgent action');
    }

    // Warn about missing key information
    if (item.description && item.description.length < 100) {
      result.warnings.push('Limited description available - manual review recommended');
    }

    // Warn about multiple business impact areas
    if (analysis.businessImpactAreas && analysis.businessImpactAreas.length > 2) {
      result.warnings.push('Regulation affects multiple business areas - coordinate response');
    }
  }

  /**
   * Helper methods
   */
  private extractMainSubject(title: string): string {
    // Simple extraction of main subject from title
    const subjects = ['cryptocurrency', 'digital asset', 'broker-dealer', 'investment adviser', 'fintech'];
    
    for (const subject of subjects) {
      if (title.toLowerCase().includes(subject)) {
        return subject;
      }
    }
    
    return 'financial services';
  }

  private extractKeyPoints(description: string): string[] {
    const points: string[] = [];
    const content = description.toLowerCase();
    
    // Look for key regulatory concepts
    const concepts = [
      'compliance', 'reporting', 'disclosure', 'penalty', 'fine',
      'deadline', 'effective date', 'implementation', 'requirements'
    ];
    
    for (const concept of concepts) {
      if (content.includes(concept)) {
        points.push(concept);
      }
    }
    
    return points.slice(0, 3); // Limit to top 3 points
  }

  private getPriorityWeight(priority: ActionItemPriority): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Updates service configuration
   */
  updateConfig(updates: Partial<ImpactAnalysisConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('Impact Analysis Service config updated:', this.config);
  }

  /**
   * Gets current configuration
   */
  getConfig(): ImpactAnalysisConfig {
    return { ...this.config };
  }

  /**
   * Performs batch analysis of multiple regulations
   */
  async analyzeBatch(items: RSSItem[]): Promise<ImpactAnalysisResult[]> {
    const results: ImpactAnalysisResult[] = [];
    
    for (const item of items) {
      try {
        const result = await this.analyzeRegulation(item);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          errors: [`Batch analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          processingTime: 0
        });
      }
    }
    
    return results;
  }

  /**
   * Gets analysis statistics
   */
  getAnalysisStatistics(results: ImpactAnalysisResult[]): {
    totalAnalyzed: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageProcessingTime: number;
    severityDistribution: Record<string, number>;
    typeDistribution: Record<RegulationType, number>;
  } {
    const successful = results.filter(r => r.success);
    const severityDistribution: Record<string, number> = {};
    const typeDistribution: Record<RegulationType, number> = {
      'enforcement': 0,
      'final-rule': 0,
      'proposed-rule': 0
    };

    successful.forEach(result => {
      if (result.analysis) {
        const severity = result.analysis.severityScore;
        const severityRange = severity >= 8 ? 'High (8-10)' : 
                             severity >= 5 ? 'Medium (5-7)' : 'Low (1-4)';
        severityDistribution[severityRange] = (severityDistribution[severityRange] || 0) + 1;
        typeDistribution[result.analysis.regulationType]++;
      }
    });

    return {
      totalAnalyzed: results.length,
      successfulAnalyses: successful.length,
      failedAnalyses: results.length - successful.length,
      averageProcessingTime: results.length > 0 ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length : 0,
      severityDistribution,
      typeDistribution
    };
  }
}

// Export singleton instance
export const impactAnalysisService = new ImpactAnalysisService();

// Export types and classes
export { ImpactAnalysisService, ImpactAnalysisError };
export type { ImpactAnalysisConfig, ImpactAnalysisResult };