// ============================================
// ERROR HANDLER MIDDLEWARE - Tratamento de Erros
// ============================================

import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Prisma errors
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Unique constraint violation',
          message: 'A record with this value already exists',
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          message: 'The requested record does not exist',
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        });
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
