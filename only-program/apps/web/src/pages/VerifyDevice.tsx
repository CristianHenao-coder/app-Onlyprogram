import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/services/apiConfig';
import { supabase } from '@/services/supabase';
import Logo from '@/components/Logo';
import loadShield from '@/assets/load/loadshield.gif';

type VerifyStep = 'code' | 'success' | 'locked';

interface LocationState {
    email?: string;
    userId?: string;
    usage?: 'register' | 'login';
    password?: string;
    name?: string;
}

const DEVICE_TOKEN_KEY = 'op_device_token';

export default function VerifyDevice() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state || {}) as LocationState;

    const { email = '', userId = '', usage = 'login', password = '', name = '' } = state;

    const [step, setStep] = useState<VerifyStep>('code');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [lockedUntil, setLockedUntil] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60); // 1-minute OTP countdown
    const [canResend, setCanResend] = useState(false);
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect based on role and profile completeness
    const handleProfileRedirect = useCallback(async (resolvedUserId: string) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, profile_completed, full_name, country')
            .eq('id', resolvedUserId)
            .single();

        const isComplete =
            profile?.profile_completed ||
            (profile?.full_name && profile?.country);

        if (!isComplete) {
            navigate('/complete-profile', { replace: true });
        } else if (profile?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/login', { replace: true });
        }
    }, [email, navigate]);

    // Countdown timer
    useEffect(() => {
        if (step !== 'code') return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    // Auto-redirect after success
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(async () => {
                if (usage === 'register' && password) {
                    // Sign in after registration
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                    if (signInError || !signInData?.user) {
                        navigate('/login', { replace: true });
                        return;
                    }
                    await handleProfileRedirect(signInData.user.id);
                } else {
                    // Login flow: session already established OR we have a sessionToken to establish it
                    let resolvedId = userId;
                    if (sessionToken) {
                        // Establish native Supabase session
                        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.verifyOtp({ 
                            token_hash: sessionToken, 
                            type: 'magiclink' 
                        });
                        console.log("verifyOtp magiclink result:", { magicLinkData, magicLinkError });
                        if (!magicLinkError && magicLinkData?.user) {
                            resolvedId = magicLinkData.user.id;
                        } else {
                            console.error("Failed to establish session natively with token:", magicLinkError);
                            navigate('/login', { replace: true });
                            return;
                        }
                    } else if (!resolvedId) {
                        // Fallback (e.g. from password login where session is already established)
                        const { data: sessionData } = await supabase.auth.getSession();
                        resolvedId = sessionData?.session?.user?.id || '';
                    }
                    
                    if (resolvedId) {
                        await handleProfileRedirect(resolvedId);
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                }
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [step, usage, email, password, userId, navigate, handleProfileRedirect]);

    const handleCodeChange = (index: number, value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = cleaned;
        setCode(newCode);

        if (cleaned && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(''));
            inputsRef.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: fullCode, usage, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'ACCOUNT_LOCKED') {
                    setLockedUntil(data.lockedUntil);
                    setStep('locked');
                    return;
                }

                setError(data.error || 'Código inválido');
                setCode(['', '', '', '', '', '']);
                inputsRef.current[0]?.focus();

                if (data.attemptsLeft !== undefined) {
                    setAttemptsLeft(data.attemptsLeft);
                }
                return;
            }

            // Success! Register this device
            if (data.session_token) {
                setSessionToken(data.session_token);
            }
            setStep('success');

            // Get current user to register device token
            // Wait shortly to make sure session establishment isn't racing this code
            const currentUserId = userId || data.userId || (await supabase.auth.getSession()).data?.session?.user?.id;

            if (currentUserId) {
                try {
                    const devResponse = await fetch(`${API_URL}/auth/register-device`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUserId }),
                    });
                    const devData = await devResponse.json();
                    if (devData.deviceToken) {
                        localStorage.setItem(DEVICE_TOKEN_KEY, devData.deviceToken);
                        // Also set as cookie
                        document.cookie = `op_device_token=${devData.deviceToken}; max-age=${30 * 24 * 3600}; path=/; SameSite=Strict`;
                    }
                } catch (e) {
                    console.warn('Could not register device token', e);
                }
            }
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        setError(null);
        setCode(['', '', '', '', '', '']);
        setAttemptsLeft(null);

        try {
            const response = await fetch(`${API_URL}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, usage, lang: 'es' }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'EMAIL_LOCKED') {
                    setLockedUntil(data.lockedUntil);
                    setStep('locked');
                    return;
                }
                setError(data.error || 'No se pudo reenviar el código');
                return;
            }

            setCountdown(60);
            setCanResend(false);
            inputsRef.current[0]?.focus();
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const formattedLocked = lockedUntil
        ? new Date(lockedUntil).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : '10 minutos';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
            {/* Background glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence mode="wait">
                {/* SUCCESS SCREEN */}
                {step === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary"
                    >
                        {/* Glow effects */}
                        <div className="absolute inset-0 bg-gradient-to-b from-primary via-blue-600 to-primary" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 blur-[120px] rounded-full" />

                        <motion.div
                            className="relative z-10 flex flex-col items-center gap-8"
                            initial={{ scale: 0.8, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            {/* Animated shield */}
                            <div className="w-40 h-40 relative">
                                <img
                                    src={loadShield}
                                    alt="Verificado"
                                    className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(255,255,255,0.6)]"
                                />
                            </div>

                            <div className="text-center">
                                <motion.h1
                                    className="text-4xl font-black text-white mb-3 tracking-tight"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    ¡Acceso Verificado!
                                </motion.h1>
                                <motion.p
                                    className="text-white/70 text-base"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    Redirigiendo al dashboard...
                                </motion.p>
                            </div>

                            {/* Progress dots */}
                            <motion.div
                                className="flex gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-white"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1,
                                            delay: i * 0.2,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}

                {/* LOCKED SCREEN */}
                {step === 'locked' && (
                    <motion.div
                        key="locked"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md px-4 z-10 py-12"
                    >
                        <div className="bg-white/[0.02] border border-red-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl backdrop-blur-md text-center">
                            <div className="text-6xl mb-6">🔒</div>
                            <h1 className="text-2xl font-black text-white mb-3">Acceso Bloqueado</h1>
                            <p className="text-silver/50 text-sm mb-6">
                                Has ingresado 3 códigos incorrectos consecutivos. Por seguridad, el acceso a este correo ha sido bloqueado temporalmente.
                            </p>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                                <p className="text-red-400 font-bold">
                                    Bloqueado hasta las {formattedLocked}
                                </p>
                            </div>
                            <p className="text-silver/30 text-xs mb-8">
                                Te hemos enviado un email de notificación a <strong className="text-silver/50">{email}</strong>
                            </p>
                            <button
                                onClick={() => navigate('/login', { replace: true })}
                                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* CODE ENTRY SCREEN */}
                {step === 'code' && (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md px-4 z-10 py-12"
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl backdrop-blur-md">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <Logo className="h-10 w-10" />
                                    <span className="text-xl font-black tracking-tighter text-white uppercase">
                                        Only <span className="text-primary">Program</span>
                                    </span>
                                </div>

                                {/* Shield icon */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">
                                            shield
                                        </span>
                                    </div>
                                </div>

                                <h1 className="text-2xl font-black text-white mb-2">
                                    Verificación de Dispositivo
                                </h1>
                                <p className="text-silver/50 text-sm">
                                    Hemos enviado un código de 6 dígitos a
                                </p>
                                <p className="text-primary font-bold text-sm mt-1">{email}</p>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                                    >
                                        <p className="text-sm text-red-400 font-medium text-center">{error}</p>
                                        {attemptsLeft !== null && (
                                            <p className="text-xs text-red-300/70 text-center mt-1">
                                                Te quedan {attemptsLeft} intento{attemptsLeft !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 6-digit code inputs */}
                            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                                {code.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputsRef.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border transition-all outline-none
                      bg-white/5 text-white
                      ${digit ? 'border-primary shadow-[0_0_15px_rgba(29,161,242,0.3)]' : 'border-white/10'}
                      focus:border-primary focus:shadow-[0_0_15px_rgba(29,161,242,0.3)]`}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>

                            {/* OTP Countdown */}
                            <div className="text-center mb-6">
                                {!canResend ? (
                                    <p className="text-silver/30 text-xs">
                                        El código expira en{' '}
                                        <span className="text-primary font-bold">
                                            {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                                            {String(countdown % 60).padStart(2, '0')}
                                        </span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="text-primary text-xs font-bold hover:text-primary/80 transition-colors underline underline-offset-4"
                                    >
                                        ¿No recibiste el código? Reenviar
                                    </button>
                                )}
                            </div>

                            {/* Spam warning */}
                            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6">
                                <p className="text-[10px] text-amber-500/70 font-medium text-center uppercase tracking-widest leading-relaxed">
                                    ⚠️ Revisa tu carpeta de SPAM si no lo encuentras
                                </p>
                            </div>

                            {/* Verify button */}
                            <button
                                onClick={handleVerify}
                                disabled={loading || code.join('').length < 6}
                                className="w-full bg-primary text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 touch-manipulation"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verificando...
                                    </span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">verified</span>
                                        Verificar Acceso
                                    </>
                                )}
                            </button>

                            {/* Back link */}
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full mt-4 text-silver/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                            >
                                ← Volver
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
