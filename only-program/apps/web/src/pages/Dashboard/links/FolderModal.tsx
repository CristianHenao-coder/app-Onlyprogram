import React, { useState } from "react";
import { Folder } from "./types";

interface FolderModalProps {
  folder?: Folder;
  onSave: (name: string, color: string, id?: string) => void;
  onClose: () => void;
}

const FOLDER_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#71717a", // Zinc/Gray
];

const FolderModal: React.FC<FolderModalProps> = ({ folder, onSave, onClose }) => {
  const [name, setName] = useState(folder?.name || "");
  const [color, setColor] = useState(folder?.color || FOLDER_COLORS[0]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-zoom-in">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {folder ? "Editar Carpeta" : "Nueva Carpeta"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-silver/40 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                Nombre de la Carpeta
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Solo Contenido, VIP..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 transition-all outline-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-silver/40 pl-1">
                Color de Identificación
              </label>
              <div className="grid grid-cols-4 gap-3">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-xl border-2 transition-all p-1 ${
                      color === c ? "border-white scale-110 shadow-lg shadow-white/10" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: c }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-silver/60 font-bold hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(name, color, folder?.id)}
              className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {folder ? "Guardar Cambios" : "Crear Carpeta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
