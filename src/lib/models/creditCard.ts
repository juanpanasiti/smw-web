export interface CreditCard {
  id: string;
  ownerId: string;
  alias: string;
  limit: number;
  isEnabled: boolean;
  mainCreditCardId: string | null;
  isMainCreditCard: boolean; // Derived: true when mainCreditCardId is null
  nextClosingDate: string;
  nextExpiringDate: string;
  financingLimit: number;
  totalExpensesCount: number;
  totalPurchasesCount: number;
  totalSubscriptionsCount: number;
  usedLimit: number;
  availableLimit: number;
  usedFinancingLimit: number;
  availableFinancingLimit: number;
}

export interface PaginatedCreditCards {
  items: CreditCard[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}
