import type { 
  RSSItem, 
  RegulationType, 
  BusinessImpactArea, 
  ActionItem,
  ActionItemPriority
} from '../types';

/**
 * Translation service configuration
 */
interface TranslationConfig {
  maxSummaryLength: number;
  maxActionItems: number;
  includeTimeEstimates: boolean;
  businessFocused: boolean;
}

/**
 * Compliance deadline information
 */
interface ComplianceDeadline {
  description: string;
  date?: Date;
  estimatedDate?: Date;
  priority: ActionItemPriority;
  source: string;
}

/**
 * Translation result with metadata
 */
interface TranslationResult {
  plainEnglishSummary: string;
  actionItems: ActionItem[];
  complianceDeadlines: ComplianceDeadline[];
  keyRequirements: string[];
  businessImpactSummary: string;
  confidence: number; // 0-1 score for translation quality
  processingTime: number;
}

/**
 * Plain English Translation Service
 * 
 * Converts complex regulatory language into business-friendly explanations
 * with specific action items and compliance deadlines.
 */
class TranslationService {
  private config: TranslationConfig;

  // Business-friendly term mappings
  private readonly termMappings: Record<string, string> = {
    'pursuant to': 'according to',
    'shall': 'must',
    'shall not': 'cannot',
    'shall be': 'must be',
    'shall pay': 'must pay',
    'notwithstanding': 'despite',
    'heretofore': 'previously',
    'hereinafter': 'from now on',
    'aforementioned': 'mentioned above',
    'thereunder': 'under that',
    'whereas': 'since',
    'provided that': 'as long as',
    'in accordance with': 'following',
    'with respect to': 'regarding',
    'in connection with': 'related to',
    'subject to': 'depending on',
    'compliance with': 'following',
    'violation of': 'breaking the rules of',
    'shall be mandatory': 'is required',
    'must comply': 'must follow',
    'enforcement action': 'penalty or fine',
    'cease and desist': 'stop immediately',
    'monetary penalty': 'fine',
    'civil penalty': 'fine',
    'administrative proceeding': 'regulatory investigation',
    'consent order': 'agreement to fix problems',
    'undertaking': 'promise to do something',
    'remedial action': 'steps to fix problems',
    'hereby adopts': 'has created',
    'the Commission': 'the SEC',
    'Commission': 'SEC'
  };

  // Fintech-specific keywords for context
  private readonly fintechKeywords = [
    'payment', 'digital asset', 'cryptocurrency', 'fintech', 'broker-dealer',
    'investment adviser', 'custody', 'AML', 'KYC', 'consumer protection',
    'money transmission', 'virtual currency', 'blockchain', 'DeFi',
    'robo-advisor', 'peer-to-peer', 'crowdfunding', 'alternative trading'
  ];

  // Common compliance deadline patterns
  private readonly deadlinePatterns = [
    /effective\s+(?:date|on)\s*:?\s*([^.]+)/gi,
    /compliance\s+(?:date|deadline|required\s+by)\s*:?\s*([^.]+)/gi,
    /must\s+(?:be\s+)?(?:completed|implemented|filed)\s+(?:by|before|within)\s+([^.]+)/gi,
    /deadline\s+(?:for|of)\s+([^.]+)/gi,
    /(?:within|by)\s+(\d+)\s+(days?|months?|years?)/gi,
    /no\s+later\s+than\s+([^.]+)/gi,
    /implement\s+(?:remedial\s+)?measures\s+within\s+(\d+)\s+(days?|months?|years?)/gi,
    /within\s+(\d+)\s+(days?|months?|years?)\s+(?:of|from)/gi
  ];

  constructor(config?: Partial<TranslationConfig>) {
    this.config = {
      maxSummaryLength: 500,
      maxActionItems: 8,
      includeTimeEstimates: true,
      businessFocused: true,
      ...config
    };
  }

