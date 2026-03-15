import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { supabase } from "@/services/supabase";
import { storageService } from "@/services/storageService";
import { arrayMove } from "@dnd-kit/sortable";
import {
  LinkPage,
  PageStatus,
  getDefaults,
  cleanButtons,
} from "../pages/Dashboard/LinksModule/types";

// Helper to map DB structure to our Frontend type
const mapDbLinkToLinkPage = (dbLink: any, t: any): LinkPage => {
  const config = dbLink.config || {};
  const DEFAULTS = getDefaults(t);

  return {
    id: dbLink.id,
    name: dbLink.title || config.name || DEFAULTS.PAGE.name,
    profileName: dbLink.title || config.profileName || DEFAULTS.PAGE.profileName,
    profileImage: dbLink.photo || config.profileImage || DEFAULTS.PAGE.profileImage,
    profileImageSize: config.profileImageSize || 100,
    status: (dbLink.status === "active" ? "active" : "draft") as PageStatus,
    template: config.template || (dbLink.mode === "redirect" ? "minimal" : "minimal"),
    landingMode: config.landingMode || (dbLink.mode === "redirect" ? "direct" : "circle"),
    directUrl: dbLink.slug ? `https://${dbLink.slug}.onlyprogram.com` : config.directUrl || "",
    slug: dbLink.slug || "",
    dbStatus: dbLink.status,
    folder: dbLink.folder || config.folder || "",
    theme: {
      backgroundType: config.theme?.backgroundType || "solid",
      backgroundStart: config.theme?.backgroundStart || "#050505",
      backgroundEnd: config.theme?.backgroundEnd || "#050505",
      pageBorderColor: config.theme?.pageBorderColor || "#333333",
      overlayOpacity: config.theme?.overlayOpacity || 40,
    },
    buttons: cleanButtons(dbLink.smart_link_buttons || config.buttons || []),
    customDomain: dbLink.custom_domain || config.customDomain || "",
    domainStatus: dbLink.domain_status || config.domainStatus || "none",
  };
};

