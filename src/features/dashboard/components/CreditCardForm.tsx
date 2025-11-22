"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreditCard } from "@/lib/models/creditCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import DateInput from "@/components/DateInput";

export type CreditCardFormValues = {
  alias: string;
  limit: number;
  financingLimit: number;
  nextClosingDate: string;
  nextExpiringDate: string;
  mainCreditCardId: string | null;
};

type CreditCardFormProps = {
  initialValues: CreditCardFormValues;
  onSubmit: (values: CreditCardFormValues) => void;
  submitting?: boolean;
  submitLabel: string;
  mainCreditCards?: CreditCard[]; // List of main credit cards for the select
  isEditMode?: boolean; // If true, mainCreditCardId field is disabled
};

export default function CreditCardForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel,
  mainCreditCards = [],
  isEditMode = false,
}: CreditCardFormProps) {
  const [values, setValues] = useState(initialValues);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Check if this is an additional card (has main credit card selected)
  const isAdditionalCard = values.mainCreditCardId !== null;

  // Get the main credit card data if selected
  const selectedMainCard = mainCreditCards.find(
    (card) => card.id === values.mainCreditCardId
  );

  // Check if form has been modified
  const hasChanges = () => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    let parsedValue: string | number | null = value;
    
    if (type === "number") {
      parsedValue = Number(value);
    } else if (name === "mainCreditCardId") {
      parsedValue = value === "" ? null : value;
      
      // When a main card is selected, preload its values
      if (parsedValue !== null) {
        const mainCard = mainCreditCards.find((card) => card.id === parsedValue);
        if (mainCard) {
          setValues((prev) => ({
            ...prev,
            mainCreditCardId: parsedValue as string,
            limit: mainCard.limit,
            financingLimit: mainCard.financingLimit,
            nextClosingDate: mainCard.nextClosingDate,
            nextExpiringDate: mainCard.nextExpiringDate,
          }));
          return;
        }
      }
    }
    
    setValues((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowCancelConfirm(true);
    } else {
      router.push("/dashboard");
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    router.push("/dashboard");
  };

  return (
    <>
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Card alias</span>
        <input
          name="alias"
          value={values.alias}
          onChange={handleInputChange}
          placeholder="Visa Platinum"
          required
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Main credit card</span>
        <select
          name="mainCreditCardId"
          value={values.mainCreditCardId ?? ""}
          onChange={handleInputChange}
          disabled={isEditMode}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">None (This is a main card)</option>
          {mainCreditCards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.alias}
            </option>
          ))}
        </select>
        {isEditMode && (
          <p className="mt-1 text-xs text-slate-500">
            Cannot change main card relationship in edit mode
          </p>
        )}
      </label>

      {isAdditionalCard && selectedMainCard && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-400">
            <strong>Additional Card:</strong> This card inherits limit and dates from{" "}
            <strong>{selectedMainCard.alias}</strong>
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Credit limit</span>
          <input
            name="limit"
            type="number"
            value={values.limit}
            onChange={handleInputChange}
            placeholder="0"
            required
            disabled={isAdditionalCard}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Financing limit</span>
          <input
            name="financingLimit"
            type="number"
            value={values.financingLimit}
            onChange={handleInputChange}
            placeholder="0"
            required
            disabled={isAdditionalCard}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Next closing date</span>
          <DateInput
            name="nextClosingDate"
            value={values.nextClosingDate}
            onChange={handleInputChange}
            required
            disabled={isAdditionalCard}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Expiration date</span>
          <DateInput
            name="nextExpiringDate"
            value={values.nextExpiringDate}
            onChange={handleInputChange}
            required
            disabled={isAdditionalCard}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/60 disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>

    <ConfirmDialog
      open={showCancelConfirm}
      title="Unsaved changes"
      message="You have unsaved changes. Are you sure you want to leave without saving?"
      confirmLabel="Leave without saving"
      cancelLabel="Continue editing"
      onCancel={() => setShowCancelConfirm(false)}
      onConfirm={handleConfirmCancel}
    />
    </>
  );
}
