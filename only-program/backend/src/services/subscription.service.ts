import { supabase } from "./supabase.service";

export class SubscriptionService {
  /**
   * Procesa la activación o renovación de una suscripción tras un pago exitoso
   */
  static async processSuccessfulPayment(subscriptionId: string) {
    console.log(`🔄 Processing subscription update for ID: ${subscriptionId}`);

    // 1. Obtener detalles de la suscripción y el plan asociado
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        plans (
          billing_cycle
        )
      `)
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error("❌ Error fetching subscription:", subError);
      throw new Error("Subscription not found");
    }

    const plan = subscription.plans;
    if (!plan) {
      throw new Error("Plan details not found for subscription");
    }

    // 2. Calcular nuevas fechas
    const now = new Date();
    let newPeriodStart = new Date(subscription.current_period_start || now);
    let newPeriodEnd = new Date(subscription.current_period_end || now);

    // Si la suscripción ya expiró o es nueva, reiniciamos el ciclo desde hoy
    if (newPeriodEnd < now) {
      newPeriodStart = now;
      newPeriodEnd = now;
    }

    // Sumar el ciclo de facturación
    if (plan.billing_cycle === "monthly") {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else if (plan.billing_cycle === "yearly") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      // Default a 30 días si no se reconoce
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
    }

    // 3. Actualizar suscripción
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        last_payment_at: now.toISOString(),
        current_period_start: newPeriodStart.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: now.toISOString(), // Asumiendo que existe columna updated_at genérica o similar
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("❌ Error updating subscription:", updateError);
      throw updateError;
    }

    console.log(`✅ Subscription ${subscriptionId} updated. Valid until: ${newPeriodEnd.toISOString()}`);
    return true;
  }
}
