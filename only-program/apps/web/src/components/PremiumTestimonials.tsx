import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { cmsService } from "@/services/cmsService";
import ManagerReviews from "./ManagerReviews";
import errorImage from "../assets/error/error.png";

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

export default function PremiumTestimonials({ previewData }: { previewData?: any[] }) {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);

  const isAutoScrollingRef = useRef(false);
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);

  const [cmsTestimonials, setCmsTestimonials] = useState<any[]>([]);

  useEffect(() => {
    if (previewData) {
      setCmsTestimonials(previewData);
      return;
    }

    const fetch = async () => {
      const data = await cmsService.getConfig('testimonials');
      if (data) setCmsTestimonials(data);
    };
    fetch();
  }, [previewData]);

  const staticTestimonials: Testimonial[] = useMemo(
    () => [
      {
        id: "t1",
        label: t('testimonials.items.t1.label'),
        name: t('testimonials.items.t1.name'),
        role: t('testimonials.items.t1.role'),
        quote: t('testimonials.items.t1.quote'),
        badge: t('testimonials.items.t1.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-young-woman-working-on-laptop-1570/1080p.mp4",
      },
      {
        id: "t2",
        label: t('testimonials.items.t2.label'),
        name: t('testimonials.items.t2.name'),
        role: t('testimonials.items.t2.role'),
        quote: t('testimonials.items.t2.quote'),
        badge: t('testimonials.items.t2.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-businesswoman-typing-on-a-laptop-9714/1080p.mp4",
      },
      {
        id: "t3",
        label: t('testimonials.items.t3.label'),
        name: t('testimonials.items.t3.name'),
        role: t('testimonials.items.t3.role'),
        quote: t('testimonials.items.t3.quote'),
        badge: t('testimonials.items.t3.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-freelancer-working-at-home-5697/1080p.mp4",
      },
      {
        id: "t4",
        label: t('testimonials.items.t4.label'),
        name: t('testimonials.items.t4.name'),
        role: t('testimonials.items.t4.role'),
        quote: t('testimonials.items.t4.quote'),
        badge: t('testimonials.items.t4.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-young-woman-working-on-laptop-1570/1080p.mp4",
      },
      {
        id: "t5",
        label: t('testimonials.items.t5.label'),
        name: t('testimonials.items.t5.name'),
        role: t('testimonials.items.t5.role'),
        quote: t('testimonials.items.t5.quote'),
        badge: t('testimonials.items.t5.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-businesswoman-typing-on-a-laptop-9714/1080p.mp4",
      },
      {
        id: "t6",
        label: t('testimonials.items.t6.label'),
        name: t('testimonials.items.t6.name'),
        role: t('testimonials.items.t6.role'),
        quote: t('testimonials.items.t6.quote'),
        badge: t('testimonials.items.t6.badge'),
        image: errorImage,
        tint: "rgba(29,161,242,.08)",
        videoSrc: "https://cdn.coverr.co/videos/coverr-freelancer-working-at-home-5697/1080p.mp4",
      }
    ],
    [t]
  );

  const testimonials = useMemo(() => {
    let base = staticTestimonials;
    if (cmsTestimonials && cmsTestimonials.length > 0) {
      base = cmsTestimonials.map((ct, i) => ({
        id: `cms-${i}`,
        label: "Creator",
        name: ct.name,
        role: ct.role,
        quote: ct.content || ct.quote,
        badge: ct.badge || "Verified",
        image: ct.avatar || errorImage,
        tint: staticTestimonials[i % staticTestimonials.length].tint,
        videoSrc: ct.videoSrc || staticTestimonials[i % staticTestimonials.length].videoSrc
      }));
    }
    return base;
  }, [cmsTestimonials, staticTestimonials]);

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

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const lockAutoScroll = (ms = 750) => {
    isAutoScrollingRef.current = true;
    if (autoScrollTimeoutRef.current) window.clearTimeout(autoScrollTimeoutRef.current);
    autoScrollTimeoutRef.current = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
      autoScrollTimeoutRef.current = null;
    }, ms);
  };

  const scrollToIndex = (idx: number) => {
    const card = cardRefs.current[idx];
    const container = carouselRef.current;
    if (!card || !container) return;
    lockAutoScroll(800);
    const left = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
    container.scrollTo({ left, behavior: "smooth" });
  };

  const computeClosestToFocus = () => {
    const container = carouselRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const focusX = rect.left + rect.width * 0.5;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    cardRefs.current.forEach((card, idx) => {
      // Safety check if repeating list changed
      if (!card || idx >= testimonials.length) return;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const dist = Math.abs(focusX - cardCenter);
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
    container.scrollLeft = 0;
  }, []);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const onScroll = () => {
      if (isAutoScrollingRef.current) return;
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const idx = computeClosestToFocus();
        if (idx !== activeIndexRef.current) setActiveIndex(idx);
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll as any);
  }, []);

  useEffect(() => {
    const t = testimonials[activeIndex];
    if (!t) return;
    setBackground(t.image, t.tint);
    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const video = card.querySelector("video") as HTMLVideoElement | null;
      if (!video) return;
      if (idx === activeIndex) video.play().catch(() => { });
      else video.pause();
    });
  }, [activeIndex, testimonials]);

  const goLeft = () => {
    const next = clamp(activeIndexRef.current - 1, 0, testimonials.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const goRight = () => {
    const next = clamp(activeIndexRef.current + 1, 0, testimonials.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <section id="testimonials" className="relative py-24 md:py-32 overflow-hidden" data-reveal>
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .snap-safe { overscroll-behavior-x: contain; }
          #testimonials { overflow-x: clip; }
          #testimonials * { max-width: 100%; }
          .carousel-guard { width: 100%; max-width: 100%; overflow-x: auto; }
        `}
      </style>

      <div className="absolute inset-0 -z-10">
        <div
          className={["absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms]", useA ? "opacity-100" : "opacity-0"].join(" ")}
          style={{ backgroundImage: `url(${bgA})`, filter: "blur(28px) saturate(1.1)", transform: "scale(1.12)", opacity: useA ? 0.22 : 0 }}
        />
        <div
          className={["absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms]", !useA ? "opacity-100" : "opacity-0"].join(" ")}
          style={{ backgroundImage: bgB ? `url(${bgB})` : "none", filter: "blur(28px) saturate(1.1)", transform: "scale(1.12)", opacity: !useA ? 0.22 : 0 }}
        />
        <div className="absolute inset-0 bg-[#000000]" />
        <div className="absolute -inset-24 blur-3xl transition-all duration-[1200ms] opacity-30" style={{ background: `radial-gradient(circle at 50% 30%, ${tint}, transparent 60%)` }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 md:mb-16" data-reveal>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {t("testimonials.title")} <span className="text-primary">Only Program</span>
          </h2>
          <p className="mt-4 text-silver/60 max-w-2xl mx-auto">{t("testimonials.subtitle")}</p>
        </div>

        <div className="relative" data-reveal>
          <div className="hidden md:flex absolute -top-2 right-0 gap-2 z-10">
            <button onClick={goLeft} className="h-10 w-10 rounded-full bg-surface border border-border hover:border-primary/50 text-silver/70 hover:text-white transition-all" type="button"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
            <button onClick={goRight} className="h-10 w-10 rounded-full bg-surface border border-border hover:border-primary/50 text-silver/70 hover:text-white transition-all" type="button"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
          </div>

          <div ref={carouselRef} className="carousel-guard no-scrollbar snap-safe flex gap-5 md:gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory pr-0 w-full max-w-full">
            {testimonials.map((t, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div key={t.id} ref={(el) => (cardRefs.current[idx] = el)} className={["snap-center flex-none w-[280px] sm:w-[320px] md:w-[360px] lg:w-[calc((100%-2*24px)/3)] transition-all duration-700", isActive ? "opacity-100 scale-[1]" : "opacity-[0.50] scale-[0.95]"].join(" ")}>
                  <button type="button" onClick={() => { setActiveIndex(idx); scrollToIndex(idx); }} className={["group text-left w-full relative rounded-3xl overflow-hidden border bg-surface/40", isActive ? "border-primary/40" : "border-border", "hover:border-primary/40 transition-all duration-500"].join(" ")} style={{ transform: "translateZ(0)" }}>
                    {t.videoSrc ? (
                      <video className={["w-full h-[400px] sm:h-[450px] object-cover transition-transform duration-[900ms]", isActive ? "scale-[1.02]" : "scale-[1.06]"].join(" ")} poster={t.image} muted loop playsInline preload="none" src={t.videoSrc} />
                    ) : (
                      <img className={["w-full h-[400px] sm:h-[450px] object-cover transition-transform duration-[900ms]", isActive ? "scale-[1.02]" : "scale-[1.06]"].join(" ")} src={t.image} alt={t.name} draggable={false} />
                    )}
                    <div className="absolute inset-0 pointer-events-none"><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" /></div>
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">{t.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">{t.badge}</span>
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
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button key={idx} type="button" onClick={() => { setActiveIndex(idx); scrollToIndex(idx); }} className={["h-2.5 rounded-full transition-all", idx === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-white/15 hover:bg-white/25"].join(" ")} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20">
        <ManagerReviews />
      </div>
    </section>
  );
}
