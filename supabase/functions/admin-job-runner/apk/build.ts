// Job: APK Build
// Triggers GitHub Actions workflow to build Android APK for a client
// Replaces the old triggerApkBuild in sync.js

import { JobDefinition, JobContext, JobResult, withRetry } from '../job-runner.ts';

const GH_REPO = Deno.env.get('GH_REPO') || 'AsafeTork/financia';
const GH_WORKFLOW = 'build.yml';

function validateToken(token: string): boolean {
  if (!token || token.length < 10) return false;
  return token.startsWith('ghp_') || token.startsWith('github_pat_') || token.startsWith('gho_');
}

function sanitizeClientName(name: string): string {
  return String(name || 'Financia')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, 60) || 'Financia';
}

function sanitizeLogoUrl(url: string): string {
  try {
    const parsed = new URL(String(url || '').trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString().slice(0, 500);
  } catch {
    return '';
  }
}

function sanitizeColor(color: string): string {
  const cleaned = String(color || '#002f59').replace(/[^#0-9a-fA-F]/g, '');
  if (!/^#?[0-9a-fA-F]{6}$/.test(cleaned)) return '#002f59';
  return cleaned.startsWith('#') ? cleaned : '#' + cleaned;
}

export const apkBuildJob: JobDefinition = {
  name: 'APK Build',
  type: 'apk.build',
  description: 'Trigger GitHub Actions to build Android APK for client',
  timeoutMs: 5 * 60 * 1000, // 5 minutes
  requiredParams: ['clientName', 'primaryColor', 'ghToken'],
  
  validateParams: (params) => {
    if (!params.clientName || String(params.clientName).trim().length === 0) {
      return { valid: false, error: 'clientName is required' };
    }
    if (!params.ghToken || !validateToken(String(params.ghToken))) {
      return { valid: false, error: 'Invalid GitHub token' };
    }
    if (params.primaryColor && !/^#?[0-9a-fA-F]{6}$/.test(String(params.primaryColor))) {
      return { valid: false, error: 'Invalid primaryColor format' };
    }
    return { valid: true };
  },

  async execute(ctx: JobContext): Promise<JobResult> {
    const { logger, params } = ctx;
    
    const clientName = sanitizeClientName(String(params.clientName));
    const ghToken = String(params.ghToken);
    const primaryColor = sanitizeColor(String(params.primaryColor || '#002f59'));
    const logoUrl = params.logoUrl ? sanitizeLogoUrl(String(params.logoUrl)) : '';
    
    logger.info('Starting APK build', { clientName, hasLogo: !!logoUrl });

    // Rate limiting check (using ai_cache as rate limit store)
    const rateLimitKey = `apk_build:${clientName}`;
    const { error: rlError } = await ctx.admin.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_window_seconds: 300, // 5 minutes
      p_max_requests: 1,
    });
    
    if (rlError) {
      logger.warn('Rate limit check failed, proceeding anyway', { error: rlError.message });
    }

    // Trigger GitHub Actions workflow
    const result = await withRetry(
      async () => {
        const response = await fetch(
          `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${ghToken}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({
              ref: 'main',
              inputs: {
                client_name: clientName,
                logo_url: logoUrl,
                primary_color: primaryColor.replace('#', ''),
              },
            }),
          }
        );

        if (response.status === 204) {
          return { triggered: true };
        }

        const errorBody = await response.text().catch(() => 'Unknown error');
        const error = new Error(`GitHub API error: ${response.status} ${errorBody}`);
        (error as any).status = response.status;
        throw error;
      },
      {
        maxAttempts: 3,
        baseDelayMs: 2000,
        retryable: (error) => {
          const status = (error as any).status;
          return status === 403 || status === 429 || status >= 500;
        },
        onRetry: (attempt, error) => {
          logger.warn(`APK build retry ${attempt}/3`, { error: (error as Error).message });
        },
      }
    );

    // Record successful trigger in rate limit cache
    await ctx.admin.from('ai_cache').insert({
      scope: 'rate_limit',
      cache_key: rateLimitKey,
      action: 'apk_build',
      status: 200,
      expires_at: new Date(Date.now() + 300 * 1000).toISOString(),
    });

    logger.info('APK build triggered successfully', { clientName });

    return {
      success: true,
      data: {
        clientName,
        workflow: GH_WORKFLOW,
        triggered: true,
        githubRepo: GH_REPO,
      },
    };
  },
};

// Register the job
import { registerJob } from '../job-runner.ts';
registerJob(apkBuildJob);
