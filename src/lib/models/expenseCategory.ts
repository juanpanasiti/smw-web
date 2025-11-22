export type ExpenseCategory = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  isIncome: boolean;
};

export type CreateExpenseCategoryData = {
  ownerId: string;
  name: string;
  description?: string;
  isIncome: boolean;
};

export type UpdateExpenseCategoryData = {
  name?: string;
  description?: string;
  isIncome?: boolean;
};
