import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { WompiService } from "../services/wompi.service";
import { config } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabase.service";

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

// NOTE: El webhook de Wompi fue consolidado en payments.routes.ts
// URL de producción: POST /api/payments/webhook/wompi
// Esta ruta fue eliminada para evitar duplicados.

export default router;
