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
  // ... (existing code stays same)
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
