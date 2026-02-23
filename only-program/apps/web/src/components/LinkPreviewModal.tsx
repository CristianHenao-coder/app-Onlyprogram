
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

const getPreviewBackground = (theme: LinkConfig['theme']): React.CSSProperties => {
    if (!theme || typeof theme === 'string') {
        return { background: 'linear-gradient(to bottom right, #07071a, #1a1a1a)' };
    }
    const bgType = theme.backgroundType || 'solid';
    const bgStart = theme.backgroundStart || '#000000';
    const bgEnd = theme.backgroundEnd || '#1a1a1a';

    if (bgType === 'solid') return { backgroundColor: bgStart };
    if (bgType === 'gradient') return { background: `linear-gradient(to bottom right, ${bgStart}, ${bgEnd})` };
    return { background: `linear-gradient(to bottom right, ${bgStart}, ${bgEnd})` };
};

const LinkPreviewModal = ({ config, onClose }: LinkPreviewModalProps) => {

    const backgroundStyle = getPreviewBackground(config.theme);

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
                    <div className="flex flex-col items-center pt-16 pb-12 px-6 text-center space-y-6 min-h-full">

                        {/* Avatar */}
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/10 shadow-xl">
                                {config.profile.image ? (
                                    <img src={config.profile.image} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-white/40">person</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">{config.profile.title || 'Sin Título'}</h2>
                            <p className="text-sm text-white/70">{config.profile.bio}</p>
                        </div>

                        {/* Buttons */}
                        <div className="w-full space-y-4">
                            {config.buttons.map((btn: any) => (
                                <a
                                    key={btn.id}
                                    href={btn.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-white font-medium transition-all text-center"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    {btn.title}
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
