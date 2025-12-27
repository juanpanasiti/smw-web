import type { ApiExpense, ApiPaginatedExpenses } from "@/lib/api/expenses";
import type { Expense, PaginatedExpenses } from "@/lib/models/expense";

export function parseExpenseFromApi(apiExpense: ApiExpense): Expense {
  return {
    id: apiExpense.id,
    accountId: apiExpense.account_id,
    title: apiExpense.title,
    ccName: apiExpense.cc_name,
    acquiredAt: apiExpense.acquired_at,
    amount: apiExpense.amount,
    expenseType: apiExpense.expense_type,
    installments: apiExpense.installments,
    firstPaymentDate: apiExpense.first_payment_date,
    status: apiExpense.status,
    categoryId: apiExpense.category_id,
    payments: apiExpense.payments?.map(payment => ({
      paymentId: payment.payment_id,
      expenseId: payment.expense_id,
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.payment_date,
      noInstallment: payment.no_installment,
      installments: payment.installments,
    })),
    isOneTimePayment: apiExpense.is_one_time_payment,
    paidAmount: apiExpense.paid_amount,
    pendingInstallments: apiExpense.pending_installments,
    doneInstallments: apiExpense.done_installments,
    pendingFinancingAmount: apiExpense.pending_financing_amount,
    pendingAmount: apiExpense.pending_amount,
  };
}

export function parsePaginatedExpenses(apiPayload: ApiPaginatedExpenses): PaginatedExpenses {
  return {
    items: apiPayload.items.map(parseExpenseFromApi),
    pagination: {
      currentPage: apiPayload.pagination.current_page,
      totalPages: apiPayload.pagination.total_pages,
      totalItems: apiPayload.pagination.total_items,
      perPage: apiPayload.pagination.per_page,
    },
  };
}