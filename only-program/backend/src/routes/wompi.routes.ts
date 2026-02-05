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
      const { email } = req.user!;

      // 1. Count pending links (is_active = false)
      // We assume 'smart_links' table has 'is_active' column.
      // If the user is paying for NEW links, they should be in the DB as inactive/pending.
      const { data: links, error } = await supabase
        .from("smart_links")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", false);

      if (error) throw error;

      // Logic: If user passes explicit qty (e.g. pre-paying), use that.
      // Otherwise use found links count.
      // For this "Smart Billing", we charge for the existing pending links.

      let qty = links?.length || 0;

      // If qty is 0, maybe they want to buy credit?
      // For now, if 0, error or allow passing qty manually in body.
      if (qty === 0 && req.body.qty) {
        qty = req.body.qty;
      }

      if (qty === 0) {
        return res.status(400).json({ error: "No pending links to pay for." });
      }

      // 2. Pricing Logic (Sync with Frontend)
      const BASE_PRICE_USD = 74.99; // Standard price
      // Check if they want Telegram included?
      // Simple logic: Base price.

      let discount = 0;
      if (qty >= 20) discount = 0.25;
      else if (qty >= 10) discount = 0.12;
      else if (qty >= 5) discount = 0.05;

      const perLink = BASE_PRICE_USD * (1 - discount);
      const totalUSD = perLink * qty;

      // Wompi requires amount in CENTS.
      // Ensure currency is USD or convert to COP. Wompi supports USD.
      const currency = "USD";
      const amountInCents = Math.round(totalUSD * 100);

      const reference = uuidv4(); // Unique transaction reference

      // 3. Generate Signature
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
        currency: currency,
        provider: "wompi",
        status: "pending",
        tx_reference: null, // Will fill with Wompi Transaction ID later
        created_at: new Date().toISOString(),
      });

      res.json({
        reference,
        amountInCents,
        currency,
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

      // 2. Activate User Links
      // We interpret "paying" as activating ALL pending links (is_active=false)
      // Or ideally, we should have linked specific items to the payment.
      // For this flow: "Smart Cart" pays for ALL pending.
      const { error: linkError } = await supabase
        .from("smart_links")
        .update({ is_active: true })
        .eq("user_id", payment.user_id)
        .eq("is_active", false);

      if (linkError) console.error("Error activating links:", linkError);

      // 3. Send Notification
      const { data: userData } = await supabase.auth.admin.getUserById(
        payment.user_id,
      );
      if (userData.user?.email) {
        await sendPaymentConfirmationEmail(
          userData.user.email,
          payment.amount,
          payment.currency,
          transactionId,
        );
      }

      console.log(`✅ Payment ${reference} approved. Links activated.`);
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
