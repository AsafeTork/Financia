// Standardized response helpers for Edge Functions

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    durationMs: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export function corsResponse<T>(body: T, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

export function successResponse<T>(data: T, status = 200, meta?: ApiResponse['meta']): Response {
  const body: ApiResponse<T> = { success: true, data, meta };
  return corsResponse(body, status);
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): Response {
  const body: ApiResponse = { success: false, error: { code, message, details } };
  return corsResponse(body, status);
}

export function validationErrorResponse(message: string, details?: Record<string, unknown>): Response {
  return errorResponse('validation_error', message, 400, details);
}

export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return errorResponse('unauthorized', message, 401);
}

export function forbiddenResponse(message = 'Forbidden'): Response {
  return errorResponse('forbidden', message, 403);
}

export function notFoundResponse(message = 'Not found'): Response {
  return errorResponse('not_found', message, 404);
}

export function rateLimitedResponse(retryAfterMs?: number): Response {
  return errorResponse('rate_limited', 'Too many requests', 429, { retry_after_ms: retryAfterMs });
}

export function serverErrorResponse(message = 'Internal server error', details?: Record<string, unknown>): Response {
  return errorResponse('server_error', message, 500, details);
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
): Response {
  const totalPages = Math.ceil(total / perPage);
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
  return corsResponse(body);
}

export function createRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}