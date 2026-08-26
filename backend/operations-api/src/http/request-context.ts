import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const supplied = req.header('x-request-id')?.trim();
  const requestId = supplied && /^[A-Za-z0-9._:-]{8,128}$/.test(supplied) ? supplied : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  next();
}

export function requestId(res: Response) {
  return typeof res.locals.requestId === 'string' ? res.locals.requestId : undefined;
}
