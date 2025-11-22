"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SidebarLayout from "@/components/SidebarLayout";
import ExpenseForm, { ExpenseFormValues } from "@/features/expenses/components/ExpenseForm";
import { useCreateExpense } from "@/features/expenses/hooks/useExpenses";
import { mapFormToPayload } from "@/features/expenses/utils/expensePayload";
import { useAuthContext } from "@/providers/AuthProvider";

export default function ExpenseNewPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const createMutation = useCreateExpense();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  const defaultValues = useMemo<ExpenseFormValues>(() => ({
    accountId: "",
    categoryId: "",
    title: "",
    ccName: "",
    amount: 0,
    acquiredAt: new Date().toISOString().slice(0, 10),
    firstPaymentDate: new Date().toISOString().slice(0, 10),
    installments: 1,
    expenseType: "purchase",
    status: "pending",
    isOneTimePayment: false,
  }), []);

  const handleSubmit = (values: ExpenseFormValues) => {
    createMutation.mutate(mapFormToPayload(values), {
      onSuccess() {
        toast.success(`Expense "${values.title}" created successfully`);
        router.push("/expenses");
      },
      onError(error) {
        const message = error instanceof Error ? error.message : "Failed to create expense";
        toast.error(message);
      },
    });
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">New expense</p>
          <h1 className="text-3xl font-semibold text-white">Create an expense</h1>
        </div>
        <ExpenseForm
          initialValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitting={createMutation.isPending}
          submitLabel="Save expense"
        />
      </div>
    </SidebarLayout>
  );
}
