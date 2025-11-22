"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuthContext } from "@/providers/AuthProvider";
import SidebarLayout from "@/components/SidebarLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProjectionChart from "@/components/ProjectionChart";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";
import { useExpenses } from "@/features/expenses/hooks/useExpenses";
import { useProjection } from "@/features/dashboard/hooks/useProjection";
import { useDeleteCreditCard } from "@/features/dashboard/hooks/useCreditCardMutations";
import type { CreditCard } from "@/lib/models/creditCard";
import { formatDate } from "@/lib/utils/dateFormat";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function DashboardPage() {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  const { data: creditCardsData } = useCreditCards();
  const { data: expensesData } = useExpenses(1, 100, {
    staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetch when returning from editing credit cards
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnMount: false, // Don't refetch when dashboard remounts (e.g., after creating a credit card)
  });
  const { data: projectionData } = useProjection(12);
  const deleteMutation = useDeleteCreditCard();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; alias: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [router, user, isLoading]);

  const kpis = useMemo<{
    pendingPurchases: number;
    activeSubscriptions: number;
    totalPending: number;
    daysToNextClose: number | null;
    closestCard: CreditCard | null;
    daysToNextExpiration: number | null;
    closestExpiringCard: CreditCard | null;
  }>(() => {
    const cards = creditCardsData?.items ?? [];
    const expenses = expensesData?.items ?? [];

    const pendingPurchases = expenses.filter(
      (exp) => exp.expenseType === "purchase" && exp.status === "pending"
    ).length;

    const activeSubscriptions = expenses.filter(
      (exp) => exp.expenseType === "subscription" && exp.status === "active"
    ).length;

    const totalPending = expenses.reduce((sum, exp) => sum + exp.pendingAmount, 0);

    let daysToNextClose: number | null = null;
    let closestCard: CreditCard | null = null;
    let daysToNextExpiration: number | null = null;
    let closestExpiringCard: CreditCard | null = null;
    
    // Use local date at start of day (00:00:00) for consistent comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    cards.forEach((card) => {
      // Parse date as local date (not UTC) by splitting and constructing
      const [year, month, day] = card.nextClosingDate.split('-').map(Number);
      const closeDate = new Date(year, month - 1, day); // month is 0-indexed
      closeDate.setHours(0, 0, 0, 0);
      
      const diffClose = Math.round((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffClose >= 0 && (daysToNextClose === null || diffClose < daysToNextClose)) {
        daysToNextClose = diffClose;
        closestCard = card;
      }

      // Calculate next expiration date
      const [expYear, expMonth, expDay] = card.nextExpiringDate.split('-').map(Number);
      const expirationDate = new Date(expYear, expMonth - 1, expDay);
      expirationDate.setHours(0, 0, 0, 0);
      
      const diffExpiration = Math.round((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffExpiration >= 0 && (daysToNextExpiration === null || diffExpiration < daysToNextExpiration)) {
        daysToNextExpiration = diffExpiration;
        closestExpiringCard = card;
      }
    });

    return { 
      pendingPurchases, 
      activeSubscriptions, 
      totalPending, 
      daysToNextClose, 
      closestCard,
      daysToNextExpiration,
      closestExpiringCard,
    };
  }, [creditCardsData, expensesData]);

  if (isLoading || !user) {
    return null;
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess() {
        setPendingDelete(null);
        toast.success(`Credit card "${pendingDelete.alias}" deleted successfully`);
      },
      onError(error) {
        const message = error instanceof Error ? error.message : "Failed to delete credit card";
        toast.error(message);
      },
    });
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back, {user.username}!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Here&apos;s your financial summary to keep everything under control.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            className="rounded-2xl border border-white/5 bg-slate-900/40 p-4"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Pending purchases</p>
            <p className="mt-2 text-2xl font-semibold text-white">{kpis.pendingPurchases}</p>
            <p className="text-xs text-slate-400">In process</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-emerald-500/10 p-4"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Active subscriptions</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-50">{kpis.activeSubscriptions}</p>
            <p className="text-xs text-emerald-200">Recurring</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-2xl border border-white/5 bg-amber-500/10 p-4"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200">Pending balance</p>
            <p className="mt-2 text-2xl font-semibold text-amber-50">
              {currencyFormatter.format(kpis.totalPending)}
            </p>
            <p className="text-xs text-amber-200">Total to pay</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-2xl border border-white/5 bg-violet-500/10 p-4"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-violet-200">Next closing</p>
            <p className="mt-2 text-2xl font-semibold text-violet-50">
              {kpis.closestCard ? formatDate(kpis.closestCard.nextClosingDate) : "—"}
            </p>
            <p className="text-xs text-violet-200">
              {kpis.closestCard ? `${kpis.closestCard.alias} · ${kpis.daysToNextClose} days` : "No data"}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="rounded-2xl border border-white/5 bg-rose-500/10 p-4"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-rose-200">Next expiration</p>
            <p className="mt-2 text-2xl font-semibold text-rose-50">
              {kpis.closestExpiringCard ? formatDate(kpis.closestExpiringCard.nextExpiringDate) : "—"}
            </p>
            <p className="text-xs text-rose-200">
              {kpis.closestExpiringCard ? `${kpis.closestExpiringCard.alias} · ${kpis.daysToNextExpiration} days` : "No data"}
            </p>
          </motion.div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Credit cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creditCardsData?.items.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="rounded-3xl border border-white/5 bg-slate-950/60 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{card.alias}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {card.isEnabled ? "Active" : "Disabled"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-emerald-200">
                    {card.totalExpensesCount} expenses
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Next closing</p>
                    <p className="font-semibold text-white">{formatDate(card.nextClosingDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expiration</p>
                    <p className="font-semibold text-white">{formatDate(card.nextExpiringDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Estimated next payment</p>
                  <p className="text-xl font-semibold text-white">
                    {currencyFormatter.format(card.usedLimit)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Available: {currencyFormatter.format(card.availableLimit)}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/credit-cards/${card.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-amber-400/60 px-3 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-400/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete({ id: card.id, alias: card.alias })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-500/60 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: (creditCardsData?.items.length ?? 0) * 0.05 }}
            >
              <Link
                href="/credit-cards/new"
                className="flex min-h-[280px] items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-slate-950/30 transition hover:border-white/40 hover:bg-slate-950/50"
              >
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Plus className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Add credit card</p>
              </div>
              </Link>
            </motion.div>
            {(!creditCardsData || creditCardsData.items.length === 0) && (
              <p className="col-span-full text-sm text-slate-400">
                You don&apos;t have any registered cards yet.
              </p>
            )}
          </div>
        </div>

        {/* Projection Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <ProjectionChart 
            periods={projectionData ?? []} 
            monthlyLimit={150000}
          />
        </motion.div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete credit card"
        message={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.alias}? This action cannot be undone.`
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
