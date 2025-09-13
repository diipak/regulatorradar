/**
 * Retry logic utilities for handling network failures and service errors
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Default retry options for different scenarios
 */
export const RETRY_PRESETS = {
  // For RSS feed fetching
  RSS_FETCH: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        error.name === 'NetworkError' ||
        error.name === 'TimeoutError' ||
        (error.status >= 500 && error.status < 600) ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'
      );
    }
  },

  // For API calls
  API_CALL: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on server errors but not client errors
      return error.status >= 500 && error.status < 600;
    }
  },

  // For email sending
  EMAIL_SEND: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on temporary failures
      return (
        error.status === 429 || // Rate limited
        error.status >= 500 ||  // Server errors
        error.name === 'NetworkError'
      );
    }
  }
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (options.retryCondition && !options.retryCondition(error)) {
        break;
      }
      
      // Don't wait after the last attempt
      if (attempt === options.maxAttempts) {
        break;
      }
      
      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await sleep(jitteredDelay);
    }
  }
  
  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: options.maxAttempts,
    totalTime: Date.now() - startTime
  };
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureThreshold: number;
  private recoveryTimeout: number;
  private monitorWindow: number;
  
  constructor(
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000, // 1 minute
    monitorWindow: number = 300000 // 5 minutes
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.monitorWindow = monitorWindow;
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
    
    // Reset failure count after monitor window
    setTimeout(() => {
      if (Date.now() - this.lastFailureTime > this.monitorWindow) {
        this.failures = 0;
      }
    }, this.monitorWindow);
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = RETRY_PRESETS.API_CALL
): Promise<Response> {
  const result = await withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, retryOptions);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

/**
 * Batch retry for multiple operations
 */
export async function batchWithRetry<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions,
  concurrency: number = 3
): Promise<Array<RetryResult<T>>> {
  const results: Array<RetryResult<T>> = [];
  
  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    const batchPromises = batch.map(op => withRetry(op, options));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Exponential backoff utility
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  multiplier: number = 2
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt - 1);
  const jitter = Math.random() * 1000; // Add up to 1s jitter
  return Math.min(delay + jitter, maxDelay);
}