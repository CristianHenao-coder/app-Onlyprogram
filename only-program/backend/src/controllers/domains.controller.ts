import { Request, Response } from 'express';
import { godaddyService } from '../services/godaddy.service';
import { cloudflareService } from '../services/cloudflare.service';
import { WompiService } from '../services/wompi.service';
import { supabase } from '../services/supabase.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const searchDomains = async (req: Request, res: Response) => {
    try {
        let { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const gdResult = await godaddyService.searchDomains(q);

        // Return single result in list for frontend compatibility
        res.json({
            success: true,
            result: [
                {
                    name: gdResult.domain,
                    available: gdResult.available,
                    price: gdResult.price,
                    currency: gdResult.currency
                }
            ]
        });

    } catch (error: any) {
        console.error("Search Domain Error:", error);
        res.status(500).json({ error: 'Error searching domains', details: error.message });
    }
};

export const buyDomain = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const { domain, token, acceptanceToken, email, amountUSD, linkId } = req.body;

        if (!domain || !token || !acceptanceToken || !email || !amountUSD) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Process Payment with Wompi
        let transaction;

        try {
            transaction = await WompiService.createTransaction({
                amountUSD,
                email,
                token,
                acceptanceToken,
                installments: 1
            });

            // Polling hasta confirmación
            if (transaction.status === 'PENDING') {
                for (let i = 0; i < 5; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const updatedTx: any = await WompiService.getTransaction(transaction.id);
                    if (updatedTx?.data) {
                        transaction = updatedTx.data;
                        if (transaction.status !== 'PENDING') break;
                    }
                }
            }
        } catch (paymentError: any) {
            console.error("Payment Failed:", paymentError);
            return res.status(402).json({ error: 'Payment failed', details: paymentError.message });
        }

        if (transaction.status !== 'APPROVED') {
            return res.status(402).json({ error: 'Payment declined', status: transaction.status });
        }

        console.log(`[Domain Buy] Payment APPROVED. Buying on GoDaddy...`);

        // 2. Register Domain via GoDaddy
        let registration;
        try {
            // Construct Contact Info (Disclaimer: Using generic info + user email for MVP)
            // GoDaddy requires full contact details.
            const contactInfo = {
                nameFirst: "OnlyProgram",
                nameLast: "User",
                addressMailing: {
                    address1: "Calle 123",
                    city: "Bogota",
                    state: "Cundinamarca",
                    postalCode: "110111",
                    country: "CO"
                },
                email: email,
                phone: "+57.3001234567",
                organization: "OnlyProgram User"
            };

            registration = await godaddyService.registerDomain(domain, contactInfo);

            // 2.5 Add DNS Zone in Cloudflare (Best Effort)
            // Even though we bought on GoDaddy, we want to control DNS in Cloudflare.
            // This requires adding the site to Cloudflare and getting nameservers.
            try {
                // TODO: This step requires user action to change NS in GoDaddy.
                // For now, we just register. The user will need to change NS manually 
                // or we implement GoDaddy NS update API later.
                console.log("Domain registered. Next step: Update Nameservers.");
            } catch (cfZoneError) {
                console.warn("Cloudflare Zone creation skipped:", cfZoneError);
            }

        } catch (gdError: any) {
            console.error("GoDaddy Registration Failed:", gdError);
            return res.status(500).json({
                error: 'Payment successful but Domain Registration failed.',
                paymentId: transaction.id,
                details: gdError.message
            });
        }

        // 3. Configure DNS (Point to our Server)
        const serverIP = process.env.SERVER_IP || '127.0.0.1'; // Default to fail-safe or dev
        // Only attempt DNS update if we have a real IP (not localhost for prod) or if user wants to test.
        if (process.env.SERVER_IP) {
            await godaddyService.updateDNS(domain, serverIP);
        } else {
            console.log("[Domain Buy] SERVER_IP not set in .env. Skipping automatic DNS update.");
        }

        // 4. Link to User Profile (Supabase)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (linkId && uuidRegex.test(linkId)) {
            console.log(`[Domain Buy] Linking domain ${domain} to SmartLink ID: ${linkId}`);
            const { error: dbError } = await supabase
                .from('smart_links')
                .update({
                    custom_domain: domain
                })
                .eq('id', linkId);

            if (dbError) {
                console.error("[Domain Buy] Failed to link domain to profile:", dbError);
                // Don't fail the request, but log it. User has the domain, we just missed the link.
            }
        }

        res.json({
            success: true,
            message: 'Domain purchased and linked successfully',
            data: registration,
            paymentId: transaction.id
        });

    } catch (error: any) {
        console.error("Critical Error buyDomain:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
