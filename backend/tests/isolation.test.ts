import { beforeEach, describe, expect, it } from 'vitest';
import { addTx, balances, categoryId, createAccount, createGoal, m, signup, summary, type Agent } from './helpers.js';

describe('aislamiento entre usuarios', () => {
  let ana: Agent, beto: Agent;
  let account: { id: string }, tx: { id: string }, goal: { id: string }, category: string;

  beforeEach(async () => {
    ana = (await signup('ana@test.com', 'Ana')).agent;
    beto = (await signup('beto@test.com', 'Beto')).agent;
    account = await createAccount(ana, { initialBalance: '500' });
    category = await categoryId(ana, 'EXPENSE', 'Comida');
    goal = await createGoal(ana);
    tx = (await addTx(ana, { type: 'EXPENSE', amount: '25', accountId: account.id, categoryId: category })).body;
  });

  it('un usuario no ve datos de otro', async () => {
    expect(await balances(beto)).toEqual([]);
    expect((await beto.get('/api/transactions')).body.total).toBe(0);
    expect((await beto.get('/api/goals')).body).toEqual([]);
    const s = await summary(beto);
    expect([m(s.totalBalance), m(s.expense)]).toEqual(['0.00', '0.00']);
  });

  it('no puede registrar movimientos en cuentas ajenas', async () => {
    expect((await addTx(beto, { type: 'INCOME', amount: '10', accountId: account.id })).status).toBe(404);
  });

  it('no puede usar categorías ni metas ajenas en sus propios movimientos', async () => {
    const mine = await createAccount(beto);
    expect((await addTx(beto, { type: 'EXPENSE', amount: '10', accountId: mine.id, categoryId: category })).status).toBe(404);
    expect((await addTx(beto, { type: 'SAVING', amount: '10', accountId: mine.id, goalId: goal.id })).status).toBe(404);
  });

  it('no puede editar ni eliminar recursos ajenos', async () => {
    const body = { type: 'EXPENSE', amount: '1', description: 'x', date: new Date().toISOString(), accountId: account.id, categoryId: category };
    expect((await beto.put(`/api/transactions/${tx.id}`).send(body)).status).toBe(404);
    expect((await beto.delete(`/api/transactions/${tx.id}`)).status).toBe(404);
    expect((await beto.delete(`/api/accounts/${account.id}`)).status).toBe(404);
    expect((await beto.delete(`/api/goals/${goal.id}`)).status).toBe(404);
    expect((await ana.get('/api/transactions')).body.total).toBe(1);   // lo de Ana sigue intacto
    expect(m((await balances(ana))[0]!.balance)).toBe('475.00');
  });
});
