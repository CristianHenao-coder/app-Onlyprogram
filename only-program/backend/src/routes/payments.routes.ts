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
      console.log(
        `💰 Crypto payment received for order ${payload.merchantOrderId}`,
      );

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
            await SubscriptionService.processSuccessfulPayment(
              payment.subscription_id,
            );
          } catch (subError) {
            console.error(
              "Failed to update subscription after crypto payment:",
              subError,
            );
          }
        }

        // 3. Enviar Email
        const { data: userData } = await supabase.auth.admin.getUserById(
          payment.user_id,
        );
        const userEmail = userData.user?.email;

        if (userEmail) {
          await sendPaymentConfirmationEmail(
            userEmail,
            payment.amount,
            payment.currency,
            payload.merchantOrderId,
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

    const order = (await PayPalService.createOrder({
      amount,
      description,
      referenceId: subscriptionId,
    })) as any;

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
    if (!orderId)
      return res.status(400).json({ error: "Order ID is required" });

    const capture = (await PayPalService.captureOrder(orderId)) as any;

    if (capture.status === "COMPLETED") {
      const purchaseUnit = capture.purchase_units?.[0];
      const amountVal = purchaseUnit?.payments?.captures?.[0]?.amount?.value;
      const currency =
        purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code;
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
            await SubscriptionService.processSuccessfulPayment(
              payment.subscription_id,
            );
          } catch (subError) {
            console.error(
              "Failed to update subscription after PayPal payment:",
              subError,
            );
          }
        }

        // 3. Enviar Email
        if (req.user && req.user.email && amountVal) {
          await sendPaymentConfirmationEmail(
            req.user.email,
            parseFloat(amountVal),
            currency || "USD",
            captureId || orderId,
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

// --- STRIPE ---

// --- WOMPI ---
router.post("/wompi/get-signature", async (req: AuthRequest, res) => {
  try {
    const { amount, currency = "COP" } = req.body;

    if (!amount) return res.status(400).json({ error: "Amount is required" });

    // Wompi usa centavos para COP
    const amountInCents = Math.round(amount * 100);
    const { WompiService } = await import("../services/wompi.service");

    const reference = WompiService.generateReference();
    const signature = WompiService.generateSignature(reference, amountInCents, currency);

    res.json({
      reference,
      signature,
      amountInCents,
      currency,
      publicKey: (await import("../config/env")).config.wompi.pubKey
    });
  } catch (error: any) {
    console.error("Error creating Wompi Signature:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/wompi/transaction", async (req: AuthRequest, res) => {
  try {
    const { amount, email, token, installments, acceptanceToken } = req.body;

    if (!amount || !token || !email || !acceptanceToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { WompiService } = await import("../services/wompi.service");

    const transaction = await WompiService.createTransaction({
      amountUSD: amount, // Frontend sends USD
      email,
      token,
      installments,
      acceptanceToken
    });

    // Guardar transacción en DB
    if (req.user) {
      // Lógica para guardar en tabla 'payments'
      // Podemos reusar la lógica existente, o insertar aquí
      const { error } = await supabase.from("payments").insert({
        user_id: req.user.id,
        amount, // USD
        currency: "USD",
        provider: "wompi",
        status: transaction.status === "APPROVED" ? "completed" : "pending",
        tx_reference: transaction.id,
        created_at: new Date().toISOString()
      });

      if (error) console.error("Error saving payment:", error);
    }

    res.json(transaction);
  } catch (error: any) {
    console.error("Error creating Wompi Transaction:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhook/wompi", async (req, res) => {
  try {
    const event = req.body;
    // Wompi sends data in 'data' and signature in headers or inside event properties
    // This is a simplified handler. In PROD verify signature! 

    console.log("💰 Wompi Webhook received:", event);

    if (event.event === "transaction.updated" && event.data.transaction.status === "APPROVED") {
      const tx = event.data.transaction;
      // Logic to update database...
      // Similar to other methods: find payment by reference -> update status -> email
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Wompi Webhook Error:", error);
    res.sendStatus(500);
  }
});

// --- MANUAL CRYPTO ---

router.post("/crypto/manual", async (req: AuthRequest, res) => {
  try {
    const { amount, currency, transactionHash, walletUsed, subscriptionId } = req.body;

    if (!amount || !transactionHash) {
      return res.status(400).json({ error: "Amount and Transaction Hash are required" });
    }

    const { ManualCryptoService } = await import("../services/manual-crypto.service");

    const payment = await ManualCryptoService.createManualPayment({
      userId: req.user!.id,
      amount,
      currency: currency || "USDT",
      transactionHash,
      walletUsed,
      subscriptionId
    });

    // Notificar al admin sobre el nuevo pago manual (Opcional, implementar luego)
    // await notifyAdmin("New Crypto Payment", payment);

    res.json({
      success: true,
      message: "Pago registrado para verificación manual",
      payment
    });
  } catch (error: any) {
    console.error("Error registering manual crypto payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Deprecated RedotPay kept for reference or removal
// router.post("/crypto/create-order", ... );

/**
 * GET /api/payments
 */
router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        subscriptions (
          plan_id,
          status
        )
      `,
      )
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
