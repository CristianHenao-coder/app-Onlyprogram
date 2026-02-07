import { Router } from 'express';
import { telegramService } from '../services/telegram.service';
import { supabase } from '../services/supabase.service';
import crypto from 'crypto';

const router = Router();

// --- RUTA 1: ROTACIÓN PÚBLICA DE TELEGRAM (/t/:slug) ---
// Esta ruta redirige directamente al siguiente bot disponible.
// Útil para botones directos "Telegram" en la landing.
router.get('/t/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Usamos el servicio de rotación Round Robin
        const botUrl = await telegramService.rotateLink(slug);

        if (botUrl) {
            // Redirección directa al bot
            return res.redirect(botUrl);
        } else {
            // Si no hay bots o link inválido, redirigir a un fallback o error
            // TODO: Configurar URL de fallback global o por usuario
            return res.status(404).send('Enlace no disponible temporalmente');
        }
    } catch (error) {
        console.error('Gate /t/ Error:', error);
        res.status(500).send('Error interno');
    }
});

// --- RUTA 2: API GATE SEGURA (/api/gate/:slug) ---
// Esta ruta es consumida por la página de carga "LoadingPage".
// Devuelve el destino final CIFRADO para evitar que los bots lo lean fácil.
router.get('/api/gate/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // 1. Obtener Link
        const { data: link, error } = await supabase
            .from('smart_links')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !link) {
            return res.status(404).json({ error: 'Node Offline' });
        }

        // 2. Determinar destino (Prioridad: OnlyFans > Telegram > Instagram)
        // La lógica de negocio puede variar, aquí asumimos que el "Gate" principal es para contenido de pago (OF)
        // Si el usuario pidió Telegram, debería haber usado /t/:slug
        let targetUrl = link.onlyfans || link.telegram || link.instagram;

        // Si es OnlyFans, aplicamos lógica de DeepLink si fuera necesario (opcional)
        // Por ahora simplificamos devolviendo la URL directa.

        // 3. Cifrar la respuesta (Obfuscation simple)
        // Esto evita que un curl simple vea la URL en texto plano
        const payload = {
            u: targetUrl,
            ts: Date.now(),
            // Firma simple para validar integridad en cliente si se desea
            v: crypto.createHash('md5').update(slug + 'gate_secret').digest('hex')
        };

        const secureData = Buffer.from(JSON.stringify(payload)).toString('base64');

        // Devolvemos la data cifrada
        res.json({ data: secureData });

    } catch (error) {
        console.error('Gate API Error:', error);
        res.status(500).json({ s: 'error' });
    }
});

// --- RUTA 3: RESOLUCIÓN POR DOMINIO (/api/gate/domain/:domain) ---
// Usada por el frontend para saber qué Link cargar cuando se entra por custom domain.
router.get('/api/gate/domain/:domain', async (req, res) => {
    try {
        const { domain } = req.params;

        // 1. Buscar Link por custom_domain
        const { data: link, error } = await supabase
            .from('smart_links')
            .select('*')
            .eq('custom_domain', domain)
            .single();

        if (error || !link) {
            return res.status(404).json({ error: 'Domain not linked' });
        }

        // 2. Devolver la info necesaria para renderizar el perfil (slug o data completa)
        // Por seguridad, devolvemos el slug y dejamos que el frontend use las rutas existentes,
        // o devolvemos la data cifrada igual que arriba si queremos consistencia.
        // Para simplificar integración con SmartLinkLanding, devolvemos el slug.
        res.json({ slug: link.slug });

    } catch (error) {
        console.error('Gate Domain Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
