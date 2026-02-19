import { Request, Response, NextFunction } from 'express';

export interface BotShieldRequest extends Request {
    isBot?: boolean;
    isSocialApp?: boolean;
    isMobile?: boolean; // Para diferenciar PC vs Móvil si se requiere lógica extra
}

export const botShield = (req: BotShieldRequest, res: Response, next: NextFunction) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();

    // 1. Detectores de Bots (Crawlers, Scrapers, Redes Sociales)
    const botList = [
        'bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit',
        'googlebot', 'bingbot', 'adsbot', 'twitterbot', 'whatsapp',
        'telegrambot', 'discordbot', 'slackbot', 'vkshare', 'w3c_validator',
        'semrush', 'mj12bot', 'ahrefsbot', 'dotbot', 'rogue'
    ];

    // 2. Detectores de Apps Sociales (WebViews In-App)
    // Estas apps abren links en su propio navegador interno limitado
    const socialApps = [
        'tiktok',      // TikTok
        'instagram',   // Instagram
        'fban',        // Facebook Android
        'fbav',        // Facebook iOS
        'line',        // Line
        'snapchat',    // Snapchat
        'micromessenger', // WeChat
        'twitter',     // Twitter App (a veces)
        'linkedin'     // LinkedIn App
    ];

    req.isBot = botList.some(bot => ua.includes(bot));
    req.isSocialApp = socialApps.some(app => ua.includes(app));

    // Detección básica de móvil para casos de desktop simulando móvil
    req.isMobile = /iphone|ipad|ipod|android/.test(ua);

    // Caso especial: iOS a veces no dice "instagram" explícito pero es WebKit sin Safari puro
    if ((ua.includes('iphone') || ua.includes('ipad')) && !ua.includes('safari') && !ua.includes('crios')) {
        // Es probable que sea un WebView
        // Pero cuidado con Chrome en iOS (CriOS). Lo excluimos arriba.
        req.isSocialApp = true;
    }

    // Si es un bot conocido de revisión de apps (Apple Bot, Google Review),
    // usualmente queremos mostrar la Safe Page.

    next();
};
