import { useEffect, useRef, useState } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export default function Turnstile({ onVerify, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [activeSiteKey, setActiveSiteKey] = useState<string | undefined>(siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no site key, try to fetch from backend
    if (!activeSiteKey) {
      console.log('--- Turnstile: Fetching siteKey from backend ---');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4005/api';
      
      const timeout = setTimeout(() => {
        setError('Tiempo de espera agotado obteniendo configuración de seguridad.');
      }, 5000);

      fetch(`${apiUrl}/config/turnstile`)
        .then(res => {
          clearTimeout(timeout);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.siteKey) {
            console.log('--- Turnstile: SiteKey received ---');
            setActiveSiteKey(data.siteKey);
          } else {
            console.error('--- Turnstile: No siteKey in response ---', data);
            setError('Error de configuración: siteKey no encontrado.');
          }
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('--- Turnstile: Error fetching config ---', err);
          // Fallback to check env again just in case
          const envKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
          if (envKey) {
            setActiveSiteKey(envKey);
          } else {
             setError('No se pudo conectar con el servicio de verificación.');
          }
        });
        
        return () => clearTimeout(timeout);
    }
  }, [activeSiteKey]);

  useEffect(() => {
    if (!activeSiteKey) return;

    const renderWidget = () => {
      // console.log('--- Turnstile: Attempting to render ---');
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
              // console.log('--- Turnstile: Verified ---');
              onVerify(token);
            },
            'expired-callback': () => {
              // console.log('--- Turnstile: Expired ---');
              onVerify('');
            },
            'error-callback': () => {
              console.error('--- Turnstile: Error Callback ---');
              setError('Error validando seguridad. Refresca la página.');
              onVerify('');
            },
          });
          // console.log('--- Turnstile: Rendered successfully ---', widgetId.current);
        } catch (e) {
          console.error('--- Turnstile: Render Error ---', e);
        }
      }
    };

    // Check if turnstile is ready - FASTER POLLING (100ms)
    if (typeof window !== 'undefined' && !(window as any).turnstile) {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100); 
      // Timeout to stop checking after 10 seconds? No, let it persist but maybe show generic message if really slow
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

  if (error) {
     return (
         <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
             {error}
         </div>
     )
  }

  if (!activeSiteKey) {
    return (
      <div className="flex items-center justify-center p-4 gap-2 text-silver/50 text-xs animate-pulse">
         <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
         <span>Protegiendo conexión...</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-xl min-h-[65px]">
      <div ref={containerRef} />
    </div>
  );
}
