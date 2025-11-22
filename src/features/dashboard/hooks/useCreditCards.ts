"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCreditCards } from "@/lib/api/creditCards";
import { parsePaginatedCreditCards } from "@/lib/parsers/creditCard";

export function useCreditCards() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["creditCards"],
    queryFn: async () => {
      const payload = await getCreditCards(50, 0);
      const parsed = parsePaginatedCreditCards(payload);
      
      // Seed individual credit card queries with data from the list
      // This prevents unnecessary API calls when viewing/editing individual cards
      parsed.items.forEach((card) => {
        queryClient.setQueryData(["creditCard", card.id], card, {
          updatedAt: Date.now(),
        });
      });
      
      return parsed;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - prevent immediate refetch
  });
}
