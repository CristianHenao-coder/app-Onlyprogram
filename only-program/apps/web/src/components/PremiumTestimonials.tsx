import React, { useEffect, useMemo, useRef, useState } from "react";

import zara from "../assets/testimonials/zara.jpeg";
import sun2 from "../assets/testimonials/sun2.jpeg";
import mia from "../assets/testimonials/mia.jpeg";
import helen1 from "../assets/testimonials/helen1.jpeg";
import sarasuuun from "../assets/testimonials/sarasuuun.jpeg";
import rocioo from "../assets/testimonials/rocioo.jpeg";

type Testimonial = {
  id: string;
  label: string;
  name: string;
  role: string;
  quote: string;
  badge: string;
  image: string;
  tint: string;
  videoSrc?: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function PremiumTestimonials() {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);

  const testimonials: Testimonial[] = useMemo(
    () => [
      {
        id: "t1",
        label: "TESTIMONIO 01",
        name: "Creadora 01",
        role: "Creadora Premium",
        quote: "Desde que uso Only Program, mis links están blindados. Se siente profesional.",
        badge: "Anti-bot",
        image: zara,
        tint: "rgba(168,85,247,.22)",
      },
      {
        id: "t2",
        label: "TESTIMONIO 02",
        name: "Creadora 02",
        role: "Creadora",
        quote: "Me encanta poder usar mi dominio y que todo se vea de marca y seguro.",
        badge: "Dominios",
        image: sun2,
        tint: "rgba(34,211,238,.18)",
      },
      {
        id: "t3",
        label: "TESTIMONIO 03",
        name: "Creadora 03",
        role: "Creadora",
        quote: "Las analíticas me muestran exactamente qué funciona y desde dónde llega mi tráfico.",
        badge: "Analytics",
        image: mia,
        tint: "rgba(249,115,22,.16)",
      },
      {
        id: "t4",
        label: "TESTIMONIO 04",
        name: "Creadora 04",
        role: "Creadora",
        quote: "Me siento tranquila porque el acceso está verificado y el bot-shield trabaja solo.",
        badge: "Seguridad",
        image: helen1,
        tint: "rgba(29,161,242,.18)",
      },
      {
        id: "t5",
        label: "TESTIMONIO 05",
        name: "Creadora 05",
        role: "Creadora",
        quote: "Puedo pausar o ajustar todo. Es un sistema serio, no un link cualquiera.",
        badge: "Control",
        image: sarasuuun,
        tint: "rgba(34,197,94,.14)",
      },
      {
        id: "t6",
        label: "TESTIMONIO 06",
        name: "Creadora 06",
        role: "Creadora",
        quote: "La experiencia del usuario es limpia y mis fans llegan sin fricción. Se nota premium.",
        badge: "Conversión",
        image: rocioo,
        tint: "rgba(244,63,94,.14)",
      },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const [bgA, setBgA] = useState(testimonials[0]?.image);
  const [bgB, setBgB] = useState<string | null>(null);
  const [useA, setUseA] = useState(true);
  const [tint, setTint] = useState(testimonials[0]?.tint);

  const setBackground = (img: string, tintColor: string) => {
    setTint(tintColor);
    if (useA) {
      setBgB(img);
      setUseA(false);
    } else {
      setBgA(img);
      setUseA(true);
    }
  };

  const scrollToIndex = (idx: number) => {
    const card = cardRefs.current[idx];
    const container = carouselRef.current;
    if (!card || !container) return;

    card.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const computeClosestToCenter = () => {
    const container = carouselRef.current;
    if (!container) return 0;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const r = card.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const dist = Math.abs(centerX - cardCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    return bestIdx;
  };

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const idx = computeClosestToCenter();
        if (idx !== activeIndex) setActiveIndex(idx);
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const t = testimonials[activeIndex];
    if (!t) return;
    setBackground(t.image, t.tint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const goLeft = () => {
    const next = clamp(activeIndex - 1, 0, testimonials.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const goRight = () => {
    const next = clamp(activeIndex + 1, 0, testimonials.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <section
      id="testimonials"
      className={[
        "relative py-24 md:py-32 overflow-hidden",
        "overflow-x-hidden", // ✅ evita cualquier overflow horizontal
      ].join(" ")}
    >
      {/* Fondo reactivo */}
      <div className="absolute inset-0 -z-10">
        <div
          className={[
            "absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms]",
            useA ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{
            backgroundImage: `url(${bgA})`,
            filter: "blur(28px) saturate(1.1)",
            transform: "scale(1.12)",
            opacity: useA ? 0.22 : 0,
          }}
        />
        <div
          className={[
            "absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms]",
            !useA ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{
            backgroundImage: bgB ? `url(${bgB})` : "none",
            filter: "blur(28px) saturate(1.1)",
            transform: "scale(1.12)",
            opacity: !useA ? 0.22 : 0,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/70 via-[#0B0B0B]/78 to-[#0B0B0B]" />
        <div
          className="absolute -inset-24 blur-3xl transition-all duration-[1200ms] opacity-40"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${tint}, transparent 60%)`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Creadoras que protegen su contenido con <span className="text-primary">Only Program</span>
          </h2>
          <p className="mt-4 text-silver/60 max-w-2xl mx-auto">
            Desliza o usa las flechas para navegar. Al centrar una creadora, el fondo reacciona suavemente.
          </p>
        </div>

        <div className="relative">
          {/* Flechas */}
          <div className="hidden md:flex absolute -top-2 right-0 gap-2 z-10">
            <button
              onClick={goLeft}
              className="h-10 w-10 rounded-full bg-surface border border-border hover:border-primary/50 text-silver/70 hover:text-white transition-all"
              aria-label="Anterior"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={goRight}
              className="h-10 w-10 rounded-full bg-surface border border-border hover:border-primary/50 text-silver/70 hover:text-white transition-all"
              aria-label="Siguiente"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Carrusel (✅ con spacers para NO dejar hueco al final) */}
          <div
            ref={carouselRef}
            className={[
              "flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-6 custom-scrollbar scroll-smooth",
              "[--card-w:300px] md:[--card-w:380px] lg:[--card-w:420px]",
            ].join(" ")}
            style={{
              scrollPaddingLeft: "calc((100% - var(--card-w)) / 2)",
              scrollPaddingRight: "calc((100% - var(--card-w)) / 2)",
            }}
          >
            {/* Spacer izquierdo */}
            <div className="flex-none w-[calc((100%-var(--card-w))/2)]" aria-hidden />

            {testimonials.map((t, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={t.id}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  className={[
                    "snap-center flex-none w-[300px] md:w-[380px] lg:w-[420px]",
                    "transition-all duration-700",
                    isActive ? "opacity-100 scale-[1]" : "opacity-[0.45] scale-[0.97]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      scrollToIndex(idx);
                    }}
                    className={[
                      "group text-left w-full relative",
                      "rounded-3xl overflow-hidden border bg-surface/40",
                      isActive ? "border-primary/40" : "border-border",
                      "hover:border-primary/40 transition-all duration-500",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40",
                    ].join(" ")}
                    style={{ transform: "translateZ(0)" }}
                  >
                    <img
                      className={[
                        "w-full h-[520px] object-cover",
                        "transition-transform duration-[900ms]",
                        isActive ? "scale-[1.02]" : "scale-[1.06]",
                      ].join(" ")}
                      src={t.image}
                      alt={t.name}
                      draggable={false}
                    />

                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                        {t.label}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {t.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-white font-bold text-lg leading-tight">{t.name}</p>
                      <p className="text-silver/50 text-xs">{t.role}</p>
                      <p className="text-silver/70 text-sm mt-2 leading-relaxed">“{t.quote}”</p>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Spacer derecho */}
            <div className="flex-none w-[calc((100%-var(--card-w))/2)]" aria-hidden />
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  scrollToIndex(idx);
                }}
                className={[
                  "h-2.5 rounded-full transition-all",
                  idx === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-white/15 hover:bg-white/25",
                ].join(" ")}
                aria-label={`Ir a testimonio ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
