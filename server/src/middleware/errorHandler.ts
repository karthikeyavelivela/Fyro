import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message || 'Server Error');

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
