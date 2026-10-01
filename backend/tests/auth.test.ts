import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { PASSWORD, signup } from './helpers.js';

describe('autenticación', () => {
  it('guarda la contraseña con hash (argon2) y abre sesión', async () => {
    const { agent, user } = await signup();
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toMatch(/^\$argon2/);
    expect(stored.passwordHash).not.toContain(PASSWORD);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('rechaza contraseñas cortas', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@test.com', password: 'corta', name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rechaza credenciales incorrectas y acepta las correctas', async () => {
    await signup('ana@test.com');
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@test.com', password: 'incorrecta-123' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@test.com', password: PASSWORD })).status).toBe(200);
  });

  it('exige sesión en las rutas protegidas', async () => {
    for (const path of ['/api/accounts', '/api/transactions', '/api/goals', '/api/statistics/summary']) {
      expect((await request(app).get(path)).status).toBe(401);
    }
  });

  it('el primer usuario es administrador y solo él ve la lista de usuarios', async () => {
    const admin = await signup('admin@test.com', 'Admin');
    const normal = await signup('user@test.com', 'User');
    expect([admin.user.role, normal.user.role]).toEqual(['ADMIN', 'USER']);
    expect((await admin.agent.get('/api/admin/users')).status).toBe(200);
    expect((await normal.agent.get('/api/admin/users')).status).toBe(403);
  });
});
