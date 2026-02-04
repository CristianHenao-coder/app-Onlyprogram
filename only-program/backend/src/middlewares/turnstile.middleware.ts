import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

/**
 * Middleware para verificar tokens de Cloudflare Turnstile
 * Se espera que el token venga en el body como 'captchaToken' o en headers como 'x-captcha-token'
 */
export async function verifyTurnstile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.body.captchaToken || req.headers["x-captcha-token"];
  const secretKey = config.turnstile.secretKey;

  if (!secretKey) {
    console.warn(
      "⚠️ TURNSTILE_SECRET_KEY no configurado. Saltando verificación de bot.",
    );
    return next();
  }

  if (!token) {
    return res.status(400).json({
      error: "Verificación de bot requerida",
      code: "CAPTCHA_REQUIRED",
    });
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: req.ip || "",
        }),
      },
    );

    const data: any = await response.json();
    const { success, "error-codes": errorCodes } = data;

    if (!success) {
      console.error("❌ Fallo de verificación Turnstile:", errorCodes);
      return res.status(403).json({
        error: "Verificación de bot fallida",
        code: "CAPTCHA_FAILED",
        details: errorCodes,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Error verificando Turnstile:", error);
    return res.status(500).json({
      error: "Error interno al verificar bot",
      code: "SERVER_ERROR",
    });
  }
}