  /**
   * Performs complete translation of regulatory content
   */
  async translateRegulation(
    item: RSSItem, 
    regulationType: RegulationType,
    businessImpactAreas: BusinessImpactArea[]
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      // Generate plain English summary
      const plainEnglishSummary = await this.generatePlainEnglishSummary(item, regulationType);

      // Extract action items
      const actionItems = await this.extractActionItems(item, regulationType, businessImpactAreas);

      // Detect compliance deadlines
      const complianceDeadlines = this.detectComplianceDeadlines(item);

      // Extract key requirements
      const keyRequirements = this.extractKeyRequirements(item);

      // Generate business impact summary
      const businessImpactSummary = this.generateBusinessImpactSummary(
        item, 
        regulationType, 
        businessImpactAreas
      );

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(item, plainEnglishSummary, actionItems);

      return {
        plainEnglishSummary,
        actionItems,
        complianceDeadlines,
        keyRequirements,
        businessImpactSummary,
        confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Translation service error:', error);
      
      // Return fallback translation
      return this.generateFallbackTranslation(item, regulationType, Date.now() - startTime);
    }
  }

  /**
   * Generates plain English summary using rule-based approach
   */
  private async generatePlainEnglishSummary(
    item: RSSItem, 
    regulationType: RegulationType
  ): Promise<string> {
    let summary = '';

    // Start with regulation type context
    const typeContext = this.getRegulationTypeContext(regulationType);
    summary += typeContext + ' ';

    // Extract and simplify the main subject
    const mainSubject = this.extractMainSubject(item.title);
    summary += `This regulation deals with ${mainSubject}. `;

    // Convert description to plain English
    const simplifiedDescription = this.convertToPlainEnglish(item.description);
    summary += simplifiedDescription + ' ';

    // Add business context
    const businessContext = this.addBusinessContext(item, regulationType);
    summary += businessContext;

    // Ensure summary doesn't exceed max length
    if (summary.length > this.config.maxSummaryLength) {
      summary = summary.substring(0, this.config.maxSummaryLength - 3) + '...';
    }

    return summary.trim();
  }

