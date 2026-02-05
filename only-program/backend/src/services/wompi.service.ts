import crypto from "crypto";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";

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
     * Wompi envía 'x-event-checksum' que es SHA256(transaction.id + transaction.status + amountInCents + eventsSecret)
     * NO USAR integritySecret aquí, sino eventsSecret si es diferente (en sandbox suelen ser iguales o distintos según config)
     * Nota: La documentación actual sugiere validar el checksum del evento.
     */
    verifyWebhookSignature(signature: string, transactionId: string, status: string, amountInCents: number): boolean {
        // La documentación de Wompi para webhooks puede variar, pero generalmente validamos la fuente o el checksum
        // Aquí implementamos una validación básica del checksum si Wompi lo provee en el formato estándar
        const rawString = `${transactionId}${status}${amountInCents}${config.wompi.eventsSecret}`;
        const calculated = crypto.createHash("sha256").update(rawString).digest("hex");
        return signature === calculated;
    },

    /**
     * Crea una referencia única para el pago
     */
    generateReference(): string {
        return uuidv4();
    }
};
