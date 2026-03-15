import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableFolderProps {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
}

const DroppableFolder: React.FC<DroppableFolderProps> = ({ id, children, isActive }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-2xl transition-all duration-200 ${
        isOver 
          ? "scale-105 shadow-[0_0_20px_rgba(29,161,242,0.4)] ring-2 ring-primary ring-offset-4 ring-offset-[#050505]" 
          : isActive ? "ring-1 ring-primary/20" : ""
      }`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-primary/10 rounded-2xl pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

export default DroppableFolder;
