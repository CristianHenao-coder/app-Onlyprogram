import { cmsService } from "@/services/cmsService";

export type ProductPricingConfig = {
  currency: "USD" | "COP" | string;
  link: {
    standard: number; // precio link estándar
    rotator: number; // precio link rotador (total)
    telegramAddon: number; // extra por Telegram
  };
  domain: {
    connect: number; // precio conectar dominio (configuración / activación)
    buy: number; // precio comprar dominio
  };
};

export const DEFAULT_PRODUCT_PRICING: ProductPricingConfig = {
  currency: "USD",
  link: {
    standard: 2.99,
    rotator: 5.99,
    telegramAddon: 5.0,
  },
  domain: {
    connect: 54.99,
    buy: 74.99,
  },
};

const CONFIG_KEY = "product_pricing";
const CACHE_KEY = "op_product_pricing_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

const mergePricing = (raw: any): ProductPricingConfig => {
  const cfg = raw && typeof raw === "object" ? raw : {};
  return {
    currency: cfg.currency ?? DEFAULT_PRODUCT_PRICING.currency,
    link: {
      standard: Number(
        cfg?.link?.standard ?? DEFAULT_PRODUCT_PRICING.link.standard,
      ),
      rotator: Number(
        cfg?.link?.rotator ?? DEFAULT_PRODUCT_PRICING.link.rotator,
      ),
      telegramAddon: Number(
        cfg?.link?.telegramAddon ?? DEFAULT_PRODUCT_PRICING.link.telegramAddon,
      ),
    },
    domain: {
      connect: Number(
        cfg?.domain?.connect ?? DEFAULT_PRODUCT_PRICING.domain.connect,
      ),
      buy: Number(cfg?.domain?.buy ?? DEFAULT_PRODUCT_PRICING.domain.buy),
    },
  };
};

export const productPricingService = {
  async get(): Promise<ProductPricingConfig> {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed?.ts &&
          Date.now() - parsed.ts < CACHE_TTL_MS &&
          parsed?.data
        ) {
          return mergePricing(parsed.data);
        }
      }
    } catch {
      // ignore cache errors
    }

    const rawValue = await cmsService.getConfig(CONFIG_KEY);
    const merged = mergePricing(rawValue);

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data: merged }),
      );
    } catch {
      // ignore
    }

    return merged;
  },

  async save(config: ProductPricingConfig) {
    const payload = {
      ...config,
      link: {
        ...config.link,
        standard: Number(config.link.standard),
        rotator: Number(config.link.rotator),
        telegramAddon: Number(config.link.telegramAddon),
      },
      domain: {
        ...config.domain,
        connect: Number(config.domain.connect),
        buy: Number(config.domain.buy),
      },
    };

    const res = await cmsService.saveConfig(CONFIG_KEY, payload);

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data: payload }),
      );
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
