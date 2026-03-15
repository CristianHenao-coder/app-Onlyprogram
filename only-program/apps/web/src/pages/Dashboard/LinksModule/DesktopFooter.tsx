import React from "react";
import { useTranslation } from "@/contexts/I18nContext";
import { LinkPage } from "./types";

interface DesktopFooterProps {
  currentPage: LinkPage;
  handleDeletePage: (id: string, name: string) => Promise<void>;
  collapsed?: boolean;
}

const DesktopFooter: React.FC<DesktopFooterProps> = ({
  currentPage,
  handleDeletePage,
  collapsed = false,
}) => {
  const { t } = useTranslation();

  const onDeleteClick = () => {
    handleDeletePage(currentPage.id, currentPage.name);
  };

  return (
    <div className="border-t border-white/5 bg-[#050505] p-4">
      {/* DELETE PAGE BUTTON */}
      <button
        onClick={onDeleteClick}
        className={`rounded-xl flex items-center justify-center transition-all group active:scale-95 w-full ${collapsed ? "py-3 px-0 h-10 w-10 mx-auto" : "py-3 px-4 gap-2 text-xs"} font-black uppercase tracking-widest text-white bg-red-500/80 hover:bg-red-500 shadow-lg shadow-red-500/20 border border-red-500/20`}
        title={collapsed ? (t("dashboard.links.deleteLink") || "Borrar Link") : undefined}
      >
        <span className="material-symbols-outlined text-lg">
          delete
        </span>
        {!collapsed && <span>{t("dashboard.links.deleteLink") || "Borrar Link"}</span>}
      </button>
    </div>
  );
};

export default DesktopFooter;
