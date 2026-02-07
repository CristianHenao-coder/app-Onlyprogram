import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export interface LinkEditorData {
  // Brand Identity
  profilePhotoBase64: string | null;
  displayName: string;
  username: string;
  bio: string;
  verifiedBadge: boolean;

  // Background
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  backgroundImageBase64: string | null;
  backgroundOpacity: number;

  // Typography
  fontFamily: string;
  fontSize: number;

  // Blocks (Buttons, Text, Images)
  blocks: LinkBlock[];

  // Meta
  isPaid: boolean;
  lastSaved: string;
}

export type BlockType = "button" | "text" | "image";
export type ButtonVariant =
  | "custom"
  | "telegram"
  | "onlyfans"
  | "instagram"
  | "whatsapp"
  | "tiktok";

export interface LinkBlock {
  id: string;
  type: BlockType;

  // Common
  visible: boolean;

  // Button Specific
  title?: string;
  url?: string;
  variant?: ButtonVariant;
  iconType?: string;
  iconBase64?: string | null;
  buttonShape?: "rounded" | "square" | "soft";
  buttonColor?: string;
  textColor?: string;
  borderWidth?: number;
  shadowIntensity?: number;

  // Text Specific
  content?: string;
  align?: "left" | "center" | "right";

  // Image Specific
  imageBase64?: string | null;
  caption?: string;
}

const STORAGE_KEY = "link_editor_data";

const DEFAULT_DATA: LinkEditorData = {
  profilePhotoBase64: null,
  displayName: "",
  username: "",
  bio: "",
  verifiedBadge: false,
  backgroundType: "solid",
  backgroundColor: "#0B0B0B",
  backgroundGradientStart: "#1DA1F2",
  backgroundGradientEnd: "#6FD6FF",
  backgroundImageBase64: null,
  backgroundOpacity: 100,
  fontFamily: "Inter",
  fontSize: 16,
  blocks: [],
  isPaid: false,
  lastSaved: new Date().toISOString(),
};

export function useLinkEditor() {
  const [data, setData] = useState<LinkEditorData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: if 'buttons' exists but 'blocks' doesn't, migrate it
      if (parsed.buttons && !parsed.blocks) {
        parsed.blocks = parsed.buttons.map((btn: any) => ({
          ...btn,
          type: "button",
          visible: btn.active !== false,
        }));
        delete parsed.buttons;
      }
      return parsed;
    }
    return DEFAULT_DATA;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    const updated = { ...data, lastSaved: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHasUnsavedChanges(true);
  }, [data]);

  const updateData = (updates: Partial<LinkEditorData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const addBlock = (type: BlockType) => {
    const newBlock: LinkBlock = {
      id: crypto.randomUUID(),
      type,
      visible: true,
    };

    // Set defaults based on type
    if (type === "button") {
      newBlock.title = "Nuevo Botón";
      newBlock.url = "";
      newBlock.variant = "custom";
      newBlock.buttonShape = "rounded";
      newBlock.buttonColor = "#1DA1F2";
      newBlock.textColor = "#FFFFFF";
      newBlock.borderWidth = 0;
      newBlock.shadowIntensity = 0;
      newBlock.iconType = "link";
    } else if (type === "text") {
      newBlock.content = "Nuevo texto";
      newBlock.align = "center";
      newBlock.textColor = "#FFFFFF";
    } else if (type === "image") {
      newBlock.imageBase64 = null;
    }

    setData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));

    toast.success(
      `Bloque de ${type === "button" ? "botón" : type === "text" ? "texto" : "imagen"} añadido`,
    );
    return newBlock.id;
  };

  const updateBlock = (id: string, updates: Partial<LinkBlock>) => {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block,
      ),
    }));
  };

  const deleteBlock = (id: string) => {
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
    toast.success("Bloque eliminado");
  };

  const duplicateBlock = (id: string) => {
    const block = data.blocks.find((b) => b.id === id);
    if (!block) return;

    const newBlock = { ...block, id: crypto.randomUUID() };
    setData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    toast.success("Bloque duplicado");
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = data.blocks.findIndex((b) => b.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.blocks.length) return;

    const newBlocks = [...data.blocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];

    setData((prev) => ({ ...prev, blocks: newBlocks }));
  };

  return {
    data,
    hasUnsavedChanges,
    updateData,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
  };
}
