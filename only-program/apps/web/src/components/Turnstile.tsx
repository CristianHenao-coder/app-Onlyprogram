import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export default function Turnstile({ onVerify, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [activeSiteKey, setActiveSiteKey] = useState<string | undefined>(siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY);

  useEffect(() => {
    // If no site key, try to fetch from backend
    if (!activeSiteKey) {
      console.log('--- Turnstile: Fetching siteKey from backend ---');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';
      fetch(`${apiUrl}/config/turnstile`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.siteKey) {
            console.log('--- Turnstile: SiteKey received ---');
            setActiveSiteKey(data.siteKey);
          } else {
            console.error('--- Turnstile: No siteKey in response ---', data);
          }
        })
        .catch(err => {
          console.error('--- Turnstile: Error fetching config ---', err);
          // Fallback to check env again just in case
          const envKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
          if (envKey) setActiveSiteKey(envKey);
        });
    }
  }, [activeSiteKey]);

  useEffect(() => {
    if (!activeSiteKey) {
      console.log('--- Turnstile: Waiting for siteKey ---');
      return;
    }

    const renderWidget = () => {
      console.log('--- Turnstile: Attempting to render ---');
      if (typeof window !== 'undefined' && (window as any).turnstile && containerRef.current) {
        try {
          // Reset if already rendered
          if (widgetId.current !== null) {
            (window as any).turnstile.remove(widgetId.current);
          }

          widgetId.current = (window as any).turnstile.render(containerRef.current, {
            sitekey: activeSiteKey,
            theme: 'dark',
            callback: (token: string) => {
              console.log('--- Turnstile: Verified ---');
              onVerify(token);
            },
            'expired-callback': () => {
              console.log('--- Turnstile: Expired ---');
              onVerify('');
            },
            'error-callback': () => {
              console.error('--- Turnstile: Error Callback ---');
              onVerify('');
            },
          });
          console.log('--- Turnstile: Rendered successfully ---', widgetId.current);
        } catch (e) {
          console.error('--- Turnstile: Render Error ---', e);
        }
      } else {
        console.log('--- Turnstile: window.turnstile or container not ready ---', {
          turnstile: !!(window as any).turnstile,
          container: !!containerRef.current
        });
      }
    };

    // Check if turnstile is ready
    if (typeof window !== 'undefined' && !(window as any).turnstile) {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      renderWidget();
    }

    return () => {
      if (widgetId.current !== null && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetId.current);
      }
    };
  }, [onVerify, activeSiteKey]);

  if (!activeSiteKey) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-500 text-center">
        Cargando verificación de seguridad...
      </div>
    );
  }

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-xl">
      <div ref={containerRef} />
    </div>
  );
}
