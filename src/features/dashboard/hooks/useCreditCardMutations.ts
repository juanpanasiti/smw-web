"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { parseCreditCardFromApi } from "@/lib/parsers/creditCard";
import type { CreditCard, PaginatedCreditCards } from "@/lib/models/creditCard";

interface CreateCreditCardPayload {
  owner_id: string;
  alias: string;
  limit: number;
  financing_limit: number;
  next_closing_date: string;
  next_expiring_date: string;
  main_credit_card_id?: string | null;
}

interface UpdateCreditCardPayload extends CreateCreditCardPayload {
  id: string;
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCreditCardPayload) => {
      const response = await apiClient.post("/api/v3/credit-cards", payload);
      return parseCreditCardFromApi(response.data);
    },
    onSuccess(newCard: CreditCard) {
      // Update individual cache with the new card
      queryClient.setQueryData(["creditCard", newCard.id], newCard);
      
      // Add to the list cache manually instead of invalidating
      // This prevents an unnecessary API call
      queryClient.setQueryData(
        ["creditCards"],
        (old: PaginatedCreditCards | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: [newCard, ...old.items],
            pagination: {
              ...old.pagination,
              totalItems: old.pagination.totalItems + 1,
            },
          };
        }
      );
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCreditCardPayload) => {
      const response = await apiClient.put(`/api/v3/credit-cards/${id}`, payload);
      return parseCreditCardFromApi(response.data);
    },
    onSuccess(updatedCard: CreditCard) {
      // Update individual cache with the response
      queryClient.setQueryData(["creditCard", updatedCard.id], updatedCard);
      
      // Update the list cache manually instead of invalidating
      // This prevents an unnecessary API call
      queryClient.setQueryData(
        ["creditCards"], 
        (old: PaginatedCreditCards | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((card: CreditCard) =>
              card.id === updatedCard.id ? updatedCard : card
            ),
          };
        }
      );
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      await apiClient.delete(`/api/v3/credit-cards/${cardId}`);
    },
    onSuccess(_data: void, cardId: string) {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: ["creditCard", cardId] });
      
      // Remove from list cache manually instead of invalidating
      // This prevents an unnecessary API call
      queryClient.setQueryData(
        ["creditCards"],
        (old: PaginatedCreditCards | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((card) => card.id !== cardId),
            pagination: {
              ...old.pagination,
              totalItems: old.pagination.totalItems - 1,
            },
          };
        }
      );
    },
  });
}
