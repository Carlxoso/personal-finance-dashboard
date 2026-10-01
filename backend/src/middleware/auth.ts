import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

declare global { namespace Express { interface Request { userId: string } } }

// Con una contraseña temporal solo se puede consultar el perfil y cambiar la contraseña.
const ALLOWED_WITH_TEMP_PASSWORD = ['/auth/me', '/auth/password'];

/** La sesión vale solo si el usuario existe, está activo y su versión de token coincide (así se pueden revocar sesiones). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const unauthorized = new AppError(401, 'UNAUTHORIZED', 'Inicia sesión para continuar');
  let sub: string | undefined;
  let tv: number | undefined;
  try { ({ sub, tv } = jwt.verify(req.cookies?.token ?? '', env.JWT_SECRET) as jwt.JwtPayload); }
  catch { return next(unauthorized); }   // token inválido o vencido
  // Un fallo de base de datos NO se disfraza de "sesión inválida": llega al manejador de errores y queda en el log.
  const user = sub ? await prisma.user.findUnique({ where: { id: sub }, select: { active: true, tokenVersion: true, mustChangePassword: true } }) : null;
  if (!sub || !user?.active || user.tokenVersion !== tv) return next(unauthorized);
  if (user.mustChangePassword && !ALLOWED_WITH_TEMP_PASSWORD.includes(req.path)) {
    return next(new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Debes cambiar tu contraseña temporal antes de continuar'));
  }
  req.userId = sub;
  next();
}

export const requireRole = (role: Role) => async (req: Request, _res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
  next(user?.role === role ? undefined : new AppError(403, 'FORBIDDEN', 'No tienes permiso para esto'));
};
