import { describe, expect, it } from 'vitest';
import { addTx, balances, createAccount, createGoal, m, signup, summary } from './helpers.js';

describe('metas y ahorros', () => {
  it('calcula el progreso de la meta desde los aportes (520 de 900)', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '1000' });
    const goal = await createGoal(agent, '900');
    await addTx(agent, { type: 'SAVING', amount: '520', accountId: acc.id, goalId: goal.id });
    const [g] = (await agent.get('/api/goals')).body as { current: string; remaining: string; percent: string }[];
    expect([m(g!.current), m(g!.remaining), Number(g!.percent)]).toEqual(['520.00', '380.00', 57.8]);
  });

  it('el ahorro cuenta como ahorro y no cambia el saldo total', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '1000' });
    const goal = await createGoal(agent);
    await addTx(agent, { type: 'SAVING', amount: '200', accountId: acc.id, goalId: goal.id });
    const s = await summary(agent);
    expect([m(s.saving), m(s.totalBalance)]).toEqual(['200.00', '1000.00']);
    expect(m((await balances(agent))[0]!.balance)).toBe('1000.00');
  });

  it('avisa cuando la meta se completa', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    const goal = await createGoal(agent, '100');
    await addTx(agent, { type: 'SAVING', amount: '100', accountId: acc.id, goalId: goal.id });
    const notices = (await agent.get('/api/notifications')).body as { message: string }[];
    expect(notices.some((n) => n.message.includes('Completaste tu meta'))).toBe(true);
  });

  it('no permite eliminar una meta con aportes, pero sí sin ellos', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    const goal = await createGoal(agent);
    const contribution = await addTx(agent, { type: 'SAVING', amount: '50', accountId: acc.id, goalId: goal.id });
    expect((await agent.delete(`/api/goals/${goal.id}`)).status).toBe(409);
    await agent.delete(`/api/transactions/${contribution.body.id}`);
    expect((await agent.delete(`/api/goals/${goal.id}`)).status).toBe(204);
  });
});
