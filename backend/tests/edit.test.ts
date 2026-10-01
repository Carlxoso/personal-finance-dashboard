import { describe, expect, it } from 'vitest';
import { addTx, balances, categoryId, createAccount, createGoal, m, signup } from './helpers.js';

describe('edición de cuentas y metas', () => {
  it('editar el saldo inicial de una cuenta recalcula su saldo', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '100' });
    const res = await agent.put(`/api/accounts/${acc.id}`).send({ name: 'Efectivo', type: 'Efectivo', initialBalance: '250' });
    expect(res.status).toBe(200);
    expect(m((await balances(agent))[0]!.balance)).toBe('250.00');
  });

  it('no permite dos cuentas con el mismo nombre', async () => {
    const { agent } = await signup();
    await createAccount(agent, { name: 'Banco' });
    expect((await agent.post('/api/accounts').send({ name: 'Banco', type: 'Banco' })).status).toBe(409);
    const other = await createAccount(agent, { name: 'Efectivo' });
    expect((await agent.put(`/api/accounts/${other.id}`).send({ name: 'Banco', type: 'Efectivo' })).status).toBe(409);
  });

  it('editar la meta cambia el objetivo y el porcentaje', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    const goal = await createGoal(agent, '900');
    await addTx(agent, { type: 'SAVING', amount: '450', accountId: acc.id, goalId: goal.id });
    expect((await agent.put(`/api/goals/${goal.id}`).send({ name: 'Comprar PC', target: '1000' })).status).toBe(200);
    const [g] = (await agent.get('/api/goals')).body as { percent: string }[];
    expect(Number(g!.percent)).toBe(45);
  });

  it('un usuario no puede editar cuentas ni metas ajenas', async () => {
    const ana = await signup('ana@test.com', 'Ana');
    const beto = await signup('beto@test.com', 'Beto');
    const acc = await createAccount(ana.agent);
    const goal = await createGoal(ana.agent);
    expect((await beto.agent.put(`/api/accounts/${acc.id}`).send({ name: 'X', type: 'Banco' })).status).toBe(404);
    expect((await beto.agent.put(`/api/goals/${goal.id}`).send({ name: 'X', target: '10' })).status).toBe(404);
  });
});

describe('historial: búsqueda, fechas y paginación', () => {
  it('busca por texto y filtra por rango de fechas', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    const category = await categoryId(agent, 'EXPENSE', 'Comida');
    await addTx(agent, { type: 'EXPENSE', amount: '5', accountId: acc.id, categoryId: category, description: 'Café con leche' });
    await addTx(agent, { type: 'EXPENSE', amount: '7', accountId: acc.id, categoryId: category, description: 'Almuerzo' });
    await addTx(agent, { type: 'EXPENSE', amount: '9', accountId: acc.id, categoryId: category, description: 'Cena antigua', date: '2020-01-15T12:00:00.000Z' });
    expect((await agent.get('/api/transactions').query({ search: 'café' })).body.total).toBe(1);
    expect((await agent.get('/api/transactions').query({ from: '2019-12-31T00:00:00.000Z', to: '2020-02-01T00:00:00.000Z' })).body.total).toBe(1);
  });

  it('pagina los resultados', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    for (let i = 0; i < 3; i++) await addTx(agent, { type: 'INCOME', amount: '1', accountId: acc.id, categoryId: await categoryId(agent, 'INCOME', 'Salario') });
    const page2 = (await agent.get('/api/transactions').query({ pageSize: 2, page: 2 })).body;
    expect([page2.total, page2.items.length]).toEqual([3, 1]);
  });
});
