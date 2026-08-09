// Admin Job Runner - Main Entry Point
// Dispatches to registered jobs via _shared/job-runner.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, handleOptions, withLogging, Logger } from '../_shared/logger.ts';
import { JobRegistry, JobResult } from './job-runner.ts';

// Import all job definitions to register them
import './deploy/functions.ts';
import './backup/database.ts';
import './cleanup/data.ts';
import './migrate/run.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MANAGEMENT_API = Deno.env.get('SUPABASE_MANAGEMENT_API') || 'https://api.supabase.com';

interface JobRequest {
  job: string;
  params?: Record<string, unknown>;
  async?: boolean;
}

async function handler(req: Request, logger: Logger): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return corsResponse({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return corsResponse({ error: 'unauthorized' }, 401);
  }

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify admin
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return corsResponse({ error: 'unauthorized' }, 401);
  }

  const adminClient = createClient(SUPABASE_URL!, SERVICE_KEY!);
  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) {
    return corsResponse({ error: 'forbidden: admin required' }, 403);
  }

  logger.setAdminId(user.id);

  let body: JobRequest;
  try {
    body = await req.json();
  } catch {
    return corsResponse({ error: 'invalid_json' }, 400);
  }

  const jobName = body.job;
  const params = body.params || {};

  if (!jobName) {
    return corsResponse({ error: 'job name required' }, 400);
  }
  if ('accessToken' in params) {
    return corsResponse({ error: 'accessToken must be configured server-side' }, 400);
  }

  const job = JobRegistry.get(jobName);
  if (!job) {
    logger.warn(`Unknown job requested: ${jobName}`);
    return corsResponse({ error: `unknown job: ${jobName}` }, 404);
  }

  // Validate params
  if (job.validateParams) {
    const validation = job.validateParams(params);
    if (!validation.valid) {
      return corsResponse({ error: validation.error }, 400);
    }
  }

  const logParams = { ...params };
  if ('accessToken' in logParams) logParams.accessToken = '[REDACTED]';
  logger.info(`Starting job: ${jobName}`, { params: logParams });

  const startTime = Date.now();
  const ctx = {
    logger,
    params,
    admin: adminClient,
    startTime,
  };

  let result: JobResult;
  try {
    // Run with timeout
    const timeoutMs = job.timeoutMs || 5 * 60 * 1000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), timeoutMs);
    });

    const executionPromise = job.execute(ctx);
    result = await Promise.race([executionPromise, timeoutPromise]);
  } catch (error) {
    const msg = (error as Error).message;
    logger.error(`Job ${jobName} failed`, error as Error);
    result = { success: false, data: { error: msg } };
  }

  const durationMs = Date.now() - startTime;
  logger.info(`Job ${jobName} completed`, { success: result.success, durationMs });

  return corsResponse({
    job: jobName,
    success: result.success,
    data: result.data,
    duration_ms: durationMs,
  });
}

// List available jobs
async function listJobsHandler(req: Request, logger: Logger): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return corsResponse({ error: 'method_not_allowed' }, 405);

  const jobs = JobRegistry.listAll().map(j => ({
    name: j.name,
    type: j.type,
    description: j.description,
    timeout_ms: j.timeoutMs,
    required_params: j.requiredParams,
  }));

  return corsResponse({ jobs });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  if (url.pathname.endsWith('/jobs') && req.method === 'GET') {
    return withLogging('admin-job-runner:list', listJobsHandler)(req);
  }
  
  if (url.pathname.endsWith('/run') && req.method === 'POST') {
    return withLogging('admin-job-runner:run', handler)(req);
  }
  
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }
  
  return corsResponse({ error: 'not_found' }, 404);
});
