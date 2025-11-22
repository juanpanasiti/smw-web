export type ExpenseType = "purchase" | "subscription";
export type ExpenseStatus = "active" | "pending" | "finished" | "cancelled";

export interface ExpensePayment {
  paymentId: string;
  expenseId: string;
  amount: number;
  status: "unconfirmed" | "confirmed" | "paid" | "canceled" | "simulated";
  paymentDate: string;
  noInstallment: number;
  installments: number;
}

export interface Expense {
  id: string;
  accountId: string;
  title: string;
  ccName: string;
  acquiredAt: string;
  amount: number;
  expenseType: ExpenseType;
  installments: number;
  firstPaymentDate: string;
  status: ExpenseStatus;
  categoryId: string;
  payments?: ExpensePayment[];
  isOneTimePayment: boolean;
  paidAmount: number;
  pendingInstallments: number;
  doneInstallments: number;
  pendingFinancingAmount: number;
  pendingAmount: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

export interface PaginatedExpenses {
  items: Expense[];
  pagination: Pagination;
}