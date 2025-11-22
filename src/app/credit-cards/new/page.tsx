"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SidebarLayout from "@/components/SidebarLayout";
import CreditCardForm, { CreditCardFormValues } from "@/features/dashboard/components/CreditCardForm";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCreateCreditCard } from "@/features/dashboard/hooks/useCreditCardMutations";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";

export default function NewCreditCardPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const createMutation = useCreateCreditCard();
  const { data: creditCardsData } = useCreditCards();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  // Filter only main credit cards for the select
  const mainCreditCards = useMemo(() => {
    return creditCardsData?.items.filter((card) => card.isMainCreditCard) ?? [];
  }, [creditCardsData]);

  const defaultValues = useMemo<CreditCardFormValues>(() => ({
    alias: "",
    limit: 0,
    financingLimit: 0,
    nextClosingDate: new Date().toISOString().slice(0, 10),
    nextExpiringDate: new Date().toISOString().slice(0, 10),
    mainCreditCardId: null,
  }), []);

  const handleSubmit = (values: CreditCardFormValues) => {
    if (!user?.id) return;
    
    createMutation.mutate({
      owner_id: user.id,
      alias: values.alias,
      limit: values.limit,
      financing_limit: values.financingLimit,
      next_closing_date: values.nextClosingDate,
      next_expiring_date: values.nextExpiringDate,
      main_credit_card_id: values.mainCreditCardId,
    }, {
      onSuccess() {
        toast.success(`Credit card "${values.alias}" created successfully`);
        router.push("/dashboard");
      },
      onError(error) {
        const message = error instanceof Error ? error.message : "Failed to create credit card";
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
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">New credit card</p>
          <h1 className="text-3xl font-semibold text-white">Add a credit card</h1>
        </div>
        <CreditCardForm
          initialValues={defaultValues}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          submitLabel="Save card"
          mainCreditCards={mainCreditCards}
        />
      </div>
    </SidebarLayout>
  );
}
