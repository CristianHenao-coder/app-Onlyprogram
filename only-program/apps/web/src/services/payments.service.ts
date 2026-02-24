import { supabase } from "./supabase";

import { API_URL } from "./apiConfig";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

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
  async createWompiTransaction(data: {
    amount: number;
    email: string;
    token: string;
    acceptanceToken: string;
    installments?: number;
    linksData?: any[];
    customDomain?: string;
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/wompi/transaction`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getHistory() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments`, {
      headers: { Authorization: headers.Authorization },
    });
    return handleResponse(response);
  },

  async createPayPalOrder(
    amount: number,
    subscriptionId?: string,
    linksData?: any[],
    customDomain?: string,
  ) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/paypal/create-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, subscriptionId, linksData, customDomain }),
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

  async getWompiSignature(amount: number, currency: string = "COP") {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/wompi/get-signature`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, currency }),
    });
    return handleResponse(response);
  },

  // ── NOWPayments ──────────────────────────────────────────────

  /** Obtiene la lista de criptomonedas disponibles para pago */
  async getNowPaymentsCurrencies(): Promise<string[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/nowpayments/currencies`, {
      headers: { Authorization: headers.Authorization },
    });
    const data = await handleResponse(response);
    return data.currencies as string[];
  },

  /** Crea un pago en NOWPayments y recibe la dirección única de depósito */
  async createNowPayment(
    amount: number,
    payCurrency: string,
    linksData?: any[],
    customDomain?: string,
  ) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/payments/nowpayments/create-payment`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ amount, payCurrency, linksData, customDomain }),
      },
    );
    return handleResponse(response);
  },

  /** Consulta el estado actual de un pago NOWPayments (para polling) */
  async getNowPaymentStatus(paymentId: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/payments/nowpayments/status/${paymentId}`,
      {
        headers: { Authorization: headers.Authorization },
      },
    );
    return handleResponse(response);
  },

  /** Activa el plan gratuito de 3 días (uso único por cuenta) */
  async activateFreeTrial(
    linksData?: any[],
    customDomain?: string,
  ): Promise<{
    success: boolean;
    message: string;
    expiresAt: string;
    orderId: string;
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/free-trial`, {
      method: "POST",
      headers,
      body: JSON.stringify({ linksData, customDomain }),
    });
    return handleResponse(response);
  },

  /** Verifica si el usuario ya ha usado su prueba gratuita */
  async checkFreeTrial(): Promise<{ hasUsedTrial: boolean }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/payments/free-trial/check`, {
      headers: { Authorization: headers.Authorization },
    });
    return handleResponse(response);
  },
};
