import { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { AppError, notFound } from '../lib/errors.js';
import { money } from '../lib/money.js';
import { prisma } from '../lib/prisma.js';
import type { goalInput } from '../validation/schemas.js';

/** El progreso de una meta se deriva de sus movimientos SAVING (única fuente de verdad). */
export async function listGoals(userId: string) {
  const [goals, saved] = await Promise.all([
    prisma.goal.findMany({ where: { userId, status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.transaction.groupBy({ by: ['goalId'], where: { userId, type: 'SAVING' }, _sum: { amount: true } }),
  ]);
  return goals.map((g) => {
    const current = saved.find((s) => s.goalId === g.id)?._sum.amount ?? money(0);
    const remaining = Prisma.Decimal.max(g.target.minus(current), 0);
    const months = g.targetDate ? Math.max(1, Math.ceil((g.targetDate.getTime() - Date.now()) / (30 * 864e5))) : null;
    return {
      ...g, current, remaining,
      percent: current.div(g.target).times(100).toDecimalPlaces(1),
      monthlyNeeded: months && remaining.gt(0) ? remaining.div(months).toDecimalPlaces(2) : null,
    };
  });
}

export const createGoal = (userId: string, d: z.infer<typeof goalInput>) => prisma.goal.create({ data: { ...d, userId } });

/** Solo se puede eliminar una meta sin aportes. */
export async function deleteGoal(userId: string, id: string) {
  if (!(await prisma.goal.count({ where: { id, userId } }))) throw notFound();
  if (await prisma.transaction.count({ where: { userId, goalId: id } })) throw new AppError(409, 'HAS_TRANSACTIONS', 'Esta meta tiene aportes. Elimínalos primero desde Ahorros.');
  await prisma.goal.delete({ where: { id } });
}

export async function updateGoal(userId: string, id: string, d: z.infer<typeof goalInput>) {
  if (!(await prisma.goal.count({ where: { id, userId } }))) throw notFound();
  return prisma.goal.update({ where: { id }, data: { name: d.name, target: d.target, targetDate: d.targetDate ?? null, description: d.description ?? null } });
}
