import { Router, Request } from "express";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";
import * as geoip from "geoip-lite";
import * as crypto from "crypto";
import { parseUA } from "../utils/ua-parser";


const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// ─── BOT DETECTION ──────────────────────────────────────────
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /facebookexternalhit/i,
  /Twitterbot/i, /LinkedInBot/i, /WhatsApp/i, /Googlebot/i,
  /bingbot/i, /YandexBot/i, /DuckDuckBot/i, /Baiduspider/i,
  /python-requests/i, /axios/i, /curl/i, /wget/i, /Scrapy/i,
  /Go-http-client/i, /Java\/\d/i, /okhttp/i, /node-fetch/i,
];

function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // sin UA → bot
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

// ─── SOURCE INFERENCE ───────────────────────────────────────
function inferSource(referrer: string | undefined): string {
  if (!referrer) return "direct";
  const r = referrer.toLowerCase();
  if (r.includes("instagram.com")) return "instagram";
  if (r.includes("tiktok.com")) return "tiktok";
  if (r.includes("twitter.com") || r.includes("t.co")) return "twitter";
  if (r.includes("whatsapp.com") || r.includes("wa.me")) return "whatsapp";
  if (r.includes("facebook.com") || r.includes("fb.com")) return "facebook";
  if (r.includes("telegram")) return "telegram";
  if (r.includes("youtube.com")) return "youtube";
  if (r.includes("google.com")) return "google";
  if (r.includes("linktr.ee")) return "linktree";
  return "other";
}

// ─── IP HELPERS ─────────────────────────────────────────────
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }
  return req.socket?.remoteAddress || "";
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "onlyprogram_salt").digest("hex");
}

