import React, { useMemo } from "react";
import { useTranslation } from "@/contexts/I18nContext";

type PaymentAssetType = "crypto" | "card" | "paypal";

export default function PremiumPayments() {
  const { t } = useTranslation() as any;

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
      <div className="rounded-3xl border border-border bg-surface/40 p-6 hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white font-extrabold">{title}</p>
            <p className="text-silver/60 text-sm mt-1">{desc}</p>
          </div>
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="text-[11px] px-2 py-1 rounded-full border border-border bg-background-dark/30 text-silver/70"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background-dark/35 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-silver/55 font-semibold">Proceso</p>
            <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
              instant
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm text-silver/70">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">done</span>
              Selecciona método
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">done</span>
              Confirma y valida
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">done</span>
              Activación inmediata
            </div>
          </div>
        </div>

        {/* Logos (si existen) */}
        {assets.length > 0 && (
          <div className="mt-5 flex items-center gap-3 flex-wrap opacity-85">
            {assets.slice(0, 6).map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="h-10 w-14 rounded-xl border border-border bg-surface/30 flex items-center justify-center overflow-hidden"
              >
                <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
        {t ? t("payments.headline") : "Paga como quieras, activa tus links al instante"}
      </h2>
      <p className="mt-3 text-silver/60 max-w-2xl mx-auto">
        {t
          ? t("payments.subheadline")
          : "Métodos flexibles, validación segura y activación sin fricción. En desktop tienes micro-interacciones con hover."}
      </p>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <Card
          title={t ? t("payments.card") : "Tarjetas"}
          desc={t ? t("payments.cardDesc") : "VISA, Mastercard, Amex. Confirmación rápida."}
          icon="credit_card"
          chips={["VISA", "Mastercard", "Amex", "3DS opcional"]}
          assets={paymentAssets.card}
        />
        <Card
          title={t ? t("payments.crypto") : "Cripto"}
          desc={t ? t("payments.cryptoDesc") : "BTC, ETH, USDT, SOL. Validación manual segura."}
          icon="currency_bitcoin"
          chips={["BTC", "ETH", "USDT", "SOL"]}
          assets={paymentAssets.crypto}
        />
        <Card
          title={t ? t("payments.paypal") : "PayPal"}
          desc={t ? t("payments.paypalDesc") : "Checkout confiable con alta tasa de aprobación."}
          icon="payments"
          chips={["PayPal", "Checkout rápido", "Confianza"]}
          assets={paymentAssets.paypal}
        />
      </div>

      {!hasAny && (
        <p className="mt-6 text-xs text-silver/45">
          Tip: si quieres logos reales, agrega imágenes en{" "}
          <span className="font-mono">src/assets/payments/</span> (visa/master/btc/paypal…)
        </p>
      )}
    </div>
  );
}
