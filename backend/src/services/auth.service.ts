import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const EXPENSE = ['Comida', 'Transporte', 'Educación', 'Entretenimiento', 'Tecnología', 'Compras', 'Servicios', 'Salud', 'Otros'];
const INCOME = ['Salario', 'Freelance', 'Negocio', 'Regalo', 'Otros'];

export async function register(email: string, password: string) {
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
  return prisma.user.create({
    data: {
      email, passwordHash: await argon2.hash(password),
      categories: { create: [...EXPENSE.map((name) => ({ name, kind: 'EXPENSE' as const })), ...INCOME.map((name) => ({ name, kind: 'INCOME' as const }))] },
    },
    select: { id: true, email: true },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.passwordHash, password))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
  return { id: user.id, email: user.email };
}

export const signToken = (userId: string) => jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: '7d' });

export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await argon2.verify(user.passwordHash, current))) throw new AppError(400, 'WRONG_PASSWORD', 'La contraseña actual no es correcta');
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(next) } });
}
