// Job: Backup
// Creates backups of critical database tables to Supabase Storage

import { JobDefinition, JobContext, JobResult, withRetry } from './job-runner.ts';
import { corsResponse } from './logger.ts';

const BACKUP_BUCKET = 'backups';
const MAX_BACKUP_AGE_DAYS = 30;

export const backupJob: JobDefinition = {
  name: 'Database Backup',
  type: 'backup.database',
  description: 'Create timestamped backup of critical tables to Supabase Storage',
  timeoutMs: 15 * 60 * 1000, // 15 minutes
  requiredParams: ['tables'],
  
  validateParams: (params) => {
    if (!params.tables || !Array.isArray(params.tables) || params.tables.length === 0) {
      return { valid: false, error: 'tables array required' };
    }
    return { valid: true };
  },

  async execute(ctx: JobContext): Promise<JobResult> {
    const { logger, params, admin } = ctx;
    const tables = params.tables as string[];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPrefix = `backup-${timestamp}`;

    logger.info('Starting database backup', { tables, timestamp });

    const results: Array<{ table: string; rows: number; path: string; success: boolean; error?: string }> = [];

    for (const table of params.tables) {
      logger.info(`Backing up table: ${table}`);
      
      try {
        // Fetch all data for the table
        const { data, error } = await ctx.admin
          .from(table)
          .select('*');
        
        if (params.where) {
          // Can't easily apply dynamic where clauses in this context
          // Would need to use RPC or dynamic SQL
        }

        if (!error && data) {
          // Convert to NDJSON for efficient storage
          const ndjson = data.map(row => JSON.stringify(row)).join('\n');
          
          // Upload to Supabase Storage
          const path = `${backupPrefix}/${table}.ndjson`;
          const { error: uploadError } = await ctx.admin.storage
            .from(BACKUP_BUCKET)
            .upload(path, new Blob([ndjson], { type: 'application/x-ndjson' }), {
              upsert: true,
              contentType: 'application/x-ndjson',
            });

          if (uploadError) throw uploadError;

          results.push({
            table,
            rows: data.length,
            path,
            success: true,
          });
        } else {
          results.push({ table, rows: 0, path: '', success: false, error: 'No data' });
        }
      } catch (error) {
        const msg = (error as Error).message;
        logger.error(`Backup failed for ${table}`, error as Error);
        results.push({ table, rows: 0, path: '', success: false, error: String(error) });
      }
    }

    // Cleanup old backups
    await cleanupOldBackups(ctx.admin);

    const failed = results.filter(r => !r.success);
    return {
      success: results.every(r => r.success),
      data: { results, totalTables: params.tables.length },
    };
  },
};

async function cleanupOldBackups(admin: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>) {
  const cutoffDate = new Date(Date.now() - MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  
  // List and delete old backup files
  // This is a simplified version - in practice you'd list all files and filter by date
  // Storage API doesn't have a direct "delete by prefix with date filter"
  // Would need to list all and filter client-side
  logger.info('Old backup cleanup would run here');
}

import { registerJob } from './job-runner.ts';
registerJob(backupJob);