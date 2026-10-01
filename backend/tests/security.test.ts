import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { PASSWORD, signup } from './helpers.js';

const me = (cookie: string) => request(app).get('/api/auth/me').set('Cookie', cookie);
const registerAdmin = async () => {
  const res = await request(app).post('/api/auth/register').send({ email: 'admin@test.com', password: PASSWORD, name: 'Admin' });
  return res.headers['set-cookie']![0]!.split(';')[0]!;   // "token=..."
};

describe('registro cerrado y sesiones', () => {
  it('el registro solo está abierto mientras no exista ningún usuario', async () => {
    expect((await request(app).get('/api/auth/status')).body.registrationOpen).toBe(true);
    await registerAdmin();
    expect((await request(app).get('/api/auth/status')).body.registrationOpen).toBe(false);
    const res = await request(app).post('/api/auth/register').send({ email: 'otro@test.com', password: PASSWORD, name: 'Otro' });
    expect([res.status, res.body.error.code]).toEqual([403, 'REGISTRATION_CLOSED']);
  });

  it('el admin crea usuarios que pueden iniciar sesión, sin repetir correos', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    const body = { email: 'nuevo@test.com', password: PASSWORD, name: 'Nuevo' };
    expect((await agent.post('/api/admin/users').send(body)).status).toBe(201);
    expect((await agent.post('/api/admin/users').send(body)).status).toBe(409);
    expect((await request(app).post('/api/auth/login').send({ email: body.email, password: PASSWORD })).status).toBe(200);
  });

  it('un usuario normal no puede crear usuarios', async () => {
    await signup('admin@test.com', 'Admin');
    const { agent } = await signup('user@test.com', 'User');
    expect((await agent.post('/api/admin/users').send({ email: 'x@test.com', password: PASSWORD, name: 'X' })).status).toBe(403);
  });

  it('cerrar sesión invalida el token', async () => {
    const cookie = await registerAdmin();
    expect((await me(cookie)).status).toBe(200);
    await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect((await me(cookie)).status).toBe(401);
  });

  it('cambiar la contraseña invalida las demás sesiones y mantiene la actual', async () => {
    const oldCookie = await registerAdmin();
    const res = await request(app).post('/api/auth/password').set('Cookie', oldCookie).send({ current: PASSWORD, next: 'nueva-clave-456' });
    expect(res.status).toBe(204);
    const newCookie = res.headers['set-cookie']![0]!.split(';')[0]!;
    expect((await me(oldCookie)).status).toBe(401);
    expect((await me(newCookie)).status).toBe(200);
  });

  it('un usuario desactivado pierde su sesión y no puede volver a entrar', async () => {
    const admin = await signup('admin@test.com', 'Admin');
    const beto = await signup('beto@test.com', 'Beto');
    expect((await beto.agent.get('/api/auth/me')).status).toBe(200);
    expect((await admin.agent.patch(`/api/admin/users/${beto.user.id}`).send({ active: false })).status).toBe(204);
    expect((await beto.agent.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'beto@test.com', password: PASSWORD })).status).toBe(401);
  });

  it('el admin no puede desactivarse a sí mismo', async () => {
    const admin = await signup('admin@test.com', 'Admin');
    expect((await admin.agent.patch(`/api/admin/users/${admin.user.id}`).send({ active: false })).status).toBe(400);
  });
});
