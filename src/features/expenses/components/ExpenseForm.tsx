"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import type { ExpenseStatus, ExpenseType } from "@/lib/models/expense";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";
import DateInput from "@/components/DateInput";

export type ExpenseFormValues = {
  accountId: string;
  categoryId: string;
  title: string;
  ccName: string;
  amount: number;
  acquiredAt: string;
  firstPaymentDate: string;
  installments: number;
  expenseType: ExpenseType;
  status: ExpenseStatus;
  isOneTimePayment: boolean;
};

type ExpenseFormProps = {
  initialValues: ExpenseFormValues;
  onSubmit: (values: ExpenseFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel: string;
  isEditing?: boolean;
};

const subscriptionStatusOptions: ExpenseStatus[] = ["active", "finished"];
const typeOptions: ExpenseType[] = ["purchase", "subscription"];

/**
 * Calculates the first payment date based on credit card closing/expiring dates and purchase date
 */
function calculateFirstPaymentDate(
  acquiredAt: string,
  closingDate: string,
  expiringDate: string
): string {
  if (!acquiredAt || !closingDate || !expiringDate) {
    return "";
  }

  const purchaseDate = new Date(acquiredAt + "T00:00:00");
  const closing = new Date(closingDate + "T00:00:00");
  const expiring = new Date(expiringDate + "T00:00:00");

  // Calculate difference in days between purchase and closing
  const daysDifference = Math.floor(
    (closing.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Case 3: If purchase date is more than 35 days away from closing date
  if (Math.abs(daysDifference) > 35) {
    // Return first day of the month after purchase
    const nextMonth = new Date(purchaseDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth.toISOString().split("T")[0];
  }

  // Case 1: Purchase before closing date
  if (purchaseDate < closing) {
    // First payment is the expiring date
    return expiringDate;
  }

  // Case 2: Purchase after closing date
  // First payment is first day of month after expiring date
  const nextMonthAfterExpiring = new Date(expiring);
  nextMonthAfterExpiring.setMonth(nextMonthAfterExpiring.getMonth() + 1);
  nextMonthAfterExpiring.setDate(1);
  return nextMonthAfterExpiring.toISOString().split("T")[0];
}

export default function ExpenseForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
  isEditing = false,
}: ExpenseFormProps) {
  const [values, setValues] = useState(initialValues);
  const [firstPaymentManuallyEdited, setFirstPaymentManuallyEdited] = useState(false);
  const { data: categoriesData } = useExpenseCategories();
  const { data: creditCardsData } = useCreditCards();

  // Sort categories: non-income first (alphabetically), then income (alphabetically)
  const sortedCategories = useMemo(() => {
    if (!categoriesData?.items) return [];
    
    const categories = [...categoriesData.items];
    const expenseCategories = categories.filter((c) => !c.isIncome).sort((a, b) => a.name.localeCompare(b.name));
    const incomeCategories = categories.filter((c) => c.isIncome).sort((a, b) => a.name.localeCompare(b.name));
    
    return [...expenseCategories, ...incomeCategories];
  }, [categoriesData]);

  const creditCards = useMemo(() => {
    return creditCardsData?.items || [];
  }, [creditCardsData]);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Auto-calculate first payment date when credit card or acquired date changes
  useEffect(() => {
    // Only auto-calculate in create mode, not when editing
    if (isEditing) return;
    
    // Don't auto-calculate if user has manually edited the field
    if (firstPaymentManuallyEdited) return;
    
    // Only calculate if we have all required fields
    if (!values.accountId || !values.acquiredAt) return;

    const selectedCard = creditCards.find(c => c.id === values.accountId);
    if (!selectedCard) return;

    const calculatedDate = calculateFirstPaymentDate(
      values.acquiredAt,
      selectedCard.nextClosingDate,
      selectedCard.nextExpiringDate
    );

    if (calculatedDate && calculatedDate !== values.firstPaymentDate) {
      setValues(prev => ({
        ...prev,
        firstPaymentDate: calculatedDate
      }));
    }
  }, [values.accountId, values.acquiredAt, creditCards, isEditing, firstPaymentManuallyEdited, values.firstPaymentDate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Type - First field */}
      <label className="block">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Type</span>
        <select
          name="expenseType"
          value={values.expenseType}
          onChange={handleInputChange}
          disabled={isEditing}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="mt-1 text-xs text-slate-400">Type cannot be changed</p>
        )}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Title</span>
          <input
            name="title"
            value={values.title}
            onChange={handleInputChange}
            placeholder="Buy iPad"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Amount</span>
          <input
            name="amount"
            type="number"
            value={values.amount}
            onChange={handleInputChange}
            disabled={isEditing}
            placeholder="0"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Credit card</span>
          <select
            name="accountId"
            value={values.accountId}
            onChange={(e) => {
              setValues(prev => ({
                ...prev,
                accountId: e.target.value,
              }));
            }}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
            required
          >
            <option value="">Select a credit card</option>
            {creditCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.alias}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Name in credit card</span>
          <input
            name="ccName"
            type="text"
            value={values.ccName}
            onChange={handleInputChange}
            placeholder="Expense name in statement"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Category</span>
          <select
            name="categoryId"
            value={values.categoryId}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
          >
            <option value="">Select a category (optional)</option>
            {sortedCategories.length > 0 && (
              <>
                {sortedCategories.filter((c) => !c.isIncome).length > 0 && (
                  <optgroup label="Expenses">
                    {sortedCategories
                      .filter((c) => !c.isIncome)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                {sortedCategories.filter((c) => c.isIncome).length > 0 && (
                  <optgroup label="Income">
                    {sortedCategories
                      .filter((c) => c.isIncome)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </>
            )}
          </select>
        </label>
        
        {/* Status - Only for subscriptions */}
        {values.expenseType === "subscription" && (
          <label className="block">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</span>
            <select
              name="status"
              value={values.status}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
            >
              {subscriptionStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Acquired at</span>
          <DateInput
            name="acquiredAt"
            value={values.acquiredAt}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">First payment</span>
          <DateInput
            name="firstPaymentDate"
            value={values.firstPaymentDate}
            onChange={(e) => {
              handleInputChange(e);
              setFirstPaymentManuallyEdited(true);
            }}
            disabled={isEditing}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
          />
          {!isEditing && (
            <p className="mt-1 text-xs text-slate-400">
              Auto-calculated, but you can change it
            </p>
          )}
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Installments</span>
          <input
            name="installments"
            type="number"
            value={values.installments}
            onChange={handleInputChange}
            disabled={isEditing}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-70"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}