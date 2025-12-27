import type { ApiCreditCard, ApiPaginatedCreditCards } from "@/lib/api/creditCards";
import type { CreditCard, PaginatedCreditCards } from "@/lib/models/creditCard";

export function parseCreditCardFromApi(apiCard: ApiCreditCard): CreditCard {
  return {
    id: apiCard.id,
    ownerId: apiCard.owner_id,
    alias: apiCard.alias,
    limit: apiCard.limit,
    isEnabled: apiCard.is_enabled,
    mainCreditCardId: apiCard.main_credit_card_id,
    isMainCreditCard: apiCard.main_credit_card_id === null, // Derived field
    nextClosingDate: apiCard.next_closing_date,
    nextExpiringDate: apiCard.next_expiring_date,
    financingLimit: apiCard.financing_limit,
    totalExpensesCount: apiCard.total_expenses_count,
    totalPurchasesCount: apiCard.total_purchases_count,
    totalSubscriptionsCount: apiCard.total_subscriptions_count,
    usedLimit: apiCard.used_limit,
    availableLimit: apiCard.available_limit,
    usedFinancingLimit: apiCard.used_financing_limit,
    availableFinancingLimit: apiCard.available_financing_limit,
  };
}

export function parsePaginatedCreditCards(apiPayload: ApiPaginatedCreditCards): PaginatedCreditCards {
  return {
    items: apiPayload.items.map(parseCreditCardFromApi),
    pagination: {
      currentPage: apiPayload.pagination.current_page,
      totalPages: apiPayload.pagination.total_pages,
      totalItems: apiPayload.pagination.total_items,
      perPage: apiPayload.pagination.per_page,
    },
  };
}
