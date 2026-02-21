import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

// --- SUB-COMPONENTES UI (PORTADOS DEL SISTEMA ANTERIOR) ---

// 1. LEGACY LOADING SCREEN (Basado en loading.ejs)
const LegacyLoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[10001] flex flex-col justify-center items-center p-10 overflow-hidden text-white"
            style={{ background: 'radial-gradient(circle at top, #ff2a8a, #3a002a, #150013)' }}>
            <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex justify-center items-center shrink-0">
                    <div className="w-40 h-40 rounded-full relative flex justify-center items-center shadow-[0_0_35px_rgba(255,42,138,0.8)] bg-white">
                        <div className="absolute inset-[-4px] rounded-full border-[6px] border-white/20 border-t-[#ff2a8a] border-r-[#ff2a8a] animate-spin"></div>
                        <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/logoOnly.png"
                            alt="Logo" className="w-[65%] h-[65%] object-contain relative" />
                    </div>
                </div>
                <div className="flex-1 text-center md:text-right">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-wide">VERIFICANDO...</h1>
                    <p className="text-lg md:text-xl opacity-90">Por favor espera un momento mientras establecemos una conexión segura.</p>
                </div>
            </div>
        </div>
    );
};

// 2. LEGACY SAFETY GATE (Basado en #safety-gate de searchEngine.ejs)
const LegacySafetyGate = () => {
    return (
        <div className="fixed inset-0 z-[10000] bg-[rgba(20,5,15,0.65)] backdrop-blur-[25px] flex items-center justify-center p-5 overflow-y-auto">
            <div className="bg-gradient-to-br from-[rgba(60,10,40,0.85)] to-[rgba(30,5,20,0.9)] border border-[rgba(255,100,180,0.3)] p-10 rounded-[28px] max-w-[360px] w-full text-center text-white shadow-[0_20px_60px_rgba(255,0,128,0.25)] relative">

                {/* Flecha Animada */}
                <div className="absolute -top-2 right-4 text-[2.8rem] text-[#ff3399] rotate-[-30deg] animate-bounce drop-shadow-[0_0_15px_#ff3399] cursor-default pointer-events-none">
                    ➚
                </div>

                <span className="text-6xl mb-4 block drop-shadow-[0_0_20px_rgba(255,50,150,0.6)] animate-pulse">💋</span>

                <div className="text-2xl font-extrabold bg-gradient-to-r from-[#ff66b2] to-[#ffccdd] bg-clip-text text-transparent uppercase mb-2 tracking-wide">
                    ACCESO PRIVADO
                </div>

                <p className="text-[#ffd9e6] mb-8 leading-relaxed font-medium">
                    El contenido está oculto por seguridad en esta aplicación. Sigue las instrucciones para entrar:
                </p>

                <div className="bg-white/10 rounded-[18px] p-5 text-left mb-6 border border-white/15">
                    <div className="flex gap-3 mb-4 items-center text-sm">
                        <div className="min-w-[28px] h-7 rounded-full bg-[#ff3399] flex items-center justify-center font-extrabold shadow-[0_0_15px_rgba(255,51,153,0.6)]">1</div>
                        <div>Toca los <b className="text-white">3 puntos</b> en la esquina superior derecha.</div>
                    </div>
                    <div className="flex gap-3 items-center text-sm">
                        <div className="min-w-[28px] h-7 rounded-full bg-[#ff3399] flex items-center justify-center font-extrabold shadow-[0_0_15px_rgba(255,51,153,0.6)]">2</div>
                        <div>Selecciona <b className="text-white">"Abrir en navegador"</b>.</div>
                    </div>
                </div>

                <img src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/gitonly.png"
                    className="w-full rounded-xl border border-white/10 mb-5 animate-pulse" alt="Tutorial" />

                <div className="text-[0.75rem] text-[#ff99cc] uppercase tracking-[1.5px] opacity-80">
                    SECURE GATEWAY v2.0
                </div>
            </div>
        </div>
    );
};

