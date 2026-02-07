import axios from 'axios';

const CF_API_URL = 'https://api.cloudflare.com/client/v4';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const API_KEY = process.env.CLOUDFLARE_API_KEY?.trim();
const API_EMAIL = process.env.CLOUDFLARE_EMAIL?.trim();
const ZONE_ID_SAAS = process.env.CLOUDFLARE_ZONE_ID?.trim();



// Determinar headers de autenticación
const headers: any = {
    'Content-Type': 'application/json'
};

// Ignorar placeholder si el usuario no lo cambió
let validToken = API_TOKEN;
if (validToken && validToken.includes('your_cf_api_token')) {
    validToken = undefined;
}

if (validToken) {
    headers['Authorization'] = `Bearer ${validToken}`;
} else if (API_KEY && API_EMAIL) {
    headers['X-Auth-Key'] = API_KEY;
    headers['X-Auth-Email'] = API_EMAIL;
} else {
    console.warn("Cloudflare credentials missing (Token or Key+Email)");
}

// DEBUG: Verificar qué se está cargando (Solo primeros caracteres)
console.log(`[CF Debug] Account ID: ${ACCOUNT_ID ? ACCOUNT_ID.substring(0, 4) + '...' : 'MISSING'}`);
console.log(`[CF Debug] Auth Method: ${validToken ? 'Token' : (API_KEY ? 'Global Key' : 'None')}`);
if (API_EMAIL) console.log(`[CF Debug] Email: ${API_EMAIL}`);

const cfClient = axios.create({
    baseURL: CF_API_URL,
    headers: headers
});

export const cloudflareService = {
    /**
     * Busca disponibilidad de dominio y precios
     */
    async searchDomains(query: string) {
        if (!ACCOUNT_ID) throw new Error("CLOUDFLARE_ACCOUNT_ID not configured");
        // Endpoint real de Cloudflare Registrar (requiere permisos de Registrar)
        // Nota: Este endpoint puede variar según el plan. Usaremos el de "check" si existe o search integrador.
        // Documentación: GET /accounts/{account_identifier}/registrar/domains/search
        try {
            const response = await cfClient.post(`/accounts/${ACCOUNT_ID}/registrar/domains/search`, {
                query: query
            });
            return response.data;
        } catch (error: any) {
            const cfErrors = error.response?.data?.errors || [];
            const isAuthError = cfErrors.some((e: any) => e.code === 10000);

            console.error("CF Search Error:", error.response?.data || error.message);

            if (isAuthError) {
                // No lanzar error fatal para que el frontend pueda mostrar un mensaje amigable
                return {
                    success: false,
                    error_code: 'AUTH_ERROR',
                    message: "Cloudflare Authorization Failed. Check Payment Method or API Token Permissions."
                };
            }
            throw error;
        }
    },

    /**
     * Registra un dominio (COMPRA REAL)
     */
    async registerDomain(domain: string, years: number = 1) {
        if (!ACCOUNT_ID) throw new Error("CLOUDFLARE_ACCOUNT_ID not configured");
        try {
            const response = await cfClient.post(`/accounts/${ACCOUNT_ID}/registrar/domains/${domain}/register`, {
                years,
                auto_renew: true,
                privacy: true
            });
            return response.data;
        } catch (error: any) {
            console.error("CF Register Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 1. Configurar DNS automáticamente para apuntar a nuestro servidor
     * Se debe llamar después de que el dominio sea comprado y esté en la cuenta.
     */
    async configureDNS(zoneId: string) {
        // Obtenemos la IP del servidor o el CNAME target
        const TARGET = process.env.SERVER_IP || 'onlyprogramlink.com';

        try {
            // Crear registro A (@)
            await cfClient.post(`/zones/${zoneId}/dns_records`, {
                type: 'CNAME',
                name: '@', // Root
                content: TARGET,
                proxied: true, // ¡Importante! Activa la protección de Cloudflare
                ttl: 1
            });

            // Crear registro www
            await cfClient.post(`/zones/${zoneId}/dns_records`, {
                type: 'CNAME',
                name: 'www',
                content: TARGET,
                proxied: true,
                ttl: 1
            });

            return true;
        } catch (error: any) {
            console.error("CF DNS Error:", error.response?.data || error.message);
            // No lanzamos error fatal, puede que ya existan
            return false;
        }
    },

    /**
     * 2. Configurar "Cloudflare for SaaS" (Custom Hostname)
     * Esto permite que onlyprogramlink.com sirva tráfico para el dominio del cliente y gestione su SSL.
     */
    async addCustomHostname(customDomain: string) {
        if (!ZONE_ID_SAAS) throw new Error("CLOUDFLARE_ZONE_ID (SaaS) not configured");

        try {
            const response = await cfClient.post(`/zones/${ZONE_ID_SAAS}/custom_hostnames`, {
                hostname: customDomain,
                ssl: {
                    method: 'http',
                    type: 'dv'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error("CF Custom Hostname Error:", error.response?.data || error.message);
            throw error;
        }
    }
};

// Función de verificación de inicio (Auto-run)
(async () => {
    if (!validToken && (!API_KEY || !API_EMAIL)) return;
    try {
        console.log("[CF Debug] Verifying credentials with Cloudflare API...");
        // Endpoint /user/tokens/verify requiere Token. Endpoint /user requiere Key/Token.
        // Usamos /user/billing/profile si es posible, o /user para testear auth general.
        const res = await cfClient.get('/user');
        console.log(`[CF Debug] Auth Successful! Logged in as: ${res.data.result.email} (${res.data.result.id})`);
    } catch (error: any) {
        console.error(`[CF Debug] Auth FAILED:`, error.response?.data || error.message);
    }
})();
