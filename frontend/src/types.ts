export interface User { id: string; email: string }
/** Los montos viajan como string decimal ("12.50"), nunca como float. */
export interface PeriodSummary {
  totalBalance: string; income: string; expense: string; saving: string;
  expenseByCategory: { categoryId: string | null; name: string; amount: string }[];
}
export interface ApiErrorBody { error: { code: string; message: string } }
