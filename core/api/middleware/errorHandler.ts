import { Context, Next } from 'koa';
import { AppError, isAppError, toAppError } from '../../lib/errors';
import { winstonLogger } from '../../winstonLoggerSystem';

/**
 * Centralized error handling middleware for Koa
 */
export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err: unknown) {
    const error = isAppError(err) ? err : toAppError(err);

    // Log error
    if (error.statusCode >= 500) {
      winstonLogger.error('Server error', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        path: ctx.path,
        method: ctx.method,
        details: error.details,
        stack: error.stack,
      });
    } else if (error.statusCode >= 400) {
      winstonLogger.warn('Client error', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        path: ctx.path,
        method: ctx.method,
      });
    }

    // Set response
    ctx.status = error.statusCode;
    ctx.body = error.toJSON();

    // Emit error event for monitoring
    ctx.app.emit('error', error, ctx);
  }
}

/**
 * Format Joi validation errors
 */
export function formatJoiError(joiError: any): { message: string; details: any } {
  const details = joiError.details.map((detail: any) => ({
    field: detail.path.join('.'),
    message: detail.message,
    type: detail.type,
  }));

  return {
    message: 'Validation failed',
    details,
  };
}
