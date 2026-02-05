import { config } from "../config/env";
import crypto from "crypto";

interface CreateCryptoOrderParams {
  amount: number;
  currency?: string; // USD, etc.
  orderId: string; // Tu ID interno de orden
  email?: string;
}

export class CryptoService {
  /**
   * Genera la firma requerida por RedotPay
   */
  private static generateSignature(body: any): string {
    // Nota: La implementación exacta de la firma depende de la documentación específica de RedotPay
    // Generalmente es HMAC-SHA256 del body con tu API Key o Secret
    // Esta es una implementación genérica común
    const hmac = crypto.createHmac("sha256", config.redotpay.apiKey);
    hmac.update(JSON.stringify(body));
    return hmac.digest("hex");
  }

  /**
   * Crea una orden de pago en RedotPay
   */
  static async createOrder({
    amount,
    currency = "USD",
    orderId,
    email,
  }: CreateCryptoOrderParams) {
    // Validar configuración antes de llamar
    if (!config.redotpay.appId || !config.redotpay.apiKey) {
      console.error("❌ RedotPay App ID o API Key no configurados en .env");
      throw new Error("Configuración de pagos crypto incompleta en el servidor.");
    }

    const payload = {
      merchantOrderId: orderId,
      amount: amount.toString(),
      currency: currency,
      email: email,
      // RedotPay suele requerir URLs de retorno
      returnUrl: `${config.urls.frontend}/payment/success?orderId=${orderId}`,
      cancelUrl: `${config.urls.frontend}/payment/cancel?orderId=${orderId}`,
      notifyUrl: `${config.urls.backend}/api/payments/webhook/redotpay`,
    };

    try {
      const response = await fetch(`${config.redotpay.apiUrl}/v1/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Id": config.redotpay.appId,
          // "X-Signature": this.generateSignature(payload), // Descomentar si es requerido
        },
        body: JSON.stringify(payload),
      });

      // Intentar leer la respuesta como texto primero para debuggear si no es JSON
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`❌ RedotPay Error (${response.status}):`, responseText);
        throw new Error(`RedotPay API Error: ${response.status} ${response.statusText}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Error parseando respuesta JSON de RedotPay:", responseText);
        throw new Error("Respuesta inválida del proveedor de pagos crypto");
      }
    } catch (error: any) {
      console.error("❌ Error en createOrder de CryptoService:", error);
      throw error; // Re-lanzar para que el controlador lo maneje
    }
  }

  /**
   * Verifica la firma de un webhook de RedotPay
   */
  static verifyWebhookSignature(
    payload: any,
    signature: string
  ): boolean {
    if (!config.redotpay.apiKey) {
      console.error("❌ RedotPay API Key missing for signature verification");
      return false;
    }

    // Generar la firma esperada usando HMAC-SHA256 y la API Key
    // Nota: Asegurarse que RedotPay usa la API Key como secret. 
    // Si usa un secret diferente, se debe añadir a las variables de entorno.
    const computedSignature = this.generateSignature(payload);

    // Comparación segura contra ataques de tiempo
    // Si la firma viene en hex, asegurarnos que computedSignature también lo sea (lo es por generateSignature)
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (e) {
      console.error("❌ Error verificando firma (posible diferencia de longitud):", e);
      return false;
    }
  }
}
