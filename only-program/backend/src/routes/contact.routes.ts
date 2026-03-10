import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

const router = Router();

const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
);

/**
 * POST /api/contact
 * Ruta pública - Guarda un mensaje del formulario de contacto del landing
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
            return res.status(400).json({ error: "Todos los campos son obligatorios." });
        }

        const { error } = await supabase
            .from("contact_messages")
            .insert({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });

        if (error) {
            // Detectar si la tabla no existe
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                console.error("[Contact] ❌ La tabla 'contact_messages' NO existe en Supabase.");
                console.error("[Contact] 👉 Ejecuta el SQL en: backend/src/migrations/contact_messages.sql");
                return res.status(503).json({
                    error: "El servicio de mensajes no está configurado aún. Por favor, contacta al administrador."
                });
            }
            console.error("[Contact] Error de Supabase:", error);
            throw error;
        }

        console.log(`[Contact] ✅ Mensaje guardado de: ${email}`);
        res.json({ success: true, message: "Mensaje recibido correctamente." });
    } catch (err: any) {
        console.error("[Contact] Error guardando mensaje:", err);
        res.status(500).json({ error: "No se pudo guardar el mensaje. Intenta de nuevo." });
    }
});

export default router;

