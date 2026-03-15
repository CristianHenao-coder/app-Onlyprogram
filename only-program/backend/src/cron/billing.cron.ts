import { supabase } from "../services/supabase.service";
import { WompiService } from "../services/wompi.service";
import {
  sendPaymentConfirmationEmail,
  sendExpirationAlertEmail,
  sendLinkDeactivatedEmail,
} from "../services/brevo.service";

/**
 * Daily Billing Cron Job
 * Charges active subscriptions that are due for renewal
 */
export async function processSubscriptionBilling() {
  console.log("💳 Running subscription billing cycle...");

  try {
    const now = new Date();

    // 1. Fetch active subscriptions reaching billing date
    const { data: dueSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*, profiles!inner(full_name)")
      .eq("status", "active")
      .lte("next_billing_date", now.toISOString());

    if (fetchError) {
      console.error("❌ Error fetching due subscriptions:", fetchError);
      return;
    }

    if (!dueSubscriptions || dueSubscriptions.length === 0) {
      console.log("📅 No subscriptions due for billing today.");
      return;
    }

    console.log(`🚀 Processing ${dueSubscriptions.length} subscriptions...`);

    for (const sub of dueSubscriptions) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        const userEmail = userData?.user?.email;

        if (!userEmail) {
           console.error(`❌ Could not find email for user ${sub.user_id}, skipping subscription ${sub.id}`);
           continue;
        }

        const reference = WompiService.generateReference();
        const transaction = await WompiService.chargePaymentSource({
          amountUSD: Number(sub.amount),
          email: userEmail,
          paymentSourceId: parseInt(sub.wompi_token), // wompi_token stores the source_id
          reference
        });

        if (transaction.status === "APPROVED") {
          // A. Success: Update Subscription Dates
          const nextDate = new Date(sub.next_billing_date);
          if (sub.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
          else nextDate.setMonth(nextDate.getMonth() + 1);

          await supabase.from("subscriptions").update({
            last_charged_at: now.toISOString(),
            next_billing_date: nextDate.toISOString(),
            payment_retries: 0,
            status: "active"
          }).eq("id", sub.id);

          // B. Register Payment
          const { data: payRecord } = await supabase.from("payments").insert({
            user_id: sub.user_id,
            amount: sub.amount,
            currency: sub.currency,
            provider: "wompi",
            status: "completed",
            tx_reference: transaction.id,
            subscription_id: sub.id,
            metadata: { is_recurring: true }
          }).select().single();

          // C. Extended Smart Links (Fulfillment)
          // We look for links previously created under this subscription or just general user links
          const expiresAt = new Date(nextDate);
          expiresAt.setDate(expiresAt.getDate() + 3); // Extra buffer

          await supabase.from("smart_links")
            .update({ expires_at: expiresAt.toISOString(), is_active: true, status: "active" })
            .eq("user_id", sub.user_id)
            .eq("is_active", true);

          // D. Email Notification
          await sendPaymentConfirmationEmail(
            userEmail,
            Number(sub.amount),
            sub.currency,
            transaction.id
          );

          console.log(`✅ Subscription ${sub.id} renewed successfully.`);
        } else {
          // B. Failed Charge (DECLINED, etc.)
          console.warn(`⚠️ Payment declined for subscription ${sub.id}: ${transaction.status}`);
          await handleBillingFailure(sub);
        }
      } catch (error) {
        console.error(`❌ Fatal error charging subscription ${sub.id}:`, error);
        await handleBillingFailure(sub);
      }
    }
  } catch (error) {
    console.error("Fatal error in billing cron job:", error);
  }
}

async function handleBillingFailure(sub: any) {
  const retries = (sub.payment_retries || 0) + 1;
  const maxRetries = 3;

  if (retries >= maxRetries) {
    // Cancel subscription after 3 failures
    await supabase.from("subscriptions").update({
      status: "past_due",
      payment_retries: retries
    }).eq("id", sub.id);

    // Deactivate links
    await supabase.from("smart_links")
      .update({ is_active: false, status: "expired" })
      .eq("user_id", sub.user_id);
      
    console.log(`🚫 Subscription ${sub.id} marked as past_due after ${retries} failures.`);
  } else {
    // Just increment retries
    await supabase.from("subscriptions").update({
      payment_retries: retries
    }).eq("id", sub.id);
    console.log(`🔄 Retry ${retries}/${maxRetries} scheduled for tomorrow.`);
  }
}

/**
 * Check for expiring and expired links
 */
export async function checkLinkExpirations() {
  console.log("🔄 Running link expiration check...");

  try {
    const now = new Date();

    // Helper for processing alerts
    const processAlertLevel = async (
      daysThreshold: number,
      alertColumn: "alert_5d_sent" | "alert_3d_sent" | "alert_1d_sent",
    ) => {
      const thresholdTime = new Date(
        now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
      );

      const { data: expiringLinks } = await supabase
        .from("smart_links")
        .select("*, profiles(full_name)")
        .eq("is_active", true)
        .eq(alertColumn, false)
        .lte("expires_at", thresholdTime.toISOString())
        .gt("expires_at", now.toISOString());

      if (expiringLinks && expiringLinks.length > 0) {
        console.log(
          `⏳ Sending ${daysThreshold}-day expiration alerts for ${expiringLinks.length} links`,
        );

        for (const link of expiringLinks) {
          const { data: userData } = await supabase.auth.admin.getUserById(
            link.user_id,
          );
          if (userData.user?.email) {
            const userName =
              (link as any).profiles?.full_name ||
              userData.user.email.split("@")[0] ||
              "Usuario";
            await sendExpirationAlertEmail(
              userData.user.email,
              userName,
              link.slug,
              new Date(link.expires_at),
              daysThreshold,
            );
            await supabase
              .from("smart_links")
              .update({ [alertColumn]: true })
              .eq("id", link.id);
          }
        }
      }
    };

    // 1. Alert 5 days before
    await processAlertLevel(5, "alert_5d_sent");

    // 2. Alert 3 days before
    await processAlertLevel(3, "alert_3d_sent");

    // 3. Alert 1 day before
    await processAlertLevel(1, "alert_1d_sent");

    // 4. DEACTIVATE: Links that have expired
    const { data: expiredLinks } = await supabase
      .from("smart_links")
      .select("*, profiles(full_name)")
      .eq("is_active", true)
      .lte("expires_at", now.toISOString());

    if (expiredLinks && expiredLinks.length > 0) {
      console.log(`🚫 Deactivating ${expiredLinks.length} expired links`);
      for (const link of expiredLinks) {
        const { data: userData } = await supabase.auth.admin.getUserById(
          link.user_id,
        );

        // Deactivate in DB
        await supabase
          .from("smart_links")
          .update({
            is_active: false,
            status: "expired",
            deactivation_notified: true,
          })
          .eq("id", link.id);

        if (userData.user?.email) {
          const userName =
            (link as any).profiles?.full_name ||
            userData.user.email.split("@")[0] ||
            "Usuario";
          await sendLinkDeactivatedEmail(
            userData.user.email,
            userName,
            link.slug,
          );
        }
      }
    }

    console.log("✅ Link expiration check completed");
  } catch (error) {
    console.error("Fatal error in expiration cron:", error);
  }
}

// Run every 24 hours (86400000 ms)
export function startBillingCron() {
  const DAILY = 24 * 60 * 60 * 1000;

  // Run immediately on startup
  processSubscriptionBilling();
  checkLinkExpirations();

  // Then run daily
  setInterval(() => {
    processSubscriptionBilling();
    checkLinkExpirations();
  }, DAILY);

  console.log("⏰ Billing cron job started (runs daily)");
}
