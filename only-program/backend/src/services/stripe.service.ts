import Stripe from "stripe";
import { config } from "../config/env";

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️ STRIPE_SECRET_KEY no está definido en las variables de entorno.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16", // Usar una versión reciente
});

export const StripeService = {
    /**
     * Crea un Payment Intent para procesar un pago.
     * @param amount Monto en centavos (ej: 1000 = $10.00 USD)
     * @param currency Moneda (ej: 'usd')
     * @param metadata Datos adicionales
     */
    async createPaymentIntent(
        amount: number,
        currency: string = "usd",
        metadata: Record<string, any> = {}
    ) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe usa centavos
                currency,
                metadata,
                payment_method_types: ['card'],
                // automatic_payment_methods: { enabled: true }, // Disabled to force card only
            });

            return {
                clientSecret: paymentIntent.client_secret,
                id: paymentIntent.id,
            };
        } catch (error: any) {
            console.error("Error creating Stripe Payment Intent:", error);
            throw new Error(`Error en Stripe: ${error.message}`);
        }
    },

    /**
     * Verifica el evento del webhook
     */
    constructEvent(payload: string | Buffer, signature: string, secret: string) {
        return stripe.webhooks.constructEvent(payload, signature, secret);
    },
};
