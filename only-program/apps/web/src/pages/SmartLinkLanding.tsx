import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useTranslation } from "@/contexts/I18nContext";
import { API_URL } from "../services/apiConfig";
import { trackEvent } from "../services/analytics.service";

// --- SUB-COMPONENTES UI (PORTADOS DEL SISTEMA ANTERIOR) ---

// 1. VIP LOADING SCREEN (Meta Bypass)
const LegacyLoadingScreen = ({ url }: { url?: string }) => {
  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col justify-center items-center p-8 text-white"
      style={{ backgroundColor: "#0a0104" }}
    >
      <div className="relative flex justify-center items-center mb-10 mt-[-50px]">
        <div className="w-[100px] h-[100px] rounded-full border-[3px] border-[#3a0b1e] border-t-[#ff2a8a] animate-spin"></div>
        <div className="absolute text-[#ff2a8a] text-[12px] font-bold tracking-[0.2em] ml-1">
          VIP
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4 tracking-wide text-white">
        Acceso <span className="text-[#ff2a8a]">VIP</span>
      </h1>
      
      <p className="text-[15px] opacity-70 mb-14 font-medium text-[#f0e6ea]">
        Conectando fuera de Instagram...
      </p>

      <a 
        href={url || "#"} 
        onClick={(e) => {
           if (!url) e.preventDefault();
        }}
        className="w-full max-w-[320px] py-[18px] bg-[#7a193d] rounded-[20px] text-[13px] font-bold tracking-[0.15em] text-[#ffacca] text-center shadow-[0_15px_40px_rgba(255,42,138,0.15)] transition-transform hover:scale-105"
      >
        ENTRAR A MI PERFIL ↗
      </a>
    </div>
  );
};

// 2. LEGACY SAFETY GATE (Basado en #safety-gate de searchEngine.ejs)
const LegacySafetyGate = () => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[10000] bg-[rgba(20,5,15,0.65)] backdrop-blur-[25px] flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-gradient-to-br from-[rgba(60,10,40,0.85)] to-[rgba(30,5,20,0.9)] border border-[rgba(255,100,180,0.3)] p-10 rounded-[28px] max-w-[360px] w-full text-center text-white shadow-[0_20px_60px_rgba(255,0,128,0.25)] relative">
        {/* Flecha Animada */}
        <div className="absolute -top-2 right-4 text-[2.8rem] text-[#ff3399] rotate-[-30deg] animate-bounce drop-shadow-[0_0_15px_#ff3399] cursor-default pointer-events-none">
          ➚
        </div>

        <span className="text-6xl mb-4 block drop-shadow-[0_0_20px_rgba(255,50,150,0.6)] animate-pulse">
          💋
        </span>

        <div className="text-2xl font-extrabold bg-gradient-to-r from-[#ff66b2] to-[#ffccdd] bg-clip-text text-transparent uppercase mb-2 tracking-wide">
          {t("landing.privateAccess")}
        </div>

        <p className="text-[#ffd9e6] mb-8 leading-relaxed font-medium">
          {t("landing.safetyGateTitle")}
        </p>

        <div className="bg-white/10 rounded-[18px] p-5 text-left mb-6 border border-white/15">
          <div className="flex gap-3 mb-4 items-center text-sm">
            <div className="min-w-[28px] h-7 rounded-full bg-[#ff3399] flex items-center justify-center font-extrabold shadow-[0_0_15px_rgba(255,51,153,0.6)]">
              1
            </div>
            <div>{t("landing.step1")}</div>
          </div>
          <div className="flex gap-3 items-center text-sm">
            <div className="min-w-[28px] h-7 rounded-full bg-[#ff3399] flex items-center justify-center font-extrabold shadow-[0_0_15px_rgba(255,51,153,0.6)]">
              2
            </div>
            <div>{t("landing.step2")}</div>
          </div>
        </div>

        <img
          src="https://fptwztporosusnwcwvny.supabase.co/storage/v1/object/public/public-fotos/gitonly.png"
          className="w-full rounded-xl border border-white/10 mb-5 animate-pulse"
          alt="Tutorial"
        />

        <div className="text-[0.75rem] text-[#ff99cc] uppercase tracking-[1.5px] opacity-80">
          SECURE GATEWAY v2.0
        </div>
      </div>
    </div>
  );
};

