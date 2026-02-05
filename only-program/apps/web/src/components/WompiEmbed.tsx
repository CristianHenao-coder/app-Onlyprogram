import { useEffect, useState } from "react";

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

        // Obtener token de la sesión (ajusta esto según cómo manejes la auth en tu app)
        const sessionStr = localStorage.getItem('sb-agrtbd-auth-token') || localStorage.getItem('supabase.auth.token'); // Fallback o ajuste específico
        let token = "";
        try {
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                token = session.access_token || session.currentSession?.access_token;
            }
        } catch (e) { console.error("Error parsing session", e); }

        fetch("/api/payments/wompi/get-signature", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                amount,
                currency: "COP"
            })
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then((responseData: WompiSignatureResponse) => {
                setData(responseData);
                setLoading(false);
            })
            .catch((err: any) => {
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
