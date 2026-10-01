import type { z } from 'zod';
import { AppError, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import type { accountInput } from '../validation/schemas.js';

type AccountInput = z.infer<typeof accountInput>;

async function assertUniqueName(userId: string, name: string, exceptId?: string) {
  if (await prisma.account.findFirst({ where: { userId, name, NOT: exceptId ? { id: exceptId } : undefined } })) {
    throw new AppError(409, 'DUPLICATE', 'Ya tienes una cuenta con ese nombre');
  }
}

export async function createAccount(userId: string, d: AccountInput) {
  await assertUniqueName(userId, d.name);
  return prisma.account.create({ data: { ...d, userId } });
}

export async function updateAccount(userId: string, id: string, d: AccountInput) {
  if (!(await prisma.account.count({ where: { id, userId } }))) throw notFound();
  await assertUniqueName(userId, d.name, id);
  return prisma.account.update({ where: { id }, data: d });
}

/** Solo se puede eliminar una cuenta sin movimientos, para no perder historial por error. */
export async function deleteAccount(userId: string, id: string) {
  if (!(await prisma.account.count({ where: { id, userId } }))) throw notFound();
  const used = await prisma.transaction.count({ where: { userId, OR: [{ accountId: id }, { toAccountId: id }] } });
  if (used) throw new AppError(409, 'HAS_TRANSACTIONS', 'Esta cuenta tiene movimientos. Elimínalos primero.');
  await prisma.account.delete({ where: { id } });
}
