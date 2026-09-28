import { Prisma } from '@prisma/client';

export type Money = Prisma.Decimal;
export const money = (v: Prisma.Decimal.Value = 0): Money => new Prisma.Decimal(v);
export const sum = (values: Money[]): Money => values.reduce((a, b) => a.plus(b), money(0));
