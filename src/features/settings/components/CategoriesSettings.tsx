"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import {
  useExpenseCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/features/expenses/hooks/useExpenseCategories";
import type { ExpenseCategory } from "@/lib/models/expenseCategory";
import ConfirmDialog from "@/components/ConfirmDialog";

type CategoryFormData = {
  name: string;
  description: string;
  isIncome: boolean;
};

export default function CategoriesSettings() {
  const { user } = useAuthContext();
  const { data: categoriesData, isLoading } = useExpenseCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenseCategory | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    isIncome: false,
  });

  if (!user) return null;

  const categories = categoriesData?.items || [];
  const expenseCategories = categories.filter((c) => !c.isIncome).sort((a, b) => a.name.localeCompare(b.name));
  const incomeCategories = categories.filter((c) => c.isIncome).sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenForm = (category?: ExpenseCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        isIncome: category.isIncome,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "", isIncome: false });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", isIncome: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      updateMutation.mutate(
        {
          categoryId: editingCategory.id,
          data: formData,
        },
        {
          onSuccess: () => {
            handleCloseForm();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          ownerId: user.id,
          ...formData,
        },
        {
          onSuccess: () => {
            handleCloseForm();
          },
        }
      );
    }
  };

  const handleDelete = (category: ExpenseCategory) => {
    setDeleteConfirm(category);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id, {
        onSuccess: () => {
          setDeleteConfirm(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-white/5 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Expense Categories</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your expense and income categories
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">
                {editingCategory ? "Edit Category" : "New Category"}
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-400"
                  />
                </div>
                
                {/* Type Switch */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category Type</label>
                  <button
                    type="button"
                    onClick={() => !editingCategory && setFormData((prev) => ({ ...prev, isIncome: !prev.isIncome }))}
                    disabled={!!editingCategory}
                    className={`relative flex w-full items-center rounded-2xl border p-1 transition ${
                      editingCategory 
                        ? "cursor-not-allowed opacity-60" 
                        : "cursor-pointer"
                    } ${
                      formData.isIncome
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-rose-500/30 bg-rose-500/10"
                    }`}
                  >
                    <div
                      className={`absolute h-10 w-1/2 rounded-xl transition-all duration-300 ${
                        formData.isIncome
                          ? "translate-x-full bg-emerald-500"
                          : "translate-x-0 bg-rose-500"
                      }`}
                    />
                    <div className="relative z-10 flex w-1/2 items-center justify-center gap-2 py-2">
                      <TrendingDown className="h-4 w-4" />
                      <span className={`text-sm font-semibold transition ${
                        !formData.isIncome ? "text-white" : "text-slate-400"
                      }`}>
                        Expense
                      </span>
                    </div>
                    <div className="relative z-10 flex w-1/2 items-center justify-center gap-2 py-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className={`text-sm font-semibold transition ${
                        formData.isIncome ? "text-white" : "text-slate-400"
                      }`}>
                        Income
                      </span>
                    </div>
                  </button>
                  {editingCategory && (
                    <p className="mt-1 text-xs text-slate-400">Category type cannot be changed</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 rounded-2xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {editingCategory ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Expense Categories */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-slate-900/40">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Expenses</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">({expenseCategories.length})</span>
        </div>
        {expenseCategories.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No expense categories yet</p>
        ) : (
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenForm(category)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Income Categories */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-slate-900/40">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Income</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">({incomeCategories.length})</span>
        </div>
        {incomeCategories.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No income categories yet</p>
        ) : (
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenForm(category)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Category"
        message={
          deleteConfirm ? (
            <>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
