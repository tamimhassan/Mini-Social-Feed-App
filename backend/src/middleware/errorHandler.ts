import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { Prisma } from '@prisma/client';

interface HttpError extends Error {
  status?: number;
}

/**
 * Central error handler. Any error passed to next(err) anywhere in the app
 * (including thrown errors in async route handlers wrapped by asyncHandler)
 * ends up here, keeping error responses consistent.
 */
function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);

  // Prisma known request errors (e.g. unique constraint violations)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target =
        (err.meta?.target as string[] | undefined)?.join(', ') ?? 'value';
      res
        .status(409)
        .json({ error: `A record with this ${target} already exists.` });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found.' });
      return;
    }
  }

  const httpErr = err as HttpError;
  const status = httpErr.status ?? 500;
  const message = status === 500 ? 'Internal server error.' : httpErr.message;
  res.status(status).json({ error: message });
}

function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
}

/** Wraps an async route handler so rejected promises are forwarded to next(err). */
function asyncHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export { errorHandler, notFoundHandler, asyncHandler };
