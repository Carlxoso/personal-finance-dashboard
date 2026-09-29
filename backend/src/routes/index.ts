import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteAccount } from '../services/account.service.js';
import * as auth from '../services/auth.service.js';
import { accountBalances } from '../services/balance.service.js';
import { monthlySeries, periodSummary } from '../services/statistics.service.js';
import * as goals from '../services/goal.service.js';
import * as tx from '../services/transaction.service.js';
import { accountInput, credentials, goalInput, idParam, monthsQuery, periodQuery, txInput, txQuery } from '../validation/schemas.js';

const api = Router();
// Cookie HttpOnly + SameSite=Strict + CORS restringido cubren CSRF.
const setSession = (res: Response, userId: string) =>
  res.cookie('token', auth.signToken(userId), { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 864e5 });

const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20 });
api.post('/auth/register', authLimit, async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = await auth.register(email, password);
  setSession(res, user.id).status(201).json(user);
});
api.post('/auth/login', authLimit, async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = await auth.login(email, password);
  setSession(res, user.id).json(user);
});
api.post('/auth/logout', (_req, res) => { res.clearCookie('token').status(204).end(); });

api.use(requireAuth);
api.get('/auth/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true } });
  if (!user) throw notFound();
  res.json(user);
});

api.get('/accounts', async (req, res) => { res.json(await accountBalances(req.userId)); });
api.post('/accounts', async (req, res) => {
  res.status(201).json(await prisma.account.create({ data: { ...accountInput.parse(req.body), userId: req.userId } }));
});
api.delete('/accounts/:id', async (req, res) => { await deleteAccount(req.userId, idParam.parse(req.params).id); res.status(204).end(); });
api.get('/categories', async (req, res) => { res.json(await prisma.category.findMany({ where: { userId: req.userId }, orderBy: { name: 'asc' } })); });

api.get('/transactions', async (req, res) => { res.json(await tx.listTransactions(req.userId, txQuery.parse(req.query))); });
api.post('/transactions', async (req, res) => { res.status(201).json(await tx.createTransaction(req.userId, txInput.parse(req.body))); });
api.put('/transactions/:id', async (req, res) => {
  res.json(await tx.updateTransaction(req.userId, idParam.parse(req.params).id, txInput.parse(req.body)));
});
api.delete('/transactions/:id', async (req, res) => { await tx.deleteTransaction(req.userId, idParam.parse(req.params).id); res.status(204).end(); });

api.get('/goals', async (req, res) => { res.json(await goals.listGoals(req.userId)); });
api.post('/goals', async (req, res) => { res.status(201).json(await goals.createGoal(req.userId, goalInput.parse(req.body))); });

api.delete('/goals/:id', async (req, res) => { await goals.deleteGoal(req.userId, idParam.parse(req.params).id); res.status(204).end(); });

api.get('/statistics/summary', async (req, res) => {
  const { from, to } = periodQuery.parse(req.query);
  res.json(await periodSummary(req.userId, from, to));
});
api.get('/statistics/monthly', async (req, res) => { res.json(await monthlySeries(req.userId, monthsQuery.parse(req.query).months)); });

export default api;
