import { money, sum } from '../lib/money.js';
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

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Serie mensual calculada desde los movimientos: ingresos, gastos, ahorro y saldo al cierre de cada mes. */
export async function monthlySeries(userId: string, months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const active = { active: true };
  const [txs, accounts, before] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, date: { gte: start }, type: { in: ['INCOME', 'EXPENSE', 'SAVING'] }, account: active }, select: { type: true, amount: true, date: true } }),
    prisma.account.findMany({ where: { userId, ...active }, select: { initialBalance: true } }),
    prisma.transaction.groupBy({ by: ['type'], where: { userId, date: { lt: start }, type: { in: ['INCOME', 'EXPENSE'] }, account: active }, _sum: { amount: true } }),
  ]);
  const prior = (t: string) => before.find((r) => r.type === t)?._sum.amount ?? money(0);
  let balance = sum(accounts.map((a) => a.initialBalance)).plus(prior('INCOME')).minus(prior('EXPENSE'));

  return Array.from({ length: months }, (_, i) => {
    const key = monthKey(new Date(start.getFullYear(), start.getMonth() + i, 1));
    const inMonth = txs.filter((t) => monthKey(t.date) === key);
    const total = (type: string) => sum(inMonth.filter((t) => t.type === type).map((t) => t.amount));
    const income = total('INCOME'), expense = total('EXPENSE');
    balance = balance.plus(income).minus(expense);
    return { month: key, income, expense, saving: total('SAVING'), balance };
  });
}
