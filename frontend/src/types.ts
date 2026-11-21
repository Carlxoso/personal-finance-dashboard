export type Role = 'ADMIN' | 'USER';
export interface User { id: string; email: string; name: string | null; role: Role; mustChangePassword: boolean }
export interface AdminUser extends User { createdAt: string; active: boolean }
export interface Notice { id: string; kind: 'success' | 'warning'; message: string }
/** Los montos viajan como string decimal ("12.50"), nunca como float. */
export interface PeriodSummary {
  totalBalance: string; income: string; expense: string; saving: string;
  expenseByCategory: { categoryId: string | null; name: string; amount: string }[];
}
export interface ApiErrorBody { error: { code: string; message: string } }
export interface Account { id: string; name: string; type: string; currency: string; balance: string; initialBalance: string; active: boolean }
export interface Category { id: string; name: string; kind: 'INCOME' | 'EXPENSE' }
export type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SAVING';
export interface Transaction {
  id: string; type: TxType; amount: string; description: string; date: string; notes: string | null;
  accountId: string; toAccountId: string | null; categoryId: string | null; goalId: string | null;
  account: { name: string }; toAccount: { name: string } | null; category: { name: string } | null;
}
export interface Page<T> { items: T[]; total: number }
export interface Goal {
  id: string; name: string; target: string; current: string; remaining: string;
  percent: string; monthlyNeeded: string | null; targetDate: string | null;
}
export interface MonthPoint { month: string; income: string; expense: string; saving: string; balance: string }

export type AuditAction = 'ADMIN_REGISTERED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGED' | 'PROFILE_UPDATED'
  | 'USER_CREATED' | 'USER_PASSWORD_RESET' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'ACCESS_DENIED';
export interface AuditEntry {
  id: string; createdAt: string; action: AuditAction;
  actorId: string | null; actorEmail: string | null; targetId: string | null; targetEmail: string | null;
  ip: string | null; userAgent: string | null; details: Record<string, unknown> | null;
}
export interface AuditSummary { events24h: number; failed24h: number; denied7d: number; admin7d: number; topFailed: { email: string; count: number }[] }