export function useLinks(user: any, t: any) {
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  
  const [pages, setPages] = useState<LinkPage[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = useMemo(() => 
    pages.find((p) => p.id === selectedPageId) || pages[0]
  , [pages, selectedPageId]);

  const loadLinks = useCallback(async () => {
    if (!user) return;
    try {
      const { data: dbLinks, error } = await supabase
        .from("smart_links")
        .select("*, smart_link_buttons(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedDbLinks = (dbLinks || []).map((l: any) => mapDbLinkToLinkPage(l, t));

      let localDrafts: LinkPage[] = [];
      try {
        const saved = localStorage.getItem("my_links_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localDrafts = parsed.map((p: any) => ({
              ...p,
              status: "draft" as PageStatus,
              buttons: cleanButtons(p.buttons || []),
              theme: {
                ...p.theme,
                backgroundType: p.theme?.backgroundType || "solid",
                backgroundStart: p.theme?.backgroundStart || "#000000",
                backgroundEnd: p.theme?.backgroundEnd || "#1a1a1a",
              },
            }));
          }
        }
      } catch (e) {
        console.error("Error parsing local links", e);
      }

      const merged = [...mappedDbLinks, ...localDrafts.filter(ld => !mappedDbLinks.some(dl => dl.id === ld.id))];
      
      setPages(merged);
      if (merged.length > 0 && !selectedPageId) {
        setSelectedPageId(merged[0].id);
      }
    } catch (err) {
      console.error("Error loading links:", err);
      toast.error("Error al cargar tus links");
    } finally {
      setInitialLoad(false);
    }
  }, [user, t, selectedPageId]);

  useEffect(() => {
    if (user) {
      loadLinks();
    } else {
      setInitialLoad(false);
    }
  }, [user, loadLinks]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "smart_links",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          if (
            (oldRecord.status === "pending" || oldRecord.status === "draft") &&
            newRecord.status === "active"
          ) {
            const linkName = newRecord.profile_name || newRecord.title || newRecord.name || "Tu link";
            toast.success(`¡Tu link ${linkName} ha sido activado exitosamente!`, {
              duration: 30000,
              icon: "🚀",
            });
            loadLinks();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadLinks]);

  // Auto-save drafts
  useEffect(() => {
    if (initialLoad) return;
    try {
      const drafts = pages.filter(p => !p.dbStatus && p.status === "draft");
      localStorage.setItem("my_links_data", JSON.stringify(drafts));
    } catch (e) {
      console.error("Error backing up drafts:", e);
    }
  }, [pages, initialLoad]);

  // Auto-save active links
  useEffect(() => {
    if (!currentPage || !currentPage.dbStatus || initialLoad) return;

    const handler = setTimeout(async () => {
      setIsSaving(true);
      try {
        const configToSave = {
          name: currentPage.name,
          profileName: currentPage.profileName,
          profileImage: currentPage.profileImage,
          template: currentPage.template,
          landingMode: currentPage.landingMode,
          theme: currentPage.theme,
          folder: currentPage.folder,
          buttons: currentPage.buttons,
          profileImageSize: currentPage.profileImageSize
        };

        const { error } = await supabase
          .from("smart_links")
          .update({
             title: currentPage.profileName,
             photo: currentPage.profileImage,
             config: configToSave,
             folder: currentPage.folder
          })
          .eq("id", currentPage.id);

        if (error) console.error("Auto-save error:", error);
      } catch (err) {
        console.error("Auto-save catch:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [currentPage, initialLoad]);

  const handleUpdatePage = useCallback((field: string, value: any) => {
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        if (field.includes(".")) {
          const parts = field.split(".");
          let current: any = { ...p };
          let target = current;
          for (let i = 0; i < parts.length - 1; i++) {
            target[parts[i]] = { ...target[parts[i]] };
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = value;
          return current;
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  }, [selectedPageId]);

  const handleSyncButtons = async () => {
    if (!currentPage || !currentPage.dbStatus) return;
    setIsSaving(true);
    try {
      await supabase.from("smart_link_buttons").delete().eq("smart_link_id", currentPage.id);
      
      if (currentPage.buttons.length > 0) {
        const buttonsToInsert = currentPage.buttons.map((btn, index) => ({
          smart_link_id: currentPage.id,
          type: btn.type,
          title: btn.title,
          url: btn.url,
          color: btn.color,
          text_color: btn.textColor,
          font: btn.font,
          border_radius: btn.borderRadius,
          opacity: btn.opacity,
          is_active: btn.isActive,
          order: index,
          rotator_active: btn.rotatorActive,
          rotator_links: btn.rotatorLinks || [],
          meta_shield: btn.metaShield,
          subtitle: btn.subtitle
        }));
        await supabase.from("smart_link_buttons").insert(buttonsToInsert);
      }
      toast.success("Cambios guardados correctamente");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Error al sincronizar botones");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveToFolder = useCallback(async (linkId: string, folderName: string | null) => {
    try {
      const actualFolder = folderName === "none" ? null : folderName;
      const targetPage = pages.find(p => p.id === linkId);
      if (!targetPage) return;

      setPages(prev => prev.map(p => p.id === linkId ? { ...p, folder: actualFolder || undefined } : p));

      if (linkId.startsWith("temp-") || !targetPage.dbStatus) {
        const saved = localStorage.getItem("my_links_data");
        if (saved) {
          const drafts = JSON.parse(saved);
          const updated = drafts.map((p: any) => p.id === linkId ? { ...p, folder: folderName } : p);
          localStorage.setItem("my_links_data", JSON.stringify(updated));
        }
      } else {
        await supabase.from("smart_links").update({ folder: folderName }).eq("id", linkId);
      }
      toast.success(folderName ? `Movido a ${folderName}` : "Link quitado");
    } catch (error) {
      console.error("Error moving to folder:", error);
      toast.error("Error al mover el link");
    }
  }, [pages]);

  const handleDeletePage = useCallback(async (id: string, name: string) => {
    const isDraft = !pages.find(p => p.id === id)?.dbStatus;
    const confirmed = await showConfirm({
      title: isDraft ? "¿Eliminar borrador?" : "¿Eliminar link activo?",
      message: `"${name}" se eliminará permanentemente. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar definitivamente",
      type: "info"
    });
    
    if (!confirmed) return;

    try {
      const pageToDelete = pages.find(p => p.id === id);
      if (!pageToDelete) return;

      if (!isDraft) {
        if (pageToDelete.profileImage && pageToDelete.profileImage.includes("cms-assets")) {
          await storageService.deleteImage(pageToDelete.profileImage);
        }
        await supabase.from("smart_links").delete().eq("id", id);
      }

      setPages(prev => {
        const updated = prev.filter(p => p.id !== id);
        const drafts = updated.filter(p => !p.dbStatus && p.status === "draft");
        localStorage.setItem("my_links_data", JSON.stringify(drafts));
        return updated;
      });

      if (selectedPageId === id) setSelectedPageId("");
      toast.success(isDraft ? "Borrador eliminado" : "Link eliminado");
    } catch (err) {
      console.error("Error deleting page:", err);
      toast.error("Error al eliminar el link");
    }
  }, [pages, selectedPageId, showConfirm]);

  const handleDragEnd = useCallback((event: any, view: string) => {
    const { active, over } = event;
    if (!over || !currentPage) return;

    if (view === "editor" && active.id !== over.id) {
      const oldIndex = currentPage.buttons.findIndex(b => b.id === active.id);
      const newIndex = currentPage.buttons.findIndex(b => b.id === over.id);
      handleUpdatePage("buttons", arrayMove(currentPage.buttons, oldIndex, newIndex));
      return;
    }

    if (view === "list") {
      handleMoveToFolder(active.id as string, over.id as string);
    }
  }, [currentPage?.buttons, handleUpdatePage, handleMoveToFolder]);

  const isValidUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  return {
    pages,
    setPages,
    currentPage,
    selectedPageId,
    setSelectedPageId,
    initialLoad,
    isSaving,
    loadLinks,
    handleUpdatePage,
    handleSyncButtons,
    handleDeletePage,
    handleMoveToFolder,
    handleDragEnd,
    isValidUrl,
    navigate,
  };
}