// 3. SOCIAL BUTTON (Botón Genérico)
interface SocialButtonProps {
    type: string;
    url: string;
    label: string;
    sub?: string;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
}

const SocialButton: React.FC<SocialButtonProps> = ({ type, url, label, sub, onClick, style }) => {
    const defaultStyles: Record<string, string> = {
        telegram: "bg-[#0088cc] border border-white/20 text-white shadow-[0_0_20px_rgba(0,136,204,0.3)]",
        instagram: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border border-white/20 shadow-[0_0_20px_rgba(253,29,29,0.3)]",
        tiktok: "bg-black/60 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]",
        onlyfans: "bg-[#00aff0]/15 border border-[#00aff0]/50 text-white shadow-[0_0_20px_rgba(0,175,240,0.2)]"
    };

    const icon: Record<string, JSX.Element | null> = {
        telegram: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9.04 15.44 8.9 19.6c.54 0 .77-.23 1.05-.5l2.52-2.4 5.23 3.82c.96.53 1.65.25 1.9-.88l3.44-16.2c.33-1.54-.56-2.14-1.5-1.79L1.12 9.2c-1.48.58-1.46 1.42-.27 1.79l4.9 1.53L18.7 5.4c.61-.4 1.17-.18.71.22Z" /></svg>
        ),
        instagram: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9zM17.8 6.2a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1z" /></svg>
        ),
        tiktok: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
        ),
        onlyfans: null,
        custom: <span className="material-symbols-outlined text-xl">link</span>
    };

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.preventDefault();
            onClick(e);
        }
    };

    return (
        <a
            href={onClick ? '#' : url}
            onClick={handleClick}
            target={onClick ? undefined : "_blank"}
            rel="noreferrer"
            className={`group relative w-full p-4 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 ${!style ? defaultStyles[type] : ''}`}
            style={style}
        >
            {/* Shimmer effect for OF */}
            {type === 'onlyfans' && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute top-[-50%] left-[-100%] w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-25 animate-[buttonShine_4s_infinite]"></div>
                </div>
            )}

            {(type === 'telegram' || type === 'instagram' || type === 'tiktok') && <span className="absolute left-6">{icon[type]}</span>}
            {type === 'custom' && <span className="absolute left-6">{icon['custom']}</span>}

            <div className="text-center leading-tight relative z-10">
                <div className="font-bold uppercase tracking-wider text-sm">{label}</div>
                {sub && <div className="text-[10px] opacity-80 font-normal">{sub}</div>}
            </div>
        </a>
    );
};

// --- COMPONENTE PRINCIPAL ---

