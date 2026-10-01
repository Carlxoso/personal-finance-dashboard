import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

declare global { namespace Express { interface Request { userId: string } } }

/** La sesión vale solo si el usuario existe, está activo y su versión de token coincide (así se pueden revocar sesiones). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  let userId: string | undefined;
  try {
    const { sub, tv } = jwt.verify(req.cookies?.token ?? '', env.JWT_SECRET) as jwt.JwtPayload;
    const user = sub ? await prisma.user.findUnique({ where: { id: sub }, select: { active: true, tokenVersion: true } }) : null;
    if (user?.active && user.tokenVersion === tv) userId = sub;
  } catch { /* token inválido o vencido */ }
  if (!userId) return next(new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar'));
  req.userId = userId;
  next();
}

export const requireRole = (role: Role) => async (req: Request, _res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
  next(user?.role === role ? undefined : new AppError(403, 'FORBIDDEN', 'No tienes permiso para esto'));
};
