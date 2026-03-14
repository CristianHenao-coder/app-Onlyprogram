// traffic.service.ts
// Lógica portada directamente de Marketing-CL/src/core/middlewares/botShield.middleware.js
// Sin llamadas a API externas — todo análisis se hace internamente.

const KNOWN_SEARCH_BOTS = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
    'sogou', 'exabot', 'facebookexternalhit', 'facebot', 'facebookbot',
    'tiktokbot', 'bytedance', 'byteamp', 'adsbot-google', 'twitterbot',
    'linkedinbot', 'instagram', 'threads', 'pinterest', 'redditbot',
    'discordbot', 'telegrambot', 'semrushbot', 'ahrefsbot', 'mj12bot',
    'ccbot', 'dotbot', 'qwantify', 'screaming frog', 'petalbot',
];

const GENERIC_BOT_TOKENS = [
    'crawler', 'spider', 'bot', 'fetch', 'httpclient', 'apache-httpclient',
    'libwww', 'python-requests', 'axios/', 'curl/', 'wget', 'go-http', 'java/',
    'scrapy', 'node-fetch', 'perl', 'php', 'httpx',
];

const HEADLESS_HINTS = ['headlesschrome', 'puppeteer', 'playwright', 'phantomjs'];

const BOT_BLOCK_THRESHOLD = 10;
const BOT_CHALLENGE_THRESHOLD = 7;

const uaMatches = (list: string[], ua: string) => list.some(t => ua.includes(t));

export interface TrafficAnalysisResult {
    action: 'allow' | 'show_overlay' | 'block' | 'direct_redirect';
    type?: string;
    device?: 'ios' | 'android' | 'desktop';
    tier?: 'high' | 'low';
    flags?: Record<string, boolean>;
    score?: number;
}

export const TrafficService = {
    /**
     * Analiza el tráfico de un visitante internamente, sin llamadas externas.
     * Portado de Marketing-CL botShield.middleware.js
     */
    analyzeVisitor(userAgent: string, headers: Record<string, any>): TrafficAnalysisResult {
        const ua = String(userAgent || '').toLowerCase();
        const h = headers || {};

        // ── 1. SCORING DE BOT ──────────────────────────────────────────────
        let score = 0;
        if (uaMatches(KNOWN_SEARCH_BOTS, ua)) score += 5;
        if (uaMatches(GENERIC_BOT_TOKENS, ua)) score += 3;
        if (!ua || ua.length < 10) score += 2;
        if (!String(h['accept'] || '').includes('text/html')) score += 1;
        if (!h['accept-language']) score += 0.5;
        if (HEADLESS_HINTS.some(t => ua.includes(t))) score += 2;

        // ── 2. DETECCIÓN DE DISPOSITIVO ────────────────────────────────────
        const isIOS = /iphone|ipad|ipod/.test(ua);
        const isAndroid = /android/.test(ua);
        const device: 'ios' | 'android' | 'desktop' = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

        // ── 2.5 DETECCIÓN DE GAMA (Best Effort via UA) ─────────────────────
        // Gama alta Apple
        const isPremiumApple = /iphone|ipad/i.test(ua) && /os 16|os 17|os 18/i.test(ua);
        // Gama alta Android
        const isPremiumAndroid = /pro|ultra|max|s22|s23|s24|s25|fold|flip|pixel 7|pixel 8|pixel 9/i.test(ua);
        
        const tier: 'high' | 'low' = (isPremiumApple || isPremiumAndroid) ? 'high' : 'low';

        // iOS: Safari limpio tiene "Version/X Safari"
        const isCleanSafari = /version\/.*safari/.test(ua);
        const isExternalBrowser = /brave|chrome|crios|fxios|edgios|firefox|opera/.test(ua);

        // In-App: iOS en app sin Safari/Chrome externo
        const isIOSInApp = isIOS && !isCleanSafari && !isExternalBrowser;
        // In-App Android: WebView
        const isAndroidWebView = isAndroid && /wv/.test(ua);

        // ── 3. DETECCIÓN DE APPS SOCIALES ──────────────────────────────────
        const socialTokens = [
            'tiktok', 'instagram', 'fb_iab', 'fban', 'fbav',
            'threads', 'musically', 'snapchat', 'line', 'whatsapp', 'telegram',
        ];

        const isSocialApp =
            socialTokens.some(t => ua.includes(t)) ||
            String(h['x-requested-with'] || '').includes('musically') ||
            String(h['x-requested-with'] || '').includes('facebook') ||
            isIOSInApp ||
            isAndroidWebView;

        // ── 4. DETECCIÓN ESPECÍFICA INSTAGRAM / THREADS (META) ─────────────
        // Tienen scan de código fuente — requieren bypass especial
        const metaTokens = ['instagram', 'threads'];
        const isInstagramThreads =
            metaTokens.some(t => ua.includes(t.toLowerCase())) ||
            String(h['x-ig-app-id'] || '').length > 0 ||
            String(h['x-ig-device-id'] || '').length > 0;

        console.log(`[TrafficService] UA: ${ua.slice(0, 100)} | isSocial: ${isSocialApp} | isMeta: ${isInstagramThreads}`);

        // ── 5. DECISIÓN ─────────────────────────────────────────────────────
        // Bots sociales → mostrar overlay (no redirigir, dar instrucciones)
        if (isSocialApp || isInstagramThreads) {
            return {
                action: 'show_overlay',
                type: isInstagramThreads ? 'instagram_threads' : 'social_app',
                device,
                tier,
                flags: { isSocialApp, isInstagramThreads, isIOSInApp, isAndroidWebView },
                score,
            };
        }

        // Bots conocidos con score alto → bloquear
        if (score >= BOT_BLOCK_THRESHOLD) {
            return { action: 'block', type: 'known_bot', device, tier, score };
        }

        // Score medio → desafío (el frontend redirige al challenge)
        if (score >= BOT_CHALLENGE_THRESHOLD) {
            return { action: 'block', type: 'suspicious', device, tier, score };
        }

        return { action: 'allow', device, tier, score };
    },
};

