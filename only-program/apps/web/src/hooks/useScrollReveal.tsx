import { useEffect } from "react";

type Options = {
  selector?: string;
  rootMargin?: string;
  threshold?: number | number[];
};

/**
 * Efecto tipo "Velada":
 * - Entra al foco => aparece
 * - Sale del foco => desaparece
 * Usa elementos con atributo: data-reveal
 * Opcional: data-delay="1|2|3..." para escalonar.
 */
export default function useScrollReveal(options: Options = {}) {
  useEffect(() => {
    const selector = options.selector ?? "[data-reveal]";
    const rootMargin = options.rootMargin ?? "-18% 0px -22% 0px";
    const threshold = options.threshold ?? [0, 0.15, 0.35, 0.6];

    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));

    // Aplica estado base + delay
    els.forEach((el) => {
      el.classList.add("reveal");
      const d = el.getAttribute("data-delay");
      if (d) {
        const delayMs = Number(d) * 90; // 1 => 90ms, 2 => 180ms, etc.
        if (!Number.isNaN(delayMs)) el.style.setProperty("--reveal-delay", `${delayMs}ms`);
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;

          // "Inteligente": aparece si está en foco y desaparece si no.
          if (e.isIntersecting) {
            el.classList.add("reveal-in");
            el.classList.remove("reveal-out");
          } else {
            // si ya apareció antes, lo desvanecemos; si nunca apareció, lo dejamos “base”
            if (el.classList.contains("reveal-in")) {
              el.classList.remove("reveal-in");
              el.classList.add("reveal-out");
            }
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
    };
  }, [options.rootMargin, options.selector, options.threshold]);
}
