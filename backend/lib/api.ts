import { ZodError } from 'zod';
import { UnauthorizedError } from '@/lib/auth';

export interface ApiError {
  error: string;
  details?: unknown;
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json({ data } as const, { status });
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown
): Response {
  const body: ApiError = { error: message };
  if (details !== undefined) body.details = details;
  return Response.json(body, { status });
}

export function handleApiError(err: unknown): Response {
  if (err instanceof ZodError) {
    return jsonError('Validation failed', 422, err.flatten());
  }
  if (err instanceof UnauthorizedError) {
    return jsonError(err.message, 401);
  }
  console.error('[api] unhandled error:', err);
  const msg = err instanceof Error ? err.message : 'Internal Server Error';
  return jsonError(msg, 500);
}
