import type { ExpenseCategory, CreateExpenseCategoryData, UpdateExpenseCategoryData } from "../models/expenseCategory";

// API Response DTOs (snake_case)
type ExpenseCategoryResponseDTO = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  is_income: boolean;
};

type CreateExpenseCategoryDTO = {
  owner_id: string;
  name: string;
  description?: string;
  is_income: boolean;
};

type UpdateExpenseCategoryDTO = {
  name?: string;
  description?: string;
  is_income?: boolean;
};

// Parse API response to domain model
export function parseExpenseCategoryFromApi(dto: ExpenseCategoryResponseDTO): ExpenseCategory {
  return {
    id: dto.id,
    ownerId: dto.owner_id,
    name: dto.name,
    description: dto.description,
    isIncome: dto.is_income,
  };
}

// Serialize create data to API format
export function serializeCreateExpenseCategory(data: CreateExpenseCategoryData): CreateExpenseCategoryDTO {
  return {
    owner_id: data.ownerId,
    name: data.name,
    description: data.description || "",
    is_income: data.isIncome,
  };
}

// Serialize update data to API format
export function serializeUpdateExpenseCategory(data: UpdateExpenseCategoryData): UpdateExpenseCategoryDTO {
  const dto: UpdateExpenseCategoryDTO = {};
  
  if (data.name !== undefined) dto.name = data.name;
  if (data.description !== undefined) dto.description = data.description;
  if (data.isIncome !== undefined) dto.is_income = data.isIncome;
  
  return dto;
}
