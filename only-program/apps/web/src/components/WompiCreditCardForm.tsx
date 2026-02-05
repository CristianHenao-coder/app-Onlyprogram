import { useState } from "react";
import { paymentsService } from "@/services/payments.service";
import toast from "react-hot-toast";

interface WompiCreditCardFormProps {
    amount: number;
    email: string;
    onSuccess: () => void;
}

export default function WompiCreditCardForm({ amount, email, onSuccess }: WompiCreditCardFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: "",
        cvc: "",
        expMonth: "",
        expYear: "",
        cardHolder: "",
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Obtener Token de Aceptación (Requerido por Wompi)
            // Wompi requires getting the merchants public key info to assume acceptance
            // For simplicity in this demo, we can hardcode or fetch acceptance token.
            // Correct flow: GET https://sandbox.wompi.co/v1/merchants/PUB_KEY
            const wompiPub = import.meta.env.VITE_WOMPI_PUB_KEY || "pub_test_Q5yWAz"; // Use ENV
            const wompiUrl = import.meta.env.VITE_WOMPI_API_URL || "https://sandbox.wompi.co/v1";

            const merchantRes = await fetch(`${wompiUrl}/merchants/${wompiPub}`);
            const merchantData = await merchantRes.json();

            if (!merchantData.data?.presigned_acceptance?.acceptance_token) {
                throw new Error("No se pudo obtener el token de aceptación de Wompi.");
            }

            const acceptanceToken = merchantData.data.presigned_acceptance.acceptance_token;

            // 2. Tokenizar Tarjeta
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
                throw new Error(tokenData.error.reason || "Error al validar la tarjeta");
            }

            const cardToken = tokenData.data.id;

            // 3. Enviar al Backend para Transacción (USD -> COP automático en backend)
            await paymentsService.createWompiTransaction({
                amount, // USD
                email,
                token: cardToken,
                acceptanceToken,
                installments: 1
            });

            toast.success("¡Pago exitoso!");
            onSuccess();

        } catch (err: any) {
            console.error("Payment Error:", err);
            setError(err.message || "Ocurrió un error al procesar el pago.");
            toast.error(err.message || "Error en el pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-gray-800 rounded-lg">
            <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Nombre en la Tarjeta</label>
                <input
                    type="text"
                    name="cardHolder"
                    placeholder="Juan Perez"
                    value={formData.cardHolder}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Número de Tarjeta</label>
                <input
                    type="text"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    maxLength={19}
                    className="w-full bg-gray-700 text-white rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                />
            </div>

            <div className="flex gap-4">
                <div className="w-1/2 space-y-2">
                    <label className="text-white text-sm font-semibold">Fecha Exp</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="expMonth"
                            placeholder="MM"
                            maxLength={2}
                            value={formData.expMonth}
                            onChange={handleChange}
                            className="w-full bg-gray-700 text-white rounded p-2 text-center outline-none"
                            required
                        />
                        <input
                            type="text"
                            name="expYear"
                            placeholder="YY"
                            maxLength={2}
                            value={formData.expYear}
                            onChange={handleChange}
                            className="w-full bg-gray-700 text-white rounded p-2 text-center outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="w-1/2 space-y-2">
                    <label className="text-white text-sm font-semibold">CVC</label>
                    <input
                        type="text"
                        name="cvc"
                        placeholder="123"
                        maxLength={4}
                        value={formData.cvc}
                        onChange={handleChange}
                        className="w-full bg-gray-700 text-white rounded p-2 text-center outline-none"
                        required
                    />
                </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                {loading ? "Procesando..." : `Pagar $${amount} USD`}
            </button>

            <p className="text-xs text-gray-400 text-center mt-2">
                Procesado por Wompi. Tus datos están seguros.
            </p>
        </form>
    );
}
