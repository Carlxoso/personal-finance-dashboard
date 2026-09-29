import type { z } from 'zod';
import { AppError, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import type { categoryInput } from '../validation/schemas.js';

export async function createCategory(userId: string, d: z.infer<typeof categoryInput>) {
  if (await prisma.category.count({ where: { userId, ...d } })) throw new AppError(409, 'DUPLICATE', 'Ya existe una categoría con ese nombre');
  return prisma.category.create({ data: { ...d, userId } });
}

/** Solo se elimina una categoría sin movimientos. */
export async function deleteCategory(userId: string, id: string) {
  if (!(await prisma.category.count({ where: { id, userId } }))) throw notFound();
  if (await prisma.transaction.count({ where: { userId, categoryId: id } })) throw new AppError(409, 'IN_USE', 'Esta categoría tiene movimientos y no se puede eliminar');
  await prisma.category.delete({ where: { id } });
}
