import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { API_URL } from '@/services/apiConfig';
import toast from 'react-hot-toast';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    contacted: boolean;
    created_at: string;
}

const Inbox = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'contacted'>('all');
    const [selected, setSelected] = useState<ContactMessage | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/admin/contact-messages`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setMessages(json.data || []);
        } catch (err: any) {
            toast.error('No se pudieron cargar los mensajes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMessages(); }, []);

    const toggleContacted = async (msg: ContactMessage) => {
        setUpdatingId(msg.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/admin/contact-messages/${msg.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ contacted: !msg.contacted })
            });
            if (!res.ok) throw new Error();
            toast.success(msg.contacted ? 'Marcado como pendiente' : '✅ Marcado como contactado');
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, contacted: !m.contacted } : m));
            if (selected?.id === msg.id) setSelected(prev => prev ? { ...prev, contacted: !prev.contacted } : null);
        } catch {
            toast.error('Error al actualizar el mensaje.');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = messages.filter(m => {
        if (filter === 'pending') return !m.contacted;
        if (filter === 'contacted') return m.contacted;
        return true;
    });

    const pendingCount = messages.filter(m => !m.contacted).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-white tracking-tighter">Buzón de Mensajes</h1>
                        {pendingCount > 0 && (
                            <span className="bg-primary text-black text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                                {pendingCount} nuevo{pendingCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-silver/40 text-sm font-medium">Mensajes recibidos desde el formulario de contacto de la web.</p>
                </div>
                <button
                    onClick={fetchMessages}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-silver hover:text-white transition-all text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Actualizar
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'Todos', count: messages.length },
                    { key: 'pending', label: 'Sin contactar', count: messages.filter(m => !m.contacted).length },
                    { key: 'contacted', label: 'Contactados', count: messages.filter(m => m.contacted).length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === tab.key
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-white/5 border-white/10 text-silver/50 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${filter === tab.key ? 'bg-primary/20 text-primary' : 'bg-white/10 text-silver/40'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Message List */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="animate-spin material-symbols-outlined text-3xl text-primary">progress_activity</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center border border-dashed border-white/10 rounded-3xl">
                            <span className="material-symbols-outlined text-4xl text-silver/10 mb-4 block">inbox</span>
                            <p className="text-silver/40 text-sm font-bold">No hay mensajes {filter !== 'all' ? 'en esta categoría' : ''}.</p>
                        </div>
                    ) : (
                        filtered.map(msg => (
                            <button
                                key={msg.id}
                                onClick={() => setSelected(msg)}
                                className={`w-full text-left bg-surface/30 border rounded-2xl p-4 transition-all hover:border-primary/30 ${selected?.id === msg.id
                                        ? 'border-primary/50 bg-primary/5'
                                        : msg.contacted
                                            ? 'border-border/20 opacity-60'
                                            : 'border-border/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary text-sm">person</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{msg.name}</p>
                                            <p className="text-[10px] text-silver/50 font-mono truncate">{msg.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        {msg.contacted ? (
                                            <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase">
                                                Contactado
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full uppercase">
                                                Pendiente
                                            </span>
                                        )}
                                        <span className="text-[9px] text-silver/30 font-mono">
                                            {new Date(msg.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-silver/50 line-clamp-2 pl-10">{msg.message}</p>
                            </button>
                        ))
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-3">
                    {selected ? (
                        <div className="bg-surface/30 border border-border/50 rounded-3xl p-8 space-y-6 sticky top-8">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{selected.name}</h2>
                                        <p className="text-sm text-silver/50">
                                            {new Date(selected.created_at).toLocaleDateString('es-CO', {
                                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-silver/30 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black mb-1.5">Email</p>
                                    <a href={`mailto:${selected.email}`} className="text-sm text-primary font-mono hover:underline break-all">
                                        {selected.email}
                                    </a>
                                </div>
                                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black mb-1.5">Celular</p>
                                    <a href={`tel:${selected.phone}`} className="text-sm text-white font-mono hover:text-primary transition-colors">
                                        {selected.phone}
                                    </a>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                                <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black mb-3">Mensaje</p>
                                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold flex-1 justify-center ${selected.contacted
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-base">
                                        {selected.contacted ? 'check_circle' : 'pending'}
                                    </span>
                                    {selected.contacted ? 'Ya contactado' : 'Pendiente de contacto'}
                                </div>

                                <button
                                    onClick={() => toggleContacted(selected)}
                                    disabled={updatingId === selected.id}
                                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all border disabled:opacity-50 ${selected.contacted
                                            ? 'bg-white/5 border-white/10 text-silver hover:bg-white/10 hover:text-white'
                                            : 'bg-green-500 border-green-600 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                        }`}
                                >
                                    {updatingId === selected.id ? (
                                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">
                                            {selected.contacted ? 'undo' : 'check_circle'}
                                        </span>
                                    )}
                                    {selected.contacted ? 'Desmarcar' : 'Marcar como contactado'}
                                </button>

                                <a
                                    href={`mailto:${selected.email}?subject=Re: Contacto OnlyProgram&body=Hola ${selected.name},%0A%0A`}
                                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    Responder
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface/30 border border-dashed border-border/30 rounded-3xl flex flex-col items-center justify-center py-24 gap-4">
                            <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-silver/20">mark_email_unread</span>
                            </div>
                            <p className="text-silver/30 font-bold text-sm">Selecciona un mensaje para ver el detalle</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inbox;
