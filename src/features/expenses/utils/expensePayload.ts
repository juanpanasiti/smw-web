import type { ExpenseFormValues } from "@/features/expenses/components/ExpenseForm";
import type { CreateExpensePayload } from "@/lib/api/expenses";

export function mapFormToPayload(values: ExpenseFormValues): CreateExpensePayload {
  return {
    account_id: values.accountId,
    category_id: values.categoryId,
    title: values.title,
    cc_name: values.ccName,
    amount: values.amount,
    acquired_at: values.acquiredAt,
    first_payment_date: values.firstPaymentDate,
    installments: values.installments,
    expense_type: values.expenseType,
    status: values.status,
    is_one_time_payment: values.isOneTimePayment,
  };
}