import argon2 from 'argon2';
import { AppError, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

export const listUsers = () =>
  prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, active: true, mustChangePassword: true, createdAt: true, lastLoginAt: true }, orderBy: { createdAt: 'asc' } });

export async function resetPassword(userId: string, password: string) {
  const r = await prisma.user.updateMany({ where: { id: userId }, data: { passwordHash: await argon2.hash(password), tokenVersion: { increment: 1 }, mustChangePassword: true } });
  if (!r.count) throw notFound();
}

/**
 * Elimina un usuario y TODOS sus datos (cuentas, movimientos, metas y categorías). No se puede deshacer.
 * Exige escribir el correo exacto como confirmación, también en el servidor.
 * Los movimientos se borran primero porque su relación con la cuenta es RESTRICT.
 */
export async function deleteUser(adminId: string, userId: string, confirmEmail: string) {
  if (adminId === userId) throw new AppError(400, 'SELF', 'No puedes eliminar tu propia cuenta');
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!user) throw notFound();
  if (user.role === 'ADMIN') throw new AppError(400, 'ADMIN_PROTECTED', 'No se puede eliminar a un administrador');
  if (confirmEmail.trim().toLowerCase() !== user.email) throw new AppError(400, 'CONFIRMATION_MISMATCH', 'El correo de confirmación no coincide');

  const [transactions, accounts, goals] = await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.account.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),   // cascada: cuentas, categorías y metas
  ]);
  // Solo cantidades para la bitácora, nunca montos.
  return { email: user.email, removed: { transactions: transactions.count, accounts, goals } };
}

export async function setActive(adminId: string, userId: string, active: boolean) {
  if (adminId === userId) throw new AppError(400, 'SELF', 'No puedes desactivar tu propia cuenta');
  const r = await prisma.user.updateMany({ where: { id: userId }, data: { active, tokenVersion: { increment: 1 } } });
  if (!r.count) throw notFound();
}

export const STALE_DAYS = 90;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Resumen para el administrador: solo cuentas de acceso y salud del sistema, nunca datos financieros. */
export async function systemSummary() {
  const now = new Date();
  const week = new Date(now.getTime() - 7 * 864e5);
  const stale = new Date(now.getTime() - STALE_DAYS * 864e5);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const started = performance.now();
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true, () => false);
  const latencyMs = Math.round(performance.now() - started);

  const [total, active, admins, pendingPassword, active7d, newThisMonth, staleCount, neverLoggedIn, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { role: 'ADMIN', active: true } }),
    prisma.user.count({ where: { active: true, mustChangePassword: true } }),
    prisma.user.count({ where: { active: true, lastLoginAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    // Sin acceso en 90 días: entró hace más de 90 días, o se creó hace más de 90 días y nunca entró.
    prisma.user.count({ where: { active: true, OR: [{ lastLoginAt: { lt: stale } }, { lastLoginAt: null, createdAt: { lt: stale } }] } }),
    prisma.user.count({ where: { active: true, lastLoginAt: null } }),
    prisma.user.findMany({ where: { createdAt: { gte: sixMonths } }, select: { createdAt: true } }),
  ]);

  const signupsByMonth = Array.from({ length: 6 }, (_, i) => {
    const key = monthKey(new Date(sixMonths.getFullYear(), sixMonths.getMonth() + i, 1));
    return { month: key, count: recent.filter((u) => monthKey(u.createdAt) === key).length };
  });

  return {
    users: { total, active, inactive: total - active, admins, pendingPassword, active7d, newThisMonth, stale: staleCount, neverLoggedIn },
    signupsByMonth,
    system: { dbOk, latencyMs, uptimeSeconds: Math.round(process.uptime()), serverTime: now.toISOString() },
  };
}
