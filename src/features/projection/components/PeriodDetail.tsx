"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Eye, DollarSign, Calendar, Tag, Trash2, Plus, CheckSquare, Square, X, AlertCircle, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Period } from "@/lib/models/period";
import { formatDate } from "@/lib/utils/dateFormat";
import EditPaymentModal from "./EditPaymentModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { updatePayment, createSubscriptionPayment, deleteSubscriptionPayment } from "@/lib/api/payments";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";

interface FailedPayment {
  paymentId: string;
  expenseTitle: string;
  accountAlias: string;
  error: string;
}

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

/**
 * Normalizes text for search comparison:
 * - Converts to lowercase
 * - Removes accents/diacritics
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

  // Quick status change state
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [statusChangePayment, setStatusChangePayment] = useState<Period['payments'][0] | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [failedPaymentsModalOpen, setFailedPaymentsModalOpen] = useState(false);
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterAccounts, setFilterAccounts] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: creditCardsData } = useCreditCards();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Get unique accounts for filter dropdown
  const uniqueAccounts = Array.from(
    new Map(period.payments.map(p => [p.accountId, p.accountAlias])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Filter payments
  const filteredPayments = period.payments.filter(payment => {
    // Text search filter
    if (searchText) {
      const normalizedSearch = normalizeText(searchText);
      const matchesTitle = normalizeText(payment.expenseTitle).includes(normalizedSearch);
      const matchesCategory = payment.expenseCategoryName 
        ? normalizeText(payment.expenseCategoryName).includes(normalizedSearch)
        : false;
      const matchesAccount = normalizeText(payment.accountAlias).includes(normalizedSearch);
      
      if (!matchesTitle && !matchesCategory && !matchesAccount) {
        return false;
      }
    }

    // Status filter (if any statuses are selected, payment must match one of them)
    if (filterStatuses.size > 0 && !filterStatuses.has(payment.status)) {
      return false;
    }

    // Account filter (if any accounts are selected, payment must match one of them)
    if (filterAccounts.size > 0 && !filterAccounts.has(payment.accountId)) {
      return false;
    }

    // Type filter
    if (filterType !== "all" && payment.expenseType !== filterType) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = searchText || filterStatuses.size > 0 || filterAccounts.size > 0 || filterType !== "all";

  const clearFilters = () => {
    setSearchText("");
    setFilterStatuses(new Set());
    setFilterAccounts(new Set());
    setFilterType("all");
  };

  const toggleStatusFilter = (status: string) => {
    setFilterStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const toggleAccountFilter = (accountId: string) => {
    setFilterAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Selection handlers
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedPayments(new Set());
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedPayments.size === 0) return;
    
    setLoading(true);
    const selectedPaymentsList = period.payments.filter(p => selectedPayments.has(p.paymentId));
    const failed: FailedPayment[] = [];
    const successfulPaymentIds: string[] = [];
    
    // Update payments sequentially (one at a time)
    for (const payment of selectedPaymentsList) {
      try {
        await updatePayment(payment.paymentId, {
          amount: payment.amount,
          status: newStatus as "unconfirmed" | "confirmed" | "paid" | "canceled",
          payment_date: payment.paymentDate,
        });
        successfulPaymentIds.push(payment.paymentId);
      } catch (error) {
        failed.push({
          paymentId: payment.paymentId,
          expenseTitle: payment.expenseTitle,
          accountAlias: payment.accountAlias,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    
    // Update cache for successful updates
    if (successfulPaymentIds.length > 0) {
      queryClient.setQueryData(["periods", 12], (oldData: Period[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(p => {
          if (p.id !== period.id) return p;
          
          const updatedPayments = p.payments.map(pay => 
            successfulPaymentIds.includes(pay.paymentId)
              ? { ...pay, status: newStatus as Period['payments'][0]['status'] }
              : pay
          );
          
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
    }
    
    setBulkStatusModalOpen(false);
    setLoading(false);
    
    if (failed.length === 0) {
      // All successful
      toast.success(`${successfulPaymentIds.length} payment${successfulPaymentIds.length !== 1 ? 's' : ''} updated successfully`);
      setSelectedPayments(new Set());
    } else {
      // Some or all failed - show error modal
      setFailedPayments(failed);
      setFailedPaymentsModalOpen(true);
      // Keep failed payments selected, deselect successful ones
      const failedIds = new Set(failed.map(f => f.paymentId));
      setSelectedPayments(failedIds);
    }
  };

  const handleEditAmount = (paymentId: string) => {
    const payment = period.payments.find(p => p.paymentId === paymentId);
    if (payment) {
      setEditingPayment(payment);
      setEditType("amount");
      setEditModalOpen(true);
    }
  };

  const allStatuses: Array<"unconfirmed" | "confirmed" | "paid" | "canceled"> = [
    "unconfirmed", "confirmed", "paid", "canceled",
  ];

  const getNextQuickStatus = (status: string): string | null => {
    if (status === "unconfirmed") return "confirmed";
    if (status === "confirmed") return "paid";
    return null;
  };

  const handleQuickStatusChange = (payment: Period['payments'][0]) => {
    const next = getNextQuickStatus(payment.status);
    if (!next) return;
    setStatusChangePayment(payment);
    setStatusChangeTarget(next);
    setConfirmStatusOpen(true);
  };

  const handleDropdownStatusChange = (payment: Period['payments'][0], newStatus: string) => {
    setStatusChangePayment(payment);
    setStatusChangeTarget(newStatus);
    setConfirmStatusOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChangePayment || !statusChangeTarget) return;
    setLoading(true);
    try {
      await updatePayment(statusChangePayment.paymentId, {
        amount: statusChangePayment.amount,
        status: statusChangeTarget as "unconfirmed" | "confirmed" | "paid" | "canceled",
        payment_date: statusChangePayment.paymentDate,
      });

      // Update cache
      queryClient.setQueryData(["periods", 12], (oldData: Period[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(p => {
          if (p.id !== period.id) return p;
          const updatedPayments = p.payments.map(pay =>
            pay.paymentId === statusChangePayment.paymentId
              ? { ...pay, status: statusChangeTarget as Period['payments'][0]['status'] }
              : pay
          );
          const totalAmount = updatedPayments.reduce((sum, pay) => sum + pay.amount, 0);
          const confirmedAmount = updatedPayments
            .filter(pay => pay.status === "confirmed" || pay.status === "paid")
            .reduce((sum, pay) => sum + pay.amount, 0);
          return { ...p, payments: updatedPayments, totalAmount, confirmedAmount };
        });
      });

      setConfirmStatusOpen(false);
      setStatusChangePayment(null);
      setStatusChangeTarget(null);
      toast.success(`Payment status updated to ${statusChangeTarget}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
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

              {/* Filters */}
              <div className="mb-4 rounded-xl border border-white/10 bg-slate-800/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Filters</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      Clear filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Search text */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Status filter - Multi-select dropdown */}
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusDropdownOpen(!statusDropdownOpen);
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span className={filterStatuses.size === 0 ? "text-slate-400" : ""}>
                        {filterStatuses.size === 0
                          ? "All statuses"
                          : filterStatuses.size === 1
                            ? Array.from(filterStatuses)[0].charAt(0).toUpperCase() + Array.from(filterStatuses)[0].slice(1)
                            : `${filterStatuses.size} statuses`}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg">
                        {[
                          { value: "unconfirmed", label: "Unconfirmed" },
                          { value: "confirmed", label: "Confirmed" },
                          { value: "paid", label: "Paid" },
                          { value: "canceled", label: "Canceled" },
                          { value: "simulated", label: "Simulated" },
                        ].map((status) => (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => toggleStatusFilter(status.value)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5"
                          >
                            {filterStatuses.has(status.value) ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                            <span className={statusColors[status.value as keyof typeof statusColors]?.split(" ")[0] || ""}>
                              {status.label}
                            </span>
                          </button>
                        ))}
                        {filterStatuses.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterStatuses(new Set())}
                            className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Account filter - Multi-select dropdown */}
                  <div className="relative" ref={accountDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(!accountDropdownOpen);
                        setStatusDropdownOpen(false);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span className={filterAccounts.size === 0 ? "text-slate-400" : "truncate"}>
                        {filterAccounts.size === 0
                          ? "All accounts"
                          : filterAccounts.size === 1
                            ? uniqueAccounts.find(([id]) => id === Array.from(filterAccounts)[0])?.[1] || "1 account"
                            : `${filterAccounts.size} accounts`}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${accountDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {accountDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg">
                        {uniqueAccounts.map(([accountId, alias]) => (
                          <button
                            key={accountId}
                            type="button"
                            onClick={() => toggleAccountFilter(accountId)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5"
                          >
                            {filterAccounts.has(accountId) ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                            <span className="truncate">{alias}</span>
                          </button>
                        ))}
                        {filterAccounts.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setFilterAccounts(new Set())}
                            className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Type filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All types</option>
                    <option value="purchase">Purchase</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <p className="mt-2 text-xs text-slate-400">
                    Showing {filteredPayments.length} of {period.payments.length} payments
                  </p>
                )}
              </div>

              {/* Selection controls bar */}
              {selectedPayments.size > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-300">
                      {selectedPayments.size} payment{selectedPayments.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkStatusModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    <Tag className="h-4 w-4" />
                    Change Status
                  </button>
                </div>
              )}

              {/* Payments table */}
              <div className="overflow-x-auto overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-2 text-center font-medium w-10">
                        <button
                          type="button"
                          onClick={() => {
                            const selectablePayments = filteredPayments.filter(p => p.status !== "simulated");
                            const allFilteredSelected = selectablePayments.every(p => selectedPayments.has(p.paymentId));
                            if (allFilteredSelected && selectablePayments.length > 0) {
                              // Deselect only filtered payments
                              setSelectedPayments(prev => {
                                const newSet = new Set(prev);
                                selectablePayments.forEach(p => newSet.delete(p.paymentId));
                                return newSet;
                              });
                            } else {
                              // Select all filtered payments
                              setSelectedPayments(prev => {
                                const newSet = new Set(prev);
                                selectablePayments.forEach(p => newSet.add(p.paymentId));
                                return newSet;
                              });
                            }
                          }}
                          className="rounded p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                          title="Select/deselect visible payments"
                        >
                          {filteredPayments.filter(p => p.status !== "simulated").length > 0 &&
                           filteredPayments.filter(p => p.status !== "simulated").every(p => selectedPayments.has(p.paymentId)) ? (
                            <CheckSquare className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
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
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No payments match the current filters
                        </td>
                      </tr>
                    ) : filteredPayments.map((payment) => {
                      const isSelectable = payment.status !== "simulated";
                      const isSelected = selectedPayments.has(payment.paymentId);
                      return (
                        <tr 
                          key={payment.paymentId} 
                          className={`text-slate-200 transition-colors ${getPaymentStyle(payment)} ${isSelected ? 'bg-blue-500/10' : ''}`}
                        >
                          <td className="py-3 text-center">
                            {isSelectable ? (
                              <button
                                type="button"
                                onClick={() => togglePaymentSelection(payment.paymentId)}
                                className="rounded p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-blue-400" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block h-4 w-4" />
                            )}
                          </td>
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
                              <div className="inline-flex">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(payment)}
                                  disabled={!getNextQuickStatus(payment.status)}
                                  className="rounded-l-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border-r border-white/10"
                                  title={
                                    getNextQuickStatus(payment.status)
                                      ? `Mark as ${getNextQuickStatus(payment.status)}`
                                      : "No quick action available"
                                  }
                                >
                                  <Tag className="h-4 w-4" />
                                </button>
                                <DropdownMenu.Root>
                                  <DropdownMenu.Trigger asChild>
                                    <button
                                      type="button"
                                      className="rounded-r-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                      title="Change status"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </DropdownMenu.Trigger>
                                  <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                      side="bottom"
                                      align="end"
                                      sideOffset={4}
                                      className="z-50 min-w-[140px] rounded-xl border border-white/10 bg-slate-900 py-1 shadow-xl"
                                    >
                                      {allStatuses
                                        .filter((s) => s !== payment.status)
                                        .map((s) => (
                                          <DropdownMenu.Item
                                            key={s}
                                            onSelect={() => handleDropdownStatusChange(payment, s)}
                                            className={`cursor-pointer px-3 py-1.5 text-xs font-medium outline-none transition hover:bg-white/5 ${statusColors[s]}`}
                                          >
                                            {s}
                                          </DropdownMenu.Item>
                                        ))}
                                    </DropdownMenu.Content>
                                  </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                              </div>
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

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        open={confirmStatusOpen}
        title="Change Status"
        message={
          statusChangePayment && statusChangeTarget
            ? <>Change payment status from <span className={`font-semibold ${statusColors[statusChangePayment.status]}`}>{statusChangePayment.status}</span> to <span className={`font-semibold ${statusColors[statusChangeTarget as keyof typeof statusColors]}`}>{statusChangeTarget}</span>?</>
            : "Confirm status change?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onCancel={() => {
          setConfirmStatusOpen(false);
          setStatusChangePayment(null);
          setStatusChangeTarget(null);
        }}
        onConfirm={handleConfirmStatusChange}
        loading={loading}
      />

      {/* Bulk Status Change Modal */}
      <BulkStatusModal
        open={bulkStatusModalOpen}
        selectedCount={selectedPayments.size}
        onCancel={() => setBulkStatusModalOpen(false)}
        onConfirm={handleBulkStatusChange}
        loading={loading}
      />

      {/* Failed Payments Modal */}
      <FailedPaymentsModal
        open={failedPaymentsModalOpen}
        failedPayments={failedPayments}
        onClose={() => {
          setFailedPaymentsModalOpen(false);
          setFailedPayments([]);
        }}
      />
    </div>
  );
}

// Bulk Status Modal Component
interface BulkStatusModalProps {
  open: boolean;
  selectedCount: number;
  onCancel: () => void;
  onConfirm: (status: string) => void;
  loading?: boolean;
}

function BulkStatusModal({ open, selectedCount, onCancel, onConfirm, loading = false }: BulkStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState("confirmed");

  const statusOptions = [
    { value: "unconfirmed", label: "Unconfirmed", color: "text-amber-400" },
    { value: "confirmed", label: "Confirmed", color: "text-blue-400" },
    { value: "paid", label: "Paid", color: "text-emerald-400" },
    { value: "canceled", label: "Canceled", color: "text-slate-400" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedStatus);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl mx-4"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Change Status</h2>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-400">
              Change status for <span className="font-semibold text-white">{selectedCount}</span> selected payment{selectedCount !== 1 ? 's' : ''}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    disabled={loading}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      selectedStatus === option.value
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className={option.color}>{option.label}</span>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Apply"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Failed Payments Modal Component
interface FailedPaymentsModalProps {
  open: boolean;
  failedPayments: FailedPayment[];
  onClose: () => void;
}

function FailedPaymentsModal({ open, failedPayments, onClose }: FailedPaymentsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl mx-4 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Failed Updates</h2>
                <p className="text-sm text-slate-400">
                  {failedPayments.length} payment{failedPayments.length !== 1 ? 's' : ''} could not be updated
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Failed payments list */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {failedPayments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{payment.expenseTitle}</p>
                        <p className="text-sm text-slate-400 truncate">{payment.accountAlias}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-red-300">{payment.error}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
