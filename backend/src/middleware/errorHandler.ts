import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Never log sensitive contents or tokens
  const safeErrorMessage = err?.message || 'Internal Server Error';
  const errorCode = err?.code || 'INTERNAL_SERVER_ERROR';
  const statusCode = typeof err?.status === 'number' ? err.status : 500;

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Multer errors
  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'One or more files exceed the maximum allowed size limit',
        },
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Exceeded maximum number of allowed files per upload',
        },
      });
      return;
    }
  }

  // Structured sanitized response
  const isDev = process.env.NODE_ENV === 'development';
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: isDev ? safeErrorMessage : 'An unexpected error occurred while processing your request',
      ...(isDev && err?.stack ? { debug: err.message } : {}),
    },
  });
}
