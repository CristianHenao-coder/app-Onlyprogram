import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Globe, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';
import WompiCreditCardForm, { WompiPaymentData } from './WompiCreditCardForm';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface DomainPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    domain: string;
    price: number;
    currency?: string;
    linkId?: string;
}

export default function DomainPurchaseModal({ isOpen, onClose, domain, price, currency = 'USD', linkId, onSuccess }: DomainPurchaseModalProps & { onSuccess?: () => void }) {
    const { user, session } = useAuth();
    const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
    const [error, setError] = useState<string | null>(null);

    // Efecto de Confeti al entrar en Success
    useEffect(() => {
        if (step === 'success') {
            const end = Date.now() + 3000;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#8b5cf6', '#10b981']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#8b5cf6', '#10b981']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [step]);

    const handleProcessPayment = async (data: WompiPaymentData) => {
        try {
            setError(null);
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4005';

            if (!session?.access_token) {
                throw new Error("No estás autenticado. Por favor inicia sesión nuevamente.");
            }

            const res = await axios.post(`${BACKEND_URL}/api/domains/buy`, {
                domain,
                amountUSD: price,
                token: data.token,
                acceptanceToken: data.acceptanceToken,
                email: data.email,
                linkId
            }, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (res.data.success) {
                setStep('success');
            } else {
                throw new Error(res.data.message || 'Error en la compra');
            }

        } catch (err: any) {
            console.error("Purchase Error:", err);
            const msg = err.response?.data?.details || err.response?.data?.error || err.message || "Error procesando la compra";
            throw new Error(msg);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0f1016] border border-white/10 rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] overflow-hidden"
                >
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between p-6 z-10">
                        {step !== 'success' ? (
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Globe className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="tracking-tight">Registro de Dominio</span>
                            </h3>
                        ) : <div />}

                        {step !== 'success' && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8 pt-2 relative z-10">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: REVIEW */}
                            {step === 'review' && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center space-y-3 py-4">
                                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                                            {domain}
                                        </h2>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-sm font-bold text-emerald-400">Disponible</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                                            <span className="text-gray-400">Precio de registro (1 año)</span>
                                            <span className="text-white font-mono text-lg">${price} {currency}</span>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-indigo-200">Seguridad Enterprise</h4>
                                                <p className="text-xs text-indigo-200/60 leading-relaxed">
                                                    Incluye protección DDoS, Bot Shield y SSL automático gestionado por Cloudflare.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep('payment')}
                                        className="group w-full py-4 bg-white text-black font-black text-lg rounded-2xl hover:bg-gray-100 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                                    >
                                        Registrar Ahora
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: PAYMENT */}
                            {step === 'payment' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                                        <span className="text-indigo-200 text-sm font-medium">Total a pagar</span>
                                        <span className="text-white font-bold font-mono text-xl">${price} {currency}</span>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex gap-3"
                                        >
                                            <span className="shrink-0">⚠️</span>
                                            {error}
                                        </motion.div>
                                    )}

                                    <WompiCreditCardForm
                                        amount={price}
                                        email={user?.email || ''}
                                        onSuccess={() => { }}
                                        onProcessPayment={handleProcessPayment}
                                    />

                                    <button
                                        onClick={() => setStep('review')}
                                        className="w-full text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Cancelar y Volver
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 3: SUCCESS */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4 relative"
                                >
                                    {/* Success Icon */}
                                    <div className="relative inline-block mb-8">
                                        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                                        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl mx-auto">
                                            <CheckCircle className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2">
                                            <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <h2 className="text-3xl font-black text-white">¡Felicitaciones! 🎉</h2>
                                        <div className="space-y-1">
                                            <p className="text-gray-400">El dominio ahora es de tu propiedad:</p>
                                            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                                {domain}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-8 text-left">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                                            <div className="space-y-1">
                                                <h4 className="text-emerald-200 font-bold text-sm">Próximos Pasos</h4>
                                                <p className="text-emerald-200/60 text-xs">
                                                    Estamos propagando los DNS globalmente. Tu sitio estará activo en unos minutos. Te hemos enviado los detalles a tu correo.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (onSuccess) onSuccess();
                                            onClose();
                                        }}
                                        className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black rounded-2xl transition-all shadow-xl"
                                    >
                                        Ir al Panel de Control
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
