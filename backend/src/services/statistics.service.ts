import { money } from '../lib/money.js';
import { prisma } from '../lib/prisma.js';
import { totalBalance } from './balance.service.js';

/** Resumen de un período. Las transferencias no cuentan como ingreso ni gasto. */
export async function periodSummary(userId: string, from: Date, to: Date) {
  const where = { userId, date: { gte: from, lte: to } };
  const [byType, byCategory, balance] = await Promise.all([
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ['categoryId'], where: { ...where, type: 'EXPENSE' }, _sum: { amount: true } }),
    totalBalance(userId),
  ]);
  const categories = await prisma.category.findMany({ where: { userId, id: { in: byCategory.flatMap((c) => (c.categoryId ? [c.categoryId] : [])) } } });
  const total = (t: string) => byType.find((r) => r.type === t)?._sum.amount ?? money(0);
  return {
    totalBalance: balance, income: total('INCOME'), expense: total('EXPENSE'), saving: total('SAVING'),
    expenseByCategory: byCategory
      .map((c) => ({ categoryId: c.categoryId, name: categories.find((k) => k.id === c.categoryId)?.name ?? 'Sin categoría', amount: c._sum.amount ?? money(0) }))
      .sort((a, b) => b.amount.comparedTo(a.amount)),
  };
}
