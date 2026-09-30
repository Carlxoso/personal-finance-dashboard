import { jsPDF } from 'jspdf';
import { LABELS } from '../components/TransactionItem';
import type { Page, PeriodSummary, Transaction, User } from '../types';
import { formatMoney } from './format';

const cents = (v: string) => Math.round(Number(v) * 100);
const SIGN = { INCOME: '+', EXPENSE: '-', TRANSFER: '', SAVING: '' } as const;

export function downloadReportPdf({ user, periodLabel, summary: s, txs }: { user: User; periodLabel: string; summary: PeriodSummary; txs: Page<Transaction> | null }) {
  const doc = new jsPDF();
  let y = 20;
  const room = () => { if (y > 280) { doc.addPage(); y = 20; } };
  const title = (text: string, size = 13) => { room(); y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(size); doc.text(text, 15, y); y += 8; };
  const row = (left: string, right: string, bold = false) => {
    room(); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(10);
    doc.text(left.slice(0, 75), 15, y); doc.text(right, 195, y, { align: 'right' }); y += 6;
  };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Reporte financiero', 15, y); y += 10;
  row('Nombre', user.name || user.email); row('Correo', user.email); row('Período', periodLabel); row('Generado', new Date().toLocaleDateString('es-EC'));

  const net = (cents(s.income) - cents(s.expense)) / 100;
  title('Resumen');
  row('Ingresos', formatMoney(s.income)); row('Gastos', formatMoney(s.expense)); row('Ahorro', formatMoney(s.saving));
  row(net < 0 ? 'Pérdida del período' : 'Ganancia del período', formatMoney(net.toFixed(2)), true);
  row('Saldo total', formatMoney(s.totalBalance), true);

  title('Gastos por categoría');
  if (s.expenseByCategory.length === 0) row('Sin gastos en este período', '');
  s.expenseByCategory.forEach((c) => row(c.name, formatMoney(c.amount)));

  title('Movimientos');
  if (!txs || txs.items.length === 0) row('Sin movimientos en este período', '');
  txs?.items.forEach((t) => row(`${new Date(t.date).toLocaleDateString('es-EC')}  ${LABELS[t.type]}  ${t.description}`, `${SIGN[t.type]}${formatMoney(t.amount)}`));
  if (txs && txs.total > txs.items.length) row(`Se muestran ${txs.items.length} de ${txs.total} movimientos`, '');

  doc.save('reporte-financiero.pdf');
}
