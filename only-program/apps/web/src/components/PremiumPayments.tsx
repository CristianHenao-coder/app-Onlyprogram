import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { cmsService } from "@/services/cmsService";

type PaymentAssetType = "crypto" | "card" | "paypal";

export default function PremiumPayments({
  previewData
}: {
  previewData?: any[];
}) {
  const { t } = useTranslation() as any;

  /* 
   * Pricing data logic removed as user requested focus on Payment Methods only.
   * If previewData is needed later for other components, re-enable here.
   */

  const paymentAssets: Record<PaymentAssetType, string[]> = useMemo(() => {
    const modules = import.meta.glob("../assets/payments/*.{png,jpg,jpeg,webp,svg}", {
      eager: true,
      import: "default",
    }) as Record<string, string>;

    const all = Object.entries(modules).map(([path, src]) => ({ path: path.toLowerCase(), src }));

    const crypto = all
      .filter(
        (a) =>
          a.path.includes("btc") ||
          a.path.includes("bitcoin") ||
          a.path.includes("eth") ||
          a.path.includes("ethereum") ||
          a.path.includes("usdt") ||
          a.path.includes("tether") ||
          a.path.includes("sol") ||
          a.path.includes("solana") ||
          a.path.includes("coin") ||
          a.path.includes("crypto")
      )
      .map((a) => a.src);

    const card = all
      .filter(
        (a) =>
          a.path.includes("visa") ||
          a.path.includes("master") ||
          a.path.includes("mastercard") ||
          a.path.includes("amex") ||
          a.path.includes("american") ||
          a.path.includes("card") ||
          a.path.includes("bank")
      )
      .map((a) => a.src);

    const paypal = all
      .filter(
        (a) =>
          a.path.includes("paypal") ||
          a.path.includes("cash") ||
          a.path.includes("money") ||
          a.path.includes("bill") ||
          a.path.includes("note")
      )
      .map((a) => a.src);

    return { crypto, card, paypal };
  }, []);

  const hasAny = paymentAssets.crypto.length + paymentAssets.card.length + paymentAssets.paypal.length > 0;

  const Card = ({
    title,
    desc,
    icon,
    chips,
    assets,
  }: {
    title: string;
    desc: string;
    icon: string;
    chips: string[];
    assets: string[];
  }) => {
    return (
      <div className="group relative rounded-[2rem] border border-white/5 bg-[#0F0F0F] p-1 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
        {/* Gradient Border on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative h-full rounded-[1.8rem] bg-[#0A0A0A] p-6 lg:p-8 flex flex-col justify-between">
            <div>
                 <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-silver group-hover:text-primary transition-colors">{icon}</span>
                  </div>
                  {assets.length > 0 && (
                    <div className="flex -space-x-3">
                        {assets.slice(0, 3).map((src, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border border-[#0A0A0A] bg-white flex items-center justify-center overflow-hidden relative z-10" style={{ zIndex: 3-i }}>
                              <img src={src} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                    </div>
                  )}
                 </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-silver/60 text-sm leading-relaxed mb-6">{desc}</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-silver/50"
                    >
                      {c}
                    </span>
                  ))}
                </div>
            </div>

            <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-silver/40">{t("payments.process.title")}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                        {t("payments.process.instant")}
                    </span>
                </div>
                <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs text-silver/60">
                         <span className="material-symbols-outlined text-primary text-sm">check</span>
                         <span>{t("payments.process.step1")}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-silver/60">
                         <span className="material-symbols-outlined text-primary text-sm">check</span>
                         <span>{t("payments.process.step2")}</span>
                     </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-center">
      {/* Component Title removed to avoid conflict with Home.tsx */}

      {/* Pricing Tiers from CMS (Hidden for now as user focused on Methods) */}
      {/* ... keeping logic if needed but user asked about Methods design ... */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title={t ? t("payments.card") : "Tarjetas"}
          desc={t ? t("payments.cardDesc") : "VISA, Mastercard, Amex. Confirmación rápida."}
          icon="credit_card"
          chips={(t("payments.chips.card") as string[]) || ["VISA", "Mastercard", "Amex", "3DS opcional"]}
          assets={paymentAssets.card}
        />
        <Card
          title={t ? t("payments.crypto") : "Cripto"}
          desc={t ? t("payments.cryptoDesc") : "BTC, ETH, USDT, SOL. Validación manual segura."}
          icon="currency_bitcoin"
          chips={(t("payments.chips.crypto") as string[]) || ["BTC", "ETH", "USDT", "SOL"]}
          assets={paymentAssets.crypto}
        />
        <Card
          title={t ? t("payments.paypal") : "PayPal"}
          desc={t ? t("payments.paypalDesc") : "Checkout confiable con alta tasa de aprobación."}
          icon="payments"
          chips={(t("payments.chips.paypal") as string[]) || ["PayPal", "Checkout rápido", "Confianza"]}
          assets={paymentAssets.paypal}
        />
      </div>

      {!hasAny && (
        <p className="mt-8 text-[10px] text-silver/20 uppercase tracking-widest">
           * Assets path: src/assets/payments/ (visa/master/btc...)
        </p>
      )}
    </div>
  );
}
