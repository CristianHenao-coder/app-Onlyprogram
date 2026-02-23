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
    const alertThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // 1. ALERT: Links expiring in less than 24h that haven't been alerted
    const { data: expiringLinks } = await supabase
      .from("smart_links")
      .select("*, profiles(full_name)")
      .eq("is_active", true)
      .eq("expiry_alert_sent", false)
      .lte("expires_at", alertThreshold.toISOString())
      .gt("expires_at", now.toISOString());

    if (expiringLinks && expiringLinks.length > 0) {
      console.log(
        `⏳ Sending expiration alerts for ${expiringLinks.length} links`,
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
          );
          await supabase
            .from("smart_links")
            .update({ expiry_alert_sent: true })
            .eq("id", link.id);
        }
      }
    }

    // 2. DEACTIVATE: Links that have expired
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
