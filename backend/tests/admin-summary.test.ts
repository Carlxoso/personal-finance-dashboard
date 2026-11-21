import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { PASSWORD, signup } from './helpers.js';

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);
const lastLogin = async (email: string) => (await prisma.user.findUnique({ where: { email }, select: { lastLoginAt: true } }))!.lastLoginAt;

describe('último acceso y resumen del administrador', () => {
  it('guarda el último acceso al registrarse y al iniciar sesión, pero no en un intento fallido', async () => {
    await signup('admin@test.com', 'Admin');
    expect(await lastLogin('admin@test.com')).toBeInstanceOf(Date);

    await prisma.user.update({ where: { email: 'admin@test.com' }, data: { lastLoginAt: daysAgo(10) } });
    await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'clave-mala-0001' });
    expect((await lastLogin('admin@test.com'))!.getTime()).toBeLessThan(daysAgo(9).getTime());

    await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: PASSWORD });
    expect((await lastLogin('admin@test.com'))!.getTime()).toBeGreaterThan(daysAgo(1).getTime());
  });

  it('la lista de usuarios incluye el último acceso', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    await agent.post('/api/admin/users').send({ email: 'luis@test.com', password: PASSWORD, name: 'Luis' });
    const users = (await agent.get('/api/admin/users')).body as { email: string; lastLoginAt: string | null }[];
    expect(users.find((u) => u.email === 'admin@test.com')!.lastLoginAt).not.toBeNull();
    expect(users.find((u) => u.email === 'luis@test.com')!.lastLoginAt).toBeNull();   // creado, pero nunca entró
  });

  it('el resumen cuenta usuarios activos, pendientes e inactivos por más de 90 días', async () => {
    const { agent } = await signup('admin@test.com', 'Admin');
    const make = async (email: string) =>
      (await agent.post('/api/admin/users').send({ email, password: PASSWORD, name: email })).body as { id: string };
    await make('nuevo@test.com');                         // clave temporal, nunca entró (creado hoy: no cuenta como +90 días)
    const viejo = await make('viejo@test.com');           // entró hace 120 días
    const fantasma = await make('fantasma@test.com');     // creado hace 100 días y nunca entró
    const baja = await make('baja@test.com');             // desactivado
    await prisma.user.update({ where: { id: viejo.id }, data: { lastLoginAt: daysAgo(120), mustChangePassword: false } });
    await prisma.user.update({ where: { id: fantasma.id }, data: { createdAt: daysAgo(100) } });
    await agent.patch(`/api/admin/users/${baja.id}`).send({ active: false });

    const { users, signupsByMonth, system } = (await agent.get('/api/admin/summary')).body;
    expect(users).toEqual({
      total: 5, active: 4, inactive: 1, admins: 1,
      pendingPassword: 2,        // nuevo y fantasma (baja no cuenta: está desactivado)
      active7d: 1,               // solo el admin
      newThisMonth: 4,           // fantasma tiene fecha de hace 100 días
      stale: 2,                  // viejo y fantasma
      neverLoggedIn: 2,          // nuevo y fantasma
    });
    expect(signupsByMonth).toHaveLength(6);
    expect(signupsByMonth.at(-1).count).toBe(4);
    expect(system.dbOk).toBe(true);
  });

  it('un usuario normal no puede ver el resumen', async () => {
    await signup('admin@test.com', 'Admin');
    const { agent } = await signup('ana@test.com', 'Ana');
    expect((await agent.get('/api/admin/summary')).status).toBe(403);
  });
});
