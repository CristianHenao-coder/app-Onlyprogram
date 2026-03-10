import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/services/supabase';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Hook que cierra la sesión automáticamente tras 30 minutos de inactividad.
 * La inactividad se define como ausencia de: clic, tecla, movimiento de ratón o scroll.
 * Solo se activa cuando el usuario está autenticado.
 */
export function useSessionTimeout(isAuthenticated: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      // La redirección la manejará el listener de onAuthStateChange en useAuth
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer(); // Iniciar el temporizador al montar

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, resetTimer]);
}
