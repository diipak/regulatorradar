/**
 * Regulation Processing Service
 * 
 * Integrates RSS monitoring with impact analysis to provide
 * end-to-end regulation processing pipeline
 */

import { rssService } from './rssService';
import { impactAnalysisService } from './impactAnalysisService';
import { storage } from '../utils/storage';
import type { 
  RSSItem, 
  RegulationAnalysis, 
  StoredRegulation
} from '../types';
import type { ImpactAnalysisResult } from './impactAnalysisService';

/**
 * Processing pipeline result
 */
export interface ProcessingPipelineResult {
  success: boolean;
  processedCount: number;
  newRegulations: StoredRegulation[];
  errors: string[];
  warnings: string[];
  processingTime: number;
  rssResults: any[];
  analysisResults: ImpactAnalysisResult[];
}

/**
 * Processing configuration
 */
export interface ProcessingConfig {
  enableImpactAnalysis: boolean;
  enableStorage: boolean;
  severityThreshold: number; // Only process regulations above this severity
  maxProcessingTime: number; // Max time in milliseconds
}

/**
 * Regulation Processing Service
 * 
 * Orchestrates the complete regulation processing pipeline:
 * 1. Fetch RSS feeds
 * 2. Analyze impact for new regulations
 * 3. Store processed regulations
 * 4. Return results for notification/display
 */
class RegulationProcessingService {
  private config: ProcessingConfig;

  constructor(config?: Partial<ProcessingConfig>) {
    this.config = {
      enableImpactAnalysis: true,
      enableStorage: true,
      severityThreshold: 1, // Process all regulations by default
      maxProcessingTime: 300000, // 5 minutes max
      ...config
    };
  }

