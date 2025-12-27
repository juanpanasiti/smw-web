import apiClient from "@/lib/api/client";

export interface ApiCreditCard {
  id: string;
  owner_id: string;
  alias: string;
  limit: number;
  is_enabled: boolean;
  main_credit_card_id: string | null;
  next_closing_date: string;
  next_expiring_date: string;
  financing_limit: number;
  total_expenses_count: number;
  total_purchases_count: number;
  total_subscriptions_count: number;
  used_limit: number;
  available_limit: number;
  used_financing_limit: number;
  available_financing_limit: number;
}

export interface ApiPaginatedCreditCards {
  items: ApiCreditCard[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export async function getCreditCards(limit = 50, offset = 0): Promise<ApiPaginatedCreditCards> {
  const response = await apiClient.get<ApiPaginatedCreditCards>("/api/v3/credit-cards", {
    params: { limit, offset },
  });
  return response.data;
}
