"use client";

import { useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import SidebarLayout from "@/components/SidebarLayout";
import CreditCardForm, { CreditCardFormValues } from "@/features/dashboard/components/CreditCardForm";
import { useAuthContext } from "@/providers/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { parseCreditCardFromApi } from "@/lib/parsers/creditCard";
import { useUpdateCreditCard } from "@/features/dashboard/hooks/useCreditCardMutations";
import { useCreditCards } from "@/features/dashboard/hooks/useCreditCards";
import type { CreditCard } from "@/lib/models/creditCard";

export default function EditCreditCardPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;
  const updateMutation = useUpdateCreditCard();
  const queryClient = useQueryClient();
  const { data: creditCardsData } = useCreditCards();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  // Filter only main credit cards for the select (excluding current card)
  const mainCreditCards = useMemo(() => {
    return creditCardsData?.items.filter(
      (card) => card.isMainCreditCard && card.id !== cardId
    ) ?? [];
  }, [creditCardsData, cardId]);

  // Fetch the credit card details
  // Use placeholderData from cache if available (from list)
  const { data: creditCard, isLoading } = useQuery({
    queryKey: ["creditCard", cardId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v3/credit-cards/${cardId}`);
      return parseCreditCardFromApi(response.data);
    },
    enabled: !!user && !!cardId,
    staleTime: 5 * 60 * 1000, // 5 minutes - trust cached data from list
    placeholderData: () => {
      // Try to get data from cache (seeded by list query)
      return queryClient.getQueryData<CreditCard>(["creditCard", cardId]);
    },
  });

  const initialValues = useMemo<CreditCardFormValues | undefined>(() => {
    if (!creditCard) return undefined;
    return {
      alias: creditCard.alias,
      limit: creditCard.limit,
      financingLimit: creditCard.financingLimit,
      nextClosingDate: creditCard.nextClosingDate,
      nextExpiringDate: creditCard.nextExpiringDate,
      mainCreditCardId: creditCard.mainCreditCardId,
    };
  }, [creditCard]);

  const handleSubmit = (values: CreditCardFormValues) => {
    if (!user?.id) return;

    updateMutation.mutate({
      id: cardId,
      owner_id: user.id,
      alias: values.alias,
      limit: values.limit,
      financing_limit: values.financingLimit,
      next_closing_date: values.nextClosingDate,
      next_expiring_date: values.nextExpiringDate,
      main_credit_card_id: values.mainCreditCardId,
    }, {
      onSuccess() {
        toast.success(`Credit card "${values.alias}" updated successfully`);
        router.push("/dashboard");
      },
      onError(error) {
        const message = error instanceof Error ? error.message : "Failed to update credit card";
        toast.error(message);
      },
    });
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading...</p>
        </div>
      </SidebarLayout>
    );
  }

  if (!initialValues) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-rose-400">Credit card not found</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Edit credit card</p>
          <h1 className="text-3xl font-semibold text-white">{creditCard?.alias}</h1>
        </div>
        <CreditCardForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitting={updateMutation.isPending}
          submitLabel="Update card"
          mainCreditCards={mainCreditCards}
          isEditMode={true}
        />
      </div>
    </SidebarLayout>
  );
}
