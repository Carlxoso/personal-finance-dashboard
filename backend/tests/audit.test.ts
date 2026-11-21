import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { PASSWORD, signup } from './helpers.js';

const logs = () => prisma.auditLog.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
const actions = async () => (await logs()).map((l) => l.action);
const login = (email: string, password = PASSWORD) => request(app).post('/api/auth/login').send({ email, password });

describe('bitácora', () => {
  it('registra el alta del administrador y los ingresos correctos', async () => {
    const { user } = await signup('admin@test.com', 'Admin');
    await login('admin@test.com');
    const entries = await logs();
    expect(entries.map((l) => l.action)).toEqual(['ADMIN_REGISTERED', 'LOGIN_SUCCESS']);
    expect(entries[1]).toMatchObject({ actorId: user.id, actorEmail: 'admin@test.com' });
  });

  it('registra los ingresos fallidos con su motivo, sin cambiar la respuesta al cliente', async () => {
    await signup('admin@test.com', 'Admin');
    const unknown = await login('nadie@test.com');
    const wrong = await login('admin@test.com', 'otra-clave-123');
    // Mismo estado y mensaje: no se revela si el correo existe.
    expect([unknown.status, unknown.body.error.message]).toEqual([wrong.status, wrong.body.error.message]);

    const failed = (await logs()).filter((l) => l.action === 'LOGIN_FAILED');
    expect(failed.map((l) => [l.actorEmail, (l.details as { reason: string }).reason])).toEqual([
      ['nadie@test.com', 'UNKNOWN_EMAIL'],
      ['admin@test.com', 'WRONG_PASSWORD'],
    ]);
    expect(failed[0]!.actorId).toBeNull();
  });

  it('un usuario desactivado con la clave correcta queda como INACTIVE', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    const { user } = await signup('ana@test.com', 'Ana');
    await agent.patch(`/api/admin/users/${user.id}`).send({ active: false });
    expect((await login('ana@test.com')).status).toBe(401);
    const last = (await logs()).at(-1)!;
    expect([last.action, (last.details as { reason: string }).reason]).toEqual(['LOGIN_FAILED', 'INACTIVE']);
  });

  it('registra las acciones del administrador con quién lo hizo y a quién', async () => {
    const { agent, user: admin } = await signup('admin@test.com', 'Admin');
    const created = (await agent.post('/api/admin/users').send({ email: 'luis@test.com', password: PASSWORD, name: 'Luis' })).body as { id: string };
    await agent.post(`/api/admin/users/${created.id}/password`).send({ password: 'temporal-12345' });
    await agent.patch(`/api/admin/users/${created.id}`).send({ active: false });
    await agent.patch(`/api/admin/users/${created.id}`).send({ active: true });

    const adminEvents = (await logs()).filter((l) => l.action.startsWith('USER_'));
    expect(adminEvents.map((l) => l.action)).toEqual(['USER_CREATED', 'USER_PASSWORD_RESET', 'USER_DEACTIVATED', 'USER_ACTIVATED']);
    for (const e of adminEvents) expect(e).toMatchObject({ actorId: admin.id, actorEmail: 'admin@test.com', targetId: created.id, targetEmail: 'luis@test.com' });
  });

  it('nunca guarda contraseñas', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    const created = (await agent.post('/api/admin/users').send({ email: 'luis@test.com', password: PASSWORD, name: 'Luis' })).body as { id: string };
    await agent.post(`/api/admin/users/${created.id}/password`).send({ password: 'temporal-12345' });
    await login('admin@test.com', 'clave-incorrecta-1');
    const dump = JSON.stringify(await logs());
    for (const secret of [PASSWORD, 'temporal-12345', 'clave-incorrecta-1']) expect(dump).not.toContain(secret);
  });

  it('registra el cambio de contraseña, el de correo y el cierre de sesión', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    await agent.post('/api/auth/password').send({ current: PASSWORD, next: 'nueva-clave-123' });
    await agent.patch('/api/auth/me').send({ name: 'Admin', email: 'jefe@test.com' });
    await agent.post('/api/auth/logout');

    const entries = await logs();
    expect(entries.map((l) => l.action)).toEqual(['ADMIN_REGISTERED', 'PASSWORD_CHANGED', 'PROFILE_UPDATED', 'LOGOUT']);
    expect(entries[2]!.details).toEqual({ changed: ['email'], previousEmail: 'admin@test.com' });
    expect(entries[3]!.actorEmail).toBe('jefe@test.com');
  });

  it('solo el administrador puede leer la bitácora, y el intento queda registrado', async () => {
    await signup('admin@test.com', 'Admin');
    const { agent, user } = await signup('ana@test.com', 'Ana');
    expect((await agent.get('/api/admin/audit')).status).toBe(403);
    const denied = (await logs()).at(-1)!;
    expect(denied).toMatchObject({ action: 'ACCESS_DENIED', actorId: user.id, actorEmail: 'ana@test.com' });
    expect(denied.details).toEqual({ method: 'GET', path: '/api/admin/audit' });
  });

  it('el administrador consulta, filtra y busca en la bitácora', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    await login('admin@test.com', 'mala-clave-0001');
    await login('admin@test.com', 'mala-clave-0002');
    await agent.post('/api/admin/users').send({ email: 'luis@test.com', password: PASSWORD, name: 'Luis' });

    const all = (await agent.get('/api/admin/audit')).body as { items: { action: string }[]; total: number };
    expect(all.total).toBe(4);
    expect(all.items[0]!.action).toBe('USER_CREATED');   // más reciente primero

    const failed = (await agent.get('/api/admin/audit').query({ action: 'LOGIN_FAILED' })).body;
    expect(failed.total).toBe(2);

    const byEmail = (await agent.get('/api/admin/audit').query({ search: 'LUIS@' })).body;
    expect(byEmail.items.map((i: { action: string }) => i.action)).toEqual(['USER_CREATED']);

    const summary = (await agent.get('/api/admin/audit/summary')).body;
    expect(summary).toMatchObject({ failed24h: 2, admin7d: 1, topFailed: [{ email: 'admin@test.com', count: 2 }] });
  });

  it('si la bitácora falla, la acción principal sigue funcionando', async () => {
    await signup('admin@test.com', 'Admin');
    await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog" RENAME TO "AuditLog_off"');
    try {
      expect((await login('admin@test.com')).status).toBe(200);
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog_off" RENAME TO "AuditLog"');
    }
    expect(await actions()).toEqual(['ADMIN_REGISTERED']);
  });
});
