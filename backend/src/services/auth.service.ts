import type { Role } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const EXPENSE = ['Comida', 'Transporte', 'Educación', 'Entretenimiento', 'Tecnología', 'Compras', 'Servicios', 'Salud', 'Otros'];
const INCOME = ['Salario', 'Freelance', 'Negocio', 'Regalo', 'Otros'];
const PUBLIC = { id: true, email: true, name: true, role: true } as const;

/** Único lugar donde se crean usuarios (con sus categorías iniciales). */
export async function createUser(d: { email: string; password: string; name: string; role: Role }) {
  if (await prisma.user.findUnique({ where: { email: d.email } })) throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
  return prisma.user.create({
    data: {
      email: d.email, name: d.name, role: d.role, passwordHash: await argon2.hash(d.password),
      categories: { create: [...EXPENSE.map((name) => ({ name, kind: 'EXPENSE' as const })), ...INCOME.map((name) => ({ name, kind: 'INCOME' as const }))] },
    },
    select: PUBLIC,
  });
}

/** Solo crea la primera cuenta (administrador); después el registro queda cerrado y el admin crea los usuarios. */
export async function register(email: string, password: string, name: string) {
  if (await prisma.user.count()) throw new AppError(403, 'REGISTRATION_CLOSED', 'El registro está cerrado. Pide al administrador que cree tu cuenta.');
  return { user: await createUser({ email, password, name, role: 'ADMIN' }), tv: 0 };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await argon2.verify(user.passwordHash, password))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, tv: user.tokenVersion };
}

export const signToken = (userId: string, tv: number) => jwt.sign({ tv }, env.JWT_SECRET, { subject: userId, expiresIn: '7d' });

/** Cerrar sesión invalida todos los tokens emitidos a ese usuario. */
export async function logout(token?: string) {
  try {
    const { sub } = jwt.verify(token ?? '', env.JWT_SECRET) as jwt.JwtPayload;
    if (sub) await prisma.user.updateMany({ where: { id: sub }, data: { tokenVersion: { increment: 1 } } });
  } catch { /* sin sesión válida no hay nada que invalidar */ }
}

export async function updateProfile(userId: string, d: { name: string; email: string }) {
  if (await prisma.user.findFirst({ where: { email: d.email, NOT: { id: userId } } })) throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
  return prisma.user.update({ where: { id: userId }, data: d, select: PUBLIC });
}

/** Cambia la contraseña e invalida las demás sesiones; devuelve la nueva versión de token para la sesión actual. */
export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await argon2.verify(user.passwordHash, current))) throw new AppError(400, 'WRONG_PASSWORD', 'La contraseña actual no es correcta');
  const updated = await prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(next), tokenVersion: { increment: 1 } }, select: { tokenVersion: true } });
  return updated.tokenVersion;
}
