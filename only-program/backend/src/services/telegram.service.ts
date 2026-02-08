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
            // 1. Obtener el Link y su configuración
            const { data: link, error: linkError } = await supabase
                .from('smart_links')
                .select('id, current_bot_index')
                .eq('slug', slug)
                .single();

            if (linkError || !link) {
                console.error('Error fetching smart link:', linkError);
                return null;
            }

            // 2. Obtener los Bots asociados
            const { data: bots, error: botsError } = await supabase
                .from('telegram_bots')
                .select('*')
                .eq('smart_link_id', link.id)
                .order('id', { ascending: true }); // Orden consistente es crucial para RR

            if (botsError || !bots || bots.length === 0) {
                return null;
            }

            // 3. Lógica ROUND ROBIN (Distribución 1 a 1)
            // Seleccionamos el bot actual basado en el índice guardado
            let currentIndex = link.current_bot_index;

            // Validación de índice (por si borraron bots y el índice quedó fuera de rango)
            if (currentIndex >= bots.length || currentIndex < 0) {
                currentIndex = 0;
            }

            const selectedBot = bots[currentIndex];

            // 4. Calcular el SIGUIENTE índice para la próxima vez
            const nextIndex = (currentIndex + 1) % bots.length;

            // 5. Actualizar contadores y el índice en la BD (Fuego y olvido para rapidez, o await si consistencia estricta)
            await Promise.all([
                // Aumentar clicks del bot seleccionado
                supabase
                    .from('telegram_bots')
                    .update({ clicks_current: (selectedBot.clicks_current || 0) + 1 })
                    .eq('id', selectedBot.id),

                // Mover el puntero al siguiente bot
                supabase
                    .from('smart_links')
                    .update({ current_bot_index: nextIndex })
                    .eq('id', link.id)
            ]);

            return selectedBot.url;

        } catch (error) {
            console.error('Telegram Rotation Error:', error);
            return null;
        }
    }
};
