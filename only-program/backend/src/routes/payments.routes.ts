import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { PayPalService } from "../services/paypal.service";
import { CryptoService } from "../services/crypto.service";
import { sendPaymentConfirmationEmail } from "../services/brevo.service";
import { supabase } from "../services/supabase.service";
import { SubscriptionService } from "../services/subscription.service";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Webhook de RedotPay
router.post("/webhook/redotpay", async (req, res) => {
  try {
    const signature = req.headers["x-signature"] as string;
    const payload = req.body;

    if (!CryptoService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Procesar el pago exitoso
    if (payload.status === "PAID" || payload.status === "COMPLETED") {
      console.log(`💰 Crypto payment received for order ${payload.merchantOrderId}`);

      // 1. Actualizar estado en la tabla 'payments'
      const { data: payment, error } = await supabase
        .from("payments")
        .update({
          status: "completed",
          tx_reference: payload.transactionId || payload.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", payload.merchantOrderId)
        .select()
        .single();

      if (error) {
        console.error("Error updating payment in DB:", error);
      } else if (payment) {
        // 2. Actualizar Suscripción si existe
        if (payment.subscription_id) {
          try {
            await SubscriptionService.processSuccessfulPayment(payment.subscription_id);
          } catch (subError) {
            console.error("Failed to update subscription after crypto payment:", subError);
          }
        }

        // 3. Enviar Email
        const { data: userData } = await supabase.auth.admin.getUserById(payment.user_id);
        const userEmail = userData.user?.email;

        if (userEmail) {
          await sendPaymentConfirmationEmail(
            userEmail,
            payment.amount,
            payment.currency,
            payload.merchantOrderId
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing RedotPay webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Todas las rutas siguientes requieren autenticación
router.use(authenticateToken);

// --- PAYPAL ---

router.post("/paypal/create-order", async (req: AuthRequest, res) => {
  try {
    const { amount, description, subscriptionId } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const order = await PayPalService.createOrder({
      amount,
      description,
      referenceId: subscriptionId,
    });

    // Guardar intento de pago
    if (req.user) {
      const { error } = await supabase.from("payments").insert({
        user_id: req.user.id,
        subscription_id: subscriptionId || null,
        amount,
        currency: "USD",
        provider: "paypal",
        status: "pending",
        tx_reference: order.id,
        created_at: new Date().toISOString(),
      });

      if (error) console.error("Error inserting payment record:", error);
    }

    res.json(order);
  } catch (error: any) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/paypal/capture-order", async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Order ID is required" });

    const capture = await PayPalService.captureOrder(orderId);

    if (capture.status === "COMPLETED") {
      const purchaseUnit = capture.purchase_units?.[0];
      const amountVal = purchaseUnit?.payments?.captures?.[0]?.amount?.value;
      const currency = purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code;
      const captureId = purchaseUnit?.payments?.captures?.[0]?.id;

      // 1. Actualizar pago en DB
      const { data: payment, error } = await supabase
        .from("payments")
        .update({
          status: "completed",
          tx_reference: captureId || capture.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("tx_reference", orderId) // Buscamos por el Order ID original
        .select()
        .single();

      if (error) {
        console.error("Error updating payment status:", error);
      } else if (payment) {
        // 2. Actualizar Suscripción
        if (payment.subscription_id) {
          try {
            await SubscriptionService.processSuccessfulPayment(payment.subscription_id);
          } catch (subError) {
            console.error("Failed to update subscription after PayPal payment:", subError);
          }
        }

        // 3. Enviar Email
        if (req.user && req.user.email && amountVal) {
          await sendPaymentConfirmationEmail(
            req.user.email,
            parseFloat(amountVal),
            currency || "USD",
            captureId || orderId
          );
        }
      }
    }
    res.json(capture);
  } catch (error: any) {
    console.error("Error capturing PayPal order:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- CRYPTO (RedotPay) ---

router.post("/crypto/create-order", async (req: AuthRequest, res) => {
  try {
    const { amount, currency = "USD", subscriptionId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentId = uuidv4();

    const order = await CryptoService.createOrder({
      amount,
      currency,
      orderId: paymentId,
      email: req.user?.email,
    });

    // Guardar intento de pago
    if (req.user) {
      await supabase.from("payments").insert({
        id: paymentId,
        user_id: req.user.id,
        subscription_id: subscriptionId || null,
        amount,
        currency,
        provider: "redotpay",
        status: "pending",
        tx_reference: null,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      ...order,
      internalOrderId: paymentId,
    });
  } catch (error: any) {
    console.error("Error creating Crypto order:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments
 */
router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        subscriptions (
          plan_id,
          status
        )
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      payments,
      user: req.user,
    });
  } catch (error: any) {
    console.error("Error fetching payments history:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
