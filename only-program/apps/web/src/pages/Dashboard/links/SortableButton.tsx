import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/contexts/I18nContext";
import { ButtonLink } from "./types";

interface SortableButtonProps {
  btn: ButtonLink;
  isSelected: boolean;
  onClick: () => void;
  collapsed?: boolean;
  rotatorSurcharge: number;
  socialPresets: any;
}

export const SortableButton: React.FC<SortableButtonProps> = ({
  btn,
  isSelected,
  onClick,
  collapsed,
  rotatorSurcharge,
  socialPresets,
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: btn.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full rounded-xl border cursor-grab active:cursor-grabbing transition-all relative group touch-none ${
        collapsed
          ? "flex items-center justify-center p-1.5"
          : "flex items-center gap-3 p-3"
      } ${
        isSelected
          ? "bg-white/5 border-primary shadow-lg"
          : "bg-transparent border-transparent hover:bg-white/[0.02]"
      }`}
      title={collapsed ? btn.title : undefined}
    >
      <div
        className="rounded-lg flex items-center justify-center shrink-0 h-9 w-9"
        style={{ backgroundColor: btn.color }}
      >
        <div className="text-white w-5 h-5">
          {socialPresets[btn.type]?.icon}
        </div>
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-bold truncate ${
              isSelected ? "text-white" : "text-silver/60"
            }`}
          >
            {btn.title}
          </p>
          {btn.type === "telegram" && btn.rotatorActive && (
            <p className="text-[9px] text-green-500 font-bold uppercase tracking-wide mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">
                sync
              </span>{" "}
              {t("dashboard.links.rotatorActiveLabel", {
                amount: rotatorSurcharge,
              })}
            </p>
          )}
        </div>
      )}

      {collapsed && btn.type === "telegram" && btn.rotatorActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050505] flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] text-black">
            sync
          </span>
        </div>
      )}
    </div>
  );
};
