import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

// --- SUB-COMPONENTES UI ---

// 1. SAFETY GATE OVERLAY - Removed (unused)

// 2. SOCIAL BUTTON (Botón Genérico)
interface SocialButtonProps {
    type: string;
    url: string;
    label: string;
    sub?: string;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties; // Add style prop
}

const SocialButton: React.FC<SocialButtonProps> = ({ type, url, label, sub, onClick, style }) => {
    // Default styles as fallback
    const defaultStyles: Record<string, string> = {
        telegram: "bg-[#0088cc] border border-white/20 text-white shadow-[0_0_20px_rgba(0,136,204,0.3)]",
        instagram: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border border-white/20 shadow-[0_0_20px_rgba(253,29,29,0.3)]",
        tiktok: "bg-black/60 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]",
        onlyfans: "bg-[#00aff0]/10 border border-[#00aff0]/50 text-white shadow-[0_0_20px_rgba(0,175,240,0.2)] animate-pulse"
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

    return (
        <a
            href={onClick ? '#' : url}
            onClick={onClick}
            target={onClick ? undefined : "_blank"}
            rel="noreferrer"
            className={`relative w-full p-4 rounded-full flex items-center justify-center gap-3 transition-transform active:scale-95 ${!style ? defaultStyles[type] : ''}`}
            style={style} // Apply custom styles here (bg, color, radius)
        >
            {/* Icons positioning */}
            {(type === 'telegram' || type === 'instagram' || type === 'tiktok') && <span className="absolute left-6">{icon[type]}</span>}
            {type === 'custom' && <span className="absolute left-6">{icon['custom']}</span>}

            <div className="text-center leading-tight">
                <div className="font-bold uppercase tracking-wider text-sm">{label}</div>
                {sub && <div className="text-[10px] opacity-80 font-normal">{sub}</div>}
            </div>
        </a>
    );
};


// --- COMPONENTE PRINCIPAL ---

interface SmartLinkLandingProps {
    slug?: string;
}

const SmartLinkLanding: React.FC<SmartLinkLandingProps> = ({ slug: propSlug }) => {
    const params = useParams<{ slug: string }>();
    const slug = propSlug || params.slug;
    const [linkData, setLinkData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const [isSocialApp, setIsSocialApp] = useState(false);  // Unused

    useEffect(() => {
        console.log("SmartLinkLanding Mounted. Slug:", slug);

        // 1. Detectar Social App (Client Side Check)
        // Social app detection - unused currently
        // const ua = navigator.userAgent.toLowerCase();
        // const social = /tiktok|instagram|fb_iab|threads|fban|fbav|musically/.test(ua);
        // setIsSocialApp(social);

        // 2. Fetch Data
        const fetchData = async () => {
            if (!slug) {
                console.warn("No slug provided");
                setLoading(false);
                return;
            }

            console.log("Fetching data for slug:", slug);
            const { data, error } = await supabase
                .from('smart_links')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error("Error fetching link data:", error);
            }

            if (data) {
                console.log("Link Data loaded:", data);
                setLinkData(data);
            } else {
                console.warn("No data found for slug:", slug);
            }
            setLoading(false);
        };

        fetchData();

        // 3. Realtime Subscription
        const channel = supabase
            .channel(`realtime-link-${slug}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'smart_links',
                    filter: `slug=eq.${slug}`
                },
                (payload) => {
                    console.log("Realtime update received:", payload);
                    if (payload.new) {
                        setLinkData(payload.new as any);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [slug]);



    // Helper to render buttons
    const renderButtons = (buttons: any[]) => {
        if (!buttons) return null;
        return buttons.map((btn: any) => {
            if (!btn.isActive) return null;
            return (
                <SocialButton
                    key={btn.id}
                    type={btn.type}
                    url={btn.url}
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

    if (loading) return <div className="bg-black text-white h-screen flex items-center justify-center">Loading...</div>;
    if (!linkData) return <div className="bg-black text-white h-screen flex items-center justify-center">Link not found</div>;

    const template = linkData.config?.template || 'minimal';
    const theme = linkData.config?.theme;
    const bgType = theme?.backgroundType || 'solid';
    const bgStart = theme?.backgroundStart || '#000000';
    const bgEnd = theme?.backgroundEnd || '#1a1a1a';
    const overlayOpacity = theme?.overlayOpacity ?? 40;

    // 1. FULL TEMPLATE
    if (template === 'full') {
        return (
            <div className="min-h-screen relative bg-black text-white flex flex-col">
                {linkData.photo && (
                    <div className="absolute inset-0 z-0">
                        <img src={linkData.photo} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black transition-all" style={{ opacity: overlayOpacity / 100 }}></div>
                    </div>
                )}
                <div className="relative z-10 flex-1 flex flex-col justify-end pb-12 px-6 text-center">
                    <h1 className="text-4xl font-black mb-6 drop-shadow-lg tracking-tight">
                        {linkData.display_name || linkData.name || linkData.title}
                    </h1>
                    <div className="flex flex-col gap-3">
                        {renderButtons(linkData.buttons)}
                    </div>
                </div>
            </div>
        );
    }

    // 2. SPLIT TEMPLATE
    if (template === 'split') {
        return (
            <div className="flex flex-col h-screen text-white" style={{ background: bgType === 'gradient' ? `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` : bgStart }}>
                <div className="h-1/2 w-full relative z-0 shrink-0">
                    {linkData.photo ? (
                        <img src={linkData.photo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-6xl opacity-20">person</span></div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-6 relative z-10 flex flex-col">
                    <div className="mb-6 text-left">
                        <h1 className="text-3xl font-bold leading-tight">{linkData.display_name || linkData.name || linkData.title}</h1>
                        <p className="text-white/70 text-sm mt-1">@{linkData.slug?.replace(/-/g, '')}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        {renderButtons(linkData.buttons)}
                    </div>
                </div>
            </div>
        );
    }

    // 3. MINIMAL / DEFAULT TEMPLATE
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden text-white" style={{ background: bgType === 'gradient' ? `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` : bgStart }}>

            {/* Profile Content */}
            <div className="relative z-10 px-6 max-w-md mx-auto w-full text-center py-12 flex flex-col justify-center min-h-screen">

                {/* Avatar */}
                {linkData.photo && (
                    <div
                        className="w-24 h-24 rounded-full bg-gray-800 mb-6 overflow-hidden border-4 shadow-xl mx-auto"
                        style={{ borderColor: theme?.pageBorderColor || '#333333' }}
                    >
                        <img src={linkData.photo} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                )}

                <h1 className="text-3xl font-black mb-1 drop-shadow-lg tracking-tight">
                    {linkData.display_name || linkData.name || linkData.title}
                </h1>

                <p className="text-[#00aff0] font-medium mb-8 text-sm drop-shadow-md">
                    {linkData.subtitle || 'Verified Profile'}
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto">
                    {renderButtons(linkData.buttons)}
                </div>
            </div>
        </div>
    );
};

export default SmartLinkLanding;
