import { z } from 'zod';

const amount = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, 'Monto inválido').refine((v) => Number(v) > 0, 'Debe ser mayor que 0');
const id = z.string().min(1).max(40);
const txType = z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING']);

export const credentials = z.object({ email: z.string().email().max(120).toLowerCase(), password: z.string().min(10).max(128) });

export const accountInput = z.object({
  name: z.string().trim().min(1).max(60), type: z.string().trim().min(1).max(30),
  currency: z.string().length(3).default('USD'), initialBalance: z.string().regex(/^-?\d{1,12}(\.\d{1,2})?$/).default('0'),
});

export const txInput = z.object({
  type: txType, amount, description: z.string().trim().min(1).max(120), notes: z.string().max(500).optional(),
  date: z.coerce.date(), accountId: id,
  toAccountId: id.optional(), categoryId: id.optional(), goalId: id.optional(),
}).superRefine((d, ctx) => {
  const bad = (message: string, path: string) => ctx.addIssue({ code: 'custom', message, path: [path] });
  if (d.type === 'TRANSFER' && (!d.toAccountId || d.toAccountId === d.accountId)) bad('Elige otra cuenta de destino', 'toAccountId');
  if (d.type !== 'TRANSFER' && d.toAccountId) bad('Solo las transferencias tienen destino', 'toAccountId');
  if (d.type === 'SAVING' && !d.goalId) bad('Elige una meta', 'goalId');
});

export const txQuery = z.object({
  type: txType.optional(), accountId: id.optional(), categoryId: id.optional(),
  search: z.string().max(60).optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const periodQuery = z.object({ from: z.coerce.date(), to: z.coerce.date() });
export const idParam = z.object({ id });

export const goalInput = z.object({
  name: z.string().trim().min(1).max(80), target: amount,
  targetDate: z.coerce.date().optional(), description: z.string().max(300).optional(),
});

export const monthsQuery = z.object({ months: z.coerce.number().int().min(1).max(24).default(6) });

export const passwordInput = z.object({ current: z.string().min(1).max(128), next: z.string().min(10).max(128) });
export const categoryInput = z.object({ name: z.string().trim().min(1).max(40), kind: z.enum(['INCOME', 'EXPENSE']) });

export const registerInput = credentials.extend({ name: z.string().trim().min(1).max(60) });
export const profileInput = z.object({ name: z.string().trim().min(1).max(60), email: z.string().email().max(120).toLowerCase() });

export const adminPasswordInput = z.object({ password: z.string().min(10).max(128) });
export const activeInput = z.object({ active: z.boolean() });
