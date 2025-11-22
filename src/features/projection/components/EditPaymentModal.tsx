"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type EditType = "amount" | "status" | "date";

type EditPaymentModalProps = {
  open: boolean;
  editType: EditType;
  currentValue: string | number;
  onCancel: () => void;
  onConfirm: (value: string | number) => void;
  loading?: boolean;
};

const statusOptions = [
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "canceled", label: "Canceled" },
];

export default function EditPaymentModal({
  open,
  editType,
  currentValue,
  onCancel,
  onConfirm,
  loading = false,
}: EditPaymentModalProps) {
  const [value, setValue] = useState(currentValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  const getTitle = () => {
    switch (editType) {
      case "amount":
        return "Edit Amount";
      case "status":
        return "Edit Status";
      case "date":
        return "Edit Date";
      default:
        return "Edit Payment";
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
              >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold text-white">
                    {getTitle()}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {editType === "amount" && (
                    <div>
                      <label
                        htmlFor="amount"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Amount
                      </label>
                      <input
                        id="amount"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter amount"
                        required
                        disabled={loading}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  )}

                  {editType === "status" && (
                    <div>
                      <label
                        htmlFor="status"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={loading}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editType === "date" && (
                    <div>
                      <label
                        htmlFor="date"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Payment Date
                      </label>
                      <input
                        id="date"
                        type="date"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 scheme-dark"
                        required
                        disabled={loading}
                      />
                    </div>
                  )}

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
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
