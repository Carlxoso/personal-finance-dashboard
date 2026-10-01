import ExcelJS from 'exceljs';
import { notFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { periodSummary } from './statistics.service.js';

const NAVY = 'FF101B33';
const MONEY = '"$"#,##0.00;[Red]-"$"#,##0.00';
const ZEBRA: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } };
const LINE: Partial<ExcelJS.Borders> = { bottom: { style: 'thin', color: { argb: 'FFD6DDE8' } } };
const TYPES = { INCOME: 'Ingreso', EXPENSE: 'Gasto', TRANSFER: 'Transferencia', SAVING: 'Ahorro' } as const;

interface Column { header: string; width: number; fmt?: string }

/** Hoja con encabezado, filas alternadas, bordes finos, encabezado fijo y filtros. */
function addTable(wb: ExcelJS.Workbook, name: string, columns: Column[], rows: (string | number | Date)[][]) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  head.height = 22; head.alignment = { vertical: 'middle' };
  rows.forEach((values, i) => {
    const row = ws.addRow(values);
    columns.forEach((c, j) => { if (c.fmt) row.getCell(j + 1).numFmt = c.fmt; });
    if (i % 2) row.fill = ZEBRA;
    row.border = LINE;
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
}

/** Libro de Excel del período: Resumen, Gastos por categoría y Movimientos. */
export async function buildReport(userId: string, from: Date, to: Date, label: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) throw notFound();
  const [s, txs] = await Promise.all([
    periodSummary(userId, from, to),
    prisma.transaction.findMany({ where: { userId, date: { gte: from, lte: to } }, orderBy: { date: 'asc' }, take: 10000, include: { category: true, account: true, toAccount: true } }),
  ]);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Finanzas';

  const summary = wb.addWorksheet('Resumen');
  summary.columns = [{ width: 30 }, { width: 34 }];
  summary.addRow(['Reporte financiero']).font = { bold: true, size: 16 };
  summary.addRow([]);
  [['Nombre', user.name || user.email], ['Correo', user.email], ['Período', label || 'Personalizado'], ['Generado', new Date()]].forEach(([k, v]) => {
    const row = summary.addRow([k, v]);
    row.getCell(1).font = { bold: true };
    if (v instanceof Date) row.getCell(2).numFmt = 'dd/mm/yyyy';
    row.getCell(2).alignment = { horizontal: 'left' };
  });
  summary.addRow([]);
  const head = summary.addRow(['Concepto', 'Monto']);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  const net = s.income.minus(s.expense);
  const lines: [string, number, boolean][] = [
    ['Ingresos', s.income.toNumber(), false], ['Gastos', s.expense.toNumber(), false], ['Ahorro', s.saving.toNumber(), false],
    [net.isNegative() ? 'Pérdida del período' : 'Ganancia del período', net.toNumber(), true], ['Saldo total', s.totalBalance.toNumber(), true],
  ];
  lines.forEach(([k, v, bold]) => {
    const row = summary.addRow([k, v]);
    row.getCell(2).numFmt = MONEY; row.font = { bold }; row.border = LINE;
  });

  const total = s.expense.toNumber();
  addTable(wb, 'Gastos por categoría', [{ header: 'Categoría', width: 28 }, { header: 'Monto', width: 16, fmt: MONEY }, { header: '% del gasto', width: 14, fmt: '0.0%' }],
    s.expenseByCategory.map((c) => [c.name, c.amount.toNumber(), total ? c.amount.toNumber() / total : 0]));

  addTable(wb, 'Movimientos', [
    { header: 'Fecha', width: 12, fmt: 'dd/mm/yyyy' }, { header: 'Tipo', width: 15 }, { header: 'Descripción', width: 36 }, { header: 'Categoría', width: 18 },
    { header: 'Cuenta', width: 18 }, { header: 'Destino', width: 18 }, { header: 'Monto', width: 14, fmt: MONEY },
  ], txs.map((t) => [t.date, TYPES[t.type], t.description, t.category?.name ?? '', t.account.name, t.toAccount?.name ?? '', t.type === 'EXPENSE' ? -t.amount.toNumber() : t.amount.toNumber()]));

  return wb.xlsx.writeBuffer();
}
