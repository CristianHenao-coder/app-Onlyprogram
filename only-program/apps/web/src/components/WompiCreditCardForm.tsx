import { useState, useEffect } from "react";
import { paymentsService } from "@/services/payments.service";
import toast from "react-hot-toast";

// Import assets relative to this component or use absolute imports if configured
import visaLogo from "@/assets/payments/visa.png";
import cardGeneric from "@/assets/payments/tarjeta-de-credito (1).png";

// Nueva interfaz exportada para uso externo
export interface WompiPaymentData {
    token: string;
    acceptanceToken: string;
    email: string;
    amount: number;
}

interface WompiCreditCardFormProps {
    amount: number;
    email: string;
    onSuccess: () => void;
    onProcessPayment?: (data: WompiPaymentData) => Promise<any>;
}

export default function WompiCreditCardForm({ amount, email, onSuccess, onProcessPayment }: WompiCreditCardFormProps) {
    const [loading, setLoading] = useState(false);
    const [cardType, setCardType] = useState<"visa" | "mastercard" | "amex" | "unknown">("unknown");
    const [formData, setFormData] = useState({
        cardNumber: "",
        cvc: "",
        expMonth: "",
        expYear: "",
        cardHolder: "",
    });
    const [error, setError] = useState<string | null>(null);

    // Detect card type (useEffect stays the same)
    useEffect(() => {
        const number = formData.cardNumber.replace(/\s/g, "");
        if (number.startsWith("4")) setCardType("visa");
        else if (/^5[1-5]/.test(number)) setCardType("mastercard");
        else if (/^3[47]/.test(number)) setCardType("amex");
        else setCardType("unknown");
    }, [formData.cardNumber]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;

        // Formatting Logic
        if (name === "cardNumber") {
            value = value.replace(/\D/g, "").substring(0, 19);
            value = value.replace(/(\d{4})(?=\d)/g, "$1 "); // Add space every 4 digits
        } else if (name === "expMonth" || name === "expYear" || name === "cvc") {
            value = value.replace(/\D/g, "");
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use production Wompi by default (sandbox only for explicit testing)
            const wompiPub = import.meta.env.VITE_WOMPI_PUB_KEY || "";
            const wompiUrl = import.meta.env.VITE_WOMPI_API_URL || "https://production.wompi.co/v1";

            if (!wompiPub) {
                throw new Error("Configuración de pago no disponible. Contacta a soporte.");
            }

            // 1. Get Acceptance Token
            const merchantRes = await fetch(`${wompiUrl}/merchants/${wompiPub}`);

            if (!merchantRes.ok) {
                if (merchantRes.status === 404 || merchantRes.status === 422) {
                    throw new Error(`Clave pública de Wompi inválida (${wompiPub}). Verifica tu configuración.`);
                }
                throw new Error("Error conectando con Wompi. Intenta más tarde.");
            }

            const merchantData = await merchantRes.json();

            if (!merchantData.data?.presigned_acceptance?.acceptance_token) {
                throw new Error("Error de conexión con el procesador de pagos.");
            }

            const acceptanceToken = merchantData.data.presigned_acceptance.acceptance_token;

            // 2. Tokenize Card
            const tokenRes = await fetch(`${wompiUrl}/tokens/cards`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${wompiPub}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    number: formData.cardNumber.replace(/\s/g, ""),
                    cvc: formData.cvc,
                    exp_month: formData.expMonth,
                    exp_year: formData.expYear,
                    card_holder: formData.cardHolder,
                }),
            });

            const tokenData = await tokenRes.json();

            if (tokenData.error) {
                throw new Error("Verifica los datos de tu tarjeta e intenta nuevamente.");
            }

            const cardToken = tokenData.data.id;

            // 3. Backend Transaction (Custom or Default)
            if (onProcessPayment) {
                await onProcessPayment({
                    token: cardToken,
                    acceptanceToken,
                    email,
                    amount
                });
                // If no error thrown, success
                toast.success("¡Operación exitosa!", { icon: "🎉" });
                onSuccess();
                return;
            }

            // Default Behavior (Generic Transaction)
            const transaction = await paymentsService.createWompiTransaction({
                amount,
                email,
                token: cardToken,
                acceptanceToken,
                installments: 1
            });

            if (transaction.status === "APPROVED") {
                toast.success("¡Pago procesado exitosamente!", { icon: "🎉" });
                onSuccess();
            } else if (transaction.status === "DECLINED") {
                throw new Error("El pago fue rechazado. Verifica los fondos o contacta a tu banco.");
            } else {
                throw new Error("Ocurrió un error con el procesador de pagos. Intenta nuevamente.");
            }

        } catch (err: any) {
            console.error("Payment Error:", err);
            const msg = err.message || "No se pudo procesar el pago.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative group">
            {/* Decorative Blur Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

            <form onSubmit={handleSubmit} className="relative bg-black/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">

                {/* Card Header / Visual */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">Tarjeta de Crédito</h3>
                    <div className="h-10 w-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                        {cardType === "visa" && <img src={visaLogo} alt="Visa" className="h-8 object-contain" />}
                        {cardType === "mastercard" && <div className="flex -space-x-3"><div className="w-6 h-6 rounded-full bg-red-500/80"></div><div className="w-6 h-6 rounded-full bg-yellow-500/80"></div></div>}
                        {cardType === "unknown" && <img src={cardGeneric} alt="Card" className="h-6 opacity-50 grayscale" />}
                    </div>
                </div>

                {/* Card Number */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-silver/60 uppercase tracking-widest pl-1">Número de Tarjeta</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={handleChange}
                            maxLength={23}
                            className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-lg tracking-wider"
                            required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver/40 material-symbols-outlined text-lg">credit_card</span>
                    </div>
                </div>

                {/* Holder Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-silver/60 uppercase tracking-widest pl-1">Titular de la Tarjeta</label>
                    <input
                        type="text"
                        name="cardHolder"
                        placeholder="COMO APARECE EN LA TARJETA"
                        value={formData.cardHolder}
                        onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                        className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm uppercase"
                        required
                    />
                </div>

                {/* Expiry & CVC */}
                <div className="flex gap-4">
                    <div className="w-1/2 space-y-2">
                        <label className="text-[10px] font-bold text-silver/60 uppercase tracking-widest pl-1">Vencimiento</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="expMonth"
                                placeholder="MM"
                                maxLength={2}
                                value={formData.expMonth}
                                onChange={handleChange}
                                className="w-full bg-background-dark/50 border border-white/10 rounded-xl py-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all font-mono"
                                required
                            />
                            <span className="text-white/20 flex items-center text-xl">/</span>
                            <input
                                type="text"
                                name="expYear"
                                placeholder="YY"
                                maxLength={2}
                                value={formData.expYear}
                                onChange={handleChange}
                                className="w-full bg-background-dark/50 border border-white/10 rounded-xl py-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="w-1/2 space-y-2">
                        <label className="text-[10px] font-bold text-silver/60 uppercase tracking-widest pl-1">CVC / CVV</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="cvc"
                                placeholder="123"
                                maxLength={4}
                                value={formData.cvc}
                                onChange={handleChange}
                                className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-all font-mono tracking-widest"
                                required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver/20 material-symbols-outlined text-sm">lock</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 animate-fade-in">
                        <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                        <p className="text-red-300 text-xs font-medium leading-tight">{error}</p>
                    </div>
                )}

                {/* Action Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-purple-900/60 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            Procesando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">lock_open</span>
                            Pagar {amount ? `$${amount} USD` : ""}
                        </>
                    )}
                </button>

                <div className="flex justify-center items-center gap-2 opacity-30 mt-2">
                    <span className="material-symbols-outlined text-[10px] text-white">verified_user</span>
                    <span className="text-[9px] text-white font-bold uppercase tracking-widest">SSL Secure Payment</span>
                </div>
            </form>


        </div>
    );
}
