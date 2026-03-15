import React from "react";
import { LinkPage, getBackgroundStyle, FONT_MAP } from "./types";
import { useTranslation } from "@/contexts/I18nContext";
import instagramLogo from "@/assets/animations/instagram.png";
import tiktokLogo from "@/assets/animations/tik-tok.png";

// Icons Components (local to preview or could be shared)
const Icons = {
  Instagram: () => (
    <img
      src={instagramLogo}
      alt="Instagram"
      className="w-full h-full object-contain"
    />
  ),
  TikTok: () => (
    <img
      src={tiktokLogo}
      alt="TikTok"
      className="w-full h-full object-contain"
    />
  ),
  Telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" />
    </svg>
  ),
  OnlyFans: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
    </svg>
  ),
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>,
};

const SOCIAL_PRESETS: Record<string, any> = {
  instagram: { icon: <Icons.Instagram /> },
  tiktok: { icon: <Icons.TikTok /> },
  telegram: { icon: <Icons.Telegram /> },
  onlyfans: { icon: <Icons.OnlyFans /> },
  custom: { icon: <Icons.Custom /> },
};

interface PreviewPaneProps {
  currentPage: LinkPage;
  selectedButtonId: string | null;
  setSelectedButtonId: (id: string | null) => void;
  setShowButtonCreator: (show: boolean) => void;
  handleNextStep: () => void;
  onClose?: () => void;
  isMobileModal?: boolean;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({
  currentPage,
  selectedButtonId,
  setSelectedButtonId,
  setShowButtonCreator,
  handleNextStep,
  onClose,
  isMobileModal = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className={`${isMobileModal ? 'flex' : 'hidden lg:flex'} w-full lg:w-[400px] bg-[#020202] lg:border-l border-white/5 flex-col items-center justify-center relative p-4 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] h-full shrink-0 lg:order-last gap-8`}>
      {isMobileModal && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
      <div
        className="relative w-[320px] aspect-[9/19] bg-black rounded-[3rem] border-[6px] border-[#333] shadow-2xl overflow-hidden flex flex-col z-10 cursor-pointer transition-colors hover:border-[#444]"
        onClick={() => {
          setSelectedButtonId(null);
          setShowButtonCreator(false);
        }}
      >
        {(currentPage.landingMode as string) === "direct" ? (
          <div className="flex-1 bg-[#050505] flex flex-col items-center justify-center px-6 text-center z-20 relative">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-6 animate-[bounce_2s_infinite]">rocket_launch</span>
            <h3 className="text-white font-bold text-lg mb-2">Escudo Directo</h3>
            <p className="text-silver/60 text-xs mb-8 leading-relaxed">El usuario no verá un perfil público ni botones, el sistema intentará abrir la app destino de manera instantánea.</p>
            <div className="w-full bg-black/40 border border-red-500/20 rounded-xl p-3 text-left shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block mb-1">Destino Final</span>
              <p className="text-white text-xs truncate opacity-80">{currentPage.directUrl || "Configura el link a la izquierda..."}</p>
            </div>
          </div>
        ) : (
          <div
            className={`flex-1 overflow-y-auto custom-scrollbar relative flex flex-col ${currentPage.template === "full" ? "" : "transition-all duration-500"}`}
            style={getBackgroundStyle(currentPage) as React.CSSProperties}
          >
            {currentPage.theme.backgroundType === "blur" && (
              <div className="absolute inset-0 z-0 backdrop-blur-3xl bg-black/40 pointer-events-none"></div>
            )}
            {currentPage.template === "full" && (
              <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <div
                  className="relative transition-all duration-300 shadow-2xl"
                  style={{
                    width: `${currentPage.profileImageSize || 100}%`,
                    height: `${currentPage.profileImageSize || 100}%`,
                  }}
                >
                  <img
                    src={currentPage.profileImage}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black transition-all"
                    style={{
                      opacity: currentPage.theme.overlayOpacity / 100,
                    }}
                  ></div>
                </div>
              </div>
            )}
            {currentPage.template === "split" && (
              <div className="h-1/2 w-full relative z-0 shrink-0">
                <img
                  src={currentPage.profileImage}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div
              className={`min-h-full p-6 pt-12 flex flex-col relative z-20 ${currentPage.template === "split" ? "" : "items-center"} ${currentPage.template === "minimal" ? "justify-center" : ""} ${currentPage.template === "full" ? "justify-end pb-12" : ""}`}
            >
              {currentPage.template !== "full" && (
                <div
                  className={`mb-8 relative z-10 ${currentPage.template === "split" ? "mt-4 text-left" : "text-center"}`}
                >
                  {currentPage.template === "minimal" && (
                    <div
                      className="rounded-full bg-gray-800 mb-4 overflow-hidden border-4 shadow-xl mx-auto transition-all"
                      style={{
                        borderColor: currentPage.theme.pageBorderColor,
                        width: `${currentPage.profileImageSize || 96}px`,
                        height: `${currentPage.profileImageSize || 96}px`,
                      }}
                    >
                      <img
                        src={currentPage.profileImage}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg px-4">
                    {currentPage.profileName}
                  </h2>
                  <p className="text-white/70 text-xs mt-1 drop-shadow-md">
                    @{currentPage.name.toLowerCase().replace(/\s/g, "")}
                  </p>
                </div>
              )}
              {currentPage.template === "full" && (
                <div className="text-center mb-6">
                  <h2 className="text-white font-bold text-2xl leading-tight drop-shadow-lg px-4">
                    {currentPage.profileName}
                  </h2>
                </div>
              )}
              <div
                className={`w-full space-y-3 relative z-10 ${currentPage.template === "minimal" ? "max-w-[260px]" : ""}`}
              >
                {currentPage.buttons.map((btn) => (
                  <a
                    key={btn.id}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedButtonId(btn.id);
                      setShowButtonCreator(false);
                    }}
                    className={`block w-full py-3.5 px-6 font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 group backdrop-blur-sm cursor-pointer ${FONT_MAP[btn.font || "sans"]} ${selectedButtonId === btn.id ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-black" : ""}`}
                    style={{
                      backgroundColor:
                        currentPage.template === "full"
                          ? `${btn.color}CC`
                          : btn.color,
                      color: btn.textColor,
                      borderRadius: `${btn.borderRadius}px`,
                      opacity: btn.opacity / 100,
                    }}
                  >
                    {btn.type !== "custom" && (
                      <div className="w-5 h-5 fill-current">
                        {SOCIAL_PRESETS[btn.type]?.icon}
                      </div>
                    )}
                    {btn.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Siguiente Button (DESKTOP - Below Phone) */}
      {!isMobileModal && currentPage?.status === "draft" && (
        <div className="w-full max-w-[320px] animate-in slide-in-from-bottom-4 duration-700 hidden lg:block">
          <button
            onClick={handleNextStep}
            className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-[0_20px_40px_rgba(29,161,242,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            <span>{t("dashboard.links.nextStep")}</span>
            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewPane;
