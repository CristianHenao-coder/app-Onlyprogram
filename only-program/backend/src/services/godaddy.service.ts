import axios from 'axios';
import { config as env } from '../config/env';

const GODADDY_API_URL = env.godaddy.env === 'PROD'
    ? 'https://api.godaddy.com'
    : 'https://api.ote-godaddy.com';

const godaddyClient = axios.create({
    baseURL: GODADDY_API_URL,
    headers: {
        'Authorization': `sso-key ${env.godaddy.apiKey}:${env.godaddy.apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export const godaddyService = {
    /**
     * Search for domain availability
     */
    async searchDomains(query: string) {
        // Strict cleanup + .com enforcement
        let domain = query.toLowerCase().trim();
        domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');

        if (!domain.includes('.')) {
            domain += '.com';
        } else if (!domain.endsWith('.com')) {
            // For now, strict .com enforcement as per plan
            return {
                available: false,
                price: 0,
                currency: 'USD',
                domain: domain,
                error: 'Solo se permiten dominios .com'
            };
        }

        try {
            console.log(`[GoDaddy] Checking availability for: ${domain} (${env.godaddy.env})`);

            // GoDaddy API: GET /v1/domains/available?domain=example.com
            const response = await godaddyClient.get('/v1/domains/available', {
                params: {
                    domain: domain,
                    checkType: 'FAST',
                    forTransfer: false
                }
            });

            const data = response.data;
            console.log("[GoDaddy] Search Result:", JSON.stringify(data, null, 2));

            if (data.available) {
                const price = data.price ? data.price / 1000000 : 15.00; // Fallback if missing
                return {
                    available: true,
                    domain: data.domain,
                    price: price,
                    currency: data.currency || 'USD'
                };
            } else {
                return {
                    available: false,
                    domain: data.domain,
                    error: 'Dominio no disponible'
                };
            }

        } catch (error: any) {
            console.error("[GoDaddy] Search Error:", error.response?.data || error.message);
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error("Error de autorización con GoDaddy. Verifica las credenciales.");
            }
            throw new Error(error.response?.data?.message || "Error al buscar dominio en GoDaddy");
        }
    },

    /**
     * Purchase a domain
     */
    async registerDomain(domain: string, contactInfo: any) {
        try {
            console.log(`[GoDaddy] Attempting purchase for: ${domain}`);

            const purchasePayload = {
                domain: domain,
                consent: {
                    agreementKeys: ["DNRA"],
                    agreedBy: "OnlyProgram User",
                    agreedAt: new Date().toISOString()
                },
                period: 1,
                renewAuto: true,
                contactAdmin: contactInfo,
                contactBilling: contactInfo,
                contactRegistrant: contactInfo,
                contactTech: contactInfo
            };

            const response = await godaddyClient.post('/v1/domains/purchase', purchasePayload);

            console.log("[GoDaddy] Purchase Success:", response.data);
            return response.data;

        } catch (error: any) {
            console.error("[GoDaddy] Purchase Error:", JSON.stringify(error.response?.data || error.message, null, 2));
            const msg = error.response?.data?.message || error.message;
            const code = error.response?.data?.code;
            throw new Error(`GoDaddy Purchase Failed: ${msg} (${code})`);
        }
    },

    /**
     * Update DNS Records (Point to Server IP)
     */
    async updateDNS(domain: string, ipAddress: string) {
        try {
            console.log(`[GoDaddy] Updating DNS for ${domain} to point to ${ipAddress}`);

            await godaddyClient.put(`/v1/domains/${domain}/records/A/@`, [
                { data: ipAddress, ttl: 600 }
            ]);

            console.log(`[GoDaddy] DNS Updated successfully for ${domain}`);
            return true;
        } catch (error: any) {
            console.error("[GoDaddy] DNS Update Error:", error.response?.data || error.message);
            return false;
        }
    }
};
