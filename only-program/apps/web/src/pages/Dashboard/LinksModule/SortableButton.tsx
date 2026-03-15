import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/contexts/I18nContext";
import { ButtonLink } from "./types";

interface SortableButtonProps {
  btn: ButtonLink;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  collapsed?: boolean;
  rotatorSurcharge: number;
  socialPresets: any;
}

export const SortableButton: React.FC<SortableButtonProps> = ({
  btn,
  isSelected,
  onClick,
  onDelete,
  collapsed = false,
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
      className={`w-full rounded-xl border transition-all relative group flex items-center overflow-hidden h-14 ${
        isSelected
          ? "bg-white/5 border-primary shadow-lg"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      }`}
    >
      {/* DRAG HANDLE */}
      {!collapsed && (
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-full flex items-center justify-center text-silver/20 hover:text-white cursor-grab active:cursor-grabbing transition-colors shrink-0 border-r border-white/5"
        >
          <span className="material-symbols-outlined text-lg">drag_indicator</span>
        </button>
      )}

      <button
        onClick={onClick}
        className={`flex-1 flex items-center h-full text-left transition-all gap-3 ${collapsed ? "justify-center px-0" : "px-3"}`}
      >
        <div
          className="rounded-lg flex items-center justify-center shrink-0 h-8 w-8"
          style={{ backgroundColor: btn.color }}
        >
          <div className="text-white w-4 h-4">
            {socialPresets[btn.type]?.icon || socialPresets["custom"]?.icon}
          </div>
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-black truncate leading-tight ${
                isSelected ? "text-white" : "text-silver/40"
              }`}
            >
              {btn.title}
            </p>
            {btn.type === "telegram" && btn.rotatorActive && (
              <p className="text-[8px] text-green-500 font-bold uppercase tracking-wide mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">sync</span>
                {t("dashboard.links.rotatorActiveLabel", { amount: rotatorSurcharge })}
              </p>
            )}
          </div>
        )}

      </button>

      {/* DELETE BUTTON */}
      {!collapsed && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-10 h-full flex items-center justify-center text-silver/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 active:scale-95 bg-gradient-to-l from-red-500/10 to-transparent shrink-0"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      )}
    </div>
  );
};
