import apiClient from "./client";
import type { ExpenseCategory, CreateExpenseCategoryData, UpdateExpenseCategoryData } from "../models/expenseCategory";
import {
  parseExpenseCategoryFromApi,
  serializeCreateExpenseCategory,
  serializeUpdateExpenseCategory,
} from "../parsers/expenseCategory";

type PaginatedResponse<T> = {
  total: number;
  limit: number;
  offset: number;
  items: T[];
};

type ExpenseCategoryResponseDTO = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  is_income: boolean;
};

// Get all expense categories (with pagination)
export async function getExpenseCategories(
  limit: number = 100,
  offset: number = 0
): Promise<PaginatedResponse<ExpenseCategory>> {
  const response = await apiClient.get<PaginatedResponse<ExpenseCategoryResponseDTO>>(
    "/api/v3/expense-categories",
    {
      params: { limit, offset },
    }
  );

  return {
    ...response.data,
    items: response.data.items.map(parseExpenseCategoryFromApi),
  };
}

// Create a new expense category
export async function createExpenseCategory(data: CreateExpenseCategoryData): Promise<ExpenseCategory> {
  const payload = serializeCreateExpenseCategory(data);
  const response = await apiClient.post<ExpenseCategoryResponseDTO>(
    "/api/v3/expense-categories",
    payload
  );
  return parseExpenseCategoryFromApi(response.data);
}

// Update an expense category
export async function updateExpenseCategory(
  categoryId: string,
  data: UpdateExpenseCategoryData
): Promise<ExpenseCategory> {
  const payload = serializeUpdateExpenseCategory(data);
  const response = await apiClient.put<ExpenseCategoryResponseDTO>(
    `/api/v3/expense-categories/${categoryId}`,
    payload
  );
  return parseExpenseCategoryFromApi(response.data);
}

// Delete an expense category
export async function deleteExpenseCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/api/v3/expense-categories/${categoryId}`);
}
