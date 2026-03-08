import { cmsService } from "@/services/cmsService";

export type ProductPricingConfig = {
  currency: "USD" | "COP" | string;
  link: {
    base: number;          // 1 link
    telegramAddon: number; // + telegram rotativo
    instagramAddon: number;// + Instagram
  };
};

export const DEFAULT_PRODUCT_PRICING: ProductPricingConfig = {
  currency: "USD",
  link: {
    base: 69,
    telegramAddon: 20,
    instagramAddon: 20,
  },
};

const CONFIG_KEY = "product_pricing_v2"; // Changing key to avoid legacy cache data
const CACHE_KEY = "op_product_pricing_cache_v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

const mergePricing = (raw: any): ProductPricingConfig => {
  const cfg = raw && typeof raw === "object" ? raw : {};
  return {
    currency: cfg.currency ?? DEFAULT_PRODUCT_PRICING.currency,
    link: {
      base: Number(cfg?.link?.base ?? DEFAULT_PRODUCT_PRICING.link.base),
      telegramAddon: Number(cfg?.link?.telegramAddon ?? DEFAULT_PRODUCT_PRICING.link.telegramAddon),
      instagramAddon: Number(cfg?.link?.instagramAddon ?? DEFAULT_PRODUCT_PRICING.link.instagramAddon),
    },
  };
};

export const productPricingService = {
  async get(): Promise<ProductPricingConfig> {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL_MS && parsed?.data) {
          return mergePricing(parsed.data);
        }
      }
    } catch {
      // ignore cache errors
    }

    const rawValue = await cmsService.getConfig(CONFIG_KEY);
    const merged = mergePricing(rawValue);

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: merged }));
    } catch {
      // ignore
    }

    return merged;
  },

  async save(config: ProductPricingConfig) {
    const payload = {
      ...config,
      link: {
        base: Number(config.link.base),
        telegramAddon: Number(config.link.telegramAddon),
        instagramAddon: Number(config.link.instagramAddon),
      },
    };

    const res = await cmsService.saveConfig(CONFIG_KEY, payload);

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: payload }));
    } catch {
      // ignore
    }

    return res;
  },

  clearCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
  },
};