// 2.5 NOT CONFIGURED GATE (Para tráfico de Meta sin escudo)
const NotConfiguredGate = () => {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1a0505] to-[#2a0808] border border-red-500/30 p-8 sm:p-10 rounded-[32px] max-w-[400px] w-full text-center text-white shadow-[0_0_80px_rgba(255,0,0,0.15)] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/10 blur-[50px] pointer-events-none"></div>

        <div className="h-20 w-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-3xl border border-red-500/30 animate-ping opacity-20"></div>
          <span className="material-symbols-outlined text-5xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            gpp_bad
          </span>
        </div>

        <h2 className="text-2xl font-black bg-gradient-to-r from-white to-silver/70 bg-clip-text text-transparent uppercase tracking-tight mb-3">
          Acceso Restringido
        </h2>

        <p className="text-silver/70 text-[15px] leading-relaxed mb-8 px-2">
          Este enlace no está configurado correctamente para recibir tráfico desde esta red social. Por favor contacta a soporte para verificar tu plan.
        </p>

        <a
          href="https://t.me/blackproonlyfans"
          target="_blank"
          rel="noreferrer"
          className="group relative w-full flex items-center justify-center gap-3 bg-[#0088cc] hover:bg-[#0099e6] text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(0,136,204,0.3)] hover:shadow-[0_0_30px_rgba(0,136,204,0.5)] hover:-translate-y-1 overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[buttonShine_1s_ease-in-out]"></div>
          </div>
          
          <svg className="w-6 h-6 fill-current relative z-10" viewBox="0 0 24 24">
            <path d="M9.04 15.44 8.9 19.6c.54 0 .77-.23 1.05-.5l2.52-2.4 5.23 3.82c.96.53 1.65.25 1.9-.88l3.44-16.2c.33-1.54-.56-2.14-1.5-1.79L1.12 9.2c-1.48.58-1.46 1.42-.27 1.79l4.9 1.53L18.7 5.4c.61-.4 1.17-.18.71.22Z" />
          </svg>
          <span className="relative z-10 tracking-wide">Contactar a Soporte</span>
        </a>

        <div className="mt-6 text-[10px] text-silver/30 font-mono tracking-widest uppercase">
          Error Code: SEC_META_SHIELD_REQ
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

const SocialButton: React.FC<SocialButtonProps> = ({
  type,
  url,
  label,
  sub,
  onClick,
  style,
}) => {
  const defaultStyles: Record<string, string> = {
    telegram:
      "bg-[#0088cc] border border-white/20 text-white shadow-[0_0_20px_rgba(0,136,204,0.3)]",
    instagram:
      "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border border-white/20 shadow-[0_0_20px_rgba(253,29,29,0.3)]",
    tiktok:
      "bg-black/60 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    onlyfans:
      "bg-[#00aff0]/15 border border-[#00aff0]/50 text-white shadow-[0_0_20px_rgba(0,175,240,0.2)]",
  };

  const icon: Record<string, JSX.Element | null> = {
    telegram: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M9.04 15.44 8.9 19.6c.54 0 .77-.23 1.05-.5l2.52-2.4 5.23 3.82c.96.53 1.65.25 1.9-.88l3.44-16.2c.33-1.54-.56-2.14-1.5-1.79L1.12 9.2c-1.48.58-1.46 1.42-.27 1.79l4.9 1.53L18.7 5.4c.61-.4 1.17-.18.71.22Z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9zM17.8 6.2a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1z" />
      </svg>
    ),
    tiktok: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    onlyfans: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
      </svg>
    ),
    custom: <span className="material-symbols-outlined text-xl">link</span>,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    } else if (url && url !== "#") {
      // Apertura ciega mediante JS (Evade analizadores estáticos de código fuente de Meta)
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`group relative w-full p-4 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 ${!style ? defaultStyles[type] : ""}`}
      style={style}
    >
      {/* Shimmer effect for OF */}
      {type === "onlyfans" && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute top-[-50%] left-[-100%] w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-25 animate-[buttonShine_4s_infinite]"></div>
        </div>
      )}

      {(type === "telegram" || type === "instagram" || type === "tiktok") && (
        <span className="absolute left-6">{icon[type]}</span>
      )}
      {type === "custom" && (
        <span className="absolute left-6">{icon["custom"]}</span>
      )}

      <div className="text-center leading-tight relative z-10">
        <div className="font-bold uppercase tracking-wider text-sm">
          {label}
        </div>
        {sub && <div className="text-[10px] opacity-80 font-normal">{sub}</div>}
      </div>
    </a>
  );
};

