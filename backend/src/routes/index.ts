import { Router, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as reports from '../services/report.service.js';
import * as notifications from '../services/notification.service.js';
import * as accounts from '../services/account.service.js';
import * as adminUsers from '../services/admin.service.js';
import * as audit from '../services/audit.service.js';
import * as auth from '../services/auth.service.js';
import { accountBalances } from '../services/balance.service.js';
import { monthlySeries, periodSummary } from '../services/statistics.service.js';
import * as categories from '../services/category.service.js';
import * as goals from '../services/goal.service.js';
import * as tx from '../services/transaction.service.js';
import { accountInput, categoryInput, credentials, profileInput, registerInput, adminPasswordInput, activeInput, auditQuery, reportQuery, goalInput, idParam, monthsQuery, passwordInput, periodQuery, txInput, txQuery } from '../validation/schemas.js';

const api = Router();
// Cookie HttpOnly + SameSite=Strict + CORS restringido cubren CSRF.
const setSession = (res: Response, userId: string, tv: number) =>
  res.cookie('token', auth.signToken(userId, tv), { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 864e5 });

const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20, skip: () => env.NODE_ENV === 'test' });
api.get('/auth/status', async (_req, res) => { res.json({ registrationOpen: (await prisma.user.count()) === 0 }); });
api.post('/auth/register', authLimit, async (req, res) => {
  const { email, password, name } = registerInput.parse(req.body);
  const { user, tv } = await auth.register(email, password, name);
  await audit.record(audit.contextOf(req), { action: 'ADMIN_REGISTERED', actorId: user.id, actorEmail: user.email });
  setSession(res, user.id, tv).status(201).json(user);
});
api.post('/auth/login', authLimit, async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const ctx = audit.contextOf(req);
  try {
    const { user, tv } = await auth.login(email, password);
    await audit.record(ctx, { action: 'LOGIN_SUCCESS', actorId: user.id, actorEmail: user.email });
    setSession(res, user.id, tv).json(user);
  } catch (err) {
    if (err instanceof auth.LoginError) {
      await audit.record(ctx, { action: 'LOGIN_FAILED', actorId: err.userId, actorEmail: email, details: { reason: err.reason } });
    }
    throw err;
  }
});
api.post('/auth/logout', async (req, res) => {
  const userId = await auth.logout(req.cookies?.token);
  if (userId) await audit.record(audit.contextOf(req), { action: 'LOGOUT', actorId: userId });
  res.clearCookie('token').status(204).end();
});

api.use(requireAuth);
api.get('/auth/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, role: true, mustChangePassword: true } });
  if (!user) throw notFound();
  res.json(user);
});

api.patch('/auth/me', async (req, res) => {
  const before = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, name: true } });
  const user = await auth.updateProfile(req.userId, profileInput.parse(req.body));
  const changed = (['name', 'email'] as const).filter((k) => before?.[k] !== user[k]);
  if (changed.length) {
    await audit.record(audit.contextOf(req), {
      action: 'PROFILE_UPDATED', actorId: user.id, actorEmail: user.email,
      details: { changed, ...(changed.includes('email') && { previousEmail: before?.email ?? null }) },
    });
  }
  res.json(user);
});
api.get('/notifications', async (req, res) => { res.json(await notifications.listNotifications(req.userId)); });
const admin = Router();
admin.use(requireRole('ADMIN'));
admin.get('/users', async (_req, res) => { res.json(await adminUsers.listUsers()); });
admin.post('/users', async (req, res) => {
  const user = await auth.createUser({ ...registerInput.parse(req.body), role: 'USER', mustChange: true });
  await audit.record(audit.contextOf(req), { action: 'USER_CREATED', actorId: req.userId, targetId: user.id, targetEmail: user.email, details: { role: user.role } });
  res.status(201).json(user);
});
admin.post('/users/:id/password', async (req, res) => {
  const { id } = idParam.parse(req.params);
  await adminUsers.resetPassword(id, adminPasswordInput.parse(req.body).password);
  await audit.record(audit.contextOf(req), { action: 'USER_PASSWORD_RESET', actorId: req.userId, targetId: id });
  res.status(204).end();
});
admin.patch('/users/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { active } = activeInput.parse(req.body);
  await adminUsers.setActive(req.userId, id, active);
  await audit.record(audit.contextOf(req), { action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', actorId: req.userId, targetId: id });
  res.status(204).end();
});
admin.get('/audit', async (req, res) => { res.json(await audit.listAudit(auditQuery.parse(req.query))); });
admin.get('/audit/summary', async (_req, res) => { res.json(await audit.auditSummary()); });
api.use('/admin', admin);

api.get('/accounts', async (req, res) => { res.json(await accountBalances(req.userId)); });
api.post('/accounts', async (req, res) => { res.status(201).json(await accounts.createAccount(req.userId, accountInput.parse(req.body))); });
api.put('/accounts/:id', async (req, res) => { res.json(await accounts.updateAccount(req.userId, idParam.parse(req.params).id, accountInput.parse(req.body))); });
api.delete('/accounts/:id', async (req, res) => { await accounts.deleteAccount(req.userId, idParam.parse(req.params).id); res.status(204).end(); });
api.get('/categories', async (req, res) => { res.json(await prisma.category.findMany({ where: { userId: req.userId }, orderBy: { name: 'asc' } })); });

api.post('/auth/password', authLimit, async (req, res) => {
  const { current, next } = passwordInput.parse(req.body);
  const tv = await auth.changePassword(req.userId, current, next);
  await audit.record(audit.contextOf(req), { action: 'PASSWORD_CHANGED', actorId: req.userId });
  setSession(res, req.userId, tv).status(204).end();
});
api.post('/categories', async (req, res) => { res.status(201).json(await categories.createCategory(req.userId, categoryInput.parse(req.body))); });
api.delete('/categories/:id', async (req, res) => { await categories.deleteCategory(req.userId, idParam.parse(req.params).id); res.status(204).end(); });

api.get('/reports/export', async (req, res) => {
  const { from, to, label } = reportQuery.parse(req.query);
  const file = await reports.buildReport(req.userId, from, to, label);
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment('reporte-financiero.xlsx').send(Buffer.from(file));
});
api.get('/transactions', async (req, res) => { res.json(await tx.listTransactions(req.userId, txQuery.parse(req.query))); });
api.post('/transactions', async (req, res) => { res.status(201).json(await tx.createTransaction(req.userId, txInput.parse(req.body))); });
api.put('/transactions/:id', async (req, res) => {
  res.json(await tx.updateTransaction(req.userId, idParam.parse(req.params).id, txInput.parse(req.body)));
});
api.delete('/transactions/:id', async (req, res) => { await tx.deleteTransaction(req.userId, idParam.parse(req.params).id); res.status(204).end(); });

api.get('/goals', async (req, res) => { res.json(await goals.listGoals(req.userId)); });
api.post('/goals', async (req, res) => { res.status(201).json(await goals.createGoal(req.userId, goalInput.parse(req.body))); });

api.put('/goals/:id', async (req, res) => { res.json(await goals.updateGoal(req.userId, idParam.parse(req.params).id, goalInput.parse(req.body))); });
api.delete('/goals/:id', async (req, res) => { await goals.deleteGoal(req.userId, idParam.parse(req.params).id); res.status(204).end(); });

api.get('/statistics/summary', async (req, res) => {
  const { from, to } = periodQuery.parse(req.query);
  res.json(await periodSummary(req.userId, from, to));
});
api.get('/statistics/monthly', async (req, res) => { res.json(await monthlySeries(req.userId, monthsQuery.parse(req.query).months)); });

export default api;
