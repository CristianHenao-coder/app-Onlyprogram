import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOTPEmail,
} from "../services/brevo.service";
import { createOTP, verifyOTP, OTPUsage } from "../services/otp.service";
import { config } from "../config/env";
import { verifyTurnstile } from "../middlewares/turnstile.middleware";

const router = Router();

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
);

/**
 * POST /api/auth/register
 * Registra un nuevo usuario y envía email de bienvenida
 */
router.post(
  "/register",
  verifyTurnstile,
  async (req: Request, res: Response) => {
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
        email_confirm: true, // Auto-confirmar email en desarrollo
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
  },
);

/**
 * POST /api/auth/forgot-password
 * Envía email de recuperación de contraseña
 */
router.post(
  "/forgot-password",
  verifyTurnstile,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "Email es requerido",
          code: "MISSING_EMAIL",
        });
      }

      // Generar link de recuperación con Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.urls.frontend}/reset-password`,
      });

      if (error) {
        return res.status(400).json({
          error: error.message,
          code: "RESET_FAILED",
        });
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
  },
);

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña del usuario
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

    // Verificar token y actualizar contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: "RESET_FAILED",
      });
    }

    res.json({
      message: "Contraseña actualizada exitosamente",
    });
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
 * Genera y envía un código de verificación
 */
router.post(
  "/request-otp",
  verifyTurnstile,
  async (req: Request, res: Response) => {
    try {
      const { email, lang, usage } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email es requerido" });
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
  },
);

/**
 * POST /api/auth/verify-otp
 * Verifica un código y realiza la acción correspondiente (Registro/Login)
 */
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, code, usage, password, name } = req.body;

    const isValid = await verifyOTP(email, code, usage as OTPUsage);
    if (!isValid) {
      return res.status(400).json({ error: "Código inválido o expirado" });
    }

    // Si es registro, crear el usuario ahora que el email está verificado
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

    // Para login o reset, simplemente confirmamos validez
    res.json({ message: "Código verificado correctamente", verified: true });
  } catch (error) {
    console.error("Error en verify-otp:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
