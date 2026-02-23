import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

const router = Router();
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
);

/**
 * GET /api/links
 * Obtiene todos los enlaces del usuario autenticado
 */
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: links, error } = await supabase
      .from("smart_links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ links });
  } catch (error: any) {
    console.error("Error al obtener enlaces:", error);
    res.status(500).json({
      error: "Error al obtener enlaces",
      code: "FETCH_FAILED",
    });
  }
});

/**
 * POST /api/links
 * Crea un nuevo enlace protegido
 */
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { slug, title, subtitle, config, expires_at } = req.body;

    if (!slug || !config) {
      return res.status(400).json({
        error: "Slug y configuración son requeridos",
        code: "MISSING_FIELDS",
      });
    }

    const { data: link, error } = await supabase
      .from("smart_links")
      .insert({
        user_id: userId,
        slug,
        title,
        subtitle,
        config,
        expires_at:
          expires_at ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días por defecto
        status: "pending",
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Duplicate slug
        return res.status(409).json({
          error: "Este slug ya está en uso",
          code: "SLUG_EXISTS",
        });
      }
      throw error;
    }

    res.status(201).json({ link });
  } catch (error: any) {
    console.error("Error al crear enlace:", error);
    res.status(500).json({
      error: "Error al crear enlace",
      code: "CREATE_FAILED",
    });
  }
});

/**
 * PUT /api/links/:id
 * Actualiza un enlace existente
 */
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, subtitle, config, is_active } = req.body;

    const { data: link, error } = await supabase
      .from("smart_links")
      .update({
        title,
        subtitle,
        config,
        is_active,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    if (!link) {
      return res.status(404).json({
        error: "Enlace no encontrado",
        code: "NOT_FOUND",
      });
    }

    res.json({ link });
  } catch (error: any) {
    console.error("Error al actualizar enlace:", error);
    res.status(500).json({
      error: "Error al actualizar enlace",
      code: "UPDATE_FAILED",
    });
  }
});

/**
 * DELETE /api/links/:id
 * Elimina un enlace
 */
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("smart_links")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res.json({ message: "Enlace eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error al eliminar enlace:", error);
    res.status(500).json({
      error: "Error al eliminar enlace",
      code: "DELETE_FAILED",
    });
  }
});

/**
 * POST /api/links/:id/request-domain
 * Registra la solicitud de conectar un dominio propio a un smart link.
 * Guarda domain_status='pending' para que el admin lo pueda gestionar.
 */
router.post("/:id/request-domain", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { custom_domain } = req.body;

    if (!custom_domain) {
      return res.status(400).json({ error: "Se requiere el dominio a conectar", code: "MISSING_DOMAIN" });
    }

    // Verify the link belongs to the requesting user
    const { data: existing, error: fetchError } = await supabase
      .from("smart_links")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: "Link no encontrado", code: "NOT_FOUND" });
    }

    const { error: updateError } = await supabase
      .from("smart_links")
      .update({
        custom_domain: custom_domain.trim().toLowerCase(),
        domain_status: "pending",
        domain_requested_at: new Date().toISOString(),
        domain_activated_at: null,
        domain_notes: null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    res.json({ success: true, message: "Solicitud de dominio registrada. El admin la revisará pronto." });
  } catch (error: any) {
    console.error("Error al registrar solicitud de dominio:", error);
    res.status(500).json({ error: "Error al registrar solicitud", code: "REQUEST_FAILED" });
  }
});

export default router;