  /**
   * Extracts and formats action items
   */
  private async extractActionItems(
    item: RSSItem,
    regulationType: RegulationType,
    businessImpactAreas: BusinessImpactArea[]
  ): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];

    // Generate type-specific action items
    actionItems.push(...this.generateTypeSpecificActions(item, regulationType));

    // Generate business impact area actions
    actionItems.push(...this.generateImpactAreaActions(businessImpactAreas, regulationType));

    // Generate content-based actions
    actionItems.push(...this.generateContentBasedActions(item));

    // Add time estimates if enabled
    if (this.config.includeTimeEstimates) {
      this.addTimeEstimates(actionItems, regulationType);
    }

    // Sort by priority and limit count
    return actionItems
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
      .slice(0, this.config.maxActionItems);
  }

  /**
   * Detects compliance deadlines from regulation content
   */
  private detectComplianceDeadlines(item: RSSItem): ComplianceDeadline[] {
    const deadlines: ComplianceDeadline[] = [];
    const content = `${item.title} ${item.description}`.toLowerCase();

    // Check each deadline pattern
    for (const pattern of this.deadlinePatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        if (match[1]) {
          const deadline = this.parseDeadlineText(match[1].trim());
          if (deadline) {
            deadlines.push(deadline);
          }
        }
      }
    }

    // Remove duplicates and sort by priority
    const uniqueDeadlines = this.removeDuplicateDeadlines(deadlines);
    return uniqueDeadlines.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Extracts key requirements from regulation
   */
  private extractKeyRequirements(item: RSSItem): string[] {
    const requirements: string[] = [];
    const content = `${item.title} ${item.description}`;

    // Look for requirement indicators
    const requirementPatterns = [
      /(?:must|shall|required to|obligated to)\s+([^.]+)/gi,
      /(?:prohibition|prohibited|may not|cannot)\s+([^.]+)/gi,
      /(?:compliance with|adherence to)\s+([^.]+)/gi,
      /(?:reporting|disclosure|filing)\s+(?:requirements?|obligations?)\s+([^.]+)/gi
    ];

    for (const pattern of requirementPatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 200) {
          const requirement = this.convertToPlainEnglish(match[1].trim());
          if (requirement && !requirements.includes(requirement)) {
            requirements.push(requirement);
          }
        }
      }
    }

    return requirements.slice(0, 5); // Limit to top 5 requirements
  }

  /**
   * Generates business impact summary
   */
  private generateBusinessImpactSummary(
    item: RSSItem,
    regulationType: RegulationType,
    businessImpactAreas: BusinessImpactArea[]
  ): string {
    let summary = '';

    // Start with impact scope
    if (businessImpactAreas.length === 1) {
      summary += `This regulation primarily affects your ${businessImpactAreas[0].toLowerCase()} processes. `;
    } else if (businessImpactAreas.length > 1) {
      const areas = businessImpactAreas.map(area => area.toLowerCase()).join(', ');
      summary += `This regulation affects multiple areas of your business: ${areas}. `;
    }

    // Add urgency based on regulation type
    switch (regulationType) {
      case 'enforcement':
        summary += 'Immediate review is recommended to ensure your company is not at risk for similar violations. ';
        break;
      case 'final-rule':
        summary += 'You must update your procedures to comply with these new requirements. ';
        break;
      case 'proposed-rule':
        summary += 'While not yet final, you should begin planning for potential implementation. ';
        break;
    }

    // Add cost/resource implications
    const resourceImplications = this.estimateResourceImplications(item, businessImpactAreas);
    summary += resourceImplications;

    return summary.trim();
  }

  /**
   * Converts regulatory language to plain English
   */
  private convertToPlainEnglish(text: string): string {
    if (!text) return '';

    let converted = text;

    // Apply term mappings
    for (const [legalTerm, plainTerm] of Object.entries(this.termMappings)) {
      const regex = new RegExp(`\\b${legalTerm}\\b`, 'gi');
      converted = converted.replace(regex, plainTerm);
    }

    // Simplify sentence structure
    converted = this.simplifySentenceStructure(converted);

    // Remove excessive legal qualifiers
    converted = this.removeLegalQualifiers(converted);

    return converted.trim();
  }

  /**
   * Helper methods for translation logic
   */
  private getRegulationTypeContext(regulationType: RegulationType): string {
    switch (regulationType) {
      case 'enforcement':
        return 'The SEC has taken action against a company for violating regulations.';
      case 'final-rule':
        return 'The SEC has created new rules that companies must follow.';
      case 'proposed-rule':
        return 'The SEC is considering new rules and wants public feedback.';
      default:
        return 'The SEC has issued a regulatory update.';
    }
  }

  private extractMainSubject(title: string): string {
    const titleLower = title.toLowerCase();
    
    // Look for fintech-specific subjects
    for (const keyword of this.fintechKeywords) {
      if (titleLower.includes(keyword)) {
        return keyword.replace('-', ' ');
      }
    }

    // Look for general financial subjects
    const generalSubjects = [
      'securities', 'trading', 'investment', 'financial services',
      'disclosure', 'reporting', 'compliance', 'market'
    ];

    for (const subject of generalSubjects) {
      if (titleLower.includes(subject)) {
        return subject;
      }
    }

    return 'financial services';
  }

  private addBusinessContext(item: RSSItem, regulationType: RegulationType): string {
    let context = '';

    // Add urgency context
    if (regulationType === 'enforcement') {
      context += 'Companies should review their practices to avoid similar penalties. ';
    } else if (regulationType === 'final-rule') {
      context += 'Your company needs to update its procedures to comply. ';
    }

    // Add fintech-specific context if relevant
    const titleLower = item.title.toLowerCase();
    if (this.fintechKeywords.some(keyword => titleLower.includes(keyword))) {
      context += 'This is particularly relevant for fintech and digital asset companies. ';
    }

    return context;
  }

  private generateTypeSpecificActions(_item: RSSItem, regulationType: RegulationType): ActionItem[] {
    const actions: ActionItem[] = [];

    switch (regulationType) {
      case 'enforcement':
        actions.push(
          {
            description: 'Review your company\'s practices for similar compliance risks',
            priority: 'high',
            estimatedHours: 4,
            category: 'legal'
          },
          {
            description: 'Update risk management procedures based on this enforcement case',
            priority: 'medium',
            estimatedHours: 6,
            category: 'operational'
          }
        );
        break;

      case 'final-rule':
        actions.push(
          {
            description: 'Read the full rule text and identify specific requirements',
            priority: 'high',
            estimatedHours: 3,
            category: 'legal'
          },
          {
            description: 'Update company policies to meet new rule requirements',
            priority: 'high',
            estimatedHours: 12,
            category: 'operational'
          },
          {
            description: 'Train relevant staff on new compliance requirements',
            priority: 'medium',
            estimatedHours: 8,
            category: 'operational'
          }
        );
        break;

      case 'proposed-rule':
        actions.push(
          {
            description: 'Review proposed rule and assess potential business impact',
            priority: 'medium',
            estimatedHours: 3,
            category: 'legal'
          },
          {
            description: 'Consider submitting a comment letter during the comment period',
            priority: 'low',
            estimatedHours: 6,
            category: 'legal'
          }
        );
        break;
    }

    return actions;
  }

  private generateImpactAreaActions(areas: BusinessImpactArea[], regulationType: RegulationType): ActionItem[] {
    const actions: ActionItem[] = [];

    for (const area of areas) {
      switch (area) {
        case 'Operations':
          actions.push({
            description: `Review and update operational procedures affected by this ${regulationType.replace('-', ' ')}`,
            priority: regulationType === 'enforcement' ? 'high' : 'medium',
            estimatedHours: 8,
            category: 'operational'
          });
          break;

        case 'Reporting':
          actions.push({
            description: `Update reporting systems and procedures to meet new requirements`,
            priority: 'high',
            estimatedHours: 16,
            category: 'technical'
          });
          break;

        case 'Technology':
          actions.push({
            description: `Assess technology systems for compliance with new requirements`,
            priority: 'medium',
            estimatedHours: 12,
            category: 'technical'
          });
          break;
      }
    }

    return actions;
  }

  private generateContentBasedActions(item: RSSItem): ActionItem[] {
    const actions: ActionItem[] = [];
    const content = `${item.title} ${item.description}`.toLowerCase();

    // Look for specific compliance areas mentioned
    if (content.includes('aml') || content.includes('anti-money laundering')) {
      actions.push({
        description: 'Review and update AML compliance procedures',
        priority: 'high',
        estimatedHours: 10,
        category: 'legal'
      });
    }

    if (content.includes('kyc') || content.includes('know your customer')) {
      actions.push({
        description: 'Update customer identification and verification procedures',
        priority: 'high',
        estimatedHours: 8,
        category: 'operational'
      });
    }

    if (content.includes('disclosure') || content.includes('reporting')) {
      actions.push({
        description: 'Review disclosure and reporting obligations',
        priority: 'medium',
        estimatedHours: 4,
        category: 'legal'
      });
    }

    return actions;
  }

  private addTimeEstimates(actionItems: ActionItem[], regulationType: RegulationType): void {
    // Adjust time estimates based on regulation urgency
    const urgencyMultiplier = regulationType === 'enforcement' ? 0.8 : 
                             regulationType === 'final-rule' ? 1.0 : 1.2;

    actionItems.forEach(item => {
      item.estimatedHours = Math.round(item.estimatedHours * urgencyMultiplier);
      
      // Add deadlines for high priority items
      if (item.priority === 'high' && regulationType !== 'proposed-rule') {
        const daysToAdd = regulationType === 'enforcement' ? 14 : 30;
        item.deadline = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
      }
    });
  }

  private parseDeadlineText(text: string): ComplianceDeadline | null {
    // Try to extract date information
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+ \d{1,2}, \d{4})/);
    const timeframeMatch = text.match(/(\d+)\s+(days?|months?|years?)/);

    let date: Date | undefined;
    let estimatedDate: Date | undefined;

    if (dateMatch) {
      date = new Date(dateMatch[1]);
      if (isNaN(date.getTime())) {
        date = undefined;
      }
    }

    if (timeframeMatch && !date) {
      const amount = parseInt(timeframeMatch[1]);
      const unit = timeframeMatch[2];
      const multiplier = unit.startsWith('day') ? 1 : 
                        unit.startsWith('month') ? 30 : 365;
      estimatedDate = new Date(Date.now() + amount * multiplier * 24 * 60 * 60 * 1000);
    }

    if (!date && !estimatedDate) {
      return null;
    }

    return {
      description: this.convertToPlainEnglish(text),
      date,
      estimatedDate,
      priority: date || (estimatedDate && estimatedDate.getTime() < Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
      source: 'regulation text'
    };
  }

  private removeDuplicateDeadlines(deadlines: ComplianceDeadline[]): ComplianceDeadline[] {
    const seen = new Set<string>();
    return deadlines.filter(deadline => {
      const key = deadline.description.toLowerCase().substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private estimateResourceImplications(item: RSSItem, areas: BusinessImpactArea[]): string {
    const content = `${item.title} ${item.description}`.toLowerCase();
    let implications = '';

    // Estimate based on complexity indicators
    const complexityIndicators = ['system', 'technology', 'reporting', 'multiple', 'comprehensive'];
    const complexityScore = complexityIndicators.reduce((score, indicator) => {
      return score + (content.includes(indicator) ? 1 : 0);
    }, 0);

    if (complexityScore >= 3 || areas.length > 2) {
      implications += 'This may require significant time and resources to implement properly. ';
    } else if (complexityScore >= 1) {
      implications += 'This will require some dedicated time and effort to address. ';
    }

    // Add specific resource hints
    if (areas.includes('Technology')) {
      implications += 'Consider involving your technical team early in the planning process. ';
    }

    if (content.includes('penalty') || content.includes('fine')) {
      implications += 'Non-compliance could result in significant financial penalties. ';
    }

    return implications;
  }

  private simplifySentenceStructure(text: string): string {
    // Break up long sentences
    text = text.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    // Simplify complex clauses
    text = text.replace(/,\s*which\s+/gi, '. This ');
    text = text.replace(/,\s*that\s+/gi, '. This ');
    
    return text;
  }

  private removeLegalQualifiers(text: string): string {
    // Remove excessive qualifiers
    const qualifiers = [
      'without limitation', 'including but not limited to', 'inter alia',
      'among other things', 'as applicable', 'as appropriate'
    ];

    for (const qualifier of qualifiers) {
      const regex = new RegExp(`\\b${qualifier}\\b,?\\s*`, 'gi');
      text = text.replace(regex, '');
    }

    return text;
  }

  private calculateConfidenceScore(
    item: RSSItem, 
    summary: string, 
    actionItems: ActionItem[]
  ): number {
    let score = 0.5; // Base score

    // Increase confidence based on content quality
    if (item.description && item.description.length > 200) score += 0.1;
    if (summary.length > 100 && summary.length < 400) score += 0.1;
    if (actionItems.length >= 3) score += 0.1;
    if (actionItems.some(item => item.priority === 'high')) score += 0.1;

    // Decrease confidence for potential issues
    if (!item.title || item.title.length === 0) score -= 0.3;
    if (!item.description || item.description.length < 50) score -= 0.2;
    if (summary.includes('...')) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private generateFallbackTranslation(
    item: RSSItem, 
    regulationType: RegulationType, 
    processingTime: number
  ): TranslationResult {
    return {
      plainEnglishSummary: `The SEC has issued a ${regulationType.replace('-', ' ')}: ${item.title}. Please review the full details to understand the impact on your business.`,
      actionItems: [
        {
          description: 'Review the regulation details and assess business impact',
          priority: 'high',
          estimatedHours: 4,
          category: 'legal'
        }
      ],
      complianceDeadlines: [],
      keyRequirements: ['Review regulation for compliance requirements'],
      businessImpactSummary: 'This regulation may affect your business operations. A detailed review is recommended.',
      confidence: 0.3,
      processingTime
    };
  }

  private getPriorityWeight(priority: ActionItemPriority): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Updates service configuration
   */
  updateConfig(updates: Partial<TranslationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Gets current configuration
   */
  getConfig(): TranslationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const translationService = new TranslationService();

// Export types and classes
export { TranslationService };
export type { TranslationConfig, TranslationResult, ComplianceDeadline };