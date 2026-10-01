import { describe, expect, it } from 'vitest';
import { addTx, balances, categoryId, createAccount, m, signup } from './helpers.js';

describe('movimientos', () => {
  it.each(['0', '-5', '10.999', 'abc'])('rechaza el monto inválido "%s"', async (amount) => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    const res = await addTx(agent, { type: 'INCOME', amount, accountId: acc.id });
    expect(res.status).toBe(400);
  });

  it('rechaza una transferencia hacia la misma cuenta', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    expect((await addTx(agent, { type: 'TRANSFER', amount: '10', accountId: acc.id, toAccountId: acc.id })).status).toBe(400);
  });

  it('un ahorro exige una meta', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    expect((await addTx(agent, { type: 'SAVING', amount: '10', accountId: acc.id })).status).toBe(400);
  });

  it('editar un movimiento actualiza el saldo', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '100' });
    const category = await categoryId(agent, 'EXPENSE', 'Comida');
    const created = await addTx(agent, { type: 'EXPENSE', amount: '30', accountId: acc.id, categoryId: category });
    const res = await agent.put(`/api/transactions/${created.body.id}`).send({ type: 'EXPENSE', amount: '45.50', description: 'Editado', date: new Date().toISOString(), accountId: acc.id, categoryId: category });
    expect(res.status).toBe(200);
    expect(m((await balances(agent))[0]!.balance)).toBe('54.50');
  });

  it('filtra por tipo', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    await addTx(agent, { type: 'INCOME', amount: '10', accountId: acc.id, categoryId: await categoryId(agent, 'INCOME', 'Salario') });
    await addTx(agent, { type: 'EXPENSE', amount: '5', accountId: acc.id, categoryId: await categoryId(agent, 'EXPENSE', 'Comida') });
    const res = await agent.get('/api/transactions').query({ type: 'INCOME' });
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].type).toBe('INCOME');
  });
});
