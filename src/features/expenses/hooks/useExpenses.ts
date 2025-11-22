"use client";

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
} from "@/lib/api/expenses";
import { parseExpenseFromApi, parsePaginatedExpenses } from "@/lib/parsers/expense";
import type { CreateExpensePayload, UpdateExpensePayload } from "@/lib/api/expenses";
import type { PaginatedExpenses } from "@/lib/models/expense";

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