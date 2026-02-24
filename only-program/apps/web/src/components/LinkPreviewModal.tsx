
interface LinkConfig {
    theme: {
        backgroundType?: 'solid' | 'gradient' | 'blur';
        backgroundStart?: string;
        backgroundEnd?: string;
    } | string;
    buttons: any[];
    profile: {
        image: string | null;
        title: string;
        bio: string;
    };
    socials: any[];
}

interface LinkPreviewModalProps {
    config: LinkConfig;
    onClose: () => void;
}

const getPreviewBackground = (theme: LinkConfig['theme'], profilePhoto: string | null): React.CSSProperties => {
    if (!theme || typeof theme === 'string') {
        return { background: 'linear-gradient(to bottom right, #07071a, #1a1a1a)' };
    }
    const bgType = theme.backgroundType || 'solid';
    const bgStart = theme.backgroundStart || '#000000';
    const bgEnd = theme.backgroundEnd || '#1a1a1a';

    if (bgType === 'solid') return { backgroundColor: bgStart };
    if (bgType === 'gradient') return { background: `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` };
    if (bgType === 'blur') return {
        backgroundColor: bgStart,
        backgroundImage: profilePhoto ? `url(${profilePhoto})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
    };
    return { background: `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` };
};

const ButtonIcon = ({ type }: { type: string }) => {
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
        custom: <span className="material-symbols-outlined text-xl">link</span>
    };
    return icon[type] || icon.custom;
};

const LinkPreviewModal = ({ config, onClose }: LinkPreviewModalProps) => {

    const backgroundStyle = getPreviewBackground(config.theme, config.profile.image);
    const theme = typeof config.theme === 'string' ? null : config.theme;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-50"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            <div className="relative w-full max-w-[375px] h-[80vh] bg-black rounded-[3rem] border-8 border-[#333] overflow-hidden shadow-2xl flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-xl z-20"></div>

                {/* Content with real theme background */}
                <div
                    className="flex-1 overflow-y-auto no-scrollbar relative"
                    style={backgroundStyle}
                >
                    {theme?.backgroundType === 'blur' && (
                        <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />
                    )}

                    <div className="relative z-10 flex flex-col items-center pt-16 pb-12 px-6 text-center min-h-full">

                        {/* Avatar */}
                        {config.profile.image && (
                            <div className="w-24 h-24 rounded-full bg-gray-800 mb-6 overflow-hidden border-4 shadow-xl mx-auto"
                                style={{ borderColor: (theme as any)?.pageBorderColor || '#333333' }}>
                                <img src={config.profile.image} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Text */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black mb-1 drop-shadow-lg tracking-tight uppercase text-white">
                                {config.profile.title || 'Sin Título'}
                            </h2>
                            <p className="text-[#00aff0] font-bold text-sm drop-shadow-md">
                                {config.profile.bio}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="w-full max-w-[300px] space-y-3 mx-auto">
                            {config.buttons.map((btn: any) => (
                                <a
                                    key={btn.id}
                                    href={btn.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative w-full p-4 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95"
                                    style={{
                                        backgroundColor: btn.color || 'rgba(255, 255, 255, 0.1)',
                                        color: btn.text_color || btn.textColor || '#ffffff',
                                        borderRadius: btn.border_radius ? `${btn.border_radius}px` : '9999px',
                                        opacity: (btn.opacity || 100) / 100
                                    }}
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <span className="absolute left-6">
                                        <ButtonIcon type={btn.type} />
                                    </span>
                                    <div className="text-center leading-tight relative z-10">
                                        <div className="font-bold uppercase tracking-wider text-sm">{btn.title}</div>
                                        {btn.subtitle && <div className="text-[10px] opacity-80 font-normal">{btn.subtitle}</div>}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Simulated Phone home bar */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>
            </div>
        </div>
    );
};

export default LinkPreviewModal;
