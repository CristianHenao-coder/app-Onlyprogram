import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendAccountLockoutEmail,
} from "../services/brevo.service";
import {
  createOTP,
  verifyOTP,
  OTPUsage,
  generateDeviceToken,
  storeDeviceToken,
  validateDeviceToken,
  isEmailLocked,
} from "../services/otp.service";
import { config } from "../config/env";

const router = Router();

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
);

/**
 * POST /api/auth/register
 * Registra un nuevo usuario y envía email de bienvenida
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email y contraseña son requeridos",
        code: "MISSING_FIELDS",
      });
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return res.status(400).json({
        error: error?.message || "No se pudo crear el usuario",
        code: "REGISTRATION_FAILED",
      });
    }

    // Crear perfil del usuario
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      role: "user",
      plan_type: null,
      is_suspended: false,
    });

    if (profileError) {
      console.error("Error al crear perfil:", profileError);
    }

    // Enviar email de bienvenida
    await sendWelcomeEmail(email, name);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error al registrar usuario",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Envía email de recuperación de contraseña
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email es requerido",
        code: "MISSING_EMAIL",
      });
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${config.urls.frontend}/reset-password`,
      },
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: "RESET_FAILED",
      });
    }

    if (data?.properties?.action_link) {
      await sendPasswordResetEmail(email, data.properties.action_link);
    }

    res.json({
      message: "Si el email existe, recibirás instrucciones de recuperación",
    });
  } catch (error: any) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({
      error: "Error al procesar solicitud",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token y nueva contraseña son requeridos",
        code: "MISSING_FIELDS",
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: "RESET_FAILED",
      });
    }

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error: any) {
    console.error("Error en reset-password:", error);
    res.status(500).json({
      error: "Error al restablecer contraseña",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * POST /api/auth/request-otp
 * Genera y envía un código de verificación (sin Turnstile)
 */
router.post("/request-otp", async (req: Request, res: Response) => {
  try {
    const { email, lang, usage } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    // Check if email is locked
    const lockCheck = await isEmailLocked(
      email,
      (usage as OTPUsage) || "register",
    );
    if (lockCheck.locked) {
      const lockedUntil = lockCheck.lockedUntil
        ? new Date(lockCheck.lockedUntil).toLocaleTimeString("es-ES")
        : "10 minutos";
      return res.status(429).json({
        error: `Demasiados intentos fallidos. El acceso está bloqueado hasta las ${lockedUntil}.`,
        code: "EMAIL_LOCKED",
        lockedUntil: lockCheck.lockedUntil,
      });
    }

    const code = await createOTP(email, (usage as OTPUsage) || "register");
    if (!code) {
      return res.status(500).json({ error: "No se pudo generar el código" });
    }

    const emailSent = await sendOTPEmail(email, code, lang || "es");
    if (!emailSent) {
      return res.status(500).json({ error: "No se pudo enviar el email" });
    }

    res.json({ message: "Código enviado exitosamente" });
  } catch (error) {
    console.error("Error en request-otp:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifica un código y realiza la acción correspondiente
 */
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, code, usage, password, name } = req.body;

    const result = await verifyOTP(email, code, usage as OTPUsage);

    if (result.locked) {
      // Send lockout notification email
      await sendAccountLockoutEmail(email, result.lockedUntil || "");

      return res.status(429).json({
        error:
          "Tu acceso ha sido bloqueado por 10 minutos debido a múltiples intentos fallidos. Te hemos enviado un email de notificación.",
        code: "ACCOUNT_LOCKED",
        lockedUntil: result.lockedUntil,
      });
    }

    if (!result.valid) {
      const attemptsMsg =
        result.attemptsLeft !== undefined
          ? ` Te quedan ${result.attemptsLeft} intentos.`
          : "";
      return res.status(400).json({
        error: `Código inválido o expirado.${attemptsMsg}`,
        code: "INVALID_OTP",
        attemptsLeft: result.attemptsLeft,
      });
    }

    // If register usage, create the user
    if (usage === "register") {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (error || !data.user) {
        return res
          .status(400)
          .json({ error: error?.message || "Error al crear usuario" });
      }

      await supabase.from("profiles").insert({
        id: data.user.id,
        role: "user",
      });

      await sendWelcomeEmail(email, name);

      return res.json({
        message: "Usuario verificado y registrado",
        user: data.user,
      });
    }

    // For login or reset, confirm validity
    res.json({ message: "Código verificado correctamente", verified: true });
  } catch (error) {
    console.error("Error en verify-otp:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * POST /api/auth/verify-device
 * Validates whether the device token is trusted for the given user
 */
router.post("/verify-device", async (req: Request, res: Response) => {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({
        trusted: false,
        error: "userId y deviceToken son requeridos",
      });
    }

    const trusted = await validateDeviceToken(userId, deviceToken);
    return res.json({ trusted });
  } catch (error) {
    console.error("Error en verify-device:", error);
    res.status(500).json({ trusted: false, error: "Error interno" });
  }
});

/**
 * POST /api/auth/register-device
 * Registers a device token after successful OTP verification
 */
router.post("/register-device", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    const deviceToken = generateDeviceToken();
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || "";

    const stored = await storeDeviceToken(userId, deviceToken, userAgent, ip);

    if (!stored) {
      return res.status(500).json({ error: "No se pudo registrar el dispositivo" });
    }

    return res.json({ deviceToken });
  } catch (error) {
    console.error("Error en register-device:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
