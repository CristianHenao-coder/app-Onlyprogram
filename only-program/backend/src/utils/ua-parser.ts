export interface UAParserResult {
    os: string;
    browser: string;
    device: 'mobile' | 'tablet' | 'desktop';
    isSocial: boolean;
}

export const parseUA = (userAgent: string): UAParserResult => {
    const ua = (userAgent || '').toLowerCase();

    // 1. Detect OS
    let os = 'Unknown';
    if (/iphone|ipad|ipod/.test(ua)) os = 'iOS';
    else if (/android/.test(ua)) os = 'Android';
    else if (/windows/.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/.test(ua)) os = 'macOS';
    else if (/linux/.test(ua)) os = 'Linux';

    // 2. Detect Device Type
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/tablet|ipad|playbook|silk/.test(ua)) device = 'tablet';
    else if (/mobile|iphone|ipod|android.*mobile/.test(ua)) device = 'mobile';

    // 3. Detect Browser & Social Apps
    let browser = 'Other';
    let isSocial = false;

    if (ua.includes('instagram')) {
        browser = 'Instagram App';
        isSocial = true;
    } else if (ua.includes('tiktok') || ua.includes('musically')) {
        browser = 'TikTok App';
        isSocial = true;
    } else if (ua.includes('telegram')) {
        browser = 'Telegram App';
        isSocial = true;
    } else if (ua.includes('fb_iab') || ua.includes('fbav')) {
        browser = 'Facebook App';
        isSocial = true;
    } else if (ua.includes('threads')) {
        browser = 'Threads App';
        isSocial = true;
    } else if (ua.includes('whatsapp')) {
        browser = 'WhatsApp';
        isSocial = true;
    } else if (ua.includes('chrome') || ua.includes('crios')) {
        browser = 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'Safari';
    } else if (ua.includes('firefox') || ua.includes('fxios')) {
        browser = 'Firefox';
    } else if (ua.includes('edg')) {
        browser = 'Edge';
    }

    return { os, browser, device, isSocial };
};
