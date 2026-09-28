import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

declare global { namespace Express { interface Request { userId: string } } }

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const { sub } = jwt.verify(req.cookies?.token ?? '', env.JWT_SECRET) as jwt.JwtPayload;
    if (!sub) throw new Error();
    req.userId = sub;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar'));
  }
}
