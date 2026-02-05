import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { paymentsService } from "@/services/payments.service";
import toast from "react-hot-toast";

// NOTE: Replace with your actual publishable key or use env var
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_sample");

function CheckoutForm({ onSuccess }: { amount: number; onSuccess: (details: any) => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + "/dashboard/payments",
            },
            redirect: "if_required",
        });

        if (error) {
            setErrorMessage(error.message || "An error occurred");
            toast.error(error.message || "Payment failed");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("Payment successful!");
            onSuccess(paymentIntent);
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-white text-black font-black px-8 py-4 rounded-xl hover:bg-silver transition-all shadow-xl shadow-white/5 active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Procesando..." : `PAGAR AHORA`}
            </button>
        </form>
    );
}

export default function StripePaymentForm({ amount, onSuccess }: { amount: number; onSuccess: (val: any) => void }) {
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        // Create PaymentIntent as soon as the page loads
        paymentsService.createStripeIntent(amount, "usd")
            .then((data) => setClientSecret(data.clientSecret))
            .catch((err) => {
                console.error("Error creating intent:", err);
                toast.error("Error iniciando pago con tarjeta");
            });
    }, [amount]);

    if (!clientSecret) {
        return (
            <div className="flex justify-center p-8">
                <span className="animate-spin material-symbols-outlined text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{
            clientSecret,
            appearance: {
                theme: 'night',
                variables: {
                    colorPrimary: '#ffffff',
                    colorBackground: '#1a1a1a',
                    colorText: '#ffffff',
                    colorDanger: '#df1b41',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '12px',
                },
                rules: {
                    '.Input': {
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                    '.Input:focus': {
                        border: '1px solid #ffffff',
                        boxShadow: 'none',
                    }
                }
            }
        }}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} />
        </Elements>
    );
}
