import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import type { txInput, txQuery } from '../validation/schemas.js';

type TxInput = z.infer<typeof txInput>;

async function assertOwnership(userId: string, d: TxInput) {
  const accountIds = [...new Set([d.accountId, d.toAccountId].filter((x): x is string => !!x))];
  const [accounts, category, goal] = await Promise.all([
    prisma.account.count({ where: { userId, id: { in: accountIds } } }),
    d.categoryId ? prisma.category.count({ where: { userId, id: d.categoryId } }) : 1,
    d.goalId ? prisma.goal.count({ where: { userId, id: d.goalId } }) : 1,
  ]);
  if (accounts !== accountIds.length || !category || !goal) throw notFound();
}

export async function listTransactions(userId: string, q: z.infer<typeof txQuery>) {
  const where: Prisma.TransactionWhereInput = {
    userId, type: q.type, categoryId: q.categoryId,
    ...(q.accountId && { OR: [{ accountId: q.accountId }, { toAccountId: q.accountId }] }),
    ...(q.search && { description: { contains: q.search, mode: 'insensitive' } }),
    ...((q.from || q.to) && { date: { gte: q.from, lte: q.to } }),
  };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { category: true, account: true, toAccount: true } }),
    prisma.transaction.count({ where }),
  ]);
  return { items, total, page: q.page, pageSize: q.pageSize };
}

export async function createTransaction(userId: string, d: TxInput) {
  await assertOwnership(userId, d);
  return prisma.transaction.create({ data: { ...d, userId } });
}

export async function updateTransaction(userId: string, id: string, d: TxInput) {
  if (!(await prisma.transaction.count({ where: { id, userId } }))) throw notFound();
  await assertOwnership(userId, d);
  return prisma.transaction.update({ where: { id }, data: { ...d, toAccountId: d.toAccountId ?? null, categoryId: d.categoryId ?? null, goalId: d.goalId ?? null } });
}

export async function deleteTransaction(userId: string, id: string) {
  if (!(await prisma.transaction.deleteMany({ where: { id, userId } })).count) throw notFound();
}

// Neutraliza fórmulas de Excel (=, +, -, @) y escapa comillas, comas y saltos de línea.
const csvCell = (v: string) => {
  const s = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCsv(userId: string, from: Date, to: Date) {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } }, orderBy: { date: 'asc' }, take: 10000,
    include: { category: true, account: true, toAccount: true },
  });
  const head = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Destino', 'Monto'];
  const body = rows.map((t) => [t.date.toISOString().slice(0, 10), t.type, t.description, t.category?.name ?? '', t.account.name, t.toAccount?.name ?? '', t.amount.toFixed(2)]);
  return '\uFEFF' + [head, ...body].map((r) => r.map(csvCell).join(',')).join('\n');
}
