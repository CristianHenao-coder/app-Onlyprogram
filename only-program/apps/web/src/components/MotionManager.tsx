import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * MotionManager
 * - Scroll-reveal transitions site-wide
 * - Optional "magnetic" micro-interaction via data-magnetic
 * - Respects prefers-reduced-motion
 */
export default function MotionManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    // ---- Reveal on scroll (Velada-like, but subtle)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-in');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    revealEls.forEach((el) => {
      if (prefersReduced) {
        el.classList.add('is-in');
      } else {
        observer.observe(el);
      }
    });

    // ---- Magnetic micro-interaction
    const magneticEls = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
    const handlers: Array<() => void> = [];

    if (!prefersReduced) {
      magneticEls.forEach((el) => {
        const strength = Number(el.getAttribute('data-magnetic')) || 0.12;

        const onMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
        };

        const onLeave = () => {
          el.style.transform = 'translate3d(0,0,0)';
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);

        handlers.push(() => {
          el.removeEventListener('mousemove', onMove);
          el.removeEventListener('mouseleave', onLeave);
        });
      });
    }

    return () => {
      observer.disconnect();
      handlers.forEach((fn) => fn());
    };
  }, [pathname]);

  return null;
}
