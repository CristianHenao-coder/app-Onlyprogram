import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { paymentsService, Payment } from '@/services/payments.service';

interface LinkData {
    id: string;
    title: string;
    slug: string;
    status: string;
    created_at: string;
    user_id: string;
}

export default function Home() {
    const { user } = useAuth();
    const [links, setLinks] = useState<LinkData[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasActivePlan, setHasActivePlan] = useState(false);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            // Load links
            const { data: linksData, error: linksError } = await supabase
                .from('smart_links')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (linksError) throw linksError;
            setLinks(linksData || []);

            // Load payment history
            const paymentsData = await paymentsService.getHistory();
            setPayments(paymentsData.payments || []);

            // Check if user has any completed payment
            const hasCompletedPayment = paymentsData.payments?.some(
                (p: Payment) => p.status === 'completed'
            );
            setHasActivePlan(hasCompletedPayment);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white">Home</h1>
                    <p className="text-silver/60 text-sm mt-1">Gestiona tus links y revisa tu actividad</p>
                </div>
                <Link
                    to="/dashboard/links/new"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nuevo Link
                </Link>
            </div>

            {/* Links Overview */}
            <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Mis Links</h2>
                        <p className="text-silver/60 text-sm">Total: {links.length} link{links.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-3 py-1.5 rounded-full font-bold ${hasActivePlan
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                            {hasActivePlan ? 'Plan Activo' : 'Sin Plan'}
                        </span>
                    </div>
                </div>

                {links.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">link_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No tienes links creados</h3>
                        <p className="text-silver/60 text-sm mb-6">Crea tu primer link protegido para comenzar</p>
                        <Link
                            to="/dashboard/links/new"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Crear Primer Link
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background-dark/50 text-silver/60 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 text-left font-bold">Link</th>
                                    <th className="p-4 text-left font-bold">Fecha de Compra</th>
                                    <th className="p-4 text-left font-bold">Estado</th>
                                    <th className="p-4 text-right font-bold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {links.map((link) => (
                                    <tr key={link.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <span className="material-symbols-outlined text-primary text-lg">link</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{link.title || 'Sin título'}</p>
                                                    <p className="text-xs text-silver/50 font-mono">{link.slug}.onlyprogram.com</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-silver/70">
                                                {new Date(link.created_at).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${link.status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                {link.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                to={`/dashboard/links/${link.id}/edit`}
                                                className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-bold transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                Editar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-white">Historial de Pagos</h2>
                    <p className="text-silver/60 text-sm">Revisa tus transacciones anteriores</p>
                </div>

                {payments.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-silver/5 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-silver/40 text-3xl">receipt_long</span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">Sin transacciones</h3>
                        <p className="text-silver/60 text-sm">Aún no has realizado ningún pago</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background-dark/50 text-silver/60 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 text-left font-bold">Fecha</th>
                                    <th className="p-4 text-left font-bold">Descripción</th>
                                    <th className="p-4 text-left font-bold">Método</th>
                                    <th className="p-4 text-left font-bold">Monto</th>
                                    <th className="p-4 text-left font-bold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-silver/70">
                                            {new Date(payment.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4 text-sm text-white">
                                            {payment.tx_reference ? `Ref: ${payment.tx_reference.substring(0, 12)}...` : "Pago de Suscripción"}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-2 text-sm text-silver/70 capitalize">
                                                <span className="material-symbols-outlined text-lg">
                                                    {payment.provider === 'paypal' ? 'payments' : payment.provider === 'crypto' ? 'currency_bitcoin' : 'credit_card'}
                                                </span>
                                                {payment.provider}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-white font-bold">
                                            ${payment.amount} {payment.currency}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : payment.status === 'pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {payment.status === 'completed' ? 'Completado' : payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
