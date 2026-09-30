import { jsPDF } from 'jspdf';
import { LABELS } from '../components/TransactionItem';
import type { Page, PeriodSummary, Transaction, User } from '../types';
import { formatMoney } from './format';

type Rgb = [number, number, number];
interface Col { header: string; width: number; right?: boolean }

const NAVY: Rgb = [16, 27, 51], ZEBRA: Rgb = [243, 246, 250], LINE: Rgb = [214, 221, 232], TEXT: Rgb = [30, 41, 59];
const LEFT = 15, ROW_H = 7;
const SIGN = { INCOME: '+', EXPENSE: '-', TRANSFER: '', SAVING: '' } as const;
const cents = (v: string) => Math.round(Number(v) * 100);

/** Dibuja una tabla con encabezado, filas alternadas y saltos de página; devuelve la nueva posición vertical. */
function table(doc: jsPDF, y: number, cols: Col[], rows: string[][], boldLast = 0): number {
  const total = cols.reduce((s, c) => s + c.width, 0);
  const hasHeader = cols.some((c) => c.header);
  const cells = (top: number, values: string[]) => {
    let x = LEFT;
    cols.forEach((c, i) => {
      const text = doc.splitTextToSize(values[i] ?? '', c.width - 4)[0] ?? '';
      doc.text(text, c.right ? x + c.width - 2 : x + 2, top + 4.8, { align: c.right ? 'right' : 'left' });
      x += c.width;
    });
  };
  const header = (top: number) => {
    doc.setFillColor(...NAVY); doc.rect(LEFT, top, total, ROW_H, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    cells(top, cols.map((c) => c.header));
    return top + ROW_H;
  };
  if (hasHeader) y = header(y);
  rows.forEach((row, i) => {
    if (y + ROW_H > 282) { doc.addPage(); y = 20; if (hasHeader) y = header(y); }
    if (i % 2) { doc.setFillColor(...ZEBRA); doc.rect(LEFT, y, total, ROW_H, 'F'); }
    doc.setDrawColor(...LINE); doc.line(LEFT, y + ROW_H, LEFT + total, y + ROW_H);
    doc.setFont('helvetica', i >= rows.length - boldLast ? 'bold' : 'normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
    cells(y, row);
    y += ROW_H;
  });
  return y + 6;
}

export function downloadReportPdf({ user, periodLabel, summary: s, txs }: { user: User; periodLabel: string; summary: PeriodSummary; txs: Page<Transaction> | null }) {
  const doc = new jsPDF();
  let y = 22;
  const section = (text: string) => {
    if (y > 262) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...TEXT); doc.text(text, LEFT, y); y += 4;
  };
  const note = (text: string) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 130, 145); doc.text(text, LEFT, y + 4); y += 10; };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...NAVY); doc.text('Reporte financiero', LEFT, y); y += 8;
  y = table(doc, y, [{ header: '', width: 45 }, { header: '', width: 135 }], [
    ['Nombre', user.name || user.email], ['Correo', user.email], ['Período', periodLabel], ['Generado', new Date().toLocaleDateString('es-EC')],
  ]);

  const net = (cents(s.income) - cents(s.expense)) / 100;
  section('Resumen');
  y = table(doc, y, [{ header: 'Concepto', width: 120 }, { header: 'Monto', width: 60, right: true }], [
    ['Ingresos', formatMoney(s.income)], ['Gastos', formatMoney(s.expense)], ['Ahorro', formatMoney(s.saving)],
    [net < 0 ? 'Pérdida del período' : 'Ganancia del período', formatMoney(net.toFixed(2))], ['Saldo total', formatMoney(s.totalBalance)],
  ], 2);

  section('Gastos por categoría');
  if (s.expenseByCategory.length === 0) note('Sin gastos en este período');
  else {
    const total = cents(s.expense);
    y = table(doc, y, [{ header: 'Categoría', width: 100 }, { header: 'Monto', width: 45, right: true }, { header: '%', width: 35, right: true }],
      s.expenseByCategory.map((c) => [c.name, formatMoney(c.amount), total ? `${((cents(c.amount) / total) * 100).toFixed(1)}%` : '0%']));
  }

  section('Movimientos');
  if (!txs || txs.items.length === 0) note('Sin movimientos en este período');
  else {
    y = table(doc, y, [{ header: 'Fecha', width: 24 }, { header: 'Tipo', width: 26 }, { header: 'Descripción', width: 52 }, { header: 'Categoría', width: 28 }, { header: 'Cuenta', width: 22 }, { header: 'Monto', width: 28, right: true }],
      txs.items.map((t) => [new Date(t.date).toLocaleDateString('es-EC'), LABELS[t.type], t.description, t.category?.name ?? '-', t.toAccount ? `${t.account.name} > ${t.toAccount.name}` : t.account.name, `${SIGN[t.type]}${formatMoney(t.amount)}`]));
    if (txs.total > txs.items.length) note(`Se muestran ${txs.items.length} de ${txs.total} movimientos`);
  }
  doc.save('reporte-financiero.pdf');
}
