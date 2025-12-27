"use client";

import { ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            {/* Overlay with fade animation */}
            <AlertDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </AlertDialog.Overlay>

            {/* Content with scale + fade animation */}
            <AlertDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50"
              >
                {/* Warning icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertTriangle className="h-7 w-7 text-amber-500" />
                </div>

                {/* Title */}
                <AlertDialog.Title className="text-center text-lg font-semibold text-white">
                  {title}
                </AlertDialog.Title>

                {/* Message */}
                <AlertDialog.Description className="mt-2 text-center text-sm text-slate-300">
                  {message}
                </AlertDialog.Description>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={loading}
                      className="flex-1 rounded-2xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
                    >
                      {cancelLabel}
                    </button>
                  </AlertDialog.Cancel>

                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={loading}
                      className="flex-1 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Processing...
                        </span>
                      ) : (
                        confirmLabel
                      )}
                    </button>
                  </AlertDialog.Action>
                </div>

                {/* Close button (optional, accessible) */}
                <AlertDialog.Cancel asChild>
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </AlertDialog.Cancel>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
}