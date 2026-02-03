import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/I18nContext";

// Si tu logo está en: apps/web/src/assets/img/logoinc.png
import logo from "../assets/img/logoinc.png";

type NavItem = { label: string; href: string };

export default function Navbar() {
  const { t, language, setLanguage } = useTranslation() as any;

  const items: NavItem[] = useMemo(
    () => [
      { label: t ? t("nav.home") : "Inicio", href: "#home" },
      { label: t ? t("nav.features") : "Funciones", href: "#features" },
      { label: t ? t("nav.pricing") : "Precios", href: "#pricing" },
      { label: t ? t("nav.testimonials") : "Testimonios", href: "#testimonials" },
    ],
    [t]
  );

  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  // cerrar dropdown al click afuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!langRef.current) return;
      if (!langRef.current.contains(e.target as any)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown as any);
  }, []);

  const currentLang = (language || "es").toLowerCase();

  const setLang = (lng: "es" | "en" | "fr") => {
    try {
      if (setLanguage) setLanguage(lng);
    } catch {
      // si por algo tu hook cambia, no rompemos la UI
    }
    setLangOpen(false);
  };

  return (
    <header
      className={[
        "fixed top-0 w-full z-50",
        "transition-all duration-300",
        scrolled ? "bg-[#0B0B0B]/70 backdrop-blur-xl border-b border-border" : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* BRAND */}
          <a href="#home" className="group flex items-center gap-3 min-w-0" aria-label="Only Program">
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-2 rounded-2xl bg-primary/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Logo container */}
              <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt="Only Program"
                  className="h-full w-full object-contain opacity-95 group-hover:opacity-100 transition-opacity"
                  draggable={false}
                />
              </div>
            </div>

            <div className="leading-tight min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-white font-extrabold tracking-tight text-lg sm:text-xl">ONLY</span>
                <span className="text-primary font-extrabold tracking-tight text-lg sm:text-xl">PROGRAM</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-silver/50 font-medium tracking-wide">
                Protección & Analíticas • Anti-bot
              </div>
            </div>
          </a>

          {/* NAV */}
          <nav className="hidden md:flex items-center gap-8">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="text-sm font-semibold text-silver/70 hover:text-white transition-colors"
              >
                {it.label}
              </a>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Language selector (desktop) */}
            <div className="hidden sm:block relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className={[
                  "inline-flex items-center gap-2",
                  "border border-border rounded-xl px-3 py-2",
                  "bg-surface/40 hover:bg-surface/55 transition-all",
                  "text-[11px] font-semibold",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-sm text-silver/70">language</span>
                <span className="text-silver/70">{currentLang.toUpperCase()}</span>
                <span className="material-symbols-outlined text-xs text-silver/60">expand_more</span>
              </button>

              <div
                className={[
                  "absolute right-0 mt-2 w-36 rounded-2xl border border-border bg-[#0B0B0B]/95 backdrop-blur-xl overflow-hidden",
                  "transition-all duration-200",
                  langOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-1 invisible",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setLang("es")}
                  className={[
                    "w-full text-left px-3 py-2 text-xs",
                    "hover:bg-primary/10 transition-colors",
                    currentLang === "es" ? "text-white" : "text-silver/70",
                  ].join(" ")}
                >
                  Español
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={[
                    "w-full text-left px-3 py-2 text-xs",
                    "hover:bg-primary/10 transition-colors",
                    currentLang === "en" ? "text-white" : "text-silver/70",
                  ].join(" ")}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang("fr")}
                  className={[
                    "w-full text-left px-3 py-2 text-xs",
                    "hover:bg-primary/10 transition-colors",
                    currentLang === "fr" ? "text-white" : "text-silver/70",
                  ].join(" ")}
                >
                  Français
                </button>
              </div>
            </div>

            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-silver/70 hover:text-white transition-colors"
            >
              {t ? t("nav.login") : "Iniciar Sesión"}
            </Link>

            <Link
              to="/register"
              className={[
                "inline-flex items-center justify-center",
                "h-10 px-4 rounded-xl",
                "bg-primary text-white font-bold text-sm",
                "hover:bg-primary-dark transition-all",
                "shadow-lg shadow-primary/20",
              ].join(" ")}
            >
              {t ? t("nav.signup") : "Crear Cuenta"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