  /**
   * Runs the complete regulation processing pipeline
   */
  async processRegulations(): Promise<ProcessingPipelineResult> {
    const startTime = Date.now();
    const result: ProcessingPipelineResult = {
      success: false,
      processedCount: 0,
      newRegulations: [],
      errors: [],
      warnings: [],
      processingTime: 0,
      rssResults: [],
      analysisResults: []
    };

    try {
      console.log('🚀 Starting regulation processing pipeline...');

      // Step 1: Fetch RSS feeds
      console.log('📡 Fetching RSS feeds...');
      const rssResults = await rssService.fetchAllFeeds();
      result.rssResults = rssResults;

      // Collect all new RSS items
      const allNewItems: RSSItem[] = [];
      rssResults.forEach(feedResult => {
        if (feedResult.success) {
          allNewItems.push(...feedResult.items);
        } else {
          result.errors.push(...feedResult.errors);
        }
      });

      console.log(`📋 Found ${allNewItems.length} new regulations to process`);

      if (allNewItems.length === 0) {
        result.success = true;
        result.processingTime = Date.now() - startTime;
        console.log('✅ No new regulations to process');
        return result;
      }

      // Step 2: Analyze impact for each regulation
      if (this.config.enableImpactAnalysis) {
        console.log('🔍 Analyzing regulation impacts...');
        
        const analysisResults = await impactAnalysisService.analyzeBatch(allNewItems);
        result.analysisResults = analysisResults;

        // Process successful analyses
        for (let i = 0; i < analysisResults.length; i++) {
          const analysisResult = analysisResults[i];
          const originalItem = allNewItems[i];

          if (analysisResult.success && analysisResult.analysis) {
            const analysis = analysisResult.analysis;

            // Check severity threshold
            if (analysis.severityScore >= this.config.severityThreshold) {
              // Create stored regulation
              const storedRegulation: StoredRegulation = {
                id: analysis.id,
                title: analysis.title,
                originalData: originalItem,
                analysis: analysis,
                createdAt: new Date(),
                updatedAt: new Date(),
                notificationsSent: []
              };

              result.newRegulations.push(storedRegulation);
              result.processedCount++;

              // Store in localStorage if enabled
              if (this.config.enableStorage) {
                try {
                  storage.addRegulation(storedRegulation);
                } catch (error) {
                  const errorMsg = `Failed to store regulation ${analysis.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                  result.errors.push(errorMsg);
                  console.warn(errorMsg);
                }
              }
            } else {
              result.warnings.push(`Regulation "${analysis.title}" below severity threshold (${analysis.severityScore} < ${this.config.severityThreshold})`);
            }
          } else {
            result.errors.push(...analysisResult.errors);
            console.warn(`Failed to analyze regulation: ${originalItem.title}`);
          }

          // Check processing time limit
          if (Date.now() - startTime > this.config.maxProcessingTime) {
            result.warnings.push('Processing time limit reached - some regulations may not have been processed');
            break;
          }
        }
      } else {
        // If impact analysis is disabled, just store raw RSS items
        console.log('⚠️  Impact analysis disabled - storing raw RSS items');
        
        for (const item of allNewItems) {
          const basicAnalysis: RegulationAnalysis = {
            id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            severityScore: 5, // Default medium severity
            regulationType: 'proposed-rule', // Default type
            businessImpactAreas: ['Operations'],
            estimatedPenalty: 0,
            implementationTimeline: 90,
            plainEnglishSummary: `Regulation: ${item.title}. Please review the full details.`,
            actionItems: [],
            originalUrl: item.link,
            processedDate: new Date()
          };

          const storedRegulation: StoredRegulation = {
            id: basicAnalysis.id,
            title: basicAnalysis.title,
            originalData: item,
            analysis: basicAnalysis,
            createdAt: new Date(),
            updatedAt: new Date(),
            notificationsSent: []
          };

          result.newRegulations.push(storedRegulation);
          result.processedCount++;

          if (this.config.enableStorage) {
            storage.addRegulation(storedRegulation);
          }
        }
      }

      result.success = true;
      result.processingTime = Date.now() - startTime;

      console.log(`✅ Processing complete: ${result.processedCount} regulations processed in ${result.processingTime}ms`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️  ${result.errors.length} errors occurred during processing`);
      }
      
      if (result.warnings.length > 0) {
        console.log(`ℹ️  ${result.warnings.length} warnings generated`);
      }

    } catch (error) {
      const errorMsg = `Pipeline processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      result.processingTime = Date.now() - startTime;
      console.error(errorMsg, error);
    }

    return result;
  }

  /**
   * Gets high-priority regulations that need immediate attention
   */
  getHighPriorityRegulations(minSeverity: number = 8): StoredRegulation[] {
    const allRegulations = storage.getRegulations();
    return allRegulations
      .filter(reg => reg.analysis.severityScore >= minSeverity)
      .sort((a, b) => b.analysis.severityScore - a.analysis.severityScore);
  }

  /**
   * Gets recent regulations within specified time period
   */
  getRecentRegulations(hoursBack: number = 24): StoredRegulation[] {
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    const allRegulations = storage.getRegulations();
    
    return allRegulations
      .filter(reg => reg.createdAt >= cutoffTime)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Gets processing statistics
   */
  getProcessingStatistics(): {
    totalRegulations: number;
    regulationsByType: Record<string, number>;
    regulationsBySeverity: Record<string, number>;
    averageSeverity: number;
    lastProcessingTime?: Date;
  } {
    const allRegulations = storage.getRegulations();
    const systemState = storage.getSystemState();

    const regulationsByType: Record<string, number> = {};
    const regulationsBySeverity: Record<string, number> = {};
    let totalSeverity = 0;

    allRegulations.forEach(reg => {
      // Count by type
      regulationsByType[reg.analysis.regulationType] = 
        (regulationsByType[reg.analysis.regulationType] || 0) + 1;

      // Count by severity range
      const severity = reg.analysis.severityScore;
      const severityRange = severity >= 8 ? 'High (8-10)' : 
                           severity >= 5 ? 'Medium (5-7)' : 'Low (1-4)';
      regulationsBySeverity[severityRange] = 
        (regulationsBySeverity[severityRange] || 0) + 1;

      totalSeverity += severity;
    });

    return {
      totalRegulations: allRegulations.length,
      regulationsByType,
      regulationsBySeverity,
      averageSeverity: allRegulations.length > 0 ? totalSeverity / allRegulations.length : 0,
      lastProcessingTime: systemState.lastRSSCheck
    };
  }

  /**
   * Updates processing configuration
   */
  updateConfig(updates: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('Regulation processing config updated:', this.config);
  }

  /**
   * Gets current configuration
   */
  getConfig(): ProcessingConfig {
    return { ...this.config };
  }

  /**
   * Clears old regulations to manage storage space
   */
  cleanupOldRegulations(daysToKeep: number = 30): number {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    const allRegulations = storage.getRegulations();
    
    const regulationsToKeep = allRegulations.filter(reg => 
      reg.createdAt >= cutoffDate
    );
    
    const removedCount = allRegulations.length - regulationsToKeep.length;
    
    if (removedCount > 0) {
      // Update storage with filtered regulations
      storage.setRegulations(regulationsToKeep);
      console.log(`🧹 Cleaned up ${removedCount} old regulations (older than ${daysToKeep} days)`);
    }
    
    return removedCount;
  }

  /**
   * Tests the complete processing pipeline with sample data
   */
  async testPipeline(): Promise<ProcessingPipelineResult> {
    console.log('🧪 Testing regulation processing pipeline...');
    
    // Temporarily disable storage for testing
    const originalConfig = { ...this.config };
    this.updateConfig({ enableStorage: false });
    
    try {
      const result = await this.processRegulations();
      console.log('🧪 Pipeline test completed:', {
        success: result.success,
        processed: result.processedCount,
        errors: result.errors.length,
        warnings: result.warnings.length,
        time: result.processingTime
      });
      
      return result;
    } finally {
      // Restore original configuration
      this.updateConfig(originalConfig);
    }
  }
}

// Export singleton instance
export const regulationProcessingService = new RegulationProcessingService();

// Export class and types
export { RegulationProcessingService };