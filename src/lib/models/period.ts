import type { ExpenseStatus, ExpenseType } from './expense'

export type PaymentStatus = 'unconfirmed' | 'confirmed' | 'paid' | 'canceled' | 'simulated'
export type AccountType = 'CreditCard' | 'DebitCard' | 'Cash' | 'BankAccount'

export interface PeriodPayment {
  paymentId: string
  amount: number
  status: PaymentStatus
  paymentDate: string
  noInstallment: number
  isLastPayment: boolean
  expenseId: string
  expenseTitle: string
  expenseType: ExpenseType
  expenseCcName: string
  expenseAcquiredAt: string
  expenseInstallments: number
  expenseStatus: ExpenseStatus
  expenseCategoryName: string | null
  accountId: string
  accountAlias: string
  accountIsEnabled: boolean
  accountType: AccountType
}

export interface Period {
  id: string
  periodStr: string // MM/YYYY format
  month: number // 1-12
  year: number
  totalAmount: number
  totalConfirmedAmount: number
  totalPaidAmount: number
  totalPendingAmount: number
  totalPayments: number
  pendingPaymentsCount: number
  completedPaymentsCount: number
  payments: PeriodPayment[]
  isOpen: boolean // true if any payment has status "confirmed" or "unconfirmed"
}
