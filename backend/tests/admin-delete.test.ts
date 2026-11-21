import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { PASSWORD, addTx, categoryId, createAccount, createGoal, signup } from './helpers.js';

describe('eliminar usuario permanentemente', () => {
  it('borra al usuario con todos sus datos y lo registra en la bitácora', async () => {
    const { agent: admin } = await signup('admin@test.com', 'Admin');
    const { agent: ana, user } = await signup('ana@test.com', 'Ana');
    const cash = await createAccount(ana);
    const bank = await createAccount(ana, { name: 'Banco', type: 'Banco' });
    const goal = await createGoal(ana);
    await addTx(ana, { type: 'EXPENSE', amount: '10', accountId: cash.id, categoryId: await categoryId(ana, 'EXPENSE', 'Comida') });
    await addTx(ana, { type: 'TRANSFER', amount: '5', accountId: cash.id, toAccountId: bank.id });
    await addTx(ana, { type: 'SAVING', amount: '20', accountId: bank.id, goalId: goal.id });

    const res = await admin.delete(`/api/admin/users/${user.id}`).send({ confirmEmail: 'ANA@test.com ' });
    expect(res.status).toBe(200);
    expect(res.body.removed).toEqual({ transactions: 3, accounts: 2, goals: 1 });

    const where = { userId: user.id };
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0);
    expect([await prisma.account.count({ where }), await prisma.transaction.count({ where }), await prisma.goal.count({ where }), await prisma.category.count({ where })]).toEqual([0, 0, 0, 0]);
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@test.com', password: PASSWORD })).status).toBe(401);

    const log = await prisma.auditLog.findFirst({ where: { action: 'USER_DELETED' } });
    expect(log).toMatchObject({ targetId: user.id, targetEmail: 'ana@test.com', actorEmail: 'admin@test.com' });
    expect(log!.details).toEqual({ removed: { transactions: 3, accounts: 2, goals: 1 } });
  });

  it('la sesión abierta del usuario eliminado deja de funcionar', async () => {
    const { agent: admin } = await signup('admin@test.com', 'Admin');
    const { agent: ana, user } = await signup('ana@test.com', 'Ana');
    await admin.delete(`/api/admin/users/${user.id}`).send({ confirmEmail: 'ana@test.com' });
    expect((await ana.get('/api/auth/me')).status).toBe(401);
  });

  it('exige escribir el correo exacto', async () => {
    const { agent: admin } = await signup('admin@test.com', 'Admin');
    const { user } = await signup('ana@test.com', 'Ana');
    const wrong = await admin.delete(`/api/admin/users/${user.id}`).send({ confirmEmail: 'otra@test.com' });
    expect([wrong.status, wrong.body.error.code]).toEqual([400, 'CONFIRMATION_MISMATCH']);
    expect((await admin.delete(`/api/admin/users/${user.id}`)).status).toBe(400);   // sin confirmación
    expect(await prisma.user.count({ where: { id: user.id } })).toBe(1);
  });

  it('no permite eliminarse a sí mismo ni a un administrador', async () => {
    const { agent: admin, user: me } = await signup('admin@test.com', 'Admin');
    const self = await admin.delete(`/api/admin/users/${me.id}`).send({ confirmEmail: 'admin@test.com' });
    expect([self.status, self.body.error.code]).toEqual([400, 'SELF']);

    const { user: other } = await signup('jefa@test.com', 'Jefa');
    await prisma.user.update({ where: { id: other.id }, data: { role: 'ADMIN' } });
    const res = await admin.delete(`/api/admin/users/${other.id}`).send({ confirmEmail: 'jefa@test.com' });
    expect([res.status, res.body.error.code]).toEqual([400, 'ADMIN_PROTECTED']);
  });

  it('un usuario normal no puede eliminar a nadie', async () => {
    await signup('admin@test.com', 'Admin');
    const { agent: ana } = await signup('ana@test.com', 'Ana');
    const { user: beto } = await signup('beto@test.com', 'Beto');
    expect((await ana.delete(`/api/admin/users/${beto.id}`).send({ confirmEmail: 'beto@test.com' })).status).toBe(403);
    expect(await prisma.user.count({ where: { id: beto.id } })).toBe(1);
  });

  it('responde 404 si el usuario no existe', async () => {
    const { agent: admin } = await signup('admin@test.com', 'Admin');
    expect((await admin.delete('/api/admin/users/no-existe').send({ confirmEmail: 'x@test.com' })).status).toBe(404);
  });
});
