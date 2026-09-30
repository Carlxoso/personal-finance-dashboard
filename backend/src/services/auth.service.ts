import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const EXPENSE = ['Comida', 'Transporte', 'Educación', 'Entretenimiento', 'Tecnología', 'Compras', 'Servicios', 'Salud', 'Otros'];
const INCOME = ['Salario', 'Freelance', 'Negocio', 'Regalo', 'Otros'];

export async function register(email: string, password: string, name: string) {
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
  const role = (await prisma.user.count()) === 0 ? ('ADMIN' as const) : ('USER' as const); // el primer usuario es administrador
  return prisma.user.create({
    data: {
      email, name, role, passwordHash: await argon2.hash(password),
      categories: { create: [...EXPENSE.map((name) => ({ name, kind: 'EXPENSE' as const })), ...INCOME.map((name) => ({ name, kind: 'INCOME' as const }))] },
    },
    select: { id: true, email: true, name: true, role: true },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.passwordHash, password))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export const signToken = (userId: string) => jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: '7d' });

export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await argon2.verify(user.passwordHash, current))) throw new AppError(400, 'WRONG_PASSWORD', 'La contraseña actual no es correcta');
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(next) } });
}

export async function updateProfile(userId: string, d: { name: string; email: string }) {
  if (await prisma.user.findFirst({ where: { email: d.email, NOT: { id: userId } } })) throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
  return prisma.user.update({ where: { id: userId }, data: d, select: { id: true, email: true, name: true, role: true } });
}