// ─── POST /api/analytics/event ──────────────────────────────
// Público (sin auth). Registra un click o page_view desde SmartLinkLanding.
router.post("/event", async (req: Request, res) => {
  try {
    const { link_id, button_id, button_type = "page_view", referrer } = req.body;

    if (!link_id) {
      return res.status(400).json({ error: "link_id requerido" });
    }

    const ua = (req.headers["user-agent"] || "").toString();
    const ip = getClientIp(req);
    const bot = isBot(ua);
    const ipHash = ip ? hashIp(ip) : null;
    const source = inferSource(referrer);

    // Geo lookup
    let countryCode: string | null = null;
    let countryName: string | null = null;
    let city: string | null = null;
    if (ip && !ip.startsWith("127.") && !ip.startsWith("::1") && !ip.startsWith("::ffff:127.")) {
      const geo = geoip.lookup(ip);
      if (geo) {
        countryCode = geo.country;
        city = geo.city || null;
        const regionNames = new Intl.DisplayNames(["es"], { type: "region" });
        try { countryName = regionNames.of(geo.country) || geo.country; } catch { countryName = geo.country; }
      }
    }

    const { os, browser, device } = parseUA(ua);

    const { error } = await supabase.from("link_events").insert({
      link_id,
      button_id: button_id || null,
      button_type,
      country_code: countryCode,
      country_name: countryName,
      city,
      os,
      browser,
      device,
      referrer: referrer || null,
      source,
      is_bot: bot,
      ip_hash: ipHash,
      user_agent: ua,
    });

    if (error) {
      console.error("Error inserting link_event:", error);
      return res.status(500).json({ error: "No se pudo registrar el evento" });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("analytics/event error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/overview ────────────────────────────
// Autenticado. Retorna el resumen agregado para el dashboard.
router.get("/overview", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt((req.query.days as string) || "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Obtener todos los link_ids del usuario
    const { data: userLinks, error: linksError } = await supabase
      .from("smart_links")
      .select("id, title, slug, photo, is_active")
      .eq("user_id", userId);

    if (linksError) throw linksError;
    if (!userLinks || userLinks.length === 0) {
      return res.json({ totalClicks: 0, totalUnique: 0, botsBlocked: 0, conversionRate: 0, countries: [], sources: [], byMonth: [], byButton: [], links: [], byOS: [], byBrowser: [], byDevice: [], hourlyHeatmap: [] });
    }

    const linkIds = userLinks.map((l: any) => l.id);

    // Obtener todos los eventos del período
    const { data: events, error: evError } = await supabase
      .from("link_events")
      .select("link_id, button_type, country_code, country_name, source, is_bot, ip_hash, created_at, os, browser, device")
      .in("link_id", linkIds)
      .gte("created_at", since);

    if (evError) throw evError;
    const evs = events || [];

    // Métricas globales
    const realClicks = evs.filter((e: any) => !e.is_bot && e.button_type !== "page_view");
    const pageViews = evs.filter((e: any) => !e.is_bot && e.button_type === "page_view");
    const bots = evs.filter((e: any) => e.is_bot);

    const totalClicks = realClicks.length;
    const botsBlocked = bots.length;
    const uniqueIps = new Set(realClicks.map((e: any) => e.ip_hash).filter(Boolean)).size;
    const conversionRate = pageViews.length > 0
      ? Math.round((realClicks.length / (pageViews.length + realClicks.length)) * 1000) / 10
      : 0;

    // Por país
    const countryMap: Record<string, { name: string; count: number }> = {};
    for (const e of realClicks) {
      if (!e.country_code) continue;
      if (!countryMap[e.country_code]) countryMap[e.country_code] = { name: e.country_name || e.country_code, count: 0 };
      countryMap[e.country_code].count++;
    }
    const countries = Object.entries(countryMap)
      .map(([code, v]) => ({ code, name: v.name, count: v.count, pct: totalClicks > 0 ? Math.round((v.count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Por fuente
    const sourceMap: Record<string, number> = {};
    for (const e of realClicks) {
      const s = e.source || "other";
      sourceMap[s] = (sourceMap[s] || 0) + 1;
    }
    const sources = Object.entries(sourceMap)
      .map(([name, count]) => ({ name, count, pct: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Por mes (últimos 12 meses)
    const monthMap: Record<string, number> = {};
    for (const e of realClicks) {
      const month = e.created_at.substring(0, 7); // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { label: monthLabels[d.getMonth()], value: monthMap[key] || 0 };
    });

    // Por tipo de botón
    const btnMap: Record<string, number> = {};
    for (const e of realClicks) {
      const t = e.button_type || "other";
      btnMap[t] = (btnMap[t] || 0) + 1;
    }
    const byButton = Object.entries(btnMap)
      .map(([type, count]) => ({ type, count, pct: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Por OS
    const osMap: Record<string, number> = {};
    for (const e of realClicks) {
      const os = e.os || "Other";
      osMap[os] = (osMap[os] || 0) + 1;
    }
    const byOS = Object.entries(osMap)
      .map(([name, count]) => ({ name, count, pct: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Por Navegador
    const browserMap: Record<string, number> = {};
    for (const e of realClicks) {
      const b = e.browser || "Other";
      browserMap[b] = (browserMap[b] || 0) + 1;
    }
    const byBrowser = Object.entries(browserMap)
      .map(([name, count]) => ({ name, count, pct: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Por Dispositivo
    const deviceMap: Record<string, number> = {};
    for (const e of realClicks) {
      const d = e.device || "desktop";
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    }
    const byDevice = Object.entries(deviceMap)
      .map(([name, count]) => ({ name, count, pct: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Heatmap por hora (0-23)
    const heatmapArr = Array(24).fill(0);
    for (const e of realClicks) {
      const hour = new Date(e.created_at).getHours();
      heatmapArr[hour]++;
    }
    const hourlyHeatmap = heatmapArr.map((count, hour) => ({ hour, count }));

    // Por link
    const links = userLinks.map((link: any) => {
      const linkClicks = realClicks.filter((e: any) => e.link_id === link.id);
      const linkUnique = new Set(linkClicks.map((e: any) => e.ip_hash).filter(Boolean)).size;
      return { ...link, clicks: linkClicks.length, unique_clicks: linkUnique };
    }).sort((a: any, b: any) => b.clicks - a.clicks);

    return res.json({
      totalClicks,
      totalUnique: uniqueIps,
      botsBlocked,
      conversionRate,
      countries,
      sources,
      byMonth,
      byButton,
      byOS,
      byBrowser,
      byDevice,
      hourlyHeatmap,
      links,
    });
  } catch (err: any) {
    console.error("analytics/overview error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/analytics/events ──────────────────────────────
// Autenticado. Eventos detallados (tabla), paginados.
router.get("/events", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt((req.query.days as string) || "30", 10);
    const linkId = req.query.link_id as string | undefined;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: userLinks } = await supabase
      .from("smart_links").select("id").eq("user_id", userId);
    const linkIds = (userLinks || []).map((l: any) => l.id);

    let q = supabase
      .from("link_events")
      .select("id, link_id, button_type, country_code, country_name, source, is_bot, created_at")
      .in("link_id", linkIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (linkId) q = q.eq("link_id", linkId);

    const { data, error } = await q;
    if (error) throw error;

    return res.json({ events: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
