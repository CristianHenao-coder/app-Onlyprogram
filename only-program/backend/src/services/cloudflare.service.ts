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
        try {
            // Note: Using POST /search often yields better results for availability check than GET in some CF API versions
            // But standard Registrar API is GET /accounts/{id}/registrar/domains/search
            // Returning to POST as GET returned 404.
            // "You are not authorized" usually means missing Payment Method in Cloudflare account.
            const response = await cfClient.post(`/accounts/${ACCOUNT_ID}/registrar/domains/search`, {
                query: query
            });
            return response.data;
        } catch (error: any) {
            console.error("CF Search Error:", error.response?.data || error.message);

            // Check for Code 10000 (Unauthorized/Billing) - THROW IT so Controller handles it
            const isAuthError = error.response?.data?.errors?.some((e: any) => e.code === 10000);
            if (isAuthError) {
                throw {
                    code: 10000,
                    message: "Cloudflare Unauthorized: Billing/Payment method required or API permissions missing.",
                    details: error.response?.data
                };
            }

            return { result: [] }; // Keep fallback for other random network errors
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

        // VERIFY BILLING PROFILE
        console.log("[CF Debug] Verifying Billing Profile...");
        try {
            const billingRes = await cfClient.get(`/accounts/${ACCOUNT_ID}/billing/profile`);
            const billing = billingRes.data.result;
            if (billing) {
                console.log(`✅ [CF Debug] Billing Profile Access OK.`);
                // Some APIs return payment_gateway or similar fields
                console.log(`   - Payment Gateway: ${billing.payment_gateway || 'Unknown'}`);
                console.log(`   - Card Details: ${billing.card_details ? 'Present' : 'Not visible via API'}`);
            }
        } catch (billingError: any) {
            console.warn(`⚠️ [CF Debug] Could not access Billing Profile: ${billingError.response?.data?.errors?.[0]?.message || billingError.message}`);
            console.warn(`   (This confirms that the API Key lacks 'Billing' permissions or the account has no billing set up)`);
        }

    } catch (error: any) {
        console.error(`[CF Debug] Auth FAILED:`, error.response?.data || error.message);
    }
})();
