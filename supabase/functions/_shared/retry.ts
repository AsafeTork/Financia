// Retry utilities with exponential backoff and configurable policies

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryable?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  timeoutMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryable = () => true,
    onRetry,
    timeoutMs,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (timeoutMs) {
        return await withTimeout(fn(), timeoutMs);
      }
      return await fn();
    } catch (error) {
      const err = error as Error;
      lastError = err;

      if (attempt === maxAttempts) break;
      if (!retryable(err)) throw err;

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      if (onRetry) onRetry(attempt, err);
      await new Promise(r => setTimeout(r, delay));
    }

    throw lastError;
  }

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: number;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private state: CircuitBreakerState = { failures: 0, lastFailure: 0, state: 'closed' };
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenAttempts: number;
  private halfOpenSuccesses = 0;

  constructor(failureThreshold = 5, resetTimeoutMs = 30000, halfOpenAttempts = 3) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.halfOpenAttempts = halfOpenAttempts;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() - this.state.lastFailure >= this.resetTimeoutMs) {
        this.state.state = 'half-open';
        this.halfOpenSuccesses = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state.state === 'half-open') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenAttempts) {
        this.state = { failures: 0, lastFailure: 0, state: 'closed' };
      }
    } else {
      this.state.failures = 0;
    }
  }

  private onFailure() {
    this.state.failures++;
    this.state.lastFailure = Date.now();
    if (this.state.state === 'half-open' || this.state.failures >= this.failureThreshold) {
      this.state.state = 'open';
    }
  }

  getState() { return { ...this.state }; }
  reset() { this.state = { failures: 0, lastFailure: 0, state: 'closed' }; }
}