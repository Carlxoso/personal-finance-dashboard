import { AppError, notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

/** Solo se puede eliminar una cuenta sin movimientos, para no perder historial por error. */
export async function deleteAccount(userId: string, id: string) {
  if (!(await prisma.account.count({ where: { id, userId } }))) throw notFound();
  const used = await prisma.transaction.count({ where: { userId, OR: [{ accountId: id }, { toAccountId: id }] } });
  if (used) throw new AppError(409, 'HAS_TRANSACTIONS', 'Esta cuenta tiene movimientos. Elimínalos primero.');
  await prisma.account.delete({ where: { id } });
}
