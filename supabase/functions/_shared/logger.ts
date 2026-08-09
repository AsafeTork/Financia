import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  function_name: string;
  request_id?: string;
  user_id?: string;
  admin_id?: string;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  const env = Deno.env.get('LOG_LEVEL');
  if (env && env in LOG_LEVELS) return env as LogLevel;
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLogLevel()];
}

function generateRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export class Logger {
  private functionName: string;
  private requestId: string;
  private userId?: string;
  private adminId?: string;
  private startTime: number;

  constructor(functionName: string, requestId?: string) {
    this.functionName = functionName;
    this.requestId = requestId || generateRequestId();
    this.startTime = performance.now();
  }

  setUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  setAdminId(adminId: string): this {
    this.adminId = adminId;
    return this;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      function_name: this.functionName,
      request_id: this.requestId,
      user_id: this.userId,
      admin_id: this.adminId,
      duration_ms: Math.round(performance.now() - this.startTime),
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    // Use console.log for structured output (can be piped to log aggregator)
    console.log(JSON.stringify(entry));
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata, error);
  }

  // Convenience methods for common patterns
  requestStart(method: string, path: string, metadata?: Record<string, unknown>): void {
    this.info('Request started', { method, path, ...metadata });
  }

  requestEnd(status: number, metadata?: Record<string, unknown>): void {
    this.info('Request completed', { status, ...metadata });
  }

  rpcStart(rpcName: string, params?: Record<string, unknown>): void {
    this.debug(`RPC call: ${rpcName}`, { params });
  }

  rpcEnd(rpcName: string, success: boolean, metadata?: Record<string, unknown>): void {
    if (success) {
      this.debug(`RPC completed: ${rpcName}`, metadata);
    } else {
      this.warn(`RPC failed: ${rpcName}`, metadata);
    }
  }

  dbQuery(query: string, durationMs: number): void {
    this.debug('Database query', { query, duration_ms: durationMs });
  }

  stripeEvent(eventType: string, metadata?: Record<string, unknown>): void {
    this.info(`Stripe event: ${eventType}`, metadata);
  }

  rateLimit(action: string, remaining: number): void {
    this.warn(`Rate limit approaching: ${action}`, { remaining });
  }
}

// Middleware helper for Deno.serve
export function withLogging(
  functionName: string,
  handler: (req: Request, logger: Logger) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') || generateRequestId();
    const logger = new Logger(functionName, requestId);
    const startTime = performance.now();

    logger.requestStart(req.method, new URL(req.url).pathname);

    try {
      const response = await handler(req, logger);
      const duration = Math.round(performance.now() - startTime);
      logger.requestEnd(response.status, { duration_ms: duration });

      // Add request ID to response headers for tracing
      const headers = new Headers(response.headers);
      headers.set('x-request-id', requestId);
      headers.set('x-response-time', `${duration}ms`);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Unhandled error', error as Error, { duration_ms: duration });
      throw error;
    }
  };
}

// Health check response type
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  function_name: string;
  version: string;
  checks: {
    database: boolean;
    stripe: boolean;
    supabase: boolean;
  };
  uptime_seconds: number;
}

// Simple health check handler
export async function handleHealthCheck(
  functionName: string,
  checks: () => Promise<{ database: boolean; stripe: boolean; supabase: boolean }>
): Promise<Response> {
  const logger = new Logger(`${functionName}:health`);
  const startTime = performance.now();

  try {
    const results = await checks();
    const allHealthy = Object.values(results).every(Boolean);
    const status = allHealthy ? 'healthy' : 'degraded';

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      function_name: functionName,
      version: Deno.env.get('APP_VERSION') || '1.0.0',
      checks: results,
      uptime_seconds: Math.round((performance.now() - startTime) / 1000),
    };

    logger.info('Health check completed', { status, ...results });

    return new Response(JSON.stringify(response), {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      function_name: functionName,
      error: (error as Error).message,
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Standard CORS headers helper
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
