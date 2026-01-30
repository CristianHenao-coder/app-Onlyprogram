import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../services/brevo.service";
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
      email_confirm: true, // Auto-confirmar email en desarrollo
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
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
});

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

export default router;
