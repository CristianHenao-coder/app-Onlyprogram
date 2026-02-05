import { supabase } from "../services/supabase.service";
import { WompiService } from "../services/wompi.service";
import { sendPaymentConfirmationEmail } from "../services/brevo.service";

/**
 * Daily Billing Cron Job
 * Charges active subscriptions that are due for renewal
 */
export async function processSubscriptionBilling() {
  console.log("🔄 Running subscription billing cron...");

  try {
    // Find all active subscriptions due for payment
    const now = new Date().toISOString();
    const { data: dueSubscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("next_payment_at", now);

    if (error) {
      console.error("Error fetching due subscriptions:", error);
      return;
    }

    if (!dueSubscriptions || dueSubscriptions.length === 0) {
      console.log("✅ No subscriptions due for billing");
      return;
    }

    console.log(`📋 Found ${dueSubscriptions.length} subscriptions to process`);

    for (const subscription of dueSubscriptions) {
      try {
        console.log(`💳 Charging subscription ${subscription.id}`);

        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(
          subscription.user_id,
        );

        if (!userData.user?.email) {
          console.error(`No email found for user ${subscription.user_id}`);
          continue;
        }

        // Attempt to charge using stored token
        const chargeResult = await WompiService.createTransaction({
          amountUSD: subscription.total_amount,
          email: userData.user.email,
          token: subscription.wompi_token,
          acceptanceToken: subscription.wompi_acceptance_token || "",
          installments: 1,
        });

        if (chargeResult.status === "APPROVED") {
          // Update subscription: reset next payment date
          const nextPayment = new Date();
          nextPayment.setDate(nextPayment.getDate() + 30);

          await supabase
            .from("subscriptions")
            .update({
              last_payment_at: new Date().toISOString(),
              next_payment_at: nextPayment.toISOString(),
              current_period_start: new Date().toISOString(),
              current_period_end: nextPayment.toISOString(),
              payment_retries: 0,
            })
            .eq("id", subscription.id);

          // Create payment record
          await supabase.from("payments").insert({
            user_id: subscription.user_id,
            amount: subscription.total_amount,
            currency: subscription.currency,
            provider: "wompi",
            status: "completed",
            tx_reference: chargeResult.id,
            confirmed_at: new Date().toISOString(),
          });

          // Send confirmation email
          await sendPaymentConfirmationEmail(
            userData.user.email,
            subscription.total_amount,
            subscription.currency,
            chargeResult.id,
          );

          console.log(
            `✅ Subscription ${subscription.id} charged successfully`,
          );
        } else {
          // Payment failed - increment retry counter
          const retries = (subscription.payment_retries || 0) + 1;

          if (retries >= 3) {
            // Max retries reached - mark as past_due
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
                payment_retries: retries,
              })
              .eq("id", subscription.id);

            console.log(
              `⚠️ Subscription ${subscription.id} marked as past_due after ${retries} retries`,
            );
          } else {
            // Retry tomorrow
            await supabase
              .from("subscriptions")
              .update({
                payment_retries: retries,
              })
              .eq("id", subscription.id);

            console.log(
              `⚠️ Subscription ${subscription.id} payment failed, retry ${retries}/3`,
            );
          }
        }
      } catch (error: any) {
        console.error(
          `Error processing subscription ${subscription.id}:`,
          error.message,
        );

        // Increment retry counter on exception
        const retries = (subscription.payment_retries || 0) + 1;
        await supabase
          .from("subscriptions")
          .update({ payment_retries: retries })
          .eq("id", subscription.id);
      }
    }

    console.log("✅ Subscription billing cron completed");
  } catch (error) {
    console.error("Fatal error in billing cron:", error);
  }
}

// Run every 24 hours (86400000 ms)
export function startBillingCron() {
  const DAILY = 24 * 60 * 60 * 1000;

  // Run immediately on startup
  processSubscriptionBilling();

  // Then run daily
  setInterval(processSubscriptionBilling, DAILY);

  console.log("⏰ Billing cron job started (runs daily)");
}
