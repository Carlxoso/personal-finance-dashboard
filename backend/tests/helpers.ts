import { Prisma } from '@prisma/client';
import request from 'supertest';
import { app } from '../src/app.js';
import { createUser } from '../src/services/auth.service.js';

export type Agent = ReturnType<typeof request.agent>;
export const PASSWORD = 'clave-segura-123';
/** Normaliza un monto a 2 decimales para compararlo exactamente. */
export const m = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v).toFixed(2);

/** El primer usuario se registra (queda como administrador); los demás se crean como lo haría el admin, porque el registro está cerrado. */
export async function signup(email = 'ana@test.com', name = 'Ana') {
  const agent = request.agent(app);
  const first = await agent.post('/api/auth/register').send({ email, password: PASSWORD, name });
  if (first.status === 201) return { agent, user: first.body as { id: string; role: 'ADMIN' | 'USER' } };
  const created = await createUser({ email, password: PASSWORD, name, role: 'USER' });
  await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  return { agent, user: { id: created.id, role: created.role as 'ADMIN' | 'USER' } };
}
export async function createAccount(agent: Agent, body: Record<string, unknown> = {}) {
  return (await agent.post('/api/accounts').send({ name: 'Efectivo', type: 'Efectivo', initialBalance: '100', ...body })).body as { id: string };
}
export async function categoryId(agent: Agent, kind: 'INCOME' | 'EXPENSE', name: string) {
  const list = (await agent.get('/api/categories')).body as { id: string; kind: string; name: string }[];
  return list.find((c) => c.kind === kind && c.name === name)!.id;
}
export const addTx = (agent: Agent, body: Record<string, unknown>) =>
  agent.post('/api/transactions').send({ description: 'Movimiento', date: new Date().toISOString(), ...body });
export const createGoal = async (agent: Agent, target = '900') => (await agent.post('/api/goals').send({ name: 'Comprar PC', target })).body as { id: string };
export const balances = async (agent: Agent) => (await agent.get('/api/accounts')).body as { id: string; balance: string }[];
export const summary = async (agent: Agent) => {
  const to = new Date(Date.now() + 864e5).toISOString();
  const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
  return (await agent.get('/api/statistics/summary').query({ from, to })).body as { totalBalance: string; income: string; expense: string; saving: string };
};
