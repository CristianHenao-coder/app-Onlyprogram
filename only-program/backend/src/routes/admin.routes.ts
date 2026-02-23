import { Router, Response } from "express";
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

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

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

/**
 * POST /api/admin/approve-link
 * Aprueba un enlace y le asigna un slug final
 */
router.post("/approve-link", async (req: AuthRequest, res: Response) => {
  try {
    const { linkId, slug } = req.body;

    if (!linkId || !slug) {
      return res
        .status(400)
        .json({ error: "ID de enlace y slug son requeridos" });
    }

    // Verificar si el slug ya existe
    const { data: existingLink } = await supabase
      .from("smart_links")
      .select("id")
      .eq("slug", slug)
      .neq("id", linkId) // Excluir el mismo link si ya tenía ese slug
      .single();

    if (existingLink) {
      return res.status(409).json({ error: "El slug ya está en uso" });
    }

    // Actualizar el link
    const { data: link, error } = await supabase
      .from("smart_links")
      .update({
        slug: slug,
        status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", linkId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Enlace aprobado exitosamente", link });
  } catch (error: any) {
    console.error("Error al aprobar enlace:", error);
    res.status(500).json({ error: "Error al aprobar enlace" });
  }
});

/**
 * POST /api/admin/site-config
 * Saves a site_config key/value using the service role (bypasses RLS).
 * Only accessible to admins (requireAdmin middleware is applied globally above).
 */
router.post("/site-config", async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const userId = req.user?.id;

    console.log(`[AdminConfig] Saving key: ${key} for user: ${userId}`);
    // console.log(`[AdminConfig] Value:`, JSON.stringify(value));

    if (!key || value === undefined) {
      return res.status(400).json({ error: "Se requiere 'key' y 'value'" });
    }

    const { error } = await supabase.from("site_configs").upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    });

    if (error) {
      console.error("Error saving site_config:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[AdminConfig] Successfully saved key: ${key}`);
    res.json({ success: true, key });
  } catch (error: any) {
    console.error("Error en site-config:", error);
    res
      .status(500)
      .json({ error: error.message || "Error al guardar configuración" });
  }
});

/**
 * GET /api/admin/domain-requests
 * Lista todos los links con domain_status = 'pending'
 */
router.get("/domain-requests", async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("smart_links")
      .select(
        `
        id, slug, title, custom_domain, domain_status,
        domain_requested_at, domain_activated_at, domain_notes,
        profiles (full_name, email)
      `,
      )
      .in("domain_status", ["pending", "active", "failed"])
      .order("domain_requested_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("[Admin] domain-requests error:", err);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

/**
 * POST /api/admin/domain-requests/:linkId/test
 * Hace un DNS lookup del custom_domain del link y verifica si el A record
 * apunta a la IP del servidor configurada en SERVER_IP.
 */
router.post(
  "/domain-requests/:linkId/test",
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;

      const { data: link, error } = await supabase
        .from("smart_links")
        .select("id, custom_domain")
        .eq("id", linkId)
        .single();

      if (error || !link || !link.custom_domain) {
        return res
          .status(404)
          .json({ error: "Link no encontrado o sin dominio" });
      }

      const domain = link.custom_domain;
      const expectedIp = process.env.SERVER_IP || "147.93.131.4";

      // Use dns module to do lookup
      const dns = await import("dns/promises");
      try {
        const addresses = await dns.resolve4(domain);
        const hasCorrectIp = addresses.includes(expectedIp);
        res.json({
          success: true,
          domain,
          addresses,
          expectedIp,
          configured: hasCorrectIp,
          message: hasCorrectIp
            ? `✅ DNS correcto. ${domain} apunta a ${expectedIp}`
            : `❌ DNS incorrecto. ${domain} apunta a ${addresses.join(", ")}, se esperaba ${expectedIp}`,
        });
      } catch (dnsErr: any) {
        res.json({
          success: false,
          domain,
          configured: false,
          message: `❌ No se pudo resolver ${domain}: ${dnsErr.code || dnsErr.message}`,
        });
      }
    } catch (err: any) {
      console.error("[Admin] domain test error:", err);
      res.status(500).json({ error: "Error al probar DNS" });
    }
  },
);

/**
 * POST /api/admin/domain-requests/:linkId/activate
 * Marca el dominio como activo
 */
router.post(
  "/domain-requests/:linkId/activate",
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;

      const { error } = await supabase
        .from("smart_links")
        .update({
          domain_status: "active",
          domain_activated_at: new Date().toISOString(),
          domain_notes: null,
        })
        .eq("id", linkId);

      if (error) throw error;

      console.log(`[Admin] Domain activated for link: ${linkId}`);
      res.json({ success: true, message: "Dominio activado exitosamente" });
    } catch (err: any) {
      console.error("[Admin] domain activate error:", err);
      res.status(500).json({ error: "Error al activar dominio" });
    }
  },
);

/**
 * POST /api/admin/domain-requests/:linkId/reject
 * Marca el dominio como fallido con una nota
 */
router.post(
  "/domain-requests/:linkId/reject",
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const { notes } = req.body;

      const { error } = await supabase
        .from("smart_links")
        .update({
          domain_status: "failed",
          domain_notes:
            notes || "Error de configuración. Por favor contacta soporte.",
        })
        .eq("id", linkId);

      if (error) throw error;

      console.log(`[Admin] Domain rejected for link: ${linkId}`);
      res.json({ success: true, message: "Solicitud rechazada" });
    } catch (err: any) {
      console.error("[Admin] domain reject error:", err);
      res.status(500).json({ error: "Error al rechazar solicitud" });
    }
  },
);

export default router;
