import { accountBalances } from './balance.service.js';
import { listGoals } from './goal.service.js';
import { periodSummary } from './statistics.service.js';

export interface Notice { id: string; kind: 'success' | 'warning'; message: string }

/** Avisos calculados desde los datos reales; desaparecen solos cuando la condición se resuelve. */
export async function listNotifications(userId: string): Promise<Notice[]> {
  const now = new Date();
  const [accounts, goals, month] = await Promise.all([
    accountBalances(userId), listGoals(userId), periodSummary(userId, new Date(now.getFullYear(), now.getMonth(), 1), now),
  ]);
  const notices: Notice[] = [];
  for (const g of goals) if (g.remaining.isZero()) notices.push({ id: `goal-${g.id}`, kind: 'success', message: `Completaste tu meta "${g.name}"` });
  for (const a of accounts) if (a.active && a.balance.isNegative()) notices.push({ id: `neg-${a.id}`, kind: 'warning', message: `La cuenta "${a.name}" tiene saldo negativo` });
  if (month.expense.gt(month.income)) notices.push({ id: 'month-deficit', kind: 'warning', message: 'Este mes tus gastos superan tus ingresos' });
  return notices;
}

