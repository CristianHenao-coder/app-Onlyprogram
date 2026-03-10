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
    telegram_rotation_limit: number;
    telegram_max_capacity: number;
    telegram: string | null;
    buttons: any[];
}

export const telegramService = {
    /**
     * Rotación de Telegram con soporte de capacidad máxima.
     * 
     * Orden de fuentes:
     *   1. Tabla `telegram_bots` (modelo del dashboard de usuario)
     *   2. buttons[].rotatorLinks (legado JSON)
     * 
     * Portado de Marketing-CL telegram.controller.js#handleRotation
     */
    async rotateLink(slug: string): Promise<string | null> {
        try {
            // 1. Obtener link
            const { data: link, error: linkError } = await supabase
                .from('smart_links')
                .select('id, current_bot_index, telegram_rotation_limit, telegram_max_capacity, telegram, buttons')
                .eq('slug', slug)
                .single<SmartLink>();

            if (linkError || !link) {
                console.error('[TelegramService] Link not found:', slug);
                return null;
            }

            const maxCapacity = link.telegram_max_capacity || 2000;
            const batchLimit = link.telegram_rotation_limit || 1;

            // ── Fuente 1: tabla telegram_bots ──────────────────────────────
            const { data: bots } = await supabase
                .from('telegram_bots')
                .select('id, url, clicks_current')
                .eq('smart_link_id', link.id)
                .order('id', { ascending: true });

            if (bots && bots.length > 0) {
                return await this._rotateFromBots(link, bots as TelegramBot[], maxCapacity, batchLimit);
            }

            // ── Fuente 2: link.telegram estático o buttons[].rotatorLinks ──
            const buttons = Array.isArray(link.buttons) ? link.buttons : [];
            const telegramBtn = buttons.find((b: any) => b.type === 'telegram' && b.rotatorActive);

            if (telegramBtn) {
                const rotatorLinks: string[] = Array.isArray(telegramBtn.rotatorLinks)
                    ? telegramBtn.rotatorLinks.filter((u: string) => u && u.trim() !== '')
                    : [];

                const allOptions = rotatorLinks.length > 0 ? rotatorLinks : (telegramBtn.url ? [telegramBtn.url] : []);

                if (allOptions.length > 0) {
                    return await this._rotateFromArray(link, allOptions, maxCapacity, batchLimit);
                }
            }

            // Fallback: link de Telegram estático del link
            if (link.telegram) return link.telegram;

            return null;

        } catch (error) {
            console.error('[TelegramService] Rotation Error:', error);
            return null;
        }
    },

    /** Rotación usando tabla `telegram_bots` (con clicks_current individualizado) */
    async _rotateFromBots(
        link: SmartLink,
        bots: TelegramBot[],
        maxCapacity: number,
        batchLimit: number,
    ): Promise<string | null> {
        let currentIndex = link.current_bot_index || 0;
        if (currentIndex >= bots.length) currentIndex = 0;

        // Buscar bot disponible (no lleno)
        let attempts = 0;
        while (bots[currentIndex].clicks_current >= maxCapacity && attempts < bots.length) {
            currentIndex = (currentIndex + 1) % bots.length;
            attempts++;
        }

        const currentBot = bots[currentIndex];

        // Si todos están llenos, redirige al actual de todos modos
        if (currentBot.clicks_current >= maxCapacity) {
            console.warn(`[TelegramService] Todos los bots de ${link.id} están llenos (>= ${maxCapacity})`);
            return currentBot.url;
        }

        // Incrementar clicks del bot actual
        const newClicks = (currentBot.clicks_current || 0) + 1;
        await supabase
            .from('telegram_bots')
            .update({ clicks_current: newClicks })
            .eq('id', currentBot.id);

        // Decidir si rotar para el PRÓXIMO usuario
        const shouldRotate =
            newClicks >= maxCapacity ||
            (batchLimit > 1 && newClicks > 0 && newClicks % batchLimit === 0);

        if (shouldRotate) {
            let nextIndex = (currentIndex + 1) % bots.length;
            let searchAttempts = 0;
            while (
                bots[nextIndex] &&
                bots[nextIndex].clicks_current >= maxCapacity &&
                searchAttempts < bots.length
            ) {
                nextIndex = (nextIndex + 1) % bots.length;
                searchAttempts++;
            }

            await supabase
                .from('smart_links')
                .update({ current_bot_index: nextIndex })
                .eq('id', link.id);

            console.log(`[TelegramService] Rotado: próximo índice ${nextIndex} para link ${link.id}`);
        }

        return currentBot.url;
    },

    /** Rotación usando array de URLs (buttons[].rotatorLinks) con contador en advanced_config */
    async _rotateFromArray(
        link: SmartLink,
        allOptions: string[],
        maxCapacity: number,
        batchLimit: number,
    ): Promise<string | null> {
        const { data: linkFull } = await supabase
            .from('smart_links')
            .select('advanced_config')
            .eq('id', link.id)
            .single();

        const advConfig = linkFull?.advanced_config || {};
        const rotatorClicks: number[] = Array.isArray(advConfig.rotator_clicks)
            ? [...advConfig.rotator_clicks]
            : new Array(allOptions.length).fill(0);

        while (rotatorClicks.length < allOptions.length) rotatorClicks.push(0);

        let currentIndex = link.current_bot_index || 0;
        if (currentIndex >= allOptions.length) currentIndex = 0;

        let attempts = 0;
        while (rotatorClicks[currentIndex] >= maxCapacity && attempts < allOptions.length) {
            currentIndex = (currentIndex + 1) % allOptions.length;
            attempts++;
        }

        const selectedUrl = allOptions[currentIndex];

        const newClicks = (rotatorClicks[currentIndex] || 0) + 1;
        rotatorClicks[currentIndex] = newClicks;

        let nextIndex = currentIndex;
        const shouldRotate =
            newClicks >= maxCapacity ||
            (batchLimit > 1 && newClicks > 0 && newClicks % batchLimit === 0);

        if (shouldRotate) {
            nextIndex = (currentIndex + 1) % allOptions.length;
            let searchAttempts = 0;
            while (
                rotatorClicks[nextIndex] >= maxCapacity &&
                searchAttempts < allOptions.length
            ) {
                nextIndex = (nextIndex + 1) % allOptions.length;
                searchAttempts++;
            }
        }

        await supabase
            .from('smart_links')
            .update({
                current_bot_index: nextIndex,
                advanced_config: { ...advConfig, rotator_clicks: rotatorClicks },
            })
            .eq('id', link.id);

        return selectedUrl;
    },
};
