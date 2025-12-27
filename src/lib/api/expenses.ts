import type { ExpenseStatus, ExpenseType } from "@/lib/models/expense";
import apiClient from "@/lib/api/client";

export interface ApiPayment {
  payment_id: string;
  expense_id: string;
  amount: number;
  status: "unconfirmed" | "confirmed" | "paid" | "canceled" | "simulated";
  payment_date: string;
  no_installment: number;
  installments: number;
}

export interface ApiExpense {
  id: string;
  account_id: string;
  title: string;
  cc_name: string;
  acquired_at: string;
  amount: number;
  expense_type: ExpenseType;
  installments: number;
  first_payment_date: string;
  status: ExpenseStatus;
  category_id: string;
  payments?: ApiPayment[];
  is_one_time_payment: boolean;
  paid_amount: number;
  pending_installments: number;
  done_installments: number;
  pending_financing_amount: number;
  pending_amount: number;
}

export interface ApiPagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export interface ApiPaginatedExpenses {
  items: ApiExpense[];
  pagination: ApiPagination;
}

export interface ExpenseListOptions {
  limit?: number;
  offset?: number;
  type?: ExpenseType | null;
}

export interface CreateExpensePayload {
  account_id: string;
  title: string;
  cc_name: string;
  acquired_at: string;
  amount: number;
  expense_type: ExpenseType;
  installments: number;
  first_payment_date: string;
  category_id: string;
  status: ExpenseStatus;
  is_one_time_payment: boolean;
}

export type UpdateExpensePayload = CreateExpensePayload;

export async function getExpenses(options: ExpenseListOptions = {}): Promise<ApiPaginatedExpenses> {
  const response = await apiClient.get<ApiPaginatedExpenses>("/api/v3/expenses", {
    params: {
      limit: options.limit,
      offset: options.offset,
      type: options.type ?? undefined,
    },
  });
  return response.data;
}

export async function getExpense(expenseId: string, expenseType?: ExpenseType): Promise<ApiExpense> {
  // If type is provided, use the specific endpoint
  if (expenseType) {
    const endpoint = expenseType === "purchase" 
      ? `/api/v3/purchases/${expenseId}`
      : `/api/v3/subscriptions/${expenseId}`;
    const response = await apiClient.get<ApiExpense>(endpoint);
    return response.data;
  }

  // If type is not provided, try both endpoints
  try {
    const response = await apiClient.get<ApiExpense>(`/api/v3/purchases/${expenseId}`);
    return response.data;
  } catch {
    // If purchase fails, try subscription
    const response = await apiClient.get<ApiExpense>(`/api/v3/subscriptions/${expenseId}`);
    return response.data;
  }
}

export async function deleteExpense(expenseId: string, expenseType: ExpenseType): Promise<void> {
  const endpoint = expenseType === "purchase" 
    ? `/api/v3/purchases/${expenseId}`
    : `/api/v3/subscriptions/${expenseId}`;
  await apiClient.delete(endpoint);
}

export async function createExpense(payload: CreateExpensePayload): Promise<ApiExpense> {
  const endpoint = payload.expense_type === "purchase"
    ? "/api/v3/purchases"
    : "/api/v3/subscriptions";
  const response = await apiClient.post<ApiExpense>(endpoint, payload);
  return response.data;
}

export async function updateExpense(expenseId: string, payload: UpdateExpensePayload): Promise<ApiExpense> {
  const endpoint = payload.expense_type === "purchase" 
    ? `/api/v3/purchases/${expenseId}`
    : `/api/v3/subscriptions/${expenseId}`;
  const response = await apiClient.put<ApiExpense>(endpoint, payload);
  return response.data;
}