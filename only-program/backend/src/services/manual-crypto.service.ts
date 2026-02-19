import { supabase } from "./supabase.service";

export const ManualCryptoService = {
    /**
     * Registra un intento de pago manual con criptomonedas.
     */
    async createManualPayment(data: {
        userId: string;
        amount: number;
        currency: string; // 'BTC', 'ETH', 'USDT', etc.
        subscriptionId?: string;
        walletUsed?: string; // La wallet del usuario (opcional si es anonimo, pero recomendado)
        transactionHash: string; // El ID de transacción que el usuario provee
    }) {
        // 1. Verificar si ya existe esa transacción para evitar duplicados obvios
        const { data: existing } = await supabase
            .from("payments")
            .select("id")
            .eq("tx_reference", data.transactionHash)
            .single();

        if (existing) {
            throw new Error("Esta referencia de transacción ya ha sido registrada.");
        }

        // 2. Insertar en la base de datos como 'pending_verification'
        // Nota: Asumimos que el status 'pending_verification' o 'pending' es válido.
        // Usaremos 'pending' y un campo extra si es necesario, o confiamos en el provider 'manual_crypto'
        const { data: payment, error } = await supabase
            .from("payments")
            .insert({
                user_id: data.userId,
                subscription_id: data.subscriptionId || null,
                amount: data.amount,
                currency: data.currency,
                provider: "manual_crypto",
                status: "pending", // Queda pendiente de revisión manual por el admin
                tx_reference: data.transactionHash,

                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating manual crypto payment:", error);
            throw new Error("Error al guardar el registro de pago.");
        }

        return payment;
    },
};
