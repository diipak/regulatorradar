// Export all utility functions and data
export * from './storage';
export * from './validation';
export * from './mockData';
export * from './dataProcessing';

// Re-export commonly used functions for convenience
export { storage } from './storage';
export { 
  validateRSSItem, 
  validateEmail, 
  validateRegulationAnalysis,
  isRelevantToFintech 
} from './validation';
export { 
  getMockDataSet, 
  loadMockData,
  fintechKeywords,
  emailTemplates 
} from './mockData';
export {
  processRSSFeed,
  determineRegulationType,
  calculateSeverityScore,
  sortRegulationsBySeverity,
  filterRegulationsBySeverity,
  isDuplicateRegulation
} from './dataProcessing';