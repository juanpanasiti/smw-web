"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import SidebarLayout from "@/components/SidebarLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteExpense, useExpenses } from "@/features/expenses/hooks/useExpenses";
import { formatDate } from "@/lib/utils/dateFormat";

const limit = 8;

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string; expenseType: "purchase" | "subscription" } | null>(null);
  const { data, isLoading } = useExpenses(page, limit);
  const deleteMutation = useDeleteExpense();

  const pagination = useMemo(() => data?.pagination, [data]);
  const expenses = useMemo(() => data?.items ?? [], [data]);

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }
    deleteMutation.mutate(
      { expenseId: pendingDelete.id, expenseType: pendingDelete.expenseType },
      {
        onSuccess() {
          setPendingDelete(null);
          toast.success(`Expense "${pendingDelete.title}" deleted successfully`);
        },
        onError(error) {
          const message = error instanceof Error ? error.message : "Failed to delete expense";
          toast.error(message);
        },
      }
    );
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Expenses</p>
          <h1 className="text-3xl font-semibold text-white">Expenses list</h1>
          <p className="text-sm text-slate-400">
            Use the sidebar to navigate between sections. You can create, view and edit your existing expenses.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-950/40 p-4">
          <table className="min-w-full text-left text-sm text-white">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Installments</th>
                <th className="px-4 py-3">First payment</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="border-b border-white/5"
                >
                  <td className="px-4 py-3">{expense.title}</td>
                  <td className="px-4 py-3 font-semibold">{currencyFormatter.format(expense.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-white/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.4em]">
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expense.installments} installments · {expense.isOneTimePayment ? "One-time" : "Recurring"}
                  </td>
                  <td className="px-4 py-3">{formatDate(expense.firstPaymentDate)}</td>
                  <td className="px-4 py-3 space-x-2">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-2xl border border-amber-400/60 px-3 py-1 text-xs font-semibold text-amber-400"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ id: expense.id, title: expense.title, expenseType: expense.expenseType })}
                      className="inline-flex items-center gap-1 rounded-2xl border border-rose-500/60 px-3 py-1 text-xs font-semibold text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {isLoading && (
            <p className="mt-4 text-sm text-slate-400">Loading expenses...</p>
          )}
          {!isLoading && expenses.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">No expenses registered yet.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <p>
            Page {pagination?.currentPage ?? page} of {pagination?.totalPages ?? 1} · {pagination?.totalItems ?? 0} items
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold disabled:border-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= (pagination?.totalPages ?? page)}
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold disabled:border-slate-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8"
      >
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-2xl shadow-black/50 transition hover:bg-emerald-400"
        >
          <Plus className="h-5 w-5" />
          New expense
        </Link>
      </motion.div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete expense"
        message={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.title}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </SidebarLayout>
  );
}
