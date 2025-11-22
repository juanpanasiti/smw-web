import type { Period, PeriodPayment } from '../models/period'

interface PeriodPaymentDTO {
  payment_id: string
  amount: number
  status: string
  payment_date: string
  no_installment: number
  is_last_payment: boolean
  expense_id: string
  expense_title: string
  expense_type: string
  expense_cc_name: string
  expense_acquired_at: string
  expense_installments: number
  expense_status: string
  expense_category_name: string | null
  account_id: string
  account_alias: string
  account_is_enabled: boolean
  account_type: string
}

interface PeriodDTO {
  id: string
  period_str: string
  month: number
  year: number
  total_amount: number
  total_confirmed_amount: number
  total_paid_amount: number
  total_pending_amount: number
  total_payments: number
  pending_payments_count: number
  completed_payments_count: number
  payments: PeriodPaymentDTO[]
}

export function parsePeriodPaymentFromApi(dto: PeriodPaymentDTO): PeriodPayment {
  return {
    paymentId: dto.payment_id,
    amount: dto.amount,
    status: dto.status as PeriodPayment['status'],
    paymentDate: dto.payment_date,
    noInstallment: dto.no_installment,
    isLastPayment: dto.is_last_payment,
    expenseId: dto.expense_id,
    expenseTitle: dto.expense_title,
    expenseType: dto.expense_type as PeriodPayment['expenseType'],
    expenseCcName: dto.expense_cc_name,
    expenseAcquiredAt: dto.expense_acquired_at,
    expenseInstallments: dto.expense_installments,
    expenseStatus: dto.expense_status as PeriodPayment['expenseStatus'],
    expenseCategoryName: dto.expense_category_name,
    accountId: dto.account_id,
    accountAlias: dto.account_alias,
    accountIsEnabled: dto.account_is_enabled,
    accountType: dto.account_type as PeriodPayment['accountType'],
  }
}

export function parsePeriodFromApi(dto: PeriodDTO): Period {
  const payments = dto.payments.map(parsePeriodPaymentFromApi);
  
  // Check if period is open (has any confirmed or unconfirmed payments)
  const isOpen = payments.some(
    payment => payment.status === 'confirmed' || payment.status === 'unconfirmed'
  );
  
  return {
    id: dto.id,
    periodStr: dto.period_str,
    month: dto.month,
    year: dto.year,
    totalAmount: dto.total_amount,
    totalConfirmedAmount: dto.total_confirmed_amount,
    totalPaidAmount: dto.total_paid_amount,
    totalPendingAmount: dto.total_pending_amount,
    totalPayments: dto.total_payments,
    pendingPaymentsCount: dto.pending_payments_count,
    completedPaymentsCount: dto.completed_payments_count,
    payments,
    isOpen,
  }
}
