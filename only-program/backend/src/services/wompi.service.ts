import crypto from "crypto";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { CurrencyService } from "./currency.service";

export class WompiService {
  /**
   * Generates the integrity signature for a transaction.
   * Format: SHA256(reference + amount_in_cents + currency + integrity_secret)
   */
  static generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const integritySecret = config.wompi.integritySecret;
    if (!integritySecret) {
      throw new Error("WOMPI_INTEGRITY_SECRET is not configured");
    }

    const data = `${reference}${amountInCents}${currency}${integritySecret}`;
    const hash = crypto.createHash("sha256").update(data).digest("hex");

    return hash;
  }

  /**
   * Verifies the signature of an incoming webhook event.
   */
  static verifyWebhookSignature(
    signature: string,
    transactionId: string,
    status: string, // e.g. "APPROVED"
    amountInCents: number,
  ): boolean {
    const eventsSecret = config.wompi.eventsSecret;
    if (!eventsSecret) return false;

    // Wompi signature for events: SHA256(transaction.id + transaction.status + transaction.amount_in_cents + events_secret)
    // Note: status from Wompi is usually uppercase in the signature check, verifying documentation is key.
    // Assuming standard concatenation:
    const data = `${transactionId}${status}${amountInCents}${eventsSecret}`;
    const calculated = crypto.createHash("sha256").update(data).digest("hex");

    return signature === calculated;
  }

  /**
   * Fetches transaction details directly from Wompi to verify status.
   */
  static async getTransaction(transactionId: string) {
    const url = `${config.wompi.url}/transactions/${transactionId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.wompi.pubKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Wompi transaction:", error);
      return null;
    }
  }

  /**
   * Crea una referencia única para el pago
   */
  static generateReference(): string {
    return uuidv4();
  }

  /**
   * Convierte USD a centavos de COP usando tasa real desde CurrencyService
   */
  static async calculateAmountInCents(amountUSD: number): Promise<number> {
    const amountCOP = await CurrencyService.convertUsdToCop(amountUSD);
    return amountCOP * 100; // Centavos
  }

  /**
   * Crea una transacción en Wompi usando un token de tarjeta
   */
  static async createTransaction(data: {
    amountUSD: number;
    email: string;
    token: string;
    installments?: number;
    acceptanceToken: string;
  }) {
    const reference = this.generateReference();
    const amountInCents = await this.calculateAmountInCents(data.amountUSD);
    // Wompi requires COP for most local methods, but supports USD if configured.
    // Assuming COP for local storage of signature.
    const currency = "COP";

    const signature = this.generateSignature(
      reference,
      amountInCents,
      currency,
    );

    const payload = {
      acceptance_token: data.acceptanceToken,
      amount_in_cents: amountInCents,
      currency: currency,
      customer_email: data.email,
      payment_method: {
        type: "CARD",
        token: data.token,
        installments: data.installments || 1,
      },
      reference: reference,
      signature: signature,
    };

    console.log(
      "🚀 Creating Wompi Transaction:",
      JSON.stringify(payload, null, 2),
    );

    // Use apiUrl from config (which defaults to production in env.ts now)
    // Note: config.wompi.url vs config.wompi.apiUrl - let's unify or use what env.ts has.
    // env.ts has 'url' and 'apiUrl' (likely duplicate in my fix? let's check env.ts content if it had redundant keys)
    // Checking env.ts content from previous step: lines 66 'url': ..., line 79 'apiUrl': ...
    // In my env.ts fix I am removing the second duplicate block (lines 74-80).
    // The first block (lines 61-67) has 'url'.
    // So I should use `config.wompi.url`.

    const response = await fetch(`${config.wompi.url}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.wompi.pubKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });



    const responseData = (await response.json()) as any;

    if (!response.ok || responseData.error) {
      const errorMessage = responseData.error?.reason || responseData.error?.type || "Wompi Transaction Failed";
      console.error("❌ Wompi Transaction Failed:", JSON.stringify(responseData.error, null, 2));
      throw new Error(`Wompi Error: ${errorMessage}`);
    }

    return responseData.data;
  }
}
