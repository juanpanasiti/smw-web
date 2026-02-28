"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, X, Loader2, ArrowUpDown } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import SidebarLayout from "@/components/SidebarLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteExpense, useAllExpenses } from "@/features/expenses/hooks/useExpenses";
import { deleteExpense } from "@/lib/api/expenses";
import { formatDateToPeriod } from "@/lib/utils/dateFormat";
import type { ExpenseStatus, ExpenseType } from "@/lib/models/expense";

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function ExpensesPage() {
  // Data fetching
  const { data: expenses = [], isLoadingAll, loadingProgress, refresh, isFetching } = useAllExpenses();
  const deleteMutation = useDeleteExpense();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Delete state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string; expenseType: ExpenseType } | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "all">("all");
  const [filterType, setFilterType] = useState<ExpenseType | "all">("all");

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  // Pagination states
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Text search filter
      if (searchText) {
        const normalizedSearch = normalizeText(searchText);
        const matchesTitle = normalizeText(expense.title).includes(normalizedSearch);
        const matchesCcName = normalizeText(expense.ccName).includes(normalizedSearch);
        
        if (!matchesTitle && !matchesCcName) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all" && expense.status !== filterStatus) {
        return false;
      }

      // Type filter
      if (filterType !== "all" && expense.expenseType !== filterType) {
        return false;
      }

      return true;
    });
  }, [expenses, searchText, filterStatus, filterType]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    const sortableItems = [...filteredExpenses];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Custom sort mapping if needed
        if (sortConfig.key === 'payments') {
           aValue = a.firstPaymentDate;
           bValue = b.firstPaymentDate;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredExpenses, sortConfig]);

  // Paginate filtered expenses
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedExpenses.slice(startIndex, startIndex + pageSize);
  }, [sortedExpenses, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchText || filterStatus !== "all" || filterType !== "all";

  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("all");
    setFilterType("all");
    setCurrentPage(1);
  };

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
          refresh();
        },
        onError(error) {
          const message = error instanceof Error ? error.message : "Failed to delete expense";
          toast.error(message);
        },
      }
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} expenses?`)) return;

    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
    
    // Get full expense objects for selected IDs to know their types
    const expensesToDelete = expenses.filter(e => selectedIds.has(e.id));

    toast.loading("Deleting expenses...", { id: "bulk-delete" });

    for (const expense of expensesToDelete) {
      try {
        await deleteExpense(expense.id, expense.expenseType);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete expense ${expense.id}`, error);
        failCount++;
      }
    }

    setIsBulkDeleting(false);
    setSelectedIds(new Set());
    await refresh(); // Refresh data

    toast.dismiss("bulk-delete");

    if (failCount === 0) {
      toast.success(`Deleted ${successCount} expenses successfully`);
    } else if (successCount === 0) {
      toast.error(`Failed to delete ${failCount} expenses`);
    } else {
      toast(`Deleted ${successCount} successfully. Failed ${failCount}.`, {
        icon: '⚠️',
        style: {
          background: '#FEF08A',
          color: '#854D0E',
        },
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible on current page
      const newSelected = new Set(selectedIds);
      paginatedExpenses.forEach(e => newSelected.add(e.id));
      setSelectedIds(newSelected);
    } else {
      // Deselect all visible on current page
      const newSelected = new Set(selectedIds);
      paginatedExpenses.forEach(e => newSelected.delete(e.id));
      setSelectedIds(newSelected);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    toast.success("Expenses refreshed");
  };

  // Check if all visible items are selected
  const allVisibleSelected = paginatedExpenses.length > 0 && paginatedExpenses.every(e => selectedIds.has(e.id));
  const someVisibleSelected = paginatedExpenses.some(e => selectedIds.has(e.id));
  const isIndeterminate = someVisibleSelected && !allVisibleSelected;

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

        {/* Loading indicator */}
        {isLoadingAll && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-300">Loading expenses...</p>
                {loadingProgress.total > 0 && (
                  <p className="text-xs text-blue-400">
                    {loadingProgress.loaded} of {loadingProgress.total} loaded
                  </p>
                )}
              </div>
            </div>
            {loadingProgress.total > 0 && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-900/50">
                <div 
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-slate-800/30 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Filters</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete ({selectedIds.size})
              </motion.button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search text */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or account..."
                value={searchText}
                onChange={(e) => handleFilterChange(setSearchText, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(setFilterStatus, e.target.value as ExpenseStatus | "all")}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(setFilterType, e.target.value as ExpenseType | "all")}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All types</option>
              <option value="purchase">Purchase</option>
              <option value="subscription">Subscription</option>
            </select>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          {(hasActiveFilters || expenses.length > 0) && !isLoadingAll && (
            <p className="mt-2 text-xs text-slate-400">
              Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
              {filteredExpenses.length !== expenses.length && ` (filtered from ${expenses.length} total)`}
            </p>
          )}
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-950/40 p-4">
          <table className="min-w-full text-left text-sm text-white">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                <th className="px-4 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ccName')}>
                  <div className="flex items-center gap-1">Card <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('expenseType')}>
                  <div className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('installments')}>
                  <div className="flex items-center gap-1">Installments <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('payments')}>
                   <div className="flex items-center gap-1">Payments <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.map((expense, index) => {
                const isCompletedPurchase = expense.expenseType === "purchase" && expense.doneInstallments >= expense.installments;
                const isSelected = selectedIds.has(expense.id);

                // Calculate Last Payment
                let lastPaymentDisplay = "---";
                if (expense.expenseType === "purchase" && expense.firstPaymentDate && expense.installments) {
                  try {
                    const date = new Date(expense.firstPaymentDate + "T00:00:00");
                    // Add installments - 1 months
                    date.setMonth(date.getMonth() + (expense.installments - 1));
                    lastPaymentDisplay = formatDateToPeriod(date);
                  } catch (e) {
                    console.error("Error calculating last payment", e);
                  }
                }

                return (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`border-b border-white/5 ${isCompletedPurchase ? "bg-emerald-500/5" : ""} ${isSelected ? "bg-blue-500/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = new Set(selectedIds);
                          if (e.target.checked) newSelected.add(expense.id);
                          else newSelected.delete(expense.id);
                          setSelectedIds(newSelected);
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={`font-medium ${isCompletedPurchase ? "text-emerald-200" : ""}`}>{expense.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{expense.ccName}</td>
                    <td className="px-4 py-3 font-semibold">{currencyFormatter.format(expense.amount)}</td>
                    <td className="px-4 py-3">
                      <span 
                        className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.4em] ${
                          isCompletedPurchase 
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                            : "border-white/20"
                        }`}
                      >
                        {isCompletedPurchase ? "DONE" : expense.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[0.65rem] uppercase tracking-wider ${
                        expense.expenseType === "subscription" 
                          ? "bg-violet-500/20 text-violet-300" 
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {expense.expenseType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expense.expenseType === "subscription" 
                        ? "Recurring"
                        : `${expense.doneInstallments}/${expense.installments}`
                      }
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                           <div className="flex items-center gap-2">
                              <span className="text-slate-500 w-8">First:</span>
                              <span>{formatDateToPeriod(expense.firstPaymentDate)}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-slate-500 w-8">Last:</span>
                              <span>{lastPaymentDisplay}</span>
                           </div>
                        </div>
                    </td>
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
                );
              })}
            </tbody>
          </table>
          {!isLoadingAll && paginatedExpenses.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">
              {hasActiveFilters ? "No expenses match the current filters." : "No expenses registered yet."}
            </p>
          )}
        </div>

        {/* Pagination controls */}
        {filteredExpenses.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <p>
              Page {currentPage} of {totalPages} · {filteredExpenses.length} items
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold disabled:border-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-white/10 text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold disabled:border-slate-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
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
