import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import loadShield from '@/assets/load/loadshield.gif';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => setIsLoaded(true), 500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Blue Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo/Shield GIF */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-32 h-32 md:w-40 md:h-40 relative"
            >
              <img 
                src={loadShield} 
                alt="Loading..." 
                className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(29,161,242,0.5)]"
              />
            </motion.div>

            {/* Progress Container */}
            <div className="w-64 flex flex-col items-center gap-3">
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-primary shadow-[0_0_15px_#1da1f2]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between w-full px-1">
                <span className="text-[10px] uppercase tracking-widest text-silver/40 font-bold">Iniciando Sistema</span>
                <span className="text-[10px] tabular-nums text-primary font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="absolute bottom-10 text-center">
            <p className="text-[9px] uppercase tracking-[0.2em] text-silver/20 font-medium">
              Only Program • Link Protection Protocol
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
