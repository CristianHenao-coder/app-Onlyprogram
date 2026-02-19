import { supabase } from '../services/supabase.service';

interface TelegramBot {
    id: number;
    url: string;
    clicks_current: number;
    smart_link_id: number;
}

interface SmartLink {
    id: number;
    current_bot_index: number;
    telegram_rotation_limit: number; // Mantenemos por compatibilidad, pero usaremos 1
}

export const telegramService = {
    /**
     * Obtiene el siguiente enlace de Telegram disponible usando Round Robin puro (1 a 1).
     * @param slug El slug del smart link.
     * @returns La URL del bot de Telegram seleccionado.
     */
    async rotateLink(slug: string): Promise<string | null> {
        try {
            // 1. Obtener el Link y su configuración de botones (JSON)
            const { data: link, error: linkError } = await supabase
                .from('smart_links')
                .select('id, buttons, current_bot_index')
                .eq('slug', slug)
                .single();

            if (linkError || !link) {
                console.error('Error fetching smart link:', linkError);
                return null;
            }

            // 2. Encontrar el botón de Telegram con rotador activo
            const buttons = Array.isArray(link.buttons) ? link.buttons : [];
            const telegramBtn = buttons.find((b: any) => b.type === 'telegram' && b.rotatorActive);

            if (!telegramBtn) {
                // Si no hay rotador, devolver el link principal del botón (si existe)
                const mainTelegramBtn = buttons.find((b: any) => b.type === 'telegram');
                return mainTelegramBtn?.url || null;
            }

            // 3. Obtener los links del rotador
            const rotatorLinks = Array.isArray(telegramBtn.rotatorLinks)
                ? telegramBtn.rotatorLinks.filter((url: string) => url && url.trim() !== '')
                : [];

            // Incluir el link principal como opción #1 si no está en la lista (o si se prefiere)
            const allOptions = rotatorLinks.length > 0 ? rotatorLinks : (telegramBtn.url ? [telegramBtn.url] : []);

            if (allOptions.length === 0) return null;

            // 4. Lógica ROUND ROBIN (Distribución 1 a 1)
            let currentIndex = link.current_bot_index || 0;
            if (currentIndex >= allOptions.length) currentIndex = 0;

            const selectedUrl = allOptions[currentIndex];

            // 5. Calcular el SIGUIENTE índice
            const nextIndex = (currentIndex + 1) % allOptions.length;

            // 6. Actualizar el índice en la BD
            await supabase
                .from('smart_links')
                .update({ current_bot_index: nextIndex })
                .eq('id', link.id);

            return selectedUrl;

        } catch (error) {
            console.error('Telegram Rotation Error:', error);
            return null;
        }
    }
};
