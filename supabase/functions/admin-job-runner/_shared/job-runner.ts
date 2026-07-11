// Shared job runner infrastructure
// Provides a reusable framework for administrative jobs with:
// - Structured logging
// - Error handling with retries
// - Progress tracking
// - Result serialization
// - Timeout enforcement

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Logger, withLogging, corsResponse, handleOptions, CORS_HEADERS } from './logger.ts';

export interface JobContext {
  jobId: string;
  jobType: string;
  startedAt: string;
  params: Record<string, unknown>;
  logger: Logger;
  supabase: ReturnType<typeof createClient>;
  admin: ReturnType<typeof createClient>;
}

export interface JobResult<T = unknown> {
  success: boolean;
  jobId: string;
  jobType: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  progress?: number;
}

export interface JobDefinition<TParams = unknown, TResult = unknown> {
  name: string;
  type: string;
  description: string;
  timeoutMs: number;
  requiredParams: string[];
  execute: (ctx: JobContext) => Promise<JobResult<TResult>>;
  validateParams?: (params: Record<string, unknown>) => { valid: boolean; error?: string };
}

const JOB_REGISTRY = new Map<string, JobDefinition>();

export function registerJob<TParams, TResult>(def: JobDefinition<TParams, TResult>): void {
  if (JOB_REGISTRY.has(def.type)) {
    throw new Error(`Job type already registered: ${def.type}`);
  }
  JOB_REGISTRY.set(def.type, def);
}

export function getJob(type: string): JobDefinition | undefined {
  return JOB_REGISTRY.get(type);
}

export function listJobs(): Array<{ type: string; name: string; description: string }> {
  return Array.from(JOB_REGISTRY.values()).map(j => ({
    type: j.type,
    name: j.name,
    description: j.description,
  }));
}

// Retry helper with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryable?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryable = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !retryable(error)) {
        throw error;
      }
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      if (onRetry) onRetry(attempt, error);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// Timeout wrapper
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError = new Error('Job timeout')
): Promise<T> {
  let timeoutId: number;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Create Supabase clients
export function createClients() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const admin = createClient(supabaseUrl, serviceKey);

  return { supabase, admin };
}

// Main job handler
export async function handleJobRequest(
  req: Request,
  logger: Logger
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return corsResponse({ error: 'method_not_allowed' }, 405);
  }

  const startTime = performance.now();
  const jobId = crypto.randomUUID();

  try {
    const body = await req.json();
    const { jobType, params = {} } = body;

    if (!jobType) {
      return corsResponse({ error: 'jobType required' }, 400);
    }

    const jobDef = getJob(jobType);
    if (!jobDef) {
      return corsResponse({ error: `Unknown job type: ${jobType}` }, 404);
    }

    // Validate params
    if (jobDef.validateParams) {
      const validation = jobDef.validateParams(params);
      if (!validation.valid) {
        return corsResponse({ error: validation.error }, 400);
      }
    }

    // Check required params
    for (const reqParam of jobDef.requiredParams) {
      if (!(reqParam in params)) {
        return corsResponse({ error: `Missing required parameter: ${reqParam}` }, 400);
      }
    }

    logger.info('Job started', { jobId, jobType: jobDef.type, params });

    const { supabase, admin } = createClients();

    const ctx: JobContext = {
      jobId,
      jobType: jobDef.type,
      startedAt: new Date().toISOString(),
      params,
      logger,
      supabase,
      admin,
    };

    // Execute with timeout
    const result = await withTimeout(
      jobDef.execute(ctx),
      jobDef.timeoutMs,
      new Error(`Job ${jobDef.type} timed out after ${jobDef.timeoutMs}ms`)
    );

    const completedAt = new Date().toISOString();
    const durationMs = Math.round(performance.now() - startTime);

    const finalResult: JobResult = {
      ...result,
      jobId,
      jobType: jobDef.type,
      startedAt: ctx.startedAt,
      completedAt,
      durationMs,
    };

    logger.info('Job completed', {
      jobId,
      jobType: jobDef.type,
      success: result.success,
      durationMs,
    });

    return corsResponse(finalResult, result.success ? 200 : 400);
  } catch (error) {
    const completedAt = new Date().toISOString();
    const durationMs = Math.round(performance.now() - startTime);

    logger.error('Job failed', error as Error, { jobId, durationMs });

    const errorResult: JobResult = {
      success: false,
      jobId,
      jobType: 'unknown',
      startedAt: new Date(Date.now() - durationMs).toISOString(),
      completedAt,
      durationMs,
      error: {
        code: (error as Error).name || 'JOB_ERROR',
        message: (error as Error).message || String(error),
        retryable: false,
      },
    };

    return corsResponse(errorResult, 500);
  }
}

// Health check for job runner
export async function handleJobRunnerHealth(): Promise<Response> {
  const { supabase, admin } = createClients();
  
  const [db, stripe, auth] = await Promise.all([
    (async () => {
      try {
        const { error } = await admin.from('company_profiles').select('user_id').limit(1);
        return !error;
      } catch { return false; }
    })(),
    (async () => {
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) return false;
        const Stripe = (await import('https://esm.sh/stripe@17.7.0?target=denonext')).default;
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
        await stripe.customers.list({ limit: 1 });
        return true;
      } catch { return false; }
    })(),
    (async () => {
      try {
        const { error } = await admin.auth.admin.listUsers({ perPage: 1 });
        return !error;
      } catch { return false; }
    })(),
  ]);

  const healthy = db && stripe && auth;
  return corsResponse({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    function_name: 'admin-job-runner',
    checks: { database: db, stripe, supabase: auth },
  }, healthy ? 200 : 503);
}