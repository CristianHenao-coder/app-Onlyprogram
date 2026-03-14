import { Router } from "express";
import { telegramService } from "../services/telegram.service";
import { supabase } from "../services/supabase.service";
import crypto from "crypto";
import * as geoip from "geoip-lite";
import { parseUA } from "../utils/ua-parser";

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
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || "";

    // 1. Obtener Link con sus botones
    const { data: link, error } = await supabase
      .from("smart_links")
      .select(`
        *,
        smart_link_buttons (*)
      `)
      .eq("slug", slug)
      .single();

    // 1.5 ANALIZAR TRÁFICO
    const trafficAnalysis = TrafficService.analyzeVisitor(
      userAgent,
      req.headers as Record<string, any>,
    );

    // 1.6 SEGURIDAD PREMIUM: GEO-BLOCKING
    const geo = geoip.lookup(ip);
    const visitorCountry = geo?.country || null;
    const securityConfig = link.security_config || {};
    const blockedCountries = Array.isArray(securityConfig.geoblocking) ? securityConfig.geoblocking : [];

    if (visitorCountry && blockedCountries.includes(visitorCountry)) {
      console.log(`[Gate] Geo-Blocked: ${slug} | Country: ${visitorCountry}`);
      const payload = {
        u: null,
        traffic: { ...trafficAnalysis, action: 'block', type: 'geo_blocked' }
      };
      return res.json({ data: Buffer.from(JSON.stringify(payload)).toString("base64") });
    }

    // 1.7 ANALIZAR DISPOSITIVO (UA Parser)
    const uaDetails = parseUA(userAgent);

    console.log(`[Gate] Traffic: ${slug} | Action: ${trafficAnalysis.action} | Device: ${uaDetails.device} | OS: ${uaDetails.os}`);

    // 1.8 Extraer configuración actual para leer el modo
    const currentConfig = typeof link.config === 'string' ? JSON.parse(link.config) : (link.config || {});
    const isDirectMode = currentConfig.landingMode === 'direct';

    // 2. Determinar destino (SOLO si está permitido)
    let targetUrl: string | null = null;
    let finalAction: string = trafficAnalysis.action;
    let finalType = trafficAnalysis.type;

    const isInstagramThreads = trafficAnalysis.type === 'instagram_threads';
    const isOtherSocial = trafficAnalysis.type === 'social_app';

    if (isDirectMode) {
      targetUrl = currentConfig.directUrl || null;

      // 2.1 SMART REDIRECTION (Device-based)
      const deviceRedirections = securityConfig.device_redirections || {};
      const deviceKey = uaDetails.device === 'desktop' ? 'desktop' : (uaDetails.os === 'iOS' ? 'ios' : 'android');

      if (deviceRedirections[deviceKey]) {
        targetUrl = deviceRedirections[deviceKey];
        console.log(`[Gate] Device-Redirect: ${slug} | Device: ${deviceKey} | URL: ${targetUrl}`);
      }

      if (isInstagramThreads) {
        // META BYPASS: Force external browser
        finalAction = 'meta_bypass';
        finalType = 'instagram_threads';
        // Hide the actual URL, provide an internal safe route
        targetUrl = `${req.protocol}://${req.get('host')}/api/gate/unlock/${slug}`;
      } else if (isOtherSocial) {
        finalAction = 'show_overlay';
        finalType = 'social_app';
      } else {
        finalAction = 'direct_redirect';
      }
    } else {
      const buttons: any[] = (link.smart_link_buttons || [])
        .filter((b: any) => b.is_active !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const hasShieldEnabled = securityConfig.meta_shield === true || buttons.some(b => b.meta_shield === true);

      if (isInstagramThreads) {
        if (hasShieldEnabled) {
          finalAction = 'meta_bypass';
          finalType = 'instagram_threads';
          // Hide actual URLs completely for Meta
          targetUrl = `${req.protocol}://${req.get('host')}/api/gate/unlock/${slug}`;
        } else {
          finalAction = 'show_overlay';
          finalType = 'upgrade_required';
        }
      } else if (isOtherSocial) {
        if (hasShieldEnabled) {
          finalAction = 'show_overlay';
          finalType = 'social_app';
        } else {
          finalAction = 'show_overlay';
          finalType = 'upgrade_required';
        }
      }

      // If not Meta Bypass (where we already set Safe URL), determine the actual button target
      if (finalAction !== 'meta_bypass') {
        // PRIORIDAD: onlyfans → custom → telegram (rotador o directo) → instagram → cualquiera
        const ofBtn = buttons.find((b) => b.type === "onlyfans");
        const tgBtn = buttons.find((b) => b.type === "telegram");
        const igBtn = buttons.find((b) => b.type === "instagram");
        const firstBtn = buttons[0];

        let selectedBtn = ofBtn || tgBtn || igBtn || firstBtn;

        if (selectedBtn) {
          targetUrl = selectedBtn.url;

          // Aplicar targeting por gama si existe el link específico
          const redirects = selectedBtn.device_redirects || selectedBtn.deviceRedirects;
          if (redirects && Object.keys(redirects).length > 0) {
            // ios representa "Gama Alta" y android "Gama Baja" en la DB
            if (trafficAnalysis.tier === 'high' && redirects.ios) {
              targetUrl = redirects.ios;
            } else if (trafficAnalysis.tier === 'low' && redirects.android) {
              targetUrl = redirects.android;
            }
          }
        }

        // Fallback a columnas legacy si no hay botones
        if (!targetUrl) {
          targetUrl = link.onlyfans || link.telegram || link.instagram || null;
        }
      }
    }

    console.log(`[Gate] Final Decision: ${slug} | Action: ${finalAction} | Type: ${finalType} | Direct: ${isDirectMode}`);

    // 2.5 TRACKING DE CLICKS Y ESTADÍSTICAS
    try {
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
        action: finalAction,
        type: finalType
      },
    };

    const secureData = Buffer.from(JSON.stringify(payload)).toString("base64");

    res.json({ data: secureData });
  } catch (error) {
    console.error("Gate API Error:", error);
    res.status(500).json({ s: "error" });
  }
});

