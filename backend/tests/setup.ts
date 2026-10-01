import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

// Los tests vacían las tablas: nunca deben correr contra la base de desarrollo.
const url = process.env.DATABASE_URL;
if (!url || !/test/i.test(new URL(url).pathname)) {
  throw new Error('DATABASE_URL debe apuntar a una base de pruebas (su nombre debe contener "test"). Revisa backend/.env.test');
}

beforeEach(async () => { await prisma.$executeRawUnsafe('TRUNCATE "User", "Account", "Category", "Goal", "Transaction" CASCADE'); });
afterAll(async () => { await prisma.$disconnect(); });