// --- COMPONENTE PRINCIPAL ---

const SmartLinkLanding: React.FC<{ slug?: string }> = ({ slug: propSlug }) => {
  const { t } = useTranslation();
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug;
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overlayType, setOverlayType] = useState<'none' | 'social_app' | 'upgrade_required'>('none');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [metaBypassUrl, setMetaBypassUrl] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      // ── Detectar dominio personalizado ──────────────────────────
      // Si el hostname no es el dominio principal de la app, buscar el link
      // por custom_domain en el backend antes de continuar.
      const APP_DOMAINS = ["localhost", "onlyprogramlink.com", "onlyprogram.com"];
      const hostname = window.location.hostname;
      const isCustomDomain = !APP_DOMAINS.some(
        (d) => hostname === d || hostname.endsWith("." + d)
      );

      let resolvedSlug = slug;

      if (isCustomDomain) {
        try {
          const domainRes = await fetch(`${API_URL}/gate/domain/${encodeURIComponent(hostname)}`);
          const domainJson = await domainRes.json().catch(() => null);
          if (domainJson?.slug) {
            resolvedSlug = domainJson.slug;
            // Aplicar acción de tráfico si viene en la respuesta
            if (domainJson.traffic?.action === "show_overlay") {
              setOverlayType(domainJson.traffic.type === 'upgrade_required' ? 'upgrade_required' : 'social_app');
            } else if (domainJson.traffic?.action === "meta_bypass" && domainJson.u) {
              setMetaBypassUrl(domainJson.u);
              setIsRedirecting(true);
              setTimeout(() => {
                const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
                if (isIOS) {
                  window.location.replace(`x-safari-${domainJson.u}`);
                  setTimeout(() => window.location.href = domainJson.u, 300);
                } else {
                  const cleanUrl = domainJson.u.replace(/^https?:\/\//, "");
                  window.location.replace(`intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`);
                  setTimeout(() => window.location.href = domainJson.u, 300);
                }
              }, 800);
            } else if (domainJson.traffic?.action === "direct_redirect" && domainJson.u) {
              window.location.replace(domainJson.u);
              return;
            }
          } else {
            // Dominio no encontrado en la DB
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Domain resolution error:", err);
          setLoading(false);
          return;
        }
      } else {
        // Flujo normal por slug
        if (!resolvedSlug) {
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${API_URL}/gate/${resolvedSlug}`);
          const json = await response.json().catch(() => null);
          if (json?.data) {
            const payload = JSON.parse(atob(json.data));
            if (payload.traffic?.action === "show_overlay") {
              setOverlayType(payload.traffic.type === 'upgrade_required' ? 'upgrade_required' : 'social_app');
            } else if (payload.traffic?.action === "meta_bypass" && payload.u) {
              // ── META BYPASS ──────────────────────────────────────────
              // Force external browser aggressively using intent / location replace
              setMetaBypassUrl(payload.u);
              setIsRedirecting(true); // Muestra la LegacyLoadingScreen (Logo girando)

              setTimeout(() => {
                const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
                // En iOS a menudo se logra forzar un intent de este tipo para saltar a Safari
                if (isIOS) {
                  // Agresivo en iOS para forzar la pantalla de "Continue"
                  window.location.replace(`x-safari-${payload.u}`);
                  setTimeout(() => {
                    window.location.href = payload.u;
                  }, 300);
                } else {
                  // Android Intent hacia un intent:// seguro que obliga abrir Chrome
                  const cleanUrl = payload.u.replace(/^https?:\/\//, "");
                  window.location.replace(`intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`);
                  setTimeout(() => {
                     window.location.href = payload.u;
                  }, 300);
                }
              }, 800);
            } else if (payload.traffic?.action === "direct_redirect" && payload.u) {
              // ── TIKTOK DIRECT_REDIRECT / CLEAN TRAFFIC ───────────────
              // Si el tráfico ya está limpio (e.g. Safari abriendo el enlace desde TikTok), auto-redirigir inmediatamente
              window.location.replace(payload.u);
              // Avoid rendering UI
              return;
            }
          }
        } catch (err) {
          console.error("Traffic check error:", err);
        }
      }

      // ── Cargar data visual del link ──────────────────────────────
      let query = supabase.from("smart_links").select(`
                *,
                smart_link_buttons (*)
            `);
      if (resolvedSlug && resolvedSlug.length > 20 && resolvedSlug.includes("-")) {
        query = query.or(`slug.eq.${resolvedSlug},id.eq.${resolvedSlug}`);
      } else {
        query = query.eq("slug", resolvedSlug);
      }

      try {
        const { data } = await query.single();
        if (data) {
          setLinkData(data);
          // Track page_view (fire-and-forget)
          trackEvent({ linkId: data.id, buttonType: 'page_view' });
        }
      } catch (err) {
        console.error("Error loading link data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`realtime-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "smart_links",
          filter: `slug=eq.${slug}`,
        },
        (p: any) => setLinkData(p.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const handleUnlockPremium = () => {
    setIsRedirecting(true);
    // Lógica portada de legacy loading.ejs
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/gate/${slug}`);
        const json = await response.json().catch(() => null);
        if (json?.data) {
          const payload = JSON.parse(atob(json.data));

          if (payload.u) {
            // Tráfico PERMITIDO -> Redirigir
            window.location.href = payload.u;
          } else if (payload.traffic?.action === "show_overlay") {
            // Tráfico SOSPECHOSO -> Mostrar instrucciones (detener carga)
            setIsRedirecting(false);
            setOverlayType(payload.traffic.type === 'upgrade_required' ? 'upgrade_required' : 'social_app');
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
  if (!linkData)
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        {t("landing.linkNotFound")}
      </div>
    );

  const config =
    typeof linkData.config === "string"
      ? JSON.parse(linkData.config)
      : linkData.config;
  const theme = config?.theme;
  const bgType = theme?.backgroundType || "solid";
  const bgStart = theme?.backgroundStart || "#000000";
  const bgEnd = theme?.backgroundEnd || "#1a1a1a";

  // Read real user-entered data from config.profile (fallback to table columns)
  const displayName =
    config?.profile?.title ||
    linkData.display_name ||
    linkData.name ||
    linkData.title ||
    "Verified Profile";
  const displayBio = config?.profile?.bio || linkData.subtitle || "";
  const displayPhoto = config?.profile?.image || linkData.photo;

  // Build background style from theme
  const backgroundStyle: React.CSSProperties =
    bgType === "gradient"
      ? { background: `linear-gradient(to bottom, ${bgStart}, ${bgEnd})` }
      : bgType === "blur"
        ? {
            backgroundColor: bgStart,
            backgroundImage: displayPhoto ? `url(${displayPhoto})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : { backgroundColor: bgStart };

  const renderButtons = () => {
    const finalButtons = (linkData.smart_link_buttons || []).sort(
      (a: any, b: any) => (a.order || 0) - (b.order || 0),
    );

    if (finalButtons.length === 0) return null;

    return finalButtons.map((btn: any) => {
      const isActive = btn.is_active ?? btn.isActive ?? true;
      if (!isActive) return null;

      // Especial OnlyFans -> Redirect Flow
      if (btn.type === "onlyfans") {
        return (
          <SocialButton
            key={btn.id}
            type="onlyfans"
            url="#"
            label={btn.title || t("landing.unlockPremium")}
            sub={btn.subtitle || btn.sub || t("landing.directAccess")}
            onClick={() => {
              trackEvent({ linkId: linkData.id, buttonId: btn.id, buttonType: 'onlyfans' });
              handleUnlockPremium();
            }}
          />
        );
      }

      // --- DETECCIÓN DE GAMA (Alta vs Baja) ---
      const isHighEndDevice = () => {
        try {
          const ua = window.navigator.userAgent.toLowerCase();
          
          // Gama alta Apple (iPhone/iPad newer versions usually report higher os)
          const isPremiumApple = /iphone|ipad/i.test(ua) && 
            (/os 16|os 17|os 18/i.test(ua) || (window.screen.width * window.screen.height) >= (390 * 844));
            
          // Gama alta Android (S23, S24, Fold, Ultra, Pro, Pixel 8/9, etc)
          const isPremiumAndroid = /pro|ultra|max|s23|s24|s25|fold|flip|pixel 8|pixel 9/i.test(ua);
          
          // Por Hardware: 8 nucleos o más + 6GB RAM o más suele ser un buen flagship moderno
          const cores = window.navigator.hardwareConcurrency || 4;
          const ram = (window.navigator as any).deviceMemory || 4;
          const isPremiumHardware = cores >= 8 && ram >= 6;

          return isPremiumApple || isPremiumAndroid || isPremiumHardware;
        } catch (e) {
          return false;
        }
      };

      const isHighTier = isHighEndDevice();

      // Botón estándar (incluyendo Telegram con Rotación)
      const rotatorActive = btn.rotator_active ?? btn.rotatorActive;
      const deviceRedirects = btn.device_redirects ?? btn.deviceRedirects;

      let finalUrl = btn.url;

      // Aplicar targeting por gama si existe el link específico
      if (deviceRedirects && Object.keys(deviceRedirects).length > 0) {
        // ios en la DB representa "Gama Alta" (Diamante) y android representa "Gama Estandar" (Celular)
        if (isHighTier && deviceRedirects.ios) {
          finalUrl = deviceRedirects.ios; 
        } else if (!isHighTier && deviceRedirects.android) {
          finalUrl = deviceRedirects.android; 
        }
      }

      if (btn.type === "telegram" && rotatorActive) {
        finalUrl = `${API_URL}/t/${slug}`;
      }

      return (
        <div
          key={btn.id}
          onClick={() => trackEvent({ linkId: linkData.id, buttonId: btn.id, buttonType: btn.type || 'custom' })}
        >
          <SocialButton
            type={btn.type}
            url={finalUrl}
            label={btn.title}
            sub={
              btn.subtitle ||
              btn.sub ||
              (btn.type === "telegram"
                ? t("landing.joinChannel")
                : t("landing.followMe"))
            }
            style={{
              backgroundColor: btn.color,
              color: btn.text_color || btn.textColor,
              borderRadius: btn.border_radius || btn.borderRadius,
              opacity: (btn.opacity || 100) / 100,
            }}
          />
        </div>
      );
    });
  };

  const template =
    config?.template || (config?.landingMode === "full" ? "full" : "minimal");
  const profileImageSize =
    config?.profileImageSize || (template === "full" ? 100 : 96);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center relative overflow-x-hidden text-white"
      style={backgroundStyle}
    >
      {/* Legacy Blur overlay for blur type (Full window) */}
      {bgType === "blur" && (
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 z-0" />
      )}

      {/* MOBILE-WIDTH CONTAINER FOR PC */}
      <div className="relative w-full max-w-[480px] flex-1 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] border-x border-white/10 bg-black/20 z-10">
        {/* FULL MODE BACKGROUND IMAGE (Contained in mobile width) */}
        {template === "full" && displayPhoto && (
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full transition-all duration-300">
              <img src={displayPhoto} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 bg-black transition-all"
                style={{ opacity: (theme?.overlayOpacity || 40) / 100 }}
              />
            </div>
          </div>
        )}

        {/* SPLIT MODE HEADER */}
        {template === "split" && displayPhoto && (
          <div className="absolute top-0 left-0 w-full h-1/2 z-0">
            <img src={displayPhoto} className="w-full h-full object-cover" />
          </div>
        )}

        <div
          className={`relative z-10 px-6 w-full text-center py-12 flex flex-col min-h-screen ${template === "full" ? "justify-end pb-24" : "justify-center"}`}
        >
          {/* MINIMAL MODE AVATAR */}
          {template === "minimal" && displayPhoto && (
            <div
              className="w-24 h-24 rounded-full bg-gray-800 mb-6 overflow-hidden border-4 shadow-xl mx-auto flex-shrink-0"
              style={{
                borderColor: theme?.pageBorderColor || "#333333",
                width: `${profileImageSize}px`,
                height: `${profileImageSize}px`,
              }}
            >
              <img
                src={displayPhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-10">
            <h1 className="text-4xl font-black mb-2 drop-shadow-lg tracking-tight uppercase">
              {displayName}
            </h1>

            <p className="text-[#00aff0] font-bold text-base drop-shadow-md">
              {displayBio}
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-[320px] mx-auto pb-10">
            {renderButtons()}
          </div>
        </div>
      </div>

      {/* Overlays */}
      {isRedirecting && <LegacyLoadingScreen url={metaBypassUrl} />}
      {overlayType === 'social_app' && <LegacySafetyGate />}
      {overlayType === 'upgrade_required' && <NotConfiguredGate />}

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
