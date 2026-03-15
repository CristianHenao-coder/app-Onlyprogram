export type TemplateType = "minimal" | "split" | "full";
export type SocialType = "instagram" | "tiktok" | "telegram" | "onlyfans" | "custom";
export type FontType = "sans" | "serif" | "mono" | "display";
export type PageStatus = "active" | "draft";
export type BackgroundType = "solid" | "gradient" | "blur";
export type LandingMode = "circle" | "full" | "dual" | "direct" | "tiktok" | "landing" | "both";

export interface ButtonLink {
  id: string;
  type: SocialType;
  title: string;
  subtitle?: string;
  url: string;
  color: string;
  textColor: string;
  font: FontType;
  borderRadius: number;
  opacity: number;
  isActive: boolean;
  rotatorActive?: boolean;
  rotatorLinks?: string[];
  metaShield?: boolean;
  deviceRedirects?: {
    ios: string;
    android: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface LinkPage {
  id: string;
  status: PageStatus;
  name: string;
  profileName: string;
  profileImage: string;
  profileImageSize?: number;
  template: TemplateType;
  landingMode?: LandingMode;
  security_config?: {
    geoblocking?: string[];
    device_redirections?: {
      ios?: string;
      android?: string;
      desktop?: string;
    };
  };
  directUrl?: string;
  theme: {
    pageBorderColor: string;
    overlayOpacity: number;
    backgroundType: BackgroundType;
    backgroundStart: string;
    backgroundEnd: string;
  };
  buttons: ButtonLink[];
  folder?: string;
  customDomain?: string;
  domainStatus?: "none" | "pending" | "active" | "failed";
  domainNotes?: string;
  slug?: string;
  dbStatus?: string;
  telegramMaxCapacity?: number;
  telegramRotationLimit?: number;
  modelName?: string;
  metaShield?: boolean;
  tiktokShield?: boolean;
}

export type PageData = LinkPage;

export const UNIQUE_SOCIAL_TYPES: SocialType[] = [
  "instagram",
  "tiktok",
  "telegram",
  "onlyfans",
];

export const FONT_MAP: Record<FontType, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  display: "font-sans tracking-widest",
};

export const getBackgroundStyle = (page: LinkPage) => {
  if (!page || !page.theme) return { backgroundColor: "#050505" };
  const { backgroundType, backgroundStart, backgroundEnd } = page.theme;
  
  if (backgroundType === "solid") {
    return { backgroundColor: backgroundStart || "#050505" };
  } else if (backgroundType === "blur") {
    return {
      backgroundImage: `url(${page.profileImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    backgroundImage: `linear-gradient(to bottom right, ${backgroundStart || '#000'}, ${backgroundEnd || '#000'})`,
  };
};

export const cleanButtons = (buttons: any[]): ButtonLink[] => {
  const seenTypes = new Set<SocialType>();
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
      textColor: btn.textColor || btn.text_color || "#FFFFFF",
      font: btn.font || "sans",
      borderRadius: btn.borderRadius ?? btn.border_radius ?? 12,
      opacity: btn.opacity ?? 100,
      isActive: btn.isActive ?? btn.is_active ?? true,
      metaShield: btn.metaShield ?? btn.meta_shield ?? false,
      rotatorActive: btn.rotatorActive ?? btn.rotator_active ?? false,
      rotatorLinks: btn.rotatorLinks || btn.rotator_links || ["", "", "", "", ""],
      deviceRedirects: btn.deviceRedirects || btn.device_redirects || { ios: "", android: "" },
    }));
};

export const getDefaults = (t: any) => ({
  PROFILE_IMAGE: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  PAGE: {
    id: "",
    status: "draft" as PageStatus,
    name: t("dashboard.links.untitledLink"),
    profileName: t("dashboard.links.profileName"),
    profileImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    profileImageSize: 100,
    template: "minimal" as TemplateType,
    landingMode: "circle" as const,
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
