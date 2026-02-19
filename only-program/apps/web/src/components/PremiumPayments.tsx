import { useMemo } from "react";

type PaymentKind = "card" | "crypto" | "paypal";

type Asset = {
  path: string;
  src: string;
};

export default function PremiumPayments() {
  // Carga local (Vite): src/assets/payments/*
  const paymentAssets = useMemo(() => {
    const modules = import.meta.glob("../assets/payments/*.{png,jpg,jpeg,webp,svg}", {
      eager: true,
      import: "default",
    }) as Record<string, string>;

    const all: Asset[] = Object.entries(modules).map(([path, src]) => ({
      path: path.toLowerCase(),
      src,
    }));

    const crypto = all
      .filter((a) =>
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
      .filter((a) =>
        a.path.includes("visa") ||
        a.path.includes("master") ||
        a.path.includes("mastercard") ||
        a.path.includes("amex") ||
        a.path.includes("american") ||
        a.path.includes("card") ||
        a.path.includes("black") ||
        a.path.includes("bank")
      )
      .map((a) => a.src);

    const paypal = all
      .filter((a) =>
        a.path.includes("paypal") ||
        a.path.includes("bill") ||
        a.path.includes("money") ||
        a.path.includes("cash") ||
        a.path.includes("note")
      )
      .map((a) => a.src);

    return { crypto, card, paypal };
  }, []);

  const pick = (kind: PaymentKind) => {
    const list = paymentAssets[kind] ?? [];
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-left rounded-3xl bg-surface/40 border border-border p-6" data-reveal>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Tarjetas</p>
            <p className="text-silver/60 text-sm mt-1">Visa · Mastercard · Amex · Bancos principales</p>
          </div>
          <span className="material-symbols-outlined text-primary">credit_card</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {pick("card") ? (
            <img src={pick("card") as string} alt="" className="h-10 w-auto opacity-90" />
          ) : (
            <span className="text-xs text-silver/50">
              Agrega imágenes en <span className="font-mono">src/assets/payments</span> (visa/master/amex/black)
            </span>
          )}
        </div>
      </div>

      <div className="text-left rounded-3xl bg-surface/40 border border-border p-6" data-reveal data-delay="1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Criptomonedas</p>
            <p className="text-silver/60 text-sm mt-1">BTC · ETH · USDT · SOL</p>
          </div>
          <span className="material-symbols-outlined text-primary">currency_bitcoin</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {pick("crypto") ? (
            <img src={pick("crypto") as string} alt="" className="h-10 w-auto opacity-90" />
          ) : (
            <span className="text-xs text-silver/50">
              Agrega imágenes en <span className="font-mono">src/assets/payments</span> (btc/eth/usdt/sol/coin)
            </span>
          )}
        </div>
      </div>

      <div className="text-left rounded-3xl bg-surface/40 border border-border p-6" data-reveal data-delay="2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold">PayPal</p>
            <p className="text-silver/60 text-sm mt-1">Checkout rápido y confiable</p>
          </div>
          <span className="material-symbols-outlined text-primary">payments</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {pick("paypal") ? (
            <img src={pick("paypal") as string} alt="" className="h-10 w-auto opacity-90" />
          ) : (
            <span className="text-xs text-silver/50">
              Agrega imágenes en <span className="font-mono">src/assets/payments</span> (paypal/bill/money)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
