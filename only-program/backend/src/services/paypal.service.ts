import { config } from "../config/env";

interface CreateOrderParams {
  amount: number;
  currency?: string;
  description?: string;
  referenceId?: string;
}

export class PayPalService {
  private static async getAccessToken(): Promise<string> {
    if (!config.paypal.clientId || !config.paypal.clientSecret) {
      console.error("❌ PayPal Client ID o Client Secret no están configurados en .env");
      throw new Error("Credenciales de PayPal no configuradas en el servidor.");
    }

    const auth = Buffer.from(
      `${config.paypal.clientId}:${config.paypal.clientSecret}`
    ).toString("base64");

    const response = await fetch(`${config.paypal.apiUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ Error al obtener Access Token de PayPal:", response.status, errorBody);
      throw new Error("Failed to get PayPal access token");
    }

    const data = await response.json();
    return data.access_token;
  }

  static async createOrder({
    amount,
    currency = "USD",
    description = "Purchase",
    referenceId,
  }: CreateOrderParams) {
    const accessToken = await this.getAccessToken();

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          description,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
    };

    const response = await fetch(`${config.paypal.apiUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal create order failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  static async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${config.paypal.apiUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal capture order failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}
