import { describe, expect, it } from 'vitest';
import { addTx, balances, categoryId, createAccount, m, signup, summary } from './helpers.js';

describe('saldos y cálculos de dinero', () => {
  it('saldo = inicial + ingresos - gastos', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '100' });
    await addTx(agent, { type: 'INCOME', amount: '50.25', accountId: acc.id, categoryId: await categoryId(agent, 'INCOME', 'Salario') });
    await addTx(agent, { type: 'EXPENSE', amount: '20.10', accountId: acc.id, categoryId: await categoryId(agent, 'EXPENSE', 'Comida') });
    expect(m((await balances(agent))[0]!.balance)).toBe('130.15');
    const s = await summary(agent);
    expect([m(s.totalBalance), m(s.income), m(s.expense)]).toEqual(['130.15', '50.25', '20.10']);
  });

  it('no arrastra errores de punto flotante (0.1 + 0.2)', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '0' });
    const category = await categoryId(agent, 'INCOME', 'Otros');
    await addTx(agent, { type: 'INCOME', amount: '0.10', accountId: acc.id, categoryId: category });
    await addTx(agent, { type: 'INCOME', amount: '0.20', accountId: acc.id, categoryId: category });
    expect(m((await balances(agent))[0]!.balance)).toBe('0.30');
  });

  it('una transferencia mueve dinero entre cuentas sin contar como ingreso ni gasto', async () => {
    const { agent } = await signup();
    const a = await createAccount(agent, { name: 'Banco', initialBalance: '100' });
    const b = await createAccount(agent, { name: 'Efectivo', initialBalance: '0' });
    expect((await addTx(agent, { type: 'TRANSFER', amount: '40', accountId: a.id, toAccountId: b.id })).status).toBe(201);
    const byId = Object.fromEntries((await balances(agent)).map((x) => [x.id, m(x.balance)]));
    expect(byId).toEqual({ [a.id]: '60.00', [b.id]: '40.00' });
    const s = await summary(agent);
    expect([m(s.income), m(s.expense), m(s.totalBalance)]).toEqual(['0.00', '0.00', '100.00']);
  });

  it('eliminar un movimiento devuelve el saldo anterior', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent, { initialBalance: '100' });
    const res = await addTx(agent, { type: 'EXPENSE', amount: '30', accountId: acc.id, categoryId: await categoryId(agent, 'EXPENSE', 'Comida') });
    expect(m((await balances(agent))[0]!.balance)).toBe('70.00');
    expect((await agent.delete(`/api/transactions/${res.body.id}`)).status).toBe(204);
    expect(m((await balances(agent))[0]!.balance)).toBe('100.00');
  });
});
