/**
 * Example demonstrating the Impact Analysis Engine integration
 * This shows how to use the impact analysis service with RSS data
 */

import { impactAnalysisService } from '../services/impactAnalysisService';
import type { RSSItem } from '../types';

// Example RSS items for demonstration
const sampleRSSItems: RSSItem[] = [
  {
    title: 'SEC Charges Cryptocurrency Exchange with Unregistered Securities Offerings',
    link: 'https://www.sec.gov/news/press-release/2024-001',
    pubDate: new Date('2024-01-15T10:00:00Z'),
    description: 'The SEC has charged a major cryptocurrency exchange with offering unregistered securities and failing to register as a broker-dealer. The company agreed to pay a $50 million penalty and implement comprehensive compliance measures.',
    guid: 'sec-2024-001-crypto-enforcement'
  },
  {
    title: 'SEC Adopts Final Rules on Cybersecurity Risk Management for Investment Advisers',
    link: 'https://www.sec.gov/news/press-release/2024-002',
    pubDate: new Date('2024-01-20T14:30:00Z'),
    description: 'The SEC has adopted final rules requiring registered investment advisers to implement comprehensive cybersecurity policies and procedures. The rules become effective 60 days after publication and require compliance within 12 months.',
    guid: 'sec-2024-002-cybersecurity-final-rule'
  },
  {
    title: 'SEC Proposes Enhanced Disclosure Requirements for Digital Asset Activities',
    link: 'https://www.sec.gov/news/press-release/2024-003',
    pubDate: new Date('2024-01-25T09:15:00Z'),
    description: 'The SEC is proposing new rules that would require public companies to disclose their digital asset activities, including custody arrangements and risk management practices. The comment period is open for 60 days.',
    guid: 'sec-2024-003-digital-asset-proposed-rule'
  }
];

/**
 * Demonstrates basic impact analysis functionality
 */
async function demonstrateBasicAnalysis() {
  console.log('=== Impact Analysis Engine Demo ===\n');

  for (const item of sampleRSSItems) {
    console.log(`Analyzing: ${item.title}`);
    console.log(`Published: ${item.pubDate.toLocaleDateString()}`);
    console.log(`URL: ${item.link}\n`);

    try {
      const result = await impactAnalysisService.analyzeRegulation(item);

      if (result.success && result.analysis) {
        const analysis = result.analysis;
        
        console.log(`✅ Analysis completed in ${result.processingTime}ms`);
        console.log(`📊 Severity Score: ${analysis.severityScore}/10 (${getSeverityLabel(analysis.severityScore)})`);
        console.log(`📋 Type: ${analysis.regulationType}`);
        console.log(`🏢 Business Impact Areas: ${analysis.businessImpactAreas.join(', ')}`);
        console.log(`💰 Estimated Penalty: $${analysis.estimatedPenalty.toLocaleString()}`);
        console.log(`⏱️  Implementation Timeline: ${analysis.implementationTimeline} days`);
        
        console.log(`\n📝 Plain English Summary:`);
        console.log(`${analysis.plainEnglishSummary}\n`);
        
        console.log(`✅ Action Items (${analysis.actionItems.length}):`);
        analysis.actionItems.forEach((item, index) => {
          const priorityIcon = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
          console.log(`  ${index + 1}. ${priorityIcon} ${item.description}`);
          console.log(`     Category: ${item.category} | Est. Hours: ${item.estimatedHours} | Priority: ${item.priority}`);
        });

        if (result.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          result.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
      } else {
        console.log(`❌ Analysis failed:`);
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
    } catch (error) {
      console.log(`💥 Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

/**
 * Demonstrates batch analysis functionality
 */
async function demonstrateBatchAnalysis() {
  console.log('=== Batch Analysis Demo ===\n');

  try {
    const results = await impactAnalysisService.analyzeBatch(sampleRSSItems);
    const stats = impactAnalysisService.getAnalysisStatistics(results);

    console.log(`📊 Batch Analysis Statistics:`);
    console.log(`  Total Analyzed: ${stats.totalAnalyzed}`);
    console.log(`  Successful: ${stats.successfulAnalyses}`);
    console.log(`  Failed: ${stats.failedAnalyses}`);
    console.log(`  Average Processing Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
    
    console.log(`\n📈 Severity Distribution:`);
    Object.entries(stats.severityDistribution).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} regulations`);
    });
    
    console.log(`\n📋 Type Distribution:`);
    Object.entries(stats.typeDistribution).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} regulations`);
    });

    // Show high-priority regulations
    const highSeverityResults = results.filter(r => 
      r.success && r.analysis && r.analysis.severityScore >= 8
    );

    if (highSeverityResults.length > 0) {
      console.log(`\n🚨 High Severity Regulations (Score ≥ 8):`);
      highSeverityResults.forEach(result => {
        if (result.analysis) {
          console.log(`  - ${result.analysis.title} (Score: ${result.analysis.severityScore})`);
        }
      });
    }

  } catch (error) {
    console.log(`💥 Batch analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Demonstrates configuration options
 */
async function demonstrateConfiguration() {
  console.log('=== Configuration Demo ===\n');

  // Show current configuration
  const currentConfig = impactAnalysisService.getConfig();
  console.log('📋 Current Configuration:');
  console.log(JSON.stringify(currentConfig, null, 2));

  // Test with different configurations
  console.log('\n🔧 Testing with Action Items Disabled:');
  impactAnalysisService.updateConfig({ enableActionItemGeneration: false });

  const result = await impactAnalysisService.analyzeRegulation(sampleRSSItems[0]);
  if (result.success && result.analysis) {
    console.log(`Action Items Generated: ${result.analysis.actionItems.length}`);
  }

  // Reset configuration
  impactAnalysisService.updateConfig({ enableActionItemGeneration: true });
  console.log('\n✅ Configuration reset to defaults');

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Helper function to get severity label
 */
function getSeverityLabel(score: number): string {
  if (score >= 8) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

/**
 * Main demonstration function
 */
export async function runImpactAnalysisDemo() {
  try {
    await demonstrateBasicAnalysis();
    await demonstrateBatchAnalysis();
    await demonstrateConfiguration();
    
    console.log('🎉 Impact Analysis Engine Demo Complete!');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export for use in other modules
export { sampleRSSItems, demonstrateBasicAnalysis, demonstrateBatchAnalysis, demonstrateConfiguration };

// Run demo if this file is executed directly
// Note: This check is for Node.js environments
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runImpactAnalysisDemo();
// }