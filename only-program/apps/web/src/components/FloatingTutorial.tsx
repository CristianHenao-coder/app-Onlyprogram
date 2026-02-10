import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/contexts/I18nContext';

interface TutorialStep {
  target: string; // CSS selector
  titleKey: string;
  descriptionKey: string;
}

interface FloatingTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  active?: boolean;
}

export default function FloatingTutorial({ steps, onComplete, onSkip, active = false }: FloatingTutorialProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active || steps.length === 0) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(steps[currentStep].target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, steps, active]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setIsVisible(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!active || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Highlighting Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${coords.left}px 100%, 
              ${coords.left}px ${coords.top}px, 
              ${coords.left + coords.width}px ${coords.top}px, 
              ${coords.left + coords.width}px ${coords.top + coords.height}px, 
              ${coords.left}px ${coords.top + coords.height}px, 
              ${coords.left}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
      </AnimatePresence>

      {/* Floating Card */}
      <motion.div
        animate={{
          top: coords.top + coords.height + 20,
          left: Math.max(20, Math.min(window.innerWidth - 320, coords.left + coords.width / 2 - 150)),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute w-[300px] bg-background-dark/95 backdrop-blur-xl border border-primary/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] pointer-events-auto"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-background-dark border-t border-l border-primary/30 rotate-45" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
            {currentStep + 1}
          </div>
          <h3 className="text-white font-black uppercase tracking-widest text-sm">
            {t(steps[currentStep].titleKey)}
          </h3>
        </div>

        <p className="text-silver/70 text-sm leading-relaxed mb-6">
          {t(steps[currentStep].descriptionKey)}
        </p>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="text-[10px] font-black text-silver/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            {t('tutorial.skip')}
          </button>
          
          <button
            onClick={handleNext}
            className="bg-primary hover:bg-primary-light text-black font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? t('tutorial.gotIt') : t('tutorial.next')}
            <span className="material-symbols-outlined text-sm">
              {currentStep === steps.length - 1 ? 'check' : 'arrow_forward'}
            </span>
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-primary' : 'w-1 bg-white/10'}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
