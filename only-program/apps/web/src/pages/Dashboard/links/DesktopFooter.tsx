import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface DesktopFooterProps {
  currentPage: LinkPage;
  handleDeletePage: (id: string, name: string) => Promise<void>;
  sidebarCollapsed: boolean;
}

const DesktopFooter: React.FC<DesktopFooterProps> = ({
  currentPage,
  handleDeletePage,
  sidebarCollapsed,
}) => {
  const { t } = useTranslation();

  const onDeleteClick = () => {
    handleDeletePage(currentPage.id, currentPage.name);
  };

  return (
    <div className="p-6 border-t border-white/5 bg-[#050505] space-y-4">
      <button
        onClick={onDeleteClick}
        className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10 bg-white/5 transition-all ${sidebarCollapsed ? "flex-col" : ""}`}
        title={sidebarCollapsed ? "Borrar Link" : undefined}
      >
        <span
          className={`material-symbols-outlined ${sidebarCollapsed ? "text-lg" : "text-sm"}`}
        >
          delete
        </span>
        {!sidebarCollapsed && <span>{t("dashboard.links.deleteLink")}</span>}
        {sidebarCollapsed && <span className="text-[10px] uppercase">Borrar</span>}
      </button>
    </div>
  );
};

export default DesktopFooter;
