// ─── ICONS & CONSTANTS ─────────────────────────────────────────────────────────
// This file contains all static assets, icons, social presets, and default values
// for the Links module.

import instagramLogo from "@/assets/animations/instagram.png";
import tiktokLogo from "@/assets/animations/tik-tok.png";
import type { FontType, BackgroundType, PageStatus, TemplateType, LinkPage } from "./types";

// ─── ICONS ────────────────────────────────────────────────────────────────────

export const Icons = {
  Instagram: () => (
    <img src={instagramLogo} alt="Instagram" className="w-full h-full object-contain" />
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-500">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14-2.85 0-4.643 1.743-4.643 4.96v2.54H7.5v4h2.5v11h4v-11z" />
    </svg>
  ),
  TikTok: () => (
    <img src={tiktokLogo} alt="TikTok" className="w-full h-full object-contain" />
  ),
  Telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.441z" />
    </svg>
  ),
  OnlyFans: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12,14.66C8.32,14.66,5.33,11.67,5.33,8S8.32,1.33,12,1.33S18.66,4.32,18.66,8S15.68,14.66,12,14.66z M12,4.66c-1.84,0-3.33,1.5-3.33,3.33S10.16,11.33,12,11.33s3.33-1.5,3.33-3.33S13.84,4.66,12,4.66z M12,22.66c-3.68,0-6.66-2.98-6.66-6.66c0-0.74,0.12-1.45,0.34-2.11c0.16-0.49,0.59-0.84,1.1-0.9c0.51-0.06,1.01,0.17,1.26,0.61c0.41,0.72,0.63,1.54,0.63,2.4c0,2.02,1.64,3.66,3.66,3.66s3.66-1.64,3.66-3.66c0-0.86-0.22-1.68-0.63-2.4c-0.25-0.44-0.17-0.99,0.19-1.34c0.36-0.35,0.91-0.4,1.32-0.12c0.88,0.6,1.45,1.6,1.45,2.73C18.66,19.68,15.68,22.66,12,22.66z" />
    </svg>
  ),
  Custom: () => <span className="material-symbols-outlined text-xl">link</span>,
};

// ─── SOCIAL PRESETS ────────────────────────────────────────────────────────────

export const getSocialPresets = (t: any) => ({
  instagram: {
    title: "Instagram",
    color: "#FFFFFF",
    textColor: "#000000",
    icon: <Icons.Instagram />,
    placeholder: t("dashboard.links.instagramPlaceholder"),
  },
  tiktok: {
    title: "TikTok",
    color: "#000000",
    icon: <Icons.TikTok />,
    placeholder: t("dashboard.links.tiktokPlaceholder"),
  },
  telegram: {
    title: "Telegram",
    color: "#0088cc",
    icon: <Icons.Telegram />,
    placeholder: t("dashboard.links.telegramPlaceholder"),
  },
  onlyfans: {
    title: t("home.preview.linksDemo.vipAccess"),
    color: "#00AFF0",
    icon: <Icons.OnlyFans />,
    placeholder: t("dashboard.links.onlyfansPlaceholder"),
  },
  custom: {
    title: t("dashboard.links.editButton"),
    color: "#333333",
    icon: <Icons.Custom />,
    placeholder: "https://...",
  },
});

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

export const PROFILE_IMAGE_DEFAULT =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export const getDefaults = (t: any) => ({
  PROFILE_IMAGE: PROFILE_IMAGE_DEFAULT,
  PAGE: {
    id: "",
    status: "draft" as PageStatus,
    name: t("dashboard.links.untitledLink"),
    profileName: t("dashboard.links.profileName"),
    profileImage: PROFILE_IMAGE_DEFAULT,
    profileImageSize: 100,
    template: "minimal" as TemplateType,
    landingMode: "circle" as string,
    directUrl: "",
    modelName: "",
    theme: {
      pageBorderColor: "#333333",
      overlayOpacity: 40,
      backgroundType: "solid" as BackgroundType,
      backgroundStart: "#000000",
      backgroundEnd: "#1a1a1a",
    },
    buttons: [],
    domainStatus: "none" as const,
  },
});

// ─── FONT MAP ─────────────────────────────────────────────────────────────────

export const FONT_MAP: Record<FontType, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  display: "font-sans tracking-widest",
};

// ─── UNIQUE SOCIAL TYPES ───────────────────────────────────────────────────────

export const UNIQUE_SOCIAL_TYPES = ["instagram", "tiktok", "telegram", "onlyfans"];

// ─── UTILITIES ────────────────────────────────────────────────────────────────

/** Returns the CSS background style object for a given page's theme */
export const getBackgroundStyle = (page: LinkPage) => {
  if (page.theme.backgroundType === "solid") {
    return { background: page.theme.backgroundStart };
  } else if (page.theme.backgroundType === "blur") {
    return {
      backgroundImage: `url(${page.profileImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    background: `linear-gradient(to bottom right, ${page.theme.backgroundStart}, ${page.theme.backgroundEnd})`,
  };
};

/** Validates that a URL is http or https */
export const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** Deduplicates buttons, keeping only the first of each unique social type */
export const cleanButtons = (buttons: any[]) => {
  const seenTypes = new Set<string>();
  return buttons
    .filter((btn) => {
      if (UNIQUE_SOCIAL_TYPES.includes(btn.type)) {
        if (seenTypes.has(btn.type)) return false;
        seenTypes.add(btn.type);
      }
      return true;
    })
    .map((btn) => ({
      id: btn.id,
      type: btn.type,
      title: btn.title,
      subtitle: btn.subtitle || "",
      url: btn.url || "",
      color: btn.color,
      textColor: btn.textColor || btn.text_color,
      font: btn.font || "sans",
      borderRadius: btn.borderRadius ?? btn.border_radius ?? 12,
      opacity: btn.opacity ?? 100,
      isActive: btn.isActive ?? btn.is_active ?? true,
      rotatorActive: btn.rotatorActive ?? btn.rotator_active ?? false,
      rotatorLinks: btn.rotatorLinks || btn.rotator_links || ["", "", "", "", ""],
      deviceRedirects: btn.deviceRedirects || btn.device_redirects || { ios: "", android: "" },
    }));
};
