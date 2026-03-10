import { Request, Response, NextFunction } from "express";
import dns from "dns";
import { verifyToken } from "../utils/pow.util";
// @ts-ignore
import ipRangeCheck from "ip-range-check";

// ─── Data Centers (AWS, Azure, GCP) ───────────────────────────────────────
const DATA_CENTER_RANGES = ["3.0.0.0/8", "52.0.0.0/8", "35.0.0.0/8", "34.0.0.0/8"];

// ─── Bots verificables por rDNS ────────────────────────────────────────────
const VERIFIED_BOTS = ["googlebot", "bingbot", "yahoo! slurp"];

// ─── Listas portadas de Marketing-CL ──────────────────────────────────────
const KNOWN_SEARCH_BOTS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider", "yandexbot",
  "sogou", "exabot", "facebookexternalhit", "facebot", "facebookbot",
  "tiktokbot", "bytedance", "byteamp", "adsbot-google", "twitterbot",
  "linkedinbot", "pinterest", "redditbot", "discordbot", "telegrambot",
  "semrushbot", "ahrefsbot", "mj12bot", "ccbot", "dotbot", "qwantify",
  "screaming frog", "petalbot",
];
const GENERIC_BOT_TOKENS = [
  "crawler", "spider", "fetch", "httpclient", "apache-httpclient", "libwww",
  "python-requests", "axios/", "curl/", "wget", "go-http", "java/",
  "scrapy", "node-fetch", "perl", "php", "httpx",
];
const HEADLESS_HINTS = ["headlesschrome", "puppeteer", "playwright", "phantomjs"];
const SOCIAL_TOKENS = ["tiktok", "instagram", "fb_iab", "fban", "fbav", "threads", "musically", "snapchat", "line", "whatsapp"];
const META_TOKENS = ["instagram", "threads"];

export const botShieldAvanzado = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 0. EXCLUSIONES
  if (
    req.path.startsWith("/challenge") ||
    req.path.startsWith("/safe") ||
    req.path.startsWith("/api/") ||
    req.path.includes("favicon")
  ) {
    return next();
  }

  // 1. PASE VIP (PoW ya resuelto)
  const powCookie = req.cookies["pow_session"];
  const ip = req.ip || req.connection.remoteAddress || "";
  if (powCookie && verifyToken(powCookie, String(ip))) {
    return next();
  }

  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const h = req.headers;

  // ── 2. SCORING ──────────────────────────────────────────────────────────
  let score = 0;
  if (KNOWN_SEARCH_BOTS.some(t => ua.includes(t))) score += 5;
  if (GENERIC_BOT_TOKENS.some(t => ua.includes(t))) score += 3;
  if (HEADLESS_HINTS.some(t => ua.includes(t))) score += 5;
  if (!ua || ua.length < 10) score += 2;
  if (!h["accept-language"]) score += 2;
  if (!h["upgrade-insecure-requests"]) score += 1;

  // ── 3. DETECCIÓN DISPOSITIVO Y APPS SOCIALES (portado de Marketing-CL) ──
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isCleanSafari = /version\/.*safari/.test(ua);
  const isExternalBrowser = /brave|chrome|crios|fxios|edgios|firefox|opera/.test(ua);

  const isIOSInApp = isIOS && !isCleanSafari && !isExternalBrowser;
  const isAndroidWebView = isAndroid && /wv/.test(ua);

  const isSocialApp =
    SOCIAL_TOKENS.some(t => ua.includes(t)) ||
    String(h["x-requested-with"] || "").includes("musically") ||
    String(h["x-requested-with"] || "").includes("facebook") ||
    isIOSInApp ||
    isAndroidWebView;

  // 🔒 Instagram/Threads — tienen escáner de source code, bypass especial
  const isInstagramThreads =
    META_TOKENS.some(t => ua.includes(t)) ||
    String(h["x-ig-app-id"] || "").length > 0 ||
    String(h["x-ig-device-id"] || "").length > 0;

  // Inyectar flags para gate.routes.ts
  (req as any).isMobile = isIOS || isAndroid;
  (req as any).isSocialApp = isSocialApp;
  (req as any).isInstagramThreads = isInstagramThreads;

  // ── 4. SOCIAL APPS → dejar pasar con flag (frontend muestra overlay) ───
  if (isSocialApp || isInstagramThreads) {
    if (ua.includes("facebookexternalhit")) {
      return res.redirect(302, "/safe");
    }
    return next();
  }

  // ── 5. DATA CENTERS ──────────────────────────────────────────────────────
  if (ipRangeCheck(ip, DATA_CENTER_RANGES)) {
    score += 4;
  }

  // ── 6. rDNS PARA BOTS CONOCIDOS ──────────────────────────────────────────
  if (VERIFIED_BOTS.some(bot => ua.includes(bot))) {
    try {
      await dns.promises.reverse(ip as string);
    } catch {
      // ignore
    }
    return res.redirect(302, "/safe");
  }

  // ── 7. DECISIÓN FINAL ────────────────────────────────────────────────────
  if (score >= 8) {
    console.log(`[BotShield] BLOCK (score ${score}): ${ip} - ${ua.slice(0, 80)}`);
    return res.redirect(302, "/safe");
  }

  if (score >= 4) {
    console.log(`[BotShield] CHALLENGE (score ${score}): ${ip} - ${ua.slice(0, 80)}`);
    const back = encodeURIComponent(req.originalUrl || req.url || "/");
    return res.redirect(302, `/challenge?back=${back}`);
  }

  next();
};
