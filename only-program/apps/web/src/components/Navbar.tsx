import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Si tu logo está en: apps/web/src/assets/img/logoinc.png
import logo from "../assets/img/logoinc.png";

type NavItem = { label: string; href: string };

export default function Navbar() {
  const items: NavItem[] = useMemo(
    () => [
      { label: "Inicio", href: "#home" },
      { label: "Funciones", href: "#features" },
      { label: "Precios", href: "#pricing" },
      { label: "Testimonios", href: "#testimonials" },
    ],
    []
  );

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

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
          <a
            href="#home"
            className="group flex items-center gap-3 min-w-0"
            aria-label="Only Program"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-2 rounded-2xl bg-primary/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Logo container */}
              <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt="Only Program"
                  className="h-[70%] w-[70%] object-contain opacity-95 group-hover:opacity-100 transition-opacity"
                  draggable={false}
                />
              </div>
            </div>

            <div className="leading-tight min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-white font-extrabold tracking-tight text-lg sm:text-xl">
                  ONLY
                </span>
                <span className="text-primary font-extrabold tracking-tight text-lg sm:text-xl">
                  PROGRAM
                </span>
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
            <div className="hidden sm:flex items-center gap-2 border border-border rounded-xl px-2 py-1 bg-surface/40">
              <span className="text-[11px] text-silver/60 font-semibold px-2">ES</span>
              <span className="w-px h-4 bg-border" />
              <button className="text-[11px] text-silver/60 font-semibold px-2 hover:text-white transition-colors">
                EN
              </button>
            </div>

            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-silver/70 hover:text-white transition-colors"
            >
              Iniciar Sesión
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
              Crear Cuenta
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
