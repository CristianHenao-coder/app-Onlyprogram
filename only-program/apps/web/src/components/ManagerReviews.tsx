
import { useTranslation } from "@/contexts/I18nContext";
import { useMemo } from "react";

export default function ManagerReviews() {
  const { t } = useTranslation() as any;

  const reviews = useMemo(() => [
    {
      name: "Carlos R.",
      role: t("managerReviews.r1.role"),
      comment: t("managerReviews.r1.comment"),
      icon: "admin_panel_settings"
    },
    {
      name: "Ana M.",
      role: t("managerReviews.r2.role"),
      comment: t("managerReviews.r2.comment"),
      icon: "supervisor_account"
    },
    {
      name: "Elite Agency",
      role: t("managerReviews.r3.role"),
      comment: t("managerReviews.r3.comment"),
      icon: "verified_user"
    },
    {
      name: "Luis G.",
      role: t("managerReviews.r4.role"),
      comment: t("managerReviews.r4.comment"),
      icon: "speed"
    },
    {
      name: "Sofía L.",
      role: t("managerReviews.r5.role"),
      comment: t("managerReviews.r5.comment"),
      icon: "chat"
    },
    {
      name: "Digital Growth",
      role: t("managerReviews.r6.role"),
      comment: t("managerReviews.r6.comment"),
      icon: "trending_up"
    },
    {
        name: "Jorge B.",
        role: t("managerReviews.r7.role"),
        comment: t("managerReviews.r7.comment"),
        icon: "shield"
    },
    {
        name: "Laura P.",
        role: t("managerReviews.r8.role"),
        comment: t("managerReviews.r8.comment"),
        icon: "favorite"
    }
  ], [t]);

  return (
    <section className="py-20 bg-background-dark border-t border-border relative overflow-hidden">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((review: any, i: number) => (
            <div 
              key={i} 
              className="group p-5 rounded-2xl border border-white/5 bg-surface/20 hover:border-primary/20 hover:bg-surface/30 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-silver/70 group-hover:text-primary group-hover:scale-110 transition-all">
                  <span className="material-symbols-outlined">{review.icon}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{review.name}</h3>
                  <p className="text-xs text-primary/80 font-medium">{review.role}</p>
                </div>
              </div>
              
              <div className="relative">
                <span className="material-symbols-outlined absolute -top-2 -left-2 text-4xl text-white/5 pointer-events-none">format_quote</span>
                <p className="text-sm text-silver/70 italic relative z-10 pl-2">
                    "{review.comment}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
