import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
}

// Fields to exclude from API responses (security sensitive)
const EXCLUDED_FIELDS = ['passwordHash'];

/**
 * Recursively removes sensitive fields from objects
 */
function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Preserve Date objects as-is
  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as T;
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!EXCLUDED_FIELDS.includes(key)) {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized as T;
  }

  return data;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: sanitizeData(data),
      })),
    );
  }
}
