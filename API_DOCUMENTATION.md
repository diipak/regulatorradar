# 📚 RegulatorRadar API Documentation

## Overview

RegulatorRadar provides a comprehensive set of services and components for regulatory monitoring and compliance management. This document outlines the key interfaces, types, and usage patterns.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │    Services     │    │     Utils       │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • RSS Service   │◄──►│ • Storage       │
│ • Header        │    │ • Email Service │    │ • Validation    │
│ • Layout        │    │ • Impact Anal.  │    │ • Mock Data     │
│ • ErrorBoundary │    │ • Translation   │    │ • Retry Logic   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Core Types

### RSSItem
```typescript
interface RSSItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  guid: string;
}
```

### RegulationAnalysis
```typescript
interface RegulationAnalysis {
  id: string;
  title: string;
  severityScore: number;           // 1-10 scale
  regulationType: 'enforcement' | 'final-rule' | 'proposed-rule';
  businessImpactAreas: string[];
  estimatedPenalty: number;
  implementationTimeline: number;  // days
  plainEnglishSummary: string;
  actionItems: ActionItem[];
  originalUrl: string;
  processedDate: Date;
}
```

### ActionItem
```typescript
interface ActionItem {
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  deadline?: Date;
  category: 'legal' | 'technical' | 'operational';
  completed: boolean;
}
```

### Subscriber
```typescript
interface Subscriber {
  email: string;
  subscribedAt: Date;
  preferences: {
    immediateAlerts: boolean;
    dailyDigest: boolean;
    severityThreshold: number;
  };
  unsubscribeToken: string;
}
```

## 🔧 Services API

### RSS Service

#### `fetchRSSFeed(url: string): Promise<RSSItem[]>`
Fetches and parses RSS feed from SEC or other regulatory sources.

```typescript
import { fetchRSSFeed } from './services/rssService';

const items = await fetchRSSFeed('https://www.sec.gov/rss/news/press-release.xml');
```

#### `filterFintechRelevant(items: RSSItem[]): RSSItem[]`
Filters RSS items for fintech-relevant content using keyword matching.

```typescript
const relevantItems = filterFintechRelevant(allItems);
```

#### `startMonitoring(interval: number): void`
Starts automated RSS monitoring with specified interval (in milliseconds).

```typescript
startMonitoring(4 * 60 * 60 * 1000); // 4 hours
```

### Impact Analysis Service

#### `analyzeRegulation(item: RSSItem): Promise<RegulationAnalysis>`
Performs comprehensive impact analysis on a regulation.

```typescript
import { analyzeRegulation } from './services/impactAnalysisService';

const analysis = await analyzeRegulation(rssItem);
console.log(`Severity: ${analysis.severityScore}/10`);
```

#### `calculateSeverityScore(item: RSSItem): number`
Calculates severity score based on regulation type and content.

**Scoring Algorithm:**
- **Enforcement Actions**: 8-10 (immediate business impact)
- **Final Rules**: 5-7 (compliance required)
- **Proposed Rules**: 1-4 (future planning needed)

#### `estimatePenalty(analysis: RegulationAnalysis): number`
Estimates potential penalty based on historical enforcement data.

### Email Service

#### `sendImmediateAlert(regulation: RegulationAnalysis, subscriber: Subscriber): Promise<void>`
Sends immediate email alert for high-severity regulations.

```typescript
import { sendImmediateAlert } from './services/emailService';

await sendImmediateAlert(analysis, subscriber);
```

#### `sendDailyDigest(regulations: RegulationAnalysis[], subscriber: Subscriber): Promise<void>`
Sends daily digest email with summary of all regulations.

#### `validateEmail(email: string): boolean`
Validates email address format.

### Translation Service

#### `translateToPlainEnglish(regulation: RSSItem): Promise<string>`
Converts complex legal text to business-friendly language.

```typescript
import { translateToPlainEnglish } from './services/translationService';

const summary = await translateToPlainEnglish(rssItem);
```

#### `extractActionItems(regulation: RSSItem): ActionItem[]`
Extracts specific action items from regulation text.

#### `estimateComplianceTimeline(regulation: RSSItem): number`
Estimates days needed for compliance implementation.

## 🧩 Components API

### Dashboard Component

```typescript
interface DashboardProps {
  regulations?: StoredRegulation[];
  onRegulationSelect?: (regulation: StoredRegulation) => void;
  className?: string;
}

<Dashboard 
  regulations={regulations}
  onRegulationSelect={handleSelect}
  className="custom-dashboard"
/>
```

### Header Component

```typescript
interface HeaderProps {
  title?: string;
  showLiveIndicator?: boolean;
  className?: string;
}

<Header 
  title="RegulatorRadar"
  showLiveIndicator={true}
  className="custom-header"
/>
```

### ErrorBoundary Component

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error}>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

<ErrorBoundary 
  fallback={CustomErrorComponent}
  onError={handleError}
>
  <YourComponent />
</ErrorBoundary>
```

### LoadingSpinner Component

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

<LoadingSpinner 
  size="lg"
  text="Analyzing regulations..."
  className="my-4"
/>
```

### Tooltip Component

```typescript
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

<Tooltip content="Click to view details" position="top">
  <button>Regulation Alert</button>
</Tooltip>
```

## 🛠️ Utilities API

### Storage Utilities

