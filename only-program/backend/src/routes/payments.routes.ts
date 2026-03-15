import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { PayPalService } from "../services/paypal.service";
import { NowPaymentsService } from "../services/nowpayments.service";
import { sendPaymentConfirmationEmail } from "../services/brevo.service";
import { supabase } from "../services/supabase.service";
import { SubscriptionService } from "../services/subscription.service";
import { config } from "../config/env";
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
// WOMPI — get-signature (público, no requiere auth)
// ─────────────────────────────────────────────────────────────
router.post("/wompi/get-signature", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount, currency = "COP", linksData, customDomain } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { WompiService } = await import("../services/wompi.service");

    const amountInCents = await WompiService.calculateAmountInCents(amount);
    const reference = WompiService.generateReference();
    const signature = WompiService.generateSignature(
      reference,
      amountInCents,
      currency,
    );

    // PERSISTENCE FIX: Save pending payment so webhook can find it
    const { error: payError } = await supabase.from("payments").insert({
      id: reference,
      user_id: req.user.id,
      amount,
      currency: "USD",
      provider: "wompi",
      status: "pending",
      created_at: new Date().toISOString(),
      metadata: { linksData, customDomain },
    });

    if (payError) {
      console.error("Error saving pending Wompi payment:", payError);
      // We continue because the signature is still valid, but fulfillment might fail
    }

    res.json({
      reference,
      signature,
      amountInCents,
      currency,
      publicKey: config.wompi.pubKey,
      paymentLink: config.wompi.paymentLink,
    });
  } catch (error: any) {
    console.error("Error creating Wompi Signature:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PAYPAL WEBHOOK (público)
// ─────────────────────────────────────────────────────────────
router.post("/webhook/paypal", async (req, res) => {
  try {
    const event = req.body;
    console.log("💰 PayPal Webhook received event:", event.event_type);

    if (
      event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || 
      event.event_type === "PAYMENT.SALE.COMPLETED"
    ) {
      const resource = event.resource;
      const customId = resource.custom_id; // user_id
      const subscriptionId = resource.billing_agreement_id || resource.id; 

      let userId = customId;
      let amount = 0;

      if (resource.amount && resource.amount.total) {
        amount = parseFloat(resource.amount.total);
      } else if (resource.plan?.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value) {
         amount = parseFloat(resource.plan.billing_cycles[0].pricing_scheme.fixed_price.value);
      }

      if (!userId) {
         const { data: payRec } = await supabase.from("payments").select("user_id, metadata").eq("tx_reference", subscriptionId).single();
         if (payRec) {
           userId = payRec.user_id;
         }
      }

      if (userId) {
         // Update Record Status
         await supabase.from("payments").update({ status: "completed", confirmed_at: new Date().toISOString() }).eq("tx_reference", subscriptionId);

         const { FulfillmentService } = await import("../services/fulfillment.service");
         await FulfillmentService.activateLinkProduct(userId, subscriptionId, amount, "USD");
         
         const { data: userData } = await supabase.auth.admin.getUserById(userId);
         if (userData?.user?.email && amount > 0) {
            await sendPaymentConfirmationEmail(
              userData.user.email,
              amount,
              "USD",
              subscriptionId
            );
         }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("PayPal Webhook Error:", error);
    res.sendStatus(500);
  }
});

// ─────────────────────────────────────────────────────────────
// WOMPI WEBHOOK (público)
// ─────────────────────────────────────────────────────────────
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
        return res.status(200).json({ received: true }); 
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

router.post("/paypal/create-subscription", async (req: AuthRequest, res) => {
  try {
    const { planId, linksData, customDomain } = req.body;
    if (!planId) return res.status(400).json({ error: "Plan ID is required" });

    // Use user.id as custom_id so the webhook knows who paid
    const customId = req.user?.id; 

    const subscription = (await PayPalService.createSubscription(planId, customId)) as any;

    if (req.user) {
      const { error } = await supabase.from("payments").insert({
        user_id: req.user.id,
        amount: 0, 
        currency: "USD",
        provider: "paypal",
        status: "pending",
        tx_reference: subscription.id,
        created_at: new Date().toISOString(),
        metadata: { isSubscription: true, linksData, customDomain },
      });
      if (error) console.error("Error inserting subscription record:", error);
    }

    res.json(subscription);
  } catch (error: any) {
    console.error("Error creating PayPal subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// (get-signature movido arriba del middleware de auth)

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
// FREE CHECKOUT (100% DISCOUNT)
// ─────────────────────────────────────────────────────────────
router.post("/checkout-zero", async (req: AuthRequest, res) => {
  try {
    const { linksData, customDomain } = req.body;
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    console.log(`🎁 Processing zero-amount checkout for user ${req.user.id}`);

    const orderId = uuidv4();

    // 1. Create a completed payment record for $0
    const { error: payError } = await supabase.from("payments").insert({
      id: orderId,
      user_id: req.user.id,
      amount: 0,
      currency: "USD",
      provider: "onlyprogram", // Internal provider for free/discounted orders
      status: "completed",
      tx_reference: `FREE_${orderId}`,
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      metadata: { linksData, customDomain, isFreeCheckout: true },
    });

    if (payError) {
      console.error("Error creating zero payment record:", payError);
      return res.status(500).json({ error: "Failed to create payment record" });
    }

    // 2. FULFILLMENT: Activate links immediately
    const { FulfillmentService } = await import("../services/fulfillment.service");
    const result = await FulfillmentService.activateLinkProduct(
      req.user.id,
      orderId,
      0,
      "USD"
    );

    if (!result.success) {
      console.error("Fulfillment error for zero checkout:", result.error);
      return res.status(500).json({ error: "Fulfillment failed" });
    }

    res.json({
      success: true,
      message: "Checkout completed successfully",
      orderId,
    });
  } catch (error: any) {
    console.error("Error in checkout-zero:", error);
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


export default router;
