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

    // 1. Obtener Link con sus botones
    const { data: link, error } = await supabase
      .from("smart_links")
      .select(`
        *,
        smart_link_buttons (*)
      `)
      .eq("slug", slug)
      .single();

    // 1.5 ANALIZAR TRÁFICO (lógica interna portada de Marketing-CL)
    const userAgent = req.headers["user-agent"] || "";
    const trafficAnalysis = TrafficService.analyzeVisitor(
      userAgent,
      req.headers as Record<string, any>,
    );

    console.log(`[Gate] Traffic: ${slug} | Action: ${trafficAnalysis.action} | Type: ${trafficAnalysis.type} | UA: ${userAgent.slice(0, 50)}...`);

    if (error || !link) {
      // Si el link no existe, devolvemos info de tráfico cifrada de todos modos
      const payload = {
        error: "Node Offline",
        traffic: trafficAnalysis,
      };
      const secureData = Buffer.from(JSON.stringify(payload)).toString("base64");
      return res.status(404).json({ data: secureData, error: "Node Offline" });
    }

    // 2. Determinar destino (SOLO si está permitido)
    let targetUrl: string | null = null;
    const buttons: any[] = (link.smart_link_buttons || [])
      .filter((b: any) => b.is_active !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    // Determinar si algún botón relevante tiene el escudo activado
    const hasShieldEnabled = buttons.some(b =>
      (b.type === 'instagram' || b.type === 'tiktok') && b.meta_shield
    );

    // Si el escudo está activado y es una app social o Instagram Threads, forzar overlay
    let finalAction = trafficAnalysis.action;
    const isSocialOrMeta = trafficAnalysis.type === 'social_app' || trafficAnalysis.type === 'instagram_threads';

    if (hasShieldEnabled && isSocialOrMeta) {
      finalAction = 'show_overlay';
    }

    if (finalAction === "allow") {
      // Prioridad: onlyfans → custom → telegram (rotador o directo) → instagram → cualquiera
      const ofBtn = buttons.find(b => b.type === "onlyfans");
      const tgBtn = buttons.find(b => b.type === "telegram");
      const igBtn = buttons.find(b => b.type === "instagram");
      const firstBtn = buttons[0];

      if (ofBtn) {
        targetUrl = ofBtn.url;
      } else if (tgBtn) {
        // Si tiene rotador activo, usa la ruta de rotación del backend
        if (tgBtn.rotator_active) {
          const rotatedUrl = await telegramService.rotateLink(slug);
          targetUrl = rotatedUrl || tgBtn.url;
        } else {
          targetUrl = tgBtn.url;
        }
      } else if (igBtn) {
        targetUrl = igBtn.url;
      } else if (firstBtn) {
        targetUrl = firstBtn.url;
      }

      // Fallback a columnas legacy si no hay botones
      if (!targetUrl) {
        targetUrl = link.onlyfans || link.telegram || link.instagram || null;
      }
    }

    // 2.5 TRACKING DE CLICKS Y ESTADÍSTICAS
    try {
      const currentConfig = typeof link.config === 'string' ? JSON.parse(link.config) : (link.config || {});
      const stats = currentConfig.stats || { devices: { ios: 0, android: 0, desktop: 0 } };
      const device = trafficAnalysis.device || 'desktop';

      if (!stats.devices) stats.devices = { ios: 0, android: 0, desktop: 0 };
      stats.devices[device] = (stats.devices[device] || 0) + 1;

      await supabase.from('smart_links').update({
        clicks: (link.clicks || 0) + 1,
        config: { ...currentConfig, stats }
      }).eq('id', link.id);
    } catch (trackError) {
      console.error("Tracking Error:", trackError);
    }

    // 3. Cifrar la respuesta
    const payload = {
      u: targetUrl,
      ts: Date.now(),
      v: crypto
        .createHash("md5")
        .update(slug + "gate_secret")
        .digest("hex"),
      // Incluir decisión de tráfico refinada
      traffic: {
        ...trafficAnalysis,
        action: finalAction
      },
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

    // 1. Buscar Link (Normalizado)
    const normalizedDomain = domain
      .toLowerCase()
      .trim()
      .replace(/^www\./, "");

    const { data: link, error } = await supabase
      .from("smart_links")
      .select("*")
      .eq("custom_domain", normalizedDomain)
      .single();

    if (error || !link) {
      return res.status(404).json({ error: "Domain not linked" });
    }

    // 1.5 ANALIZAR TRÁFICO
    const userAgent = req.headers["user-agent"] || "";
    const trafficAnalysis = TrafficService.analyzeVisitor(
      userAgent,
      req.headers as Record<string, any>,
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

    // 2. Buscar en la base de datos de Smart Links (Normalizado)
    const normalizedDomain = domain
      .toLowerCase()
      .trim()
      .replace(/^www\./, "");

    const { data: link, error } = await supabase
      .from("smart_links")
      .select("id")
      .eq("custom_domain", normalizedDomain)
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
