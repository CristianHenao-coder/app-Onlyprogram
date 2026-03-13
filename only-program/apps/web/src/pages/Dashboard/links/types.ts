// ─── TYPES ────────────────────────────────────────────────────────────────────
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
  rotatorLinks?: string[]; // Up to 5
  deviceRedirects?: {
    ios: string;
    android: string;
  };
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