#### `storage.get<T>(key: string): T | null`
Retrieves data from localStorage with type safety.

```typescript
import { storage } from './utils/storage';

const regulations = storage.get<StoredRegulation[]>('regulations');
```

#### `storage.set<T>(key: string, value: T): void`
Stores data in localStorage with JSON serialization.

#### `storage.remove(key: string): void`
Removes item from localStorage.

#### `storage.clear(): void`
Clears all localStorage data.

### Validation Utilities

#### `validateEmail(email: string): boolean`
Validates email address format using RFC 5322 regex.

#### `validateRegulation(regulation: any): regulation is RegulationAnalysis`
Type guard for regulation objects.

#### `sanitizeInput(input: string): string`
Sanitizes user input to prevent XSS attacks.

### Retry Logic

#### `withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>`
Wraps async functions with retry logic and exponential backoff.

```typescript
import { withRetry } from './utils/retryLogic';

const data = await withRetry(
  () => fetchRSSFeed(url),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

#### `RetryOptions`
```typescript
interface RetryOptions {
  maxAttempts?: number;     // Default: 3
  baseDelay?: number;       // Default: 1000ms
  maxDelay?: number;        // Default: 10000ms
  backoffFactor?: number;   // Default: 2
  jitter?: boolean;         // Default: true
}
```

## 🎨 Styling API

### CSS Classes

#### Animation Classes
```css
.animate-fade-in          /* Fade in animation */
.animate-slide-in-left    /* Slide from left */
.animate-slide-in-right   /* Slide from right */
.animate-pulse-glow       /* Pulsing glow effect */
```

#### Utility Classes
```css
.transition-smooth        /* Smooth transitions */
.hover-lift              /* Hover lift effect */
.focus-visible:focus     /* Accessible focus styles */
.skeleton                /* Loading skeleton */
```

#### Severity Colors
```css
.severity-high           /* Red - Critical alerts */
.severity-medium         /* Yellow - Medium priority */
.severity-low            /* Green - Low priority */
```

## 🔌 Integration Examples

### Custom RSS Source

```typescript
// Add new RSS source
const customSource = {
  url: 'https://example.gov/rss/feed.xml',
  name: 'Custom Regulatory Feed',
  keywords: ['custom', 'regulation', 'compliance']
};

// Monitor custom source
const items = await fetchRSSFeed(customSource.url);
const filtered = filterFintechRelevant(items);
```

### Custom Email Templates

```typescript
// Override email template
const customTemplate = {
  subject: "🚨 Custom Alert: {{regulation_title}}",
  body: `
    <h1>Custom Regulatory Alert</h1>
    <p>{{plain_english_summary}}</p>
    <div>{{action_items}}</div>
  `
};

// Use in email service
await sendCustomAlert(regulation, subscriber, customTemplate);
```

### Custom Severity Scoring

```typescript
// Override severity calculation
const customSeverityCalculator = (item: RSSItem): number => {
  // Custom scoring logic
  if (item.title.includes('URGENT')) return 10;
  if (item.title.includes('Final Rule')) return 7;
  return 3;
};

// Use in analysis
const analysis = await analyzeRegulation(item, {
  severityCalculator: customSeverityCalculator
});
```

## 🧪 Testing API

### Mock Data

```typescript
import { 
  mockRSSItems, 
  mockRegulationAnalyses, 
  mockSubscribers,
  loadMockData 
} from './utils/mockData';

// Load demo data
loadMockData();

// Use in tests
const testRegulation = mockRegulationAnalyses[0];
```

### Test Utilities

```typescript
// Test helper functions
import { 
  createMockRegulation,
  createMockSubscriber,
  simulateRSSFeed 
} from './utils/testHelpers';

const mockReg = createMockRegulation({
  severityScore: 9,
  regulationType: 'enforcement'
});
```

## 🚀 Performance Optimization

### Bundle Splitting
The application uses automatic code splitting:

- **Vendor chunk**: React, React DOM
- **Router chunk**: React Router
- **Main chunk**: Application code

### Lazy Loading
```typescript
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Subscribe = lazy(() => import('./pages/Subscribe'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Caching Strategy
- **RSS feeds**: 4-hour cache
- **Analysis results**: 24-hour cache
- **Static assets**: Browser cache with versioning

## 🔒 Security Considerations

### Input Sanitization
All user inputs are sanitized to prevent XSS attacks.

### CORS Handling
RSS feeds are accessed through CORS proxy services.

### Data Privacy
- No sensitive data stored in localStorage
- Email addresses encrypted in transit
- Unsubscribe tokens for privacy compliance

## 📊 Monitoring & Analytics

### Error Tracking
```typescript
// Custom error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});
```

### Performance Metrics
```typescript
// Performance monitoring
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Performance:', entry);
  });
});
observer.observe({ entryTypes: ['navigation', 'paint'] });
```

## 🤝 Contributing

### Adding New Services

1. Create service file in `src/services/`
2. Export main functions and types
3. Add tests in `src/services/__tests__/`
4. Update this documentation

### Adding New Components

1. Create component in `src/components/`
2. Follow TypeScript interface patterns
3. Add Storybook stories (if applicable)
4. Update component documentation

---

*For more examples and advanced usage, see the [GitHub repository](https://github.com/diipak/regulatorradar) and [live demo](https://diipak.github.io/regulatorradar/).*