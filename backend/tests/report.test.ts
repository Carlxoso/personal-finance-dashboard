import ExcelJS from 'exceljs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { addTx, categoryId, createAccount, signup } from './helpers.js';

const binary = (res: NodeJS.ReadableStream, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};
const range = { from: new Date(new Date().getFullYear(), 0, 1).toISOString(), to: new Date(Date.now() + 864e5).toISOString() };

describe('reporte en Excel', () => {
  it('exige sesión', async () => {
    expect((await request(app).get('/api/reports/export').query(range)).status).toBe(401);
  });

  it('genera un .xlsx con las tres hojas, montos numéricos y texto sin fórmulas activas', async () => {
    const { agent } = await signup();
    const acc = await createAccount(agent);
    await addTx(agent, { type: 'EXPENSE', amount: '12.50', accountId: acc.id, categoryId: await categoryId(agent, 'EXPENSE', 'Comida'), description: '=SUM(A1)' });
    const res = await agent.get('/api/reports/export').query({ ...range, label: 'Este año' }).buffer(true).parse(binary);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Resumen', 'Gastos por categoría', 'Movimientos']);
    const row = wb.getWorksheet('Movimientos')!.getRow(2);
    expect([row.getCell(3).value, row.getCell(7).value]).toEqual(['=SUM(A1)', -12.5]);
  });
});
