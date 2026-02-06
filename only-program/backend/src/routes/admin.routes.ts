import { Router, Response } from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middlewares/auth.middleware";
import { sendAdminVerificationCode } from "../services/brevo.service";
import { config } from "../config/env";

const router = Router();

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
);

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * POST /api/admin/request-promotion-code
 * Solicita un código para promover a un usuario a admin
 */
router.post(
  "/request-promotion-code",
  async (req: AuthRequest, res: Response) => {
    try {
      const { targetUserId } = req.body;
      const adminId = req.user?.id;
      const adminEmail = req.user?.email || "";

      if (!targetUserId) {
        return res
          .status(400)
          .json({ error: "Se requiere el ID del usuario destino" });
      }

      // Generar código de 6 dígitos seguro
      const code = crypto.randomInt(100000, 999999).toString();

      // Guardar en la DB
      const { error } = await supabase.from("admin_verification_codes").insert({
        admin_id: adminId,
        code,
        action_type: "promote_user",
        target_id: targetUserId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      // Enviar por email
      await sendAdminVerificationCode(
        adminEmail,
        code,
        "Promover usuario a administrador",
      );

      res.json({ message: "Código enviado correctamente" });
    } catch (err: any) {
      console.error("Error al solicitar código:", err);
      res.status(500).json({ error: "Error al generar código de seguridad" });
    }
  },
);

/**
 * POST /api/admin/verify-promotion-code
 * Verifica el código y promueve al usuario
 */
router.post(
  "/verify-promotion-code",
  async (req: AuthRequest, res: Response) => {
    try {
      const { code, targetUserId } = req.body;
      const adminId = req.user?.id;

      if (!code || !targetUserId) {
        return res
          .status(400)
          .json({ error: "Código e ID de destino son requeridos" });
      }

      // Verificar código
      const { data: verif, error: verifError } = await supabase
        .from("admin_verification_codes")
        .select("*")
        .eq("admin_id", adminId)
        .eq("code", code)
        .eq("target_id", targetUserId)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (verifError || !verif) {
        return res.status(400).json({ error: "Código inválido o expirado" });
      }

      // Marcar código como usado
      await supabase
        .from("admin_verification_codes")
        .update({ is_used: true })
        .eq("id", verif.id);

      // Promover usuario
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", targetUserId);

      if (updateError) throw updateError;

      res.json({ message: "Usuario promovido a administrador exitosamente" });
    } catch (err: any) {
      console.error("Error al verificar código:", err);
      res.status(500).json({ error: "Error al procesar la promoción" });
    }
  },
);

/**
 * DELETE /api/admin/users/:userId
 * Elimina un usuario por ID (solo admin)
 */
router.delete("/users/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }

    if (userId === adminId) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu propia cuenta" });
    }

    // 1. Eliminar referencias en la base de datos
    // Eliminamos los links del usuario para evitar huérfanos o restricciones
    const { error: linksError } = await supabase
      .from("smart_links")
      .delete()
      .eq("user_id", userId);

    if (linksError) {
      console.error("Error al eliminar links del usuario:", linksError);
      // No lanzamos error para permitir intentar borrar el usuario de todas formas,
      // o podrías decidir lanzar error si es crítico.
      // throw linksError;
    }

    // 2. Eliminar de Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err: any) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "No se pudo eliminar el usuario" });
  }
});

/**
 * GET /api/admin/users
 * Obtiene lista de usuarios (solo admin)
 */
router.get("/users", async (req: AuthRequest, res) => {
  res.json({
    message: "Endpoint de administración",
    admin: req.user,
  });
});

export default router;
