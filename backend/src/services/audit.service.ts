import type { AuditAction, Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { auditQuery } from '../validation/schemas.js';

/** Origen de la petición (IP y navegador) para cada evento. */
export interface AuditContext { ip?: string; userAgent?: string }
export const contextOf = (req: Request): AuditContext => ({ ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 200) });

interface AuditEvent {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetId?: string | null;
  targetEmail?: string | null;
  /** Datos extra NO sensibles (nunca contraseñas ni montos). */
  details?: Prisma.InputJsonObject;
}

/**
 * Registra un evento. Si la bitácora falla, la acción principal NO falla:
 * el error queda en el log del servidor y la persona puede seguir usando la app.
 */
export async function record(ctx: AuditContext, e: AuditEvent) {
  try {
    // Se guarda una copia del correo: así el registro sigue siendo legible aunque el usuario lo cambie.
    const ids = [e.actorId, e.targetId].filter((id): id is string => !!id);
    const missing = (e.actorId && !e.actorEmail) || (e.targetId && !e.targetEmail);
    const users = missing ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } }) : [];
    const emailOf = (id?: string | null) => users.find((u) => u.id === id)?.email ?? null;
    await prisma.auditLog.create({
      data: {
        action: e.action,
        actorId: e.actorId ?? null, actorEmail: e.actorEmail ?? emailOf(e.actorId),
        targetId: e.targetId ?? null, targetEmail: e.targetEmail ?? emailOf(e.targetId),
        ip: ctx.ip ?? null, userAgent: ctx.userAgent ?? null, details: e.details,
      },
    });
  } catch (err) {
    console.error('[bitácora] no se pudo registrar el evento', e.action, err);
  }
}

export async function listAudit(q: z.infer<typeof auditQuery>) {
  const where: Prisma.AuditLogWhereInput = {
    action: q.action,
    ...((q.from || q.to) && { createdAt: { gte: q.from, lte: q.to } }),
    ...(q.search && { OR: [
      { actorEmail: { contains: q.search, mode: 'insensitive' } },
      { targetEmail: { contains: q.search, mode: 'insensitive' } },
      { ip: { contains: q.search } },
    ] }),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}

const ADMIN_ACTIONS: AuditAction[] = ['USER_CREATED', 'USER_PASSWORD_RESET', 'USER_ACTIVATED', 'USER_DEACTIVATED'];

/** Cifras para las tarjetas de la bitácora. */
export async function auditSummary() {
  const now = Date.now();
  const day = new Date(now - 864e5), week = new Date(now - 7 * 864e5);
  const [events24h, failed24h, denied7d, admin7d, topFailed] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: day } } }),
    prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: day } } }),
    prisma.auditLog.count({ where: { action: 'ACCESS_DENIED', createdAt: { gte: week } } }),
    prisma.auditLog.count({ where: { action: { in: ADMIN_ACTIONS }, createdAt: { gte: week } } }),
    // Correos con más intentos fallidos en 24 h: señal de que alguien está probando contraseñas.
    prisma.auditLog.groupBy({
      by: ['actorEmail'], where: { action: 'LOGIN_FAILED', createdAt: { gte: day }, actorEmail: { not: null } },
      _count: { _all: true }, orderBy: { _count: { actorEmail: 'desc' } }, take: 3,
    }),
  ]);
  return {
    events24h, failed24h, denied7d, admin7d,
    topFailed: topFailed.map((r) => ({ email: r.actorEmail!, count: r._count._all })),
  };
}

/** Borra registros más antiguos que `days` (por defecto, un año). */
export const purgeOlderThan = (days = 365) =>
  prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - days * 864e5) } } });