const SmartLinkLanding: React.FC<{ slug?: string }> = ({ slug: propSlug }) => {
    const params = useParams<{ slug: string }>();
    const slug = propSlug || params.slug;
    const [linkData, setLinkData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSocialApp, setIsSocialApp] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                // Consultamos nuestro Backend Gate para obtener data + decisión de tráfico
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gate/${slug}`);
                const json = await response.json().catch(() => null);

                if (json?.data) {
                    const payload = JSON.parse(atob(json.data));
                    if (payload.traffic?.action === 'show_overlay') {
                        setIsSocialApp(true);
                    }
                }
            } catch (err) {
                console.error("Traffic check error:", err);
            }

            // Cargar data visual
            let query = supabase.from('smart_links').select('*');
            if (slug.length > 20 && slug.includes('-')) {
                query = query.or(`slug.eq.${slug},id.eq.${slug}`);
            } else {
                query = query.eq('slug', slug);
            }

            const { data } = await query.single();
            if (data) setLinkData(data);
            setLoading(false);
        };

        fetchData();

        const channel = supabase.channel(`realtime-${slug}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'smart_links', filter: `slug=eq.${slug}` }, (p) => setLinkData(p.new))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [slug]);

    const handleUnlockPremium = () => {
        setIsRedirecting(true);
        // Lógica portada de legacy loading.ejs
        setTimeout(async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/gate/${slug}`);
                const json = await response.json().catch(() => null);
                if (json?.data) {
                    const payload = JSON.parse(atob(json.data));

                    if (payload.u) {
                        // Tráfico PERMITIDO -> Redirigir
                        window.location.href = payload.u;
                    } else if (payload.traffic?.action === 'show_overlay') {
                        // Tráfico SOSPECHOSO -> Mostrar instrucciones (detener carga)
                        setIsRedirecting(false);
                        setIsSocialApp(true);
                    } else {
                        // Bot o Bloqueado -> Redirigir de nuevo a la landing (bucle seguro)
                        setIsRedirecting(false);
                        window.location.href = `/${slug}`;
                    }
                }
            } catch (e) {
                console.error("Redirect error:", e);
                setIsRedirecting(false);
            }
        }, 2000);
    };

    if (loading) return null; // El loader legacy se encarga de OF, para el perfil general usamos nada o un mini spinner
    if (!linkData) return <div className="bg-black text-white h-screen flex items-center justify-center">Link not found</div>;

    const config = typeof linkData.config === 'string' ? JSON.parse(linkData.config) : linkData.config;
    const theme = config?.theme;
    const bgType = theme?.backgroundType || 'solid';
    const bgStart = theme?.backgroundStart || '#000000';
    const bgEnd = theme?.backgroundEnd || '#1a1a1a';

    const renderButtons = (buttons: any[]) => {
        if (!buttons) return null;
        return buttons.map((btn: any) => {
            if (!btn.isActive) return null;

            // Especial OnlyFans -> Redirect Flow
            if (btn.type === 'onlyfans') {
                return (
                    <SocialButton
                        key={btn.id}
                        type="onlyfans"
                        url="#"
                        label="VER CONTENIDO EXCLUSIVO"
                        sub="Acceso Directo a Galería"
                        onClick={handleUnlockPremium}
                    />
                );
            }

            // Botón estándar (incluyendo Telegram con Rotación)
            const finalUrl = (btn.type === 'telegram' && btn.rotatorActive)
                ? `${import.meta.env.VITE_API_URL}/t/${slug}`
                : btn.url;

            return (
                <SocialButton
                    key={btn.id}
                    type={btn.type}
                    url={finalUrl}
                    label={btn.title}
                    sub={btn.sub || (btn.type === 'telegram' ? 'Join Channel' : 'Follow Me')}
                    style={{
                        backgroundColor: btn.color,
                        color: btn.textColor,
                        borderRadius: btn.borderRadius,
                        opacity: (btn.opacity || 100) / 100
                    }}
                />
            );
        });
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden text-white"
            style={{ background: bgType === 'gradient' ? `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` : bgStart }}>

            <div className="relative z-10 px-6 max-w-md mx-auto w-full text-center py-12 flex flex-col justify-center min-h-screen">
                {linkData.photo && (
                    <div className="w-24 h-24 rounded-full bg-gray-800 mb-6 overflow-hidden border-4 shadow-xl mx-auto"
                        style={{ borderColor: theme?.pageBorderColor || '#333333' }}>
                        <img src={linkData.photo} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                )}

                <h1 className="text-3xl font-black mb-1 drop-shadow-lg tracking-tight uppercase">
                    {linkData.display_name || linkData.name || 'Verified Profile'}
                </h1>

                <p className="text-[#00aff0] font-bold mb-8 text-sm drop-shadow-md">
                    {linkData.subtitle || 'MODELO PROFESIONAL'}
                </p>

                <div className="flex flex-col gap-3 w-full max-w-[300px] mx-auto">
                    {renderButtons(linkData.buttons)}
                </div>
            </div>

            {/* Overlays */}
            {isRedirecting && <LegacyLoadingScreen />}
            {isSocialApp && <LegacySafetyGate />}

            <style>{`
                @keyframes buttonShine {
                    0% { left: -120%; }
                    30% { left: 150%; }
                    100% { left: 150%; }
                }
                .rotate-25 { transform: rotate(25deg); }
            `}</style>
        </div>
    );
};

export default SmartLinkLanding;
