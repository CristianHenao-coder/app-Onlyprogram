import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { PayPalService } from "../services/paypal.service";
import { NowPaymentsService } from "../services/nowpayments.service";
import {
  sendPaymentConfirmationEmail,
  sendFreeTrialInvoiceEmail,
} from "../services/brevo.service";
import { supabase } from "../services/supabase.service";
import { SubscriptionService } from "../services/subscription.service";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[PaymentsRouter] ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────
// NOWPAYMENTS WEBHOOK (IPN) — debe ir ANTES de authenticateToken
// ─────────────────────────────────────────────────────────────
router.post("/webhook/nowpayments", async (req, res) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const rawBody = JSON.stringify(req.body); // body-parser ya lo parseó
    const payload = req.body;

    if (!NowPaymentsService.verifyIpnSignature(rawBody, signature)) {
      console.warn("⚠️ NOWPayments IPN signature inválida — rechazado.");
      return res.status(401).json({ error: "Invalid IPN signature" });
    }

    const {
      payment_id,
      payment_status,
      order_id,
      actually_paid,
      pay_currency,
    } = payload;

    console.log(
      `💰 NOWPayments IPN recibido | payment_id=${payment_id} status=${payment_status}`,
    );

    const isCompleted =
      payment_status === "finished" || payment_status === "confirmed";
    const isPartial = payment_status === "partially_paid";

    if (isCompleted || isPartial) {
      // 1. Actualizar pago en DB
      const { data: payment, error } = await supabase
        .from("payments")
        .update({
          status: isCompleted ? "completed" : "partially_paid",
          tx_reference: payment_id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", order_id)
        .select()
        .single();

      if (error) {
        console.error("Error actualizando pago en DB:", error);
      } else if (payment && isCompleted) {
        // 2. Activar producto
        const { FulfillmentService } =
          await import("../services/fulfillment.service");
        await FulfillmentService.activateLinkProduct(
          payment.user_id,
          payment_id,
          payment.amount,
          "USD",
        );

        // 3. Enviar email de confirmación
        const { data: userData } = await supabase.auth.admin.getUserById(
          payment.user_id,
        );
        const userEmail = userData.user?.email;
        if (userEmail) {
          await sendPaymentConfirmationEmail(
            userEmail,
            payment.amount,
            pay_currency?.toUpperCase() || "CRYPTO",
            payment_id,
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error procesando NOWPayments IPN:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// Todas las rutas siguientes requieren autenticación
// ─────────────────────────────────────────────────────────────
router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────
// PAYPAL
// ─────────────────────────────────────────────────────────────
router.post("/paypal/create-order", async (req: AuthRequest, res) => {
  try {
    const { amount, description, subscriptionId, linksData, customDomain } =
      req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const order = (await PayPalService.createOrder({
      amount,
      description,
      referenceId: subscriptionId,
    })) as any;

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
        metadata: { linksData, customDomain },
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

      const { data: payment, error } = await supabase
        .from("payments")
        .update({
          status: "completed",
          tx_reference: captureId || capture.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("tx_reference", orderId)
        .select()
        .single();

      if (error) {
        console.error("Error updating payment status:", error);
      } else if (payment) {
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

        // FULFILLMENT: Activate links
        try {
          const { FulfillmentService } =
            await import("../services/fulfillment.service");
          await FulfillmentService.activateLinkProduct(
            payment.user_id,
            payment.id,
            payment.amount,
            "USD",
          );
        } catch (fulfillmentError) {
          console.error(
            "Fulfillment error after PayPal capture:",
            fulfillmentError,
          );
        }

        if (req.user?.email && amountVal) {
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

// ─────────────────────────────────────────────────────────────
// WOMPI
// ─────────────────────────────────────────────────────────────
router.post("/wompi/get-signature", async (req: AuthRequest, res) => {
  try {
    const { amount, currency = "COP" } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const amountInCents = Math.round(amount * 100);
    const { WompiService } = await import("../services/wompi.service");

    const reference = WompiService.generateReference();
    const signature = WompiService.generateSignature(
      reference,
      amountInCents,
      currency,
    );

    res.json({
      reference,
      signature,
      amountInCents,
      currency,
      publicKey: (await import("../config/env")).config.wompi.pubKey,
    });
  } catch (error: any) {
    console.error("Error creating Wompi Signature:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/wompi/transaction", async (req: AuthRequest, res) => {
  try {
    const {
      amount,
      email,
      token,
      installments,
      acceptanceToken,
      linksData,
      customDomain,
    } = req.body;

    console.log(
      "💰 Wompi Transaction Initiated. Body:",
      JSON.stringify(req.body, null, 2),
    );

    if (!amount)
      return res.status(400).json({ error: "Missing required field: amount" });
    if (!token)
      return res.status(400).json({ error: "Missing required field: token" });
    if (!email)
      return res.status(400).json({ error: "Missing required field: email" });
    if (!acceptanceToken)
      return res
        .status(400)
        .json({ error: "Missing required field: acceptanceToken" });

    const { WompiService } = await import("../services/wompi.service");
    const transaction = await WompiService.createTransaction({
      amountUSD: amount,
      email,
      token,
      installments,
      acceptanceToken,
    });

    if (req.user) {
      const status =
        transaction.status === "APPROVED" ? "completed" : "pending";
      const { error } = await supabase.from("payments").insert({
        user_id: req.user.id,
        amount,
        currency: "USD",
        provider: "wompi",
        status,
        tx_reference: transaction.id,
        created_at: new Date().toISOString(),
        metadata: { linksData, customDomain },
      });
      if (error) console.error("Error saving payment:", error);

      if (status === "completed") {
        const { FulfillmentService } =
          await import("../services/fulfillment.service");
        await FulfillmentService.activateLinkProduct(
          req.user.id,
          transaction.id,
          amount,
          "USD",
        );
      }
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
    console.log("💰 Wompi Webhook received:", JSON.stringify(event, null, 2));

    if (
      event.event === "transaction.updated" &&
      event.data.transaction.status === "APPROVED"
    ) {
      const tx = event.data.transaction;
      const reference = tx.reference;
      const transactionId = tx.id;

      // 1. Update Payment Record
      const { data: payment, error: payError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          tx_reference: transactionId,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", reference)
        .select()
        .single();

      if (payError || !payment) {
        console.error("Payment record not found for ref:", reference);
        return res.status(200).json({ received: true }); // Acknowledge to stop retries even if not found
      }

      // 2. FULFILLMENT: Activate links
      const { FulfillmentService } =
        await import("../services/fulfillment.service");
      await FulfillmentService.activateLinkProduct(
        payment.user_id,
        reference,
        payment.amount,
        payment.currency,
      );

      console.log(
        `✅ Payment ${reference} approved via Webhook. Links activated.`,
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Wompi Webhook Error:", error);
    res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────────────────────
// NOWPAYMENTS — Crear pago crypto
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/payments/nowpayments/currencies
 * Devuelve la lista de criptomonedas disponibles.
 */
router.get("/nowpayments/currencies", async (_req, res) => {
  try {
    const currencies = await NowPaymentsService.getCurrencies();
    res.json({ currencies });
  } catch (error: any) {
    console.error("Error fetching NOWPayments currencies:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/nowpayments/create-payment
 * Crea un pago en NOWPayments y guarda el registro pending en la base de datos.
 * Body: { amount: number, payCurrency: string }
 */
router.post("/nowpayments/create-payment", async (req: AuthRequest, res) => {
  try {
    const { amount, payCurrency, linksData, customDomain } = req.body;

    if (!amount) return res.status(400).json({ error: "Amount is required" });
    if (!payCurrency)
      return res.status(400).json({ error: "payCurrency is required" });

    // Generar un order_id único que usaremos como PK en la tabla payments
    const orderId = uuidv4();

    const paymentData = await NowPaymentsService.createPayment({
      amount,
      payCurrency,
      orderId,
      orderDescription: "Only Program - Activación de Links Premium",
      email: req.user?.email,
    });

    // Guardar en la tabla payments como 'pending'
    if (req.user) {
      const { error } = await supabase.from("payments").insert({
        id: orderId,
        user_id: req.user.id,
        amount,
        currency: "USD",
        provider: "nowpayments",
        status: "pending",
        tx_reference: paymentData.payment_id,
        created_at: new Date().toISOString(),
        metadata: { linksData, customDomain },
      });
      if (error) console.error("Error guardando pago NOWPayments:", error);
    }

    res.json({
      payment_id: paymentData.payment_id,
      pay_address: paymentData.pay_address,
      pay_amount: paymentData.pay_amount,
      pay_currency: paymentData.pay_currency,
      price_amount: paymentData.price_amount,
      price_currency: paymentData.price_currency,
      expiration_estimate_date: paymentData.expiration_estimate_date,
      order_id: orderId,
    });
  } catch (error: any) {
    console.error("Error creating NOWPayments payment:", error);
    // Errors from NOWPayments with user-friendly messages should be 400
    const isClientError =
      error.message &&
      !error.message.startsWith("NOWPayments API Error") &&
      !error.message.includes("NOWPayments API Key");
    res.status(isClientError ? 400 : 500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/nowpayments/status/:paymentId
 * El frontend hace polling aquí para saber si el pago fue confirmado.
 */
router.get("/nowpayments/status/:paymentId", async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const status = await NowPaymentsService.getPaymentStatus(paymentId);
    res.json(status);
  } catch (error: any) {
    console.error("Error fetching NOWPayments status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE PAGOS
// ─────────────────────────────────────────────────────────────
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

    res.json({ payments, user: req.user });
  } catch (error: any) {
    console.error("Error fetching payments history:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// FREE TRIAL — Plan gratuito de 3 días
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/payments/free-trial/check
 * Verifica si el usuario ya ha utilizado su prueba gratuita.
 */
router.get("/free-trial/check", async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    const userId = req.user.id;

    const { data: existingTrial } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "free-trial")
      .maybeSingle();

    res.json({ hasUsedTrial: !!existingTrial });
  } catch (error: any) {
    console.error("Error checking free trial:", error);
    res.status(500).json({ error: "Error al verificar prueba gratuita." });
  }
});

/**
 * POST /api/payments/free-trial
 * Activa el plan gratuito de 3 días para el usuario.
 * Solo puede usarse una vez por usuario.
 */
router.post("/free-trial", async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });

    const userId = req.user.id;
    const userEmail = req.user.email;
    const { linksData, customDomain } = req.body;

    /* 
    // 1. Verificar que el usuario no haya usado ya una prueba gratuita
    const { data: existingTrial } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "free-trial")
      .maybeSingle();

    if (existingTrial) {
      return res.status(400).json({
        error:
          "Ya utilizaste tu prueba gratuita. Solo se permite una vez por cuenta.",
        code: "TRIAL_ALREADY_USED",
      });
    }
    */

    console.log(`[FreeTrial] Starting activation for user: ${userId}`);
    // 2. Calcular fechas (30 días para pruebas)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const orderId = uuidv4();

    // 3. Crear registro de pago $0
    const { error: paymentError } = await supabase.from("payments").insert({
      id: orderId,
      user_id: userId,
      amount: 0,
      currency: "USD",
      provider: "free-trial",
      status: "completed",
      tx_reference: `free-trial-${orderId.slice(0, 8)}`,
      confirmed_at: now.toISOString(),
      created_at: now.toISOString(),
      metadata: { linksData, customDomain },
    });

    if (paymentError) {
      console.error("Error creando pago free trial:", paymentError);
      return res
        .status(500)
        .json({ error: "Error al registrar el plan gratuito." });
    }

    // 4. Activar links pendientes del usuario
    const { FulfillmentService } =
      await import("../services/fulfillment.service");
    await FulfillmentService.activateLinkProduct(userId, orderId, 0, "USD");

    // 5. Registrar/actualizar suscripción con fecha de expiración
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userName =
      userData.user?.user_metadata?.full_name ||
      userData.user?.user_metadata?.name ||
      userData.user?.email?.split("@")[0] ||
      "Usuario";

    // Intentar insertar la suscripción (si ya existe, el error de PK será ignorado por el .then)
    await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        status: "active",
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        next_payment_at: expiresAt.toISOString(),
        last_payment_at: now.toISOString(),
        total_amount: 0,
      })
      .then(({ error }) => {
        if (error)
          console.warn(
            "Subscriptions upsert warning (non-critical):",
            error.message,
          );
      });

    // 6. Enviar email de factura
    if (userEmail) {
      await sendFreeTrialInvoiceEmail(
        userEmail,
        userName,
        now,
        expiresAt,
        orderId,
      );
    }

    return res.json({
      success: true,
      message: "¡Plan gratuito activado! Revisa tu email para ver la factura.",
      expiresAt: expiresAt.toISOString(),
      orderId,
    });
  } catch (error: any) {
    console.error("❌ Error activando free trial:", error);
    return res.status(500).json({
      error: error.message || "Error interno.",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

export default router;
