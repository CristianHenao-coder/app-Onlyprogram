import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { WompiService } from "../services/wompi.service";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabase.service";
import { sendPaymentConfirmationEmail } from "../services/brevo.service";

const router = Router();

/**
 * POST /api/wompi/transaction-init
 * Prepares the transaction data for the Wompi Widget.
 * Calculates the total amount based on the user's pending links.
 */
router.post(
  "/transaction-init",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // 1. Read dynamic prices from site_configs
      const DEFAULT_LINK_STANDARD = 2.99;
      const DEFAULT_LINK_ROTATOR = 5.99;
      const DEFAULT_TELEGRAM_ADDON = 5.0;

      let linkPriceStandard = DEFAULT_LINK_STANDARD;
      let linkPriceRotator = DEFAULT_LINK_ROTATOR;
      let telegramAddon = DEFAULT_TELEGRAM_ADDON;

      try {
        const { data: cfgRow } = await supabase
          .from("site_configs")
          .select("value")
          .eq("key", "product_pricing")
          .maybeSingle();

        if (cfgRow?.value) {
          linkPriceStandard = Number(
            cfgRow.value?.link?.standard ?? DEFAULT_LINK_STANDARD,
          );
          linkPriceRotator = Number(
            cfgRow.value?.link?.rotator ?? DEFAULT_LINK_ROTATOR,
          );
          telegramAddon = Number(
            cfgRow.value?.link?.telegramAddon ?? DEFAULT_TELEGRAM_ADDON,
          );
        }
      } catch (priceErr) {
        console.warn(
          "Could not read pricing from DB, using defaults:",
          priceErr,
        );
      }

      // 2. Count pending links (is_active = false)
      const { data: links, error } = await supabase
        .from("smart_links")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", false);

      if (error) throw error;

      let qty = links?.length || 0;
      if (qty === 0 && req.body.qty) {
        qty = req.body.qty;
      }
      if (qty === 0) {
        return res.status(400).json({ error: "No pending links to pay for." });
      }

      // 3. Determine if rotator applies (sent from frontend)
      const hasRotator = !!req.body.hasRotator;
      const countRotator = req.body.countRotator
        ? Number(req.body.countRotator)
        : 0;
      const countStandard = req.body.countStandard
        ? Number(req.body.countStandard)
        : qty;

      // 4. Pricing Logic (uses DB prices)
      const subtotal =
        countStandard * linkPriceStandard + countRotator * linkPriceRotator;

      let discount = 0;
      if (qty >= 20) discount = 0.25;
      else if (qty >= 10) discount = 0.12;
      else if (qty >= 5) discount = 0.05;

      const perLink = (subtotal / qty) * (1 - discount);
      const totalUSD = perLink * qty;

      // Wompi Colombia requires COP (Colombian Pesos), not USD
      // Convert USD to COP
      const currency = "COP";
      const totalCOP = await WompiService.calculateAmountInCents(totalUSD);
      const amountInCents = totalCOP; // Already in cents from calculateAmountInCents

      const reference = uuidv4(); // Unique transaction reference

      // 3. Generate Signature (must use COP for Wompi Colombia)
      const signature = WompiService.generateSignature(
        reference,
        amountInCents,
        currency,
      );

      // 4. Save pending payment in DB (to link it later)
      await supabase.from("payments").insert({
        id: reference, // Using reference as ID
        user_id: userId,
        amount: totalUSD,
        currency: "USD", // Store original USD amount
        provider: "wompi",
        status: "pending",
        tx_reference: null, // Will fill with Wompi Transaction ID later
        created_at: new Date().toISOString(),
      });

      res.json({
        reference,
        amountInCents,
        currency, // Send COP to frontend
        signature,
        publicKey: config.wompi.pubKey,
        redirectUrl: `${config.urls.frontend}/dashboard/billing?status=success`, // Redirect after pay
        qty,
      });
    } catch (error: any) {
      console.error("Error initiating Wompi transaction:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/wompi/webhook
 * Handles transaction updates from Wompi.
 */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;
    // console.log("Incoming Wompi Webhook:", JSON.stringify(event, null, 2));

    if (event.event !== "transaction.updated") {
      return res.status(200).json({ message: "Event ignored" }); // Acknowledge receipt
    }

    const transaction = event.data.transaction;
    const reference = transaction.reference;
    const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR
    const transactionId = transaction.id;

    // Verify status with Wompi directly for security
    // const verifiedTx = await WompiService.getTransaction(transactionId);
    // if (!verifiedTx || verifiedTx.data.status !== status) { ... }
    // For MVP, trusting the payload but assuming HTTPS + Secret check if we implemented it.

    if (status === "APPROVED") {
      // 1. Update Payment Record
      const { data: payment, error: payError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          tx_reference: transactionId,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", reference) // reference was used as ID
        .select()
        .single();

      if (payError || !payment) {
        console.error("Payment record not found for ref:", reference);
        return res.status(404).json({ error: "Payment not found" });
      }

      // 2. Capture Payment Token for Recurring Billing
      // Extract token from transaction payment_method
      const paymentMethod = transaction.payment_method;
      const cardToken = paymentMethod?.token; // e.g., "tok_prod_12345_..."
      const last4 = paymentMethod?.extra?.last_four || "";

      if (cardToken) {
        console.log(`💳 Captured payment token for user ${payment.user_id}`);

        // Check if subscription already exists
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", payment.user_id)
          .eq("status", "active")
          .single();

        if (!existingSub) {
          // Create new subscription with 30-day billing cycle
          const nextPayment = new Date();
          nextPayment.setDate(nextPayment.getDate() + 30);

          await supabase.from("subscriptions").insert({
            user_id: payment.user_id,
            status: "active",
            wompi_token: cardToken,
            payment_method_last4: last4,
            current_period_start: new Date().toISOString(),
            current_period_end: nextPayment.toISOString(),
            next_payment_at: nextPayment.toISOString(),
            last_payment_at: new Date().toISOString(),
            total_amount: payment.amount,
            total_links: 1, // Adjust based on your business logic
          });

          console.log(`✅ Subscription created for user ${payment.user_id}`);
        }
      }

      // 3. Activate User Links (Centralized)
      const { FulfillmentService } =
        await import("../services/fulfillment.service");
      await FulfillmentService.activateLinkProduct(
        payment.user_id,
        reference,
        payment.amount,
        payment.currency,
      );

      console.log(
        `✅ Payment ${reference} approved. Links activated via Webhook.`,
      );
    } else {
      // Handle Rejected/Voided
      await supabase
        .from("payments")
        .update({
          status: "failed",
          tx_reference: transactionId,
        })
        .eq("id", reference);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Error in Wompi webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
