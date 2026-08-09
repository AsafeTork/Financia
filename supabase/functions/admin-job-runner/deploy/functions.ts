// Job: Deploy
// Deploys Edge Functions to Supabase via Management API
// Uses Supabase CLI or Management API

import { JobDefinition, JobContext, JobResult, withRetry } from '../job-runner.ts';

const SUPABASE_MANAGEMENT_API = 'https://api.supabase.com/v1';

export const deployJob: JobDefinition = {
  name: 'Deploy Edge Functions',
  type: 'deploy.functions',
  description: 'Deploy Edge Functions to Supabase project',
  timeoutMs: 10 * 60 * 1000, // 10 minutes
  requiredParams: ['projectRef'],
  
  validateParams: (params) => {
    if (!params.projectRef || !String(params.projectRef).match(/^[a-z0-9]{20}$/)) {
      return { valid: false, error: 'Invalid projectRef' };
    }
    if (!Deno.env.get('SUPABASE_MANAGEMENT_API_TOKEN')) {
      return { valid: false, error: 'management API token not configured' };
    }
    return { valid: true };
  },

  async execute(ctx: JobContext): Promise<JobResult> {
    const { logger, params } = ctx;
    const projectRef = String(params.projectRef);
    const accessToken = Deno.env.get('SUPABASE_MANAGEMENT_API_TOKEN')!;
    const functions = params.functions as string[] | undefined;
    
    logger.info('Starting function deployment', { projectRef, functions });

    // Get list of functions to deploy
    let functionsToDeploy: string[];
    if (functions && functions.length > 0) {
      functionsToDeploy = functions;
    } else {
      // Auto-detect from filesystem (not available in Edge Function context)
      // Would need to be passed from CLI
      functionsToDeploy = [
        'stripe-webhook',
        'create-subscription',
        'create-payment',
        'cancel-subscription',
        'create-setup-intent',
        'get-payment-method',
        'get-subscription-status',
        'remove-payment-method',
        'set-default-payment-method',
        'stripe-config',
        'admin-create-client',
        'admin-set-custom-price',
        'admin-set-white-label',
        'admin-stripe-overview',
        'admin-job-runner',
        'ai',
        'health',
      ];
    }

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    for (const fn of functionsToDeploy) {
      logger.info(`Deploying function: ${fn}`);
      
      try {
        await withRetry(
          async () => {
            const response = await fetch(
              `${SUPABASE_MANAGEMENT_API}/projects/${projectRef}/functions/${fn}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  // Function deployment would include the function code
                  // This is a simplified version - real deployment needs the function bundle
                }),
              }
            );

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Failed to deploy ${fn}: ${error}`);
            }
          },
          { maxAttempts: 3, baseDelayMs: 5000 }
        );

        results.push({ name: fn, success: true });
      } catch (error) {
        const msg = (error as Error).message;
        logger.error(`Failed to deploy ${fn}`, error as Error);
        results.push({ name: fn, success: false, error: msg });
      }
    }

    const failed = results.filter(r => !r.success);
    return {
      success: failed.length === 0,
      data: { results, projectRef },
    };
  },
};

import { registerJob } from '../job-runner.ts';
registerJob(deployJob);