// --- RUTA 2.5: UNLOCK GATE PARA META BYPASS (/api/gate/unlock/:slug) ---
// Resuelve el destino final desde el servidor y redirige, ocultando el target al escáner.
router.get("/api/gate/unlock/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: link, error } = await supabase
      .from("smart_links")
      .select(`
        *,
        smart_link_buttons (*)
      `)
      .eq("slug", slug)
      .single();

    if (error || !link) {
      return res.status(404).send("Enlace no encontrado");
    }

    const currentConfig = typeof link.config === 'string' ? JSON.parse(link.config) : (link.config || {});
    const isDirectMode = currentConfig.landingMode === 'direct';
    let targetUrl: string | null = null;

    if (isDirectMode) {
      targetUrl = currentConfig.directUrl || null;
    } else {
      const buttons: any[] = (link.smart_link_buttons || [])
        .filter((b: any) => b.is_active !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const ofBtn = buttons.find((b) => b.type === "onlyfans");
      const tgBtn = buttons.find((b) => b.type === "telegram");
      const igBtn = buttons.find((b) => b.type === "instagram");
      const firstBtn = buttons[0];
      const selectedBtn = ofBtn || tgBtn || igBtn || firstBtn;

      if (selectedBtn) {
        targetUrl = selectedBtn.url;
      } else {
        targetUrl = link.onlyfans || link.telegram || link.instagram || null;
      }
    }

    if (targetUrl) {
      res.redirect(targetUrl);
    } else {
      res.status(404).send("Destino no configurado");
    }
  } catch (error) {
    console.error("Unlock Gate Error:", error);
    res.status(500).send("Error de sistema");
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
