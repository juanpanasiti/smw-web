import apiClient from "./client";

export interface UpdatePaymentData {
  amount: number;
  status: "unconfirmed" | "confirmed" | "paid" | "canceled";
  payment_date: string; // yyyy-mm-dd format
}

export interface CreatePaymentData {
  expense_id: string;
  amount: number;
  payment_date: string; // yyyy-mm-dd format
}

export interface PaymentResponse {
  payment_id: string;
  expense_id: string;
  amount: number;
  status: "unconfirmed" | "confirmed" | "paid" | "canceled" | "simulated";
  payment_date: string;
  no_installment: number;
  installments: number;
}

/**
 * Update a payment (works for both purchases and subscriptions)
 */
export async function updatePayment(
  paymentId: string,
  data: UpdatePaymentData
): Promise<PaymentResponse> {
  const response = await apiClient.put(
    `/api/v3/expenses/payments/${paymentId}`,
    data
  );
  return response.data;
}

/**
 * Create a new payment for a subscription
 */
export async function createSubscriptionPayment(
  subscriptionId: string,
  data: CreatePaymentData
): Promise<PaymentResponse> {
  const response = await apiClient.post(
    `/api/v3/subscriptions/${subscriptionId}/payments`,
    data
  );
  return response.data;
}

/**
 * Delete a payment from a subscription
 */
export async function deleteSubscriptionPayment(
  subscriptionId: string,
  paymentId: string
): Promise<void> {
  await apiClient.delete(
    `/api/v3/subscriptions/${subscriptionId}/payments/${paymentId}`
  );
}
