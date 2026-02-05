import crypto from "crypto";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { CurrencyService } from "./currency.service";

export const WompiService = {
    /**
     * Genera la firma de integridad requerida por Wompi.
     * La fórmula es: SHA256(reference + amountOrCents + currency + integritySecret)
     */
    generateSignature(reference: string, amountInCents: number, currency: string): string {
        const rawString = `${reference}${amountInCents}${currency}${config.wompi.integritySecret}`;
        const signature = crypto.createHash("sha256").update(rawString).digest("hex");
        return signature;
    },

    /**
     * Verifica la firma de un evento (Webhook)
     */
    verifyWebhookSignature(signature: string, transactionId: string, status: string, amountInCents: number): boolean {
        const rawString = `${transactionId}${status}${amountInCents}${config.wompi.eventsSecret}`;
        const calculated = crypto.createHash("sha256").update(rawString).digest("hex");
        return signature === calculated;
    },

    /**
     * Crea una referencia única para el pago
     */
    generateReference(): string {
        return uuidv4();
    },

    /**
     * Convierte USD a centavos de COP usando tasa real desde CurrencyService
     */
    async calculateAmountInCents(amountUSD: number): Promise<number> {
        const amountCOP = await CurrencyService.convertUsdToCop(amountUSD);
        return amountCOP * 100; // Centavos
    },

    /**
     * Crea una transacción en Wompi usando un token de tarjeta
     */
    async createTransaction(data: {
        amountUSD: number,
        email: string,
        token: string,
        installments?: number,
        acceptanceToken: string
    }) {
        const reference = this.generateReference();
        const amountInCents = await this.calculateAmountInCents(data.amountUSD);
        const currency = "COP";
        const signature = this.generateSignature(reference, amountInCents, currency);

        const payload = {
            acceptance_token: data.acceptanceToken,
            amount_in_cents: amountInCents,
            currency: currency,
            customer_email: data.email,
            payment_method: {
                type: "CARD",
                token: data.token,
                installments: data.installments || 1
            },
            reference: reference,
            signature: signature
        };

        console.log("🚀 Creating Wompi Transaction:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${config.wompi.apiUrl}/transactions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.wompi.pubKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json() as any;

        if (!response.ok) {
            throw new Error(responseData.error?.type || "Wompi Transaction Failed");
        }

        return responseData.data;
    }
};
