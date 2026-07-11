// Job Runner - Shared infrastructure for admin jobs

export interface JobContext {
  logger: Logger;
  params: Record<string, unknown>;
  admin: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>;
  startTime: number;
}

export interface JobResult {
  success: boolean;
  data: Record<string, unknown>;
}

export interface JobDefinition {
  name: string;
  type: string;
  description: string;
  timeoutMs?: number;
  requiredParams?: string[];
  validateParams?: (params: Record<string, unknown>) => { valid: boolean; error?: string };
  execute: (ctx: JobContext) => Promise<JobResult>;
}

// Registry for job definitions
class JobRegistryClass {
  private jobs = new Map<string, JobDefinition>();

  register(job: JobDefinition) {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job already registered: ${job.name}`);
    }
    this.jobs.set(job.name, job);
  }

  get(name: string): JobDefinition | undefined {
    return this.jobs.get(name);
  }

  listAll(): JobDefinition[] {
    return Array.from(this.jobs.values());
  }
}

export const JobRegistry = new JobRegistryClass();

export function registerJob(job: JobDefinition) {
  JobRegistry.register(job);
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number; retryable?: (error: Error) => boolean } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000, retryable } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      if (retryable && !retryable(lastError)) {
        throw lastError;
      }
      
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      await new Promise(r => setTimeout(r, delay));
    }
    
    throw lastError;
  }
}

// Logger interface (minimal - real logger is in _shared/logger.ts)
export interface Logger {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
  setUserId(userId: string): this;
  setAdminId(adminId: string): this;
}