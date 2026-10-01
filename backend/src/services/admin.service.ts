import argon2 from 'argon2';
import { AppError, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

export const listUsers = () =>
  prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: 'asc' } });

export async function resetPassword(userId: string, password: string) {
  const r = await prisma.user.updateMany({ where: { id: userId }, data: { passwordHash: await argon2.hash(password), tokenVersion: { increment: 1 } } });
  if (!r.count) throw notFound();
}

export async function setActive(adminId: string, userId: string, active: boolean) {
  if (adminId === userId) throw new AppError(400, 'SELF', 'No puedes desactivar tu propia cuenta');
  const r = await prisma.user.updateMany({ where: { id: userId }, data: { active, tokenVersion: { increment: 1 } } });
  if (!r.count) throw notFound();
}
