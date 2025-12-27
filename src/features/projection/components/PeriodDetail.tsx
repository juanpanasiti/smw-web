"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, DollarSign, Calendar, Tag, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { Period } from "@/lib/models/period";
import { formatDate } from "@/lib/utils/dateFormat";
import EditPaymentModal from "./EditPaymentModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { updatePayment, createSubscriptionPayment, deleteSubscriptionPayment } from "@/lib/api/payments";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";

interface PeriodDetailProps {
  period: Period;
  isOpen: boolean;
  onToggle: () => void;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const statusColors = {
  unconfirmed: "text-amber-400 bg-amber-500/10",
  confirmed: "text-blue-400 bg-blue-500/10",
  paid: "text-emerald-400 bg-emerald-500/10",
  canceled: "text-slate-400 bg-slate-500/10",
  simulated: "text-violet-400 bg-violet-500/10",
};

/**
 * Determines the visual style for a payment based on its characteristics
 */
function getPaymentStyle(payment: Period['payments'][0]) {
  const isSinglePayment = payment.expenseInstallments === 1;
  const isFirstPayment = payment.noInstallment === 1;
  const isSubscription = payment.expenseType === "subscription";
  const isSimulated = payment.status === "simulated";

  // Single payment purchase (most important)
  if (isSinglePayment && !isSubscription) {
    return "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-l-2 border-emerald-500";
  }

  // Last payment of multi-installment purchase
  if (payment.isLastPayment && !isSubscription && payment.expenseInstallments > 1) {
    return "bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-l-2 border-blue-500";
  }

  // Simulated subscription payment (special case)
  if (isSubscription && isSimulated) {
    return "bg-gradient-to-r from-slate-500/20 to-slate-600/10 border-l-2 border-slate-500";
  }

  // Regular subscription payment
  if (isSubscription) {
    return "bg-gradient-to-r from-violet-500/20 to-violet-600/10 border-l-2 border-violet-500";
  }

  // First payment of multi-installment purchase
  if (isFirstPayment && payment.expenseInstallments > 1) {
    return "bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-l-2 border-amber-500";
  }

  // Regular middle payments
  return "";
}

export default function PeriodDetail({ period, isOpen, onToggle }: PeriodDetailProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<"amount" | "status" | "date">("amount");
  const [editingPayment, setEditingPayment] = useState<Period['payments'][0] | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { data: creditCardsData } = useCreditCards();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const periodName = `${monthNames[period.month - 1]} ${period.year}`;

  // Calculate totals by main account
  const totalsByAccount = period.payments.reduce((acc, payment) => {
    const card = creditCardsData?.items.find(c => c.id === payment.accountId);
    
    // Only count main credit cards
    if (card?.isMainCreditCard) {
      const accountId = payment.accountId;
      if (!acc[accountId]) {
        acc[accountId] = {
          alias: payment.accountAlias,
          total: 0,
        };
      }
      acc[accountId].total += payment.amount;
    }
    
    return acc;
  }, {} as Record<string, { alias: string; total: number }>);

  const sortedAccountTotals = Object.entries(totalsByAccount)
    .sort((a, b) => b[1].total - a[1].total);

  const handleEditAmount = (paymentId: string) => {
    const payment = period.payments.find(p => p.paymentId === paymentId);
    if (payment) {
      setEditingPayment(payment);
      setEditType("amount");
      setEditModalOpen(true);
    }
  };

  const handleEditStatus = (paymentId: string) => {
    const payment = period.payments.find(p => p.paymentId === paymentId);
    if (payment) {
      setEditingPayment(payment);
      setEditType("status");
      setEditModalOpen(true);
    }
  };

  const handleEditDate = (paymentId: string) => {
    const payment = period.payments.find(p => p.paymentId === paymentId);
    if (payment) {
      setEditingPayment(payment);
      setEditType("date");
      setEditModalOpen(true);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setConfirmDeleteOpen(true);
  };

  const handleCreatePayment = async (paymentId: string) => {
    const payment = period.payments.find(p => p.paymentId === paymentId);
    if (!payment) return;

    setLoading(true);
    try {
      const newPayment = await createSubscriptionPayment(payment.expenseId, {
        expense_id: payment.expenseId,
        amount: payment.amount,
        payment_date: payment.paymentDate,
      });

      // Update cache manually to avoid full page reload
      queryClient.setQueryData(["periods", 12], (oldData: Period[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(p => {
          if (p.id !== period.id) return p;
          
          // Update the payment status from simulated to the new status
          const updatedPayments = p.payments.map(pay => 
            pay.paymentId === paymentId 
              ? { ...pay, status: newPayment.status, paymentId: newPayment.payment_id }
              : pay
          );
          
          return { ...p, payments: updatedPayments };
        });
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEdit = async (value: string | number) => {
    if (!editingPayment) return;
    
    setLoading(true);
    try {
      // Build the update payload based on current payment data
      const updateData = {
        amount: editingPayment.amount,
        status: editingPayment.status === "simulated" ? "unconfirmed" : editingPayment.status as "unconfirmed" | "confirmed" | "paid" | "canceled",
        payment_date: editingPayment.paymentDate,
      };

      // Update the specific field
      if (editType === "amount") {
        updateData.amount = Number(value);
      } else if (editType === "status") {
        updateData.status = value as "unconfirmed" | "confirmed" | "paid" | "canceled";
      } else if (editType === "date") {
        updateData.payment_date = value as string;
      }

      await updatePayment(editingPayment.paymentId, updateData);
      
      // Update cache manually to avoid full page reload
      queryClient.setQueryData(["periods", 12], (oldData: Period[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(p => {
          if (p.id !== period.id) return p;
          
          // Update the specific payment
          const updatedPayments = p.payments.map(pay => 
            pay.paymentId === editingPayment.paymentId
              ? { 
                  ...pay, 
                  amount: updateData.amount,
                  status: updateData.status,
                  paymentDate: updateData.payment_date
                }
              : pay
          );
          
          // Recalculate period totals
          const totalAmount = updatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
          const confirmedAmount = updatedPayments
            .filter(pay => pay.status === "confirmed" || pay.status === "paid")
            .reduce((sum, pay) => sum + pay.amount, 0);
          
          return { 
            ...p, 
            payments: updatedPayments,
            totalAmount,
            confirmedAmount
          };
        });
      });
      
      setEditModalOpen(false);
      setEditingPayment(null);
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to update payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPaymentId) return;
    
    const payment = period.payments.find(p => p.paymentId === deletingPaymentId);
    if (!payment) return;
    
    setLoading(true);
    try {
      await deleteSubscriptionPayment(payment.expenseId, deletingPaymentId);
      
      // Update cache manually to avoid full page reload
      queryClient.setQueryData(["periods", 12], (oldData: Period[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(p => {
          if (p.id !== period.id) return p;
          
          // Remove the deleted payment
          const updatedPayments = p.payments.filter(pay => pay.paymentId !== deletingPaymentId);
          
          // Recalculate period totals
          const totalAmount = updatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
          const confirmedAmount = updatedPayments
            .filter(pay => pay.status === "confirmed" || pay.status === "paid")
            .reduce((sum, pay) => sum + pay.amount, 0);
          const totalPayments = updatedPayments.length;
          
          return { 
            ...p, 
            payments: updatedPayments,
            totalAmount,
            confirmedAmount,
            totalPayments
          };
        });
      });
      
      setConfirmDeleteOpen(false);
      setDeletingPaymentId(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = () => {
    if (!editingPayment) return "";
    
    switch (editType) {
      case "amount":
        return editingPayment.amount;
      case "status":
        return editingPayment.status;
      case "date":
        return editingPayment.paymentDate;
      default:
        return "";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
      {/* Title - Always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 text-left transition hover:bg-white/5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {isOpen ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{periodName}</h3>
              <p className="text-xs text-slate-400">
                {period.totalPayments} payment{period.totalPayments !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400">Confirmed: </span>
              <span className="text-sm font-semibold text-emerald-400">
                {currencyFormatter.format(period.totalConfirmedAmount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total: </span>
              <span className="text-sm font-semibold text-white">
                {currencyFormatter.format(period.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Body - Collapsible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-6 py-4">
              {/* Summary stats */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <p className="text-xs text-emerald-200">Paid</p>
                  <p className="text-sm font-semibold text-emerald-50">
                    {currencyFormatter.format(period.totalPaidAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-200">Pending</p>
                  <p className="text-sm font-semibold text-amber-50">
                    {currencyFormatter.format(period.totalPendingAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <p className="text-xs text-blue-200">Completed</p>
                  <p className="text-sm font-semibold text-blue-50">
                    {period.completedPaymentsCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-500/10 p-3">
                  <p className="text-xs text-slate-300">Pending</p>
                  <p className="text-sm font-semibold text-slate-100">
                    {period.pendingPaymentsCount}
                  </p>
                </div>
              </div>

              {/* Totals by main account */}
              {sortedAccountTotals.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Total by Main Account
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedAccountTotals.map(([accountId, data]) => (
                      <div
                        key={accountId}
                        className="rounded-lg bg-slate-800/50 px-3 py-2 border border-white/5"
                      >
                        <p className="text-xs text-slate-400 truncate">{data.alias}</p>
                        <p className="text-sm font-semibold text-white">
                          {currencyFormatter.format(data.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments table */}
              <div className="overflow-x-auto overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-2 text-left font-medium">Date</th>
                      <th className="pb-2 text-left font-medium">Expense</th>
                      <th className="pb-2 text-left font-medium">Account</th>
                      <th className="pb-2 text-center font-medium">Installment</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                      <th className="pb-2 text-center font-medium">Status</th>
                      <th className="pb-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {period.payments.map((payment) => {
                      return (
                        <tr 
                          key={payment.paymentId} 
                          className={`text-slate-200 transition-colors ${getPaymentStyle(payment)}`}
                        >
                          <td className="py-3 text-slate-300">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-white">{payment.expenseTitle}</p>
                              {payment.expenseCategoryName && (
                                <p className="text-xs text-slate-400">{payment.expenseCategoryName}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-slate-300">{payment.accountAlias}</td>
                          <td className="py-3 text-center text-slate-300">
                            {payment.noInstallment}/{payment.expenseInstallments}
                            {payment.isLastPayment && (
                              <span className="ml-1 text-xs text-emerald-400">●</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-semibold text-white">
                            {currencyFormatter.format(payment.amount)}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[payment.status]}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center gap-1">
                              <Link
                                href={`/expenses/${payment.expenseId}`}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="View expense"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleEditAmount(payment.paymentId)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit amount"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditStatus(payment.paymentId)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit status"
                              >
                                <Tag className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditDate(payment.paymentId)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit date"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                              {payment.expenseType === "subscription" && payment.status === "simulated" ? (
                                <button
                                  type="button"
                                  onClick={() => handleCreatePayment(payment.paymentId)}
                                  className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                  title="Create payment"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              ) : payment.expenseType === "subscription" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment.paymentId)}
                                  className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                  title="Delete payment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          key={`${editingPayment.paymentId}-${editType}`}
          open={editModalOpen}
          editType={editType}
          currentValue={getCurrentValue()}
          onCancel={() => {
            setEditModalOpen(false);
            setEditingPayment(null);
          }}
          onConfirm={handleConfirmEdit}
          loading={loading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setDeletingPaymentId(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </div>
  );
}
