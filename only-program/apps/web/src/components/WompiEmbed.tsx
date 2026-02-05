import { useEffect, useState } from "react";
import { paymentsService } from "@/services/payments.service";

interface WompiSignatureResponse {
    reference: string;
    signature: string;
    amountInCents: number;
    currency: string;
    publicKey: string;
}

export default function WompiEmbed({ amount, email }: { amount: number, email?: string }) {
    const [data, setData] = useState<WompiSignatureResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Obtener firma del backend
        setLoading(true);
        paymentsService.getWompiSignature(amount, "COP")
            .then((responseData) => {
                setData(responseData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error getting Wompi signature:", err);
                setLoading(false);
            });
    }, [amount]);

    useEffect(() => {
        if (!data) return;

        // 2. Cargar script de Wompi dinámicamente
        const script = document.createElement("script");
        script.src = "https://checkout.wompi.co/widget.js";
        script.setAttribute("data-render", "button");
        script.setAttribute("data-public-key", data.publicKey);
        script.setAttribute("data-currency", data.currency);
        script.setAttribute("data-amount-in-cents", data.amountInCents.toString());
        script.setAttribute("data-reference", data.reference);
        script.setAttribute("data-signature:integrity", data.signature);
        if (email) {
            script.setAttribute("data-customer-data:email", email);
        }
        // Redirección después del pago
        script.setAttribute("data-redirect-url", window.location.origin + "/dashboard/payments?status=wompi_return");

        const container = document.getElementById("wompi-container");
        if (container) {
            container.innerHTML = ""; // Limpiar anterior
            container.appendChild(script);
        }
    }, [data, email]);

    if (loading) return <div className="text-white">Cargando Wompi...</div>;
    if (!data) return <div className="text-red-500">Error cargando pago</div>;

    return (
        <div className="w-full flex justify-center py-4">
            <div id="wompi-container"></div>
        </div>
    );
}
