import { Request, Response, NextFunction } from 'express';
import dns from 'dns';
import { verifyToken } from '../utils/pow.util';
// @ts-ignore
import ipRangeCheck from 'ip-range-check';

// --- CONFIGURACIÓN DE RANGOS IP DE DATA CENTERS (AWS, AZURE, GCP) ---
// Estos rangos suelen ser usados por VPNs, Proxies y Bots baratos.
// En producción idealmente se cargan de una lista actualizada o DB.
const DATA_CENTER_RANGES = [
    // Ejemplo simplificado. En producción usar librería completa o API externa
    '3.0.0.0/8', '52.0.0.0/8', '35.0.0.0/8', '34.0.0.0/8'
];

// --- LISTA DE BOTS VÁLIDOS QUE REQUIEREN VERIFICACIÓN RDNS ---
const VERIFIED_BOTS = ['googlebot', 'bingbot', 'yahoo! slurp'];

export const botShieldAvanzado = async (req: Request, res: Response, next: NextFunction) => {
    // 0. EXCLUSIONES (Rutas que no requieren escudo o son estáticas)
    if (req.path.startsWith('/challenge') || req.path.startsWith('/safe') || req.path.includes('favicon')) {
        return next();
    }

    // 1. VERIFICACIÓN DE PASE VIP (Cookie de PoW Resuelto)
    const powCookie = req.cookies['pow_session'];
    const ip = req.ip || req.connection.remoteAddress || '';

    if (powCookie && verifyToken(powCookie, String(ip))) {
        // Usuario ya resolvió el desafío matemático recientemente. Pase VIP.
        return next();
    }

    const ua = (req.headers['user-agent'] || '').toLowerCase();

    // 2. ANÁLISIS DE HEURÍSTICA Y ANOMALÍAS (Heredado del legado)
    let score = 0;

    // Bots conocidos básicos
    if (ua.includes('bot') || ua.includes('crawl') || ua.includes('spider')) score += 3;
    if (ua.includes('headless')) score += 5;

    // Falta de headers típicos de navegador
    if (!req.headers['accept-language']) score += 2;
    if (!req.headers['upgrade-insecure-requests']) score += 1;

    // Social Apps (WebViews) - Cloaking Inmediato
    if (/tiktok|instagram|fb_iab|fban|fbav/.test(ua)) {
        // Marcamos para Overlay en Frontend, pero dejamos pasar
        // Ojo: Si es el CRAWLER de FB (facebookexternalhit), lo bloqueamos
        if (ua.includes('facebookexternalhit')) {
            return res.redirect(302, '/safe'); // Manda a Safe Page
        }
        (req as any).isSocialApp = true;
        return next();
    }

    // 3. VERIFICACIÓN DE IP (DATA CENTERS)
    // Si la IP viene de un Data Center conocido (AWS, etc), es sospechoso
    // Los usuarios reales vienen de ISPs residenciales/móviles.
    if (ipRangeCheck(ip, DATA_CENTER_RANGES)) {
        score += 4;
    }

    // 4. VERIFICACIÓN REVERSE DNS (Solo para "Googlebot" y similares)
    // Si dice ser Googlebot, verifiquemos que la IP sea de Google.
    if (VERIFIED_BOTS.some(bot => ua.includes(bot))) {
        try {
            const hostnames = await dns.promises.reverse(ip as string);
            const isValid = hostnames.some(h => h.endsWith('.googlebot.com') || h.endsWith('.google.com') || h.endsWith('.search.msn.com'));

            if (!isValid) {
                // MENTIROSO: Dice ser Googlebot pero no tiene DNS inversa de Google. BLOQUEAR.
                console.log(`[BotShield] Fake Bot Detected: ${ip} claiming to be ${ua}`);
                return res.redirect(302, '/safe');
            } else {
                // ES REAL: Dejar pasar (o mandar a Safe Page si queremos ocultarnos de Google también)
                // Usualmente a Google le mostramos Safe Page para que indexe contenido "blanco".
                return res.redirect(302, '/safe');
            }
        } catch (error) {
            // Si falla el RDNS, asumimos fake por seguridad
            return res.redirect(302, '/safe');
        }
    }

    // 5. DECISIÓN FINAL: DESAFÍO O BLOQUEO
    // Si el score es sospechoso (> 2) pero no confirmado bot malicioso, le damos el beneficio de la duda, pero le hacemos trabajar (Proof of Work).
    if (score >= 3) {
        console.log(`[BotShield] Challenging Suspicious Client (${score}): ${ip} - ${ua}`);
        const back = encodeURIComponent(req.originalUrl || req.url || '/');
        return res.redirect(302, `/challenge?back=${back}`);
    }

    next();
};