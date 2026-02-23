import { Router } from "express";
import { telegramService } from "../services/telegram.service";
import { supabase } from "../services/supabase.service";
import crypto from "crypto";

const router = Router();

// --- RUTA 1: ROTACIÓN PÚBLICA DE TELEGRAM (/t/:slug) ---
// Esta ruta redirige directamente al siguiente bot disponible.
// Útil para botones directos "Telegram" en la landing.
router.get("/t/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Usamos el servicio de rotación Round Robin
    const botUrl = await telegramService.rotateLink(slug);

    if (botUrl) {
      // Redirección directa al bot
      return res.redirect(botUrl);
    } else {
      // Si no hay bots o link inválido, redirigir a un fallback o error
      // TODO: Configurar URL de fallback global o por usuario
      return res.status(404).send("Enlace no disponible temporalmente");
    }
  } catch (error) {
    console.error("Gate /t/ Error:", error);
    res.status(500).send("Error interno");
  }
});

import { TrafficService } from "../services/traffic.service";

// ...

// --- RUTA 2: API GATE SEGURA (/api/gate/:slug) ---
router.get("/api/gate/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Obtener Link
    const { data: link, error } = await supabase
      .from("smart_links")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !link) {
      return res.status(404).json({ error: "Node Offline" });
    }

    // 1.5 ANALIZAR TRÁFICO CON LEGACY SYSTEM
    const userAgent = req.headers["user-agent"] || "";
    // Pass all headers to help legacy system detect in-app browsers
    const trafficAnalysis = await TrafficService.analyzeVisitor(
      userAgent,
      req.headers,
    );

    // 2. Determinar destino (SOLO si está permitido)
    let targetUrl = null;
    if (trafficAnalysis.action === "allow") {
      targetUrl = link.onlyfans || link.telegram || link.instagram;
    }

    // 3. Cifrar la respuesta
    const payload = {
      u: targetUrl,
      ts: Date.now(),
      v: crypto
        .createHash("md5")
        .update(slug + "gate_secret")
        .digest("hex"),
      // Incluir decisión de tráfico para que el frontend sepa qué hacer
      traffic: trafficAnalysis,
    };

    const secureData = Buffer.from(JSON.stringify(payload)).toString("base64");

    res.json({ data: secureData });
  } catch (error) {
    console.error("Gate API Error:", error);
    res.status(500).json({ s: "error" });
  }
});

// --- RUTA 3: RESOLUCIÓN POR DOMINIO (/api/gate/domain/:domain) ---
router.get("/api/gate/domain/:domain", async (req, res) => {
  try {
    const { domain } = req.params;

    // 1. Buscar Link
    const { data: link, error } = await supabase
      .from("smart_links")
      .select("*")
      .eq("custom_domain", domain)
      .single();

    if (error || !link) {
      return res.status(404).json({ error: "Domain not linked" });
    }

    // 1.5 ANALIZAR TRÁFICO
    const userAgent = req.headers["user-agent"] || "";
    const trafficAnalysis = await TrafficService.analyzeVisitor(
      userAgent,
      req.headers,
    );

    // 2. Devolver slug + decisión de tráfico
    res.json({
      slug: link.slug,
      traffic: trafficAnalysis,
    });
  } catch (error) {
    console.error("Gate Domain Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- RUTA 4: CHECK DOMAIN FOR CADDY (SSL On-Demand) ---
router.get("/api/system/check-domain", async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== "string") {
      return res.status(400).send("Domain is required");
    }

    // 1. Permitir dominios del sistema (Ajustar según necesidad)
    const systemDomains = ["onlyprogramlink.com", "onlyprogram.com"];
    if (systemDomains.some((d) => domain === d || domain.endsWith("." + d))) {
      return res.status(200).send("System Domain Allowed");
    }

    // 2. Buscar en la base de datos de Smart Links
    const { data: link, error } = await supabase
      .from("smart_links")
      .select("id")
      .eq("custom_domain", domain)
      .single();

    if (link && !error) {
      return res.status(200).send("User Domain Allowed");
    }

    // Si no está en la DB, denegar SSL para evitar ataques de agotamiento de certificados
    console.log(`[Caddy Ask] SSL Denied for: ${domain}`);
    res.status(404).send("Not authorized");
  } catch (error) {
    console.error("Check Domain Error:", error);
    res.status(500).send("Internal Error");
  }
});

export default router;
