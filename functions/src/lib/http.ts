import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from './firebase';

export type AuthedRequest = Request & {
  auth?: { userId: string; email?: string };
};

export function jsonError(res: Response, message: string, status = 400): Response {
  return res.status(status).json({ error: message });
}

type AsyncRequestHandler<Req extends Request = AuthedRequest> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises are forwarded to `next`.
 * Generic over AuthedRequest so `req`/`res` stay typed under strict mode.
 */
export function asyncHandler<Req extends AuthedRequest = AuthedRequest>(
  fn: AsyncRequestHandler<Req>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}

/**
 * Verifies `Authorization: Bearer <Firebase ID token>` and attaches
 * `req.auth = { userId, email? }`. Returns 401 JSON on failure.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    jsonError(res, 'Missing or invalid Authorization header', 401);
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    jsonError(res, 'Missing or invalid Authorization header', 401);
    return;
  }

  try {
    adminApp();
    const decoded = await getAuth().verifyIdToken(token);
    (req as AuthedRequest).auth = {
      userId: decoded.uid,
      email: decoded.email,
    };
    next();
  } catch {
    jsonError(res, 'Unauthorized', 401);
  }
};
