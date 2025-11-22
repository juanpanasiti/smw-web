"use client";

import Link from "next/link";
import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, DollarSign, Calendar, Tag, Trash2, Plus } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { useExpense } from "@/features/expenses/hooks/useExpenses";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatDate } from "@/lib/utils/dateFormat";
import EditPaymentModal from "@/features/projection/components/EditPaymentModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { updatePayment, createSubscriptionPayment, deleteSubscriptionPayment } from "@/lib/api/payments";
import type { ExpensePayment } from "@/lib/models/expense";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";
import { useExpenseCategories } from "@/features/expenses/hooks/useExpenseCategories";

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

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthContext();
  const router = useRouter();
  const { data, isLoading } = useExpense(id);
  const { data: creditCardsData } = useCreditCards();
  const { data: categoriesData } = useExpenseCategories();
  const queryClient = useQueryClient();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<"amount" | "status" | "date">("amount");
  const [editingPayment, setEditingPayment] = useState<ExpensePayment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  const handleEditAmount = (payment: ExpensePayment) => {
    setEditingPayment(payment);
    setEditType("amount");
    setEditModalOpen(true);
  };

  const handleEditStatus = (payment: ExpensePayment) => {
    setEditingPayment(payment);
    setEditType("status");
    setEditModalOpen(true);
  };

  const handleEditDate = (payment: ExpensePayment) => {
    setEditingPayment(payment);
    setEditType("date");
    setEditModalOpen(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setConfirmDeleteOpen(true);
  };

  const handleCreatePayment = async (payment: ExpensePayment) => {
    if (!data) return;

    setLoading(true);
    try {
      await createSubscriptionPayment(data.id, {
        expense_id: data.id,
        amount: payment.amount,
        payment_date: payment.paymentDate,
      });

      // Refetch expense data
      await queryClient.invalidateQueries({ queryKey: ["expense", id] });
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEdit = async (value: string | number) => {
    if (!editingPayment || !data) return;
    
    setLoading(true);
    try {
      const updateData = {
        amount: editingPayment.amount,
        status: editingPayment.status === "simulated" ? "unconfirmed" : editingPayment.status as "unconfirmed" | "confirmed" | "paid" | "canceled",
        payment_date: editingPayment.paymentDate,
      };

      if (editType === "amount") {
        updateData.amount = Number(value);
      } else if (editType === "status") {
        updateData.status = value as "unconfirmed" | "confirmed" | "paid" | "canceled";
      } else if (editType === "date") {
        updateData.payment_date = value as string;
      }

      await updatePayment(editingPayment.paymentId, updateData);
      
      // Refetch expense data
      await queryClient.invalidateQueries({ queryKey: ["expense", id] });
      
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
    if (!deletingPaymentId || !data) return;
    
    setLoading(true);
    try {
      await deleteSubscriptionPayment(data.id, deletingPaymentId);
      
      // Refetch expense data
      await queryClient.invalidateQueries({ queryKey: ["expense", id] });
      
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

  if (!user) {
    return null;
  }

  // Find account and category details
  const account = creditCardsData?.items.find(card => card.id === data?.accountId);
  const category = categoriesData?.items.find(cat => cat.id === data?.categoryId);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Detail</p>
          <h1 className="text-3xl font-semibold text-white">{data?.title ?? "Loading expense..."}</h1>
        </div>

        {isLoading || !data ? (
          <p className="text-sm text-slate-400">Loading data...</p>
        ) : (
          <>
            <div className="grid gap-6 rounded-3xl border border-white/5 bg-slate-950/60 p-6 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Amount</p>
                <p className="text-2xl font-semibold text-white">{currencyFormatter.format(data.amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                <p className="text-lg font-semibold text-white">{data.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Account</p>
                <p className="text-lg font-semibold text-white">{account?.alias || data.accountId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</p>
                <p className="text-lg font-semibold text-white">
                  {category ? `${category.name}${category.description ? ` - ${category.description}` : ''}` : data.categoryId}
                </p>
              </div>
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Description</p>
                <p className="text-sm text-slate-300">{data.title} · {data.ccName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Installments</p>
                <p className="text-lg font-semibold text-white">{data.installments}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Paid</p>
                <p className="text-lg font-semibold text-white">{currencyFormatter.format(data.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending</p>
                <p className="text-lg font-semibold text-white">{currencyFormatter.format(data.pendingAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Type</p>
                <p className="text-lg font-semibold text-white">{data.expenseType}</p>
              </div>
            </div>

            {data.payments && data.payments.length > 0 && (
              <div className="rounded-3xl border border-white/5 bg-slate-950/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Payments</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400">
                        <th className="px-6 py-3 text-left font-medium">Date</th>
                        <th className="px-6 py-3 text-center font-medium">Installment</th>
                        <th className="px-6 py-3 text-right font-medium">Amount</th>
                        <th className="px-6 py-3 text-center font-medium">Status</th>
                        <th className="px-6 py-3 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.payments.map((payment) => (
                        <tr key={payment.paymentId} className="text-slate-200 hover:bg-white/5 transition">
                          <td className="px-6 py-3 text-slate-300">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-6 py-3 text-center text-slate-300">
                            {payment.noInstallment}/{data.installments}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-white">
                            {currencyFormatter.format(payment.amount)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[payment.status]}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditAmount(payment)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit amount"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditStatus(payment)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit status"
                              >
                                <Tag className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditDate(payment)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                title="Edit date"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                              {data.expenseType === "subscription" && payment.status === "simulated" ? (
                                <button
                                  type="button"
                                  onClick={() => handleCreatePayment(payment)}
                                  className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                                  title="Create payment"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              ) : data.expenseType === "subscription" && (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/expenses"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold"
          >
            Back to list
          </Link>
          <Link
            href={`/expenses/${id}/edit`}
            className="rounded-2xl bg-amber-400/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            Edit expense
          </Link>
        </div>

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
    </SidebarLayout>
  );
}
