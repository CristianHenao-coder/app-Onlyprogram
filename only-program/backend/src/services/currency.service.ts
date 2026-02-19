
// Cache simple en memoria
let cachedRate: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Horas
const FALLBACK_RATE = 4200; // Valor seguro si falla la API

export const CurrencyService = {
    /**
     * Obtiene la tasa de cambio USD -> COP actual.
     * Usa caché para evitar llamadas excesivas a la API.
     */
    async getUsdToCopRate(): Promise<number> {
        const now = Date.now();

        // 1. Verificar Caché válida
        if (cachedRate && (now - lastFetchTime < CACHE_DURATION_MS)) {
            console.log(`💱 Using Cached Exchange Rate: ${cachedRate} COP/USD`);
            return cachedRate;
        }

        // 2. Fetch a API externa
        try {
            console.log("🌐 Fetching real-time exchange rate...");
            const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");

            if (!response.ok) {
                throw new Error(`Currency API failed: ${response.statusText}`);
            }

            const data = await response.json() as any; // Cast to any to avoid TS unknown error
            const rate = data.rates?.COP;

            if (!rate) {
                throw new Error("Currency API did not return COP rate");
            }

            // 3. Actualizar Caché
            cachedRate = rate;
            lastFetchTime = now;
            console.log(`✅ Updated Exchange Rate: ${rate} COP/USD`);

            return rate;
        } catch (error) {
            console.error("⚠️ Error fetching currency rate, using fallback:", error);
            // Retornar fallback o el último caché conocido
            return cachedRate || FALLBACK_RATE;
        }
    },

    /**
     * Convierte un monto en USD a COP
     */
    async convertUsdToCop(amountUSD: number): Promise<number> {
        const rate = await this.getUsdToCopRate();
        return Math.round(amountUSD * rate);
    }
};
