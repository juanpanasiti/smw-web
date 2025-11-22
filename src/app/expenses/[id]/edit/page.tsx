"use client";

import { useMemo, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SidebarLayout from "@/components/SidebarLayout";
import ExpenseForm, { ExpenseFormValues } from "@/features/expenses/components/ExpenseForm";
import { useExpense, useUpdateExpense } from "@/features/expenses/hooks/useExpenses";
import { useAuthContext } from "@/providers/AuthProvider";
import type { CreateExpensePayload } from "@/lib/api/expenses";

type Params = { params: Promise<{ id: string }> };

function mapToPayload(values: ExpenseFormValues): CreateExpensePayload {
  return {
    account_id: values.accountId,
    category_id: values.categoryId,
    title: values.title,
    cc_name: values.ccName,
    amount: values.amount,
    acquired_at: values.acquiredAt,
    first_payment_date: values.firstPaymentDate,
    installments: values.installments,
    expense_type: values.expenseType,
    status: values.status,
    is_one_time_payment: values.isOneTimePayment,
  };
}

export default function ExpenseEditPage({ params }: Params) {
  const { id } = use(params);
  const { user } = useAuthContext();
  const router = useRouter();
  const { data } = useExpense(id);
  const updateMutation = useUpdateExpense();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  const defaultValues = useMemo<ExpenseFormValues>(() => {
    if (!data) {
      return {
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
      };
    }

    return {
      accountId: data.accountId,
      categoryId: data.categoryId,
      title: data.title,
      ccName: data.ccName,
      amount: data.amount,
      acquiredAt: data.acquiredAt,
      firstPaymentDate: data.firstPaymentDate,
      installments: data.installments,
      expenseType: data.expenseType,
      status: data.status,
      isOneTimePayment: data.isOneTimePayment,
    };
  }, [data]);

  const handleSubmit = (values: ExpenseFormValues) => {
    updateMutation.mutate(
      { id, payload: mapToPayload(values) },
      {
        onSuccess() {
          toast.success(`Expense "${values.title}" updated successfully`);
          router.push(`/expenses/${id}`);
        },
        onError(error) {
          const message = error instanceof Error ? error.message : "Failed to update expense";
          toast.error(message);
        },
      }
    );
  };

  if (!user) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Edit expense</p>
          <h1 className="text-3xl font-semibold text-white">{data.title}</h1>
        </div>
        <ExpenseForm
          initialValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitting={updateMutation.isPending}
          submitLabel="Save changes"
          isEditing={true}
        />
      </div>
    </SidebarLayout>
  );
}
