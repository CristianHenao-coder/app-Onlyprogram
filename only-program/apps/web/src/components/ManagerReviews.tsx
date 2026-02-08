
import { useTranslation } from "@/contexts/I18nContext";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

export default function ManagerReviews() {
  const { t } = useTranslation() as any;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  const reviews = useMemo(() => [
    {
      name: "Carlos R.",
      role: t("managerReviews.r1.role"),
      comment: t("managerReviews.r1.comment"),
      icon: "admin_panel_settings",
      image: "https://i.pravatar.cc/150?u=CarlosR"
    },
    {
      name: "Ana M.",
      role: t("managerReviews.r2.role"),
      comment: t("managerReviews.r2.comment"),
      icon: "supervisor_account",
      image: "https://i.pravatar.cc/150?u=AnaM"
    },
    {
      name: "Elite Agency",
      role: t("managerReviews.r3.role"),
      comment: t("managerReviews.r3.comment"),
      icon: "verified_user",
      image: "https://i.pravatar.cc/150?u=EliteAgency"
    },
    {
      name: "Luis G.",
      role: t("managerReviews.r4.role"),
      comment: t("managerReviews.r4.comment"),
      icon: "speed",
      image: "https://i.pravatar.cc/150?u=LuisG"
    },
    {
      name: "Sofía L.",
      role: t("managerReviews.r5.role"),
      comment: t("managerReviews.r5.comment"),
      icon: "chat",
      image: "https://i.pravatar.cc/150?u=SofiaL"
    },
    {
      name: "Digital Growth",
      role: t("managerReviews.r6.role"),
      comment: t("managerReviews.r6.comment"),
      icon: "trending_up",
      image: "https://i.pravatar.cc/150?u=DigitalGrowth"
    },
    {
      name: "Jorge B.",
      role: t("managerReviews.r7.role"),
      comment: t("managerReviews.r7.comment"),
      icon: "shield",
      image: "https://i.pravatar.cc/150?u=JorgeB"
    },
    {
      name: "Laura P.",
      role: t("managerReviews.r8.role"),
      comment: t("managerReviews.r8.comment"),
      icon: "favorite",
      image: "https://i.pravatar.cc/150?u=LauraP"
    }
  ], [t]);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(4);
      } else if (window.innerWidth >= 640) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    handleResize(); // Init
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] left-[10%] w-72 h-72 bg-purple-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t("managerReviews.title")}
          </h2>
          <p className="text-silver/60 max-w-2xl mx-auto">
            {t("managerReviews.subtitle")}
          </p>
        </div>

        <div className="relative group">
          {/* Navigation Buttons - Visible on hover/always on mobile */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center text-silver hover:bg-primary hover:text-white transition-all -ml-4 lg:-ml-6 shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 disabled:opacity-0"
            aria-label="Previous review"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center text-silver hover:bg-primary hover:text-white transition-all -mr-4 lg:-mr-6 shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100"
            aria-label="Next review"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <div className="overflow-hidden py-4 -mx-4 px-4">
            <motion.div
              className="flex"
              animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {reviews.map((review: any, i: number) => (
                <div
                  key={i}
                  className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="h-full p-6 rounded-2xl border border-white/5 bg-surface/20 hover:border-primary/20 hover:bg-surface/30 transition-all duration-300 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                          <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-silver/70 group-hover:text-primary transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">{review.icon}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-base">{review.name}</h3>
                        <p className="text-xs text-primary/80 font-medium">{review.role}</p>
                      </div>
                    </div>
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute -top-2 -left-2 text-4xl text-white/5 pointer-events-none">format_quote</span>
                      <p className="text-sm text-silver/70 italic relative z-10 pl-2 leading-relaxed">
                        "{review.comment}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, i) => (
              // Logic to show dots? Showing 8 dots is fine.
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
