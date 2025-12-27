"use client";

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  createExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
} from "@/lib/api/expenses";
import { parseExpenseFromApi, parsePaginatedExpenses } from "@/lib/parsers/expense";
import type { CreateExpensePayload, UpdateExpensePayload } from "@/lib/api/expenses";
import type { Expense, PaginatedExpenses } from "@/lib/models/expense";

export function useExpenses(
  page: number, 
  limit = 10,
  options?: Omit<UseQueryOptions<PaginatedExpenses>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ["expenses", page, limit],
    queryFn: async () => {
      const payload = await getExpenses({ limit, offset: (page - 1) * limit });
      return parsePaginatedExpenses(payload);
    },
    ...options,
  });
}

/**
 * Hook that loads ALL expenses by fetching pages of 100 items until all are loaded.
 * Returns loading progress and a refresh function.
 */
export function useAllExpenses() {
  const queryClient = useQueryClient();
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  const fetchAllExpenses = useCallback(async (): Promise<Expense[]> => {
    const PAGE_SIZE = 100;
    let allExpenses: Expense[] = [];
    let currentPage = 1;
    let totalPages = 1;

    setIsLoadingAll(true);
    setLoadingProgress({ loaded: 0, total: 0 });

    try {
      // Fetch first page to get total
      const firstPayload = await getExpenses({ limit: PAGE_SIZE, offset: 0 });
      const firstParsed = parsePaginatedExpenses(firstPayload);
      allExpenses = [...firstParsed.items];
      totalPages = firstParsed.pagination.totalPages;
      
      setLoadingProgress({ 
        loaded: allExpenses.length, 
        total: firstParsed.pagination.totalItems 
      });

      // Fetch remaining pages
      for (currentPage = 2; currentPage <= totalPages; currentPage++) {
        const payload = await getExpenses({ 
          limit: PAGE_SIZE, 
          offset: (currentPage - 1) * PAGE_SIZE 
        });
        const parsed = parsePaginatedExpenses(payload);
        allExpenses = [...allExpenses, ...parsed.items];
        
        setLoadingProgress({ 
          loaded: allExpenses.length, 
          total: firstParsed.pagination.totalItems 
        });
      }

      return allExpenses;
    } finally {
      setIsLoadingAll(false);
    }
  }, []);

  const query = useQuery({
    queryKey: ["expenses", "all"],
    queryFn: fetchAllExpenses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["expenses", "all"] });
  }, [queryClient]);

  return {
    ...query,
    isLoadingAll: isLoadingAll || query.isLoading,
    loadingProgress,
    refresh,
  };
}

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => getExpense(expenseId).then(parseExpenseFromApi),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, expenseType }: { expenseId: string; expenseType: "purchase" | "subscription" }) => 
      deleteExpense(expenseId, expenseType),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      updateExpense(id, payload),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
    },
  });
}