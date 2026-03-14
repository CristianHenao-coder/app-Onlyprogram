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
      console.error(
        "❌ PayPal Client ID o Client Secret no están configurados en .env",
      );
      throw new Error("Credenciales de PayPal no configuradas en el servidor.");
    }

    const auth = Buffer.from(
      `${config.paypal.clientId}:${config.paypal.clientSecret}`,
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
      console.error(
        "❌ Error al obtener Access Token de PayPal:",
        response.status,
        errorBody,
      );
      throw new Error("Failed to get PayPal access token");
    }

    const data = (await response.json()) as any;
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
      application_context: {
        return_url: `${config.urls.frontend}/dashboard/payments?status=success`,
        cancel_url: `${config.urls.frontend}/dashboard/payments?status=cancel`,
        user_action: "PAY_NOW",
        brand_name: "Only Program"
      }
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
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayPal capture order failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  static async createSubscription(planId: string, customId?: string) {
    const accessToken = await this.getAccessToken();

    const payload = {
      plan_id: planId,
      custom_id: customId,
      application_context: {
        return_url: `${config.urls.frontend}/dashboard/payments?status=paypal_success`,
        cancel_url: `${config.urls.frontend}/dashboard/payments?status=paypal_cancel`,
        user_action: "SUBSCRIBE_NOW",
        brand_name: "Only Program",
      },
    };

    const response = await fetch(`${config.paypal.apiUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("PayPal create subscription failed:", error);
      throw new Error(`PayPal create subscription failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Si necesitamos verificar el webhook de PayPal manualmente o validar eventos
  static async verifyWebhookSignature(reqBody: any, headers: any, webhookId: string) {
    const accessToken = await this.getAccessToken();

    const payload = {
      transmission_id: headers["paypal-transmission-id"],
      transmission_time: headers["paypal-transmission-time"],
      cert_url: headers["paypal-cert-url"],
      auth_algo: headers["paypal-auth-algo"],
      transmission_sig: headers["paypal-transmission-sig"],
      webhook_id: webhookId,
      webhook_event: reqBody,
    };

    const response = await fetch(`${config.paypal.apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Failed to verify PayPal Webhook signature.");
      return false;
    }

    const data = (await response.json()) as any;
    return data.verification_status === "SUCCESS";
  }
}
