import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory methods
export const BadRequestError = (message = 'Bad request') => new ApiError(400, message);
export const UnauthorizedError = (message = 'Unauthorized') => new ApiError(401, message);
export const ForbiddenError = (message = 'Forbidden') => new ApiError(403, message);
export const NotFoundError = (message = 'Not found') => new ApiError(404, message);
export const ConflictError = (message = 'Conflict') => new ApiError(409, message);
export const ValidationError = (message = 'Validation failed') => new ApiError(422, message);
export const InternalError = (message = 'Internal server error') => new ApiError(500, message, false);

// Global error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 internal server error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Joi validation errors
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log error details
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    isOperational,
    stack: isOperational ? undefined : err.stack,
    ip: req.ip,
    userId: (req as any).user?.id,
  };

  if (isOperational) {
    logger.warn('Operational error', logData);
  } else {
    logger.error('Unexpected error', logData);
  }

  // Send response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && !isOperational && { stack: err.stack }),
  });
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
