import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { PASSWORD, signup } from './helpers.js';

const NEW_PASSWORD = 'otra-clave-segura-1';

async function adminWithTempUser() {
  const admin = await signup('admin@test.com', 'Admin');
  const created = await admin.agent.post('/api/admin/users').send({ email: 'beto@test.com', password: PASSWORD, name: 'Beto' });
  const beto = request.agent(app);
  await beto.post('/api/auth/login').send({ email: 'beto@test.com', password: PASSWORD });
  return { admin, beto, betoId: created.body.id as string };
}

describe('contraseña temporal', () => {
  it('el primer administrador no debe cambiar su contraseña', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    expect((await agent.get('/api/auth/me')).body.mustChangePassword).toBe(false);
  });

  it('un usuario creado por el admin debe cambiarla antes de usar la app', async () => {
    const { beto } = await adminWithTempUser();
    expect((await beto.get('/api/auth/me')).body.mustChangePassword).toBe(true);
    const blocked = await beto.get('/api/accounts');
    expect([blocked.status, blocked.body.error.code]).toEqual([403, 'PASSWORD_CHANGE_REQUIRED']);
    expect((await beto.post('/api/auth/password').send({ current: PASSWORD, next: NEW_PASSWORD })).status).toBe(204);
    expect((await beto.get('/api/accounts')).status).toBe(200);
    expect((await beto.get('/api/auth/me')).body.mustChangePassword).toBe(false);
  });

  it('no acepta la misma contraseña como nueva', async () => {
    const { beto } = await adminWithTempUser();
    expect((await beto.post('/api/auth/password').send({ current: PASSWORD, next: PASSWORD })).status).toBe(400);
  });

  it('al restablecer la clave, el usuario debe cambiarla de nuevo', async () => {
    const { admin, beto, betoId } = await adminWithTempUser();
    await beto.post('/api/auth/password').send({ current: PASSWORD, next: NEW_PASSWORD });
    expect((await admin.agent.post(`/api/admin/users/${betoId}/password`).send({ password: 'clave-temporal-nueva-2' })).status).toBe(204);
    const again = request.agent(app);
    await again.post('/api/auth/login').send({ email: 'beto@test.com', password: 'clave-temporal-nueva-2' });
    expect((await again.get('/api/accounts')).status).toBe(403);
  });
});
