import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface MobileNextButtonProps {
  currentPage: LinkPage;
  handleNextStep: () => void;
}

const MobileNextButton: React.FC<MobileNextButtonProps> = ({
  currentPage,
  handleNextStep,
}) => {
  const { t } = useTranslation();

  if (currentPage?.status === "active") return null;

  return (
    <div className="lg:hidden p-8 flex justify-center">
      <button
        onClick={handleNextStep}
        className="w-full max-w-sm py-4 px-8 rounded-2xl bg-primary text-white font-black text-sm shadow-[0_20px_40px_rgba(29,161,242,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
      >
        <span>{t("dashboard.links.nextStep")}</span>
        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </button>
    </div>
  );
};

export default MobileNextButton;
