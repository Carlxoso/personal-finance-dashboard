export interface User { id: string; email: string }
/** Los montos viajan como string decimal ("12.50"), nunca como float. */
export interface PeriodSummary {
  totalBalance: string; income: string; expense: string; saving: string;
  expenseByCategory: { categoryId: string | null; name: string; amount: string }[];
}
export interface ApiErrorBody { error: { code: string; message: string } }
export interface Account { id: string; name: string; type: string; currency: string; balance: string; active: boolean }
export interface Category { id: string; name: string; kind: 'INCOME' | 'EXPENSE' }
export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING';
export interface Transaction {
  id: string; type: TxType; amount: string; description: string; date: string;
  account: { name: string }; toAccount: { name: string } | null; category: { name: string } | null;
}
export interface Page<T> { items: T[]; total: number }
