import { prisma } from '../lib/prisma.js';
import { money, sum } from '../lib/money.js';

/** Única fuente de verdad del saldo de cada cuenta. */
export async function accountBalances(userId: string) {
  const [accounts, flows, received] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.transaction.groupBy({ by: ['accountId', 'type'], where: { userId }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ['toAccountId'], where: { userId, type: 'TRANSFER' }, _sum: { amount: true } }),
  ]);
  return accounts.map((a) => {
    const of = (t: string) => flows.find((f) => f.accountId === a.id && f.type === t)?._sum.amount ?? money(0);
    const balance = a.initialBalance.plus(of('INCOME')).minus(of('EXPENSE')).minus(of('TRANSFER'))
      .plus(received.find((r) => r.toAccountId === a.id)?._sum.amount ?? 0);
    return { ...a, balance };
  });
}

export const totalBalance = async (userId: string) => sum((await accountBalances(userId)).filter((a) => a.active).map((a) => a.balance));
