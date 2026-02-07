import { supabase } from "./supabase.service";
import { sendPaymentConfirmationEmail } from "./brevo.service";

export class FulfillmentService {
    /**
     * Activa los links pendientes de un usuario tras un pago exitoso.
     * @param userId ID del usuario
     * @param paymentId ID del pago (para referencia)
     */
    static async activateLinkProduct(userId: string, paymentId: string, amount: number, currency: string) {
        try {
            console.log(`🚀 Iniciando activación de producto para usuario ${userId}`);

            // 1. Activar links "pendientes" (is_active = false)
            const { data: activatedLinks, error: updateError } = await supabase
                .from("smart_links")
                .update({ is_active: true })
                .eq("user_id", userId)
                .eq("is_active", false)
                .select();

            if (updateError) {
                console.error("❌ Error al activar links en BD:", updateError);
                throw new Error("No se pudieron activar los links.");
            }

            console.log(`✅ ${activatedLinks?.length || 0} links activados para el usuario.`);

            // 2. Registrar suscripción (si aplica lógica de negocio, o renovar)
            // Por ahora, asumimos que el pago activa la cuenta/links.

            // 3. Enviar correo de confirmación
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            if (userData.user?.email) {
                await sendPaymentConfirmationEmail(
                    userData.user.email,
                    amount,
                    currency,
                    paymentId
                );
            }

            return { success: true, activatedCount: activatedLinks?.length };
        } catch (error) {
            console.error("❌ Error en FulfillmentService:", error);
            return { success: false, error };
        }
    }
}
