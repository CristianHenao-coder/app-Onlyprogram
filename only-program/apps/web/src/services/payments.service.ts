import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4005/api";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  created_at: string;
  tx_reference?: string;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        errorData.message ||
        `Error ${response.status}: ${response.statusText}`,
    );
  }
  return response.json();
}

async function getAuthHeaders() {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;

  if (!token) {
    throw new Error(
      "No hay sesión activa. Por favor inicia sesión nuevamente.",
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const paymentsService = {
  async getHistory() {
    const headers = await getAuthHeaders();
    // getAuthHeaders devuelve Content-Type, pero para GET no es estrictamente necesario, aunque no daña.
    // Sin embargo, fetch GET no lleva body, así que Content-Type es irrelevante.
    // Ajustamos para solo usar Authorization si fuera necesario, pero dejémoslo simple.

    const response = await fetch(`${API_URL}/payments`, {
      headers: {
        Authorization: headers.Authorization,
      },
    });

    return handleResponse(response);
  },

  async createPayPalOrder(amount: number, subscriptionId?: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/paypal/create-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, subscriptionId }),
    });

    return handleResponse(response);
  },

  async capturePayPalOrder(orderId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/paypal/capture-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ orderId }),
    });

    return handleResponse(response);
  },

  async createStripeIntent(amount: number, currency: string = "usd") {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/stripe/create-intent`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, currency }),
    });

    return handleResponse(response);
  },

  async submitManualCryptoPayment(data: {
    amount: number;
    currency: string;
    transactionHash: string;
    walletUsed?: string;
    subscriptionId?: string;
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/crypto/manual`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },
};

