import crypto from "crypto";
import { config } from "../config/env";

export interface NowPaymentCreateParams {
  amount: number; // Amount in USD
  payCurrency: string; // e.g. "btc", "eth", "usdttrc20", "sol"
  orderId: string; // Internal order ID
  orderDescription?: string;
  email?: string;
}

export interface NowPaymentResult {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  expiration_estimate_date?: string;
}

export interface NowPaymentStatusResult {
  payment_id: string;
  payment_status: string; // 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'
  pay_address: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
}

/** Curated default list used if API call fails */
const DEFAULT_CURRENCIES = [
  "btc",
  "eth",
  "usdttrc20",
  "usdterc20",
  "sol",
  "bnbbsc",
  "trx",
  "ltc",
  "doge",
];

export class NowPaymentsService {
  private static get headers() {
    return {
      "Content-Type": "application/json",
      "x-api-key": config.nowpayments.apiKey,
    };
  }

  /**
   * Creates a payment invoice in NOWPayments.
   * Returns the unique pay_address and exact pay_amount for the user to send.
   */
  static async createPayment({
    amount,
    payCurrency,
    orderId,
    orderDescription = "Only Program - Links Premium",
  }: NowPaymentCreateParams): Promise<NowPaymentResult> {
    if (!config.nowpayments.apiKey) {
      throw new Error("NOWPayments API Key no configurada en el servidor.");
    }

    const payload: Record<string, any> = {
      price_amount: amount,
      price_currency: "usd",
      pay_currency: payCurrency.toLowerCase(),
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: `${config.urls.backend}/api/payments/webhook/nowpayments`,
    };

    const response = await fetch(`${config.nowpayments.apiUrl}/payment`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(`❌ NOWPayments Error (${response.status}):`, text);

      // Parse error for user-friendly messages
      try {
        const errJson = JSON.parse(text);
        const code = errJson.code || "";

        if (code === "AMOUNT_MINIMAL_ERROR") {
          throw new Error(
            "El monto es demasiado pequeño para esa criptomoneda. Por favor elige USDT (TRC20 o ERC20) u otra moneda con menor monto mínimo.",
          );
        }
        if (code === "INVALID_REQUEST_PARAMS") {
          throw new Error(`Parámetros inválidos: ${errJson.message}`);
        }
        if (code === "CURRENCY_NOT_SUPPORTED") {
          throw new Error(
            "La criptomoneda seleccionada no está disponible. Elige otra.",
          );
        }
        throw new Error(
          errJson.message ||
            `Error del proveedor de pagos (${response.status})`,
        );
      } catch (e: any) {
        // Re-throw if it's our own descriptive error
        if (e.message && !e.message.startsWith("NOWPayments API Error")) {
          throw e;
        }
        throw new Error(`NOWPayments API Error ${response.status}: ${text}`);
      }
    }

    try {
      return JSON.parse(text) as NowPaymentResult;
    } catch {
      console.error("❌ NOWPayments respuesta no es JSON:", text);
      throw new Error("Respuesta inválida del proveedor de pagos.");
    }
  }

  /**
   * Gets the current status of a payment by payment_id.
   */
  static async getPaymentStatus(
    paymentId: string,
  ): Promise<NowPaymentStatusResult> {
    const response = await fetch(
      `${config.nowpayments.apiUrl}/payment/${paymentId}`,
      { headers: this.headers },
    );

    const text = await response.text();
    if (!response.ok) {
      console.error(`❌ NOWPayments Status Error (${response.status}):`, text);
      throw new Error(`NOWPayments Status Error ${response.status}: ${text}`);
    }

    return JSON.parse(text) as NowPaymentStatusResult;
  }

  /**
   * Returns a list of supported cryptocurrencies for payment.
   */
  static async getCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(
        `${config.nowpayments.apiUrl}/currencies?fixed_rate=false`,
        { headers: this.headers },
      );
      if (!response.ok) return DEFAULT_CURRENCIES;
      const data = (await response.json()) as { currencies?: string[] };
      return data.currencies ?? DEFAULT_CURRENCIES;
    } catch {
      return DEFAULT_CURRENCIES;
    }
  }

  /**
   * Verifies the IPN signature from NOWPayments.
   * NOWPayments sorts the keys of the body alphabetically and generates HMAC-SHA512.
   */
  static verifyIpnSignature(
    rawBody: string | Buffer,
    signature: string,
  ): boolean {
    if (!config.nowpayments.ipnSecret) {
      console.warn(
        "⚠️ NOWPAYMENTS IPN Secret no configurado — saltando verificación.",
      );
      return true;
    }
    try {
      const parsed = JSON.parse(
        typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
      );
      const sorted = sortKeysDeep(parsed);
      const sortedString = JSON.stringify(sorted);
      const hmac = crypto.createHmac("sha512", config.nowpayments.ipnSecret);
      hmac.update(sortedString);
      const computed = hmac.digest("hex");
      return computed === signature;
    } catch (e) {
      console.error("Error verifying IPN signature:", e);
      return false;
    }
  }
}

/** Deep-sort object keys alphabetically (required for IPN signature) */
function sortKeysDeep(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortKeysDeep(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}
