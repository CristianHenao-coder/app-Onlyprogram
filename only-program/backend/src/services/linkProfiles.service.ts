import { supabase } from "../config/supabase";

export interface LinkProfile {
  id?: string;
  user_id: string;
  smart_link_id?: string;
  background_type: "solid" | "gradient" | "image";
  background_color: string;
  background_gradient_start?: string;
  background_gradient_end?: string;
  background_image_url?: string;
  background_opacity: number;
  font_family: string;
  font_size: number;
  social_links: Array<{
    type: string;
    url: string;
    icon: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface LinkButton {
  id: string;
  title: string;
  url: string;
  type: "custom" | "telegram" | "onlyfans" | "instagram";
  icon_type?: string;
  icon_url?: string;
  button_shape: "rounded" | "square" | "soft";
  border_width: number;
  shadow_intensity: number;
  button_color: string;
  text_color: string;
  order: number;
  active: boolean;
}

export const linkProfilesService = {
  /**
   * Get user's link profile
   */
  async getProfile(userId: string): Promise<LinkProfile | null> {
    const { data, error } = await supabase
      .from("link_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching link profile: ${error.message}`);
    }

    return data;
  },

  /**
   * Create or update link profile
   */
  async upsertProfile(profile: LinkProfile): Promise<LinkProfile> {
    const { data, error } = await supabase
      .from("link_profiles")
      .upsert(profile, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Error upserting link profile: ${error.message}`);
    }

    return data;
  },

  /**
   * Get smart link with buttons
   */
  async getSmartLink(userId: string, linkId?: string): Promise<any> {
    let query = supabase.from("smart_links").select("*").eq("user_id", userId);

    if (linkId) {
      query = query.eq("id", linkId);
    } else {
      query = query.limit(1);
    }

    const { data, error } = await supabase
      .from("smart_links")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching smart link: ${error.message}`);
    }

    return data;
  },

  /**
   * Update smart link buttons
   */
  async updateButtons(linkId: string, buttons: LinkButton[]): Promise<void> {
    const { error } = await supabase
      .from("smart_links")
      .update({ buttons })
      .eq("id", linkId);

    if (error) {
      throw new Error(`Error updating buttons: ${error.message}`);
    }
  },

  /**
   * Update smart link branding (photo, title, subtitle, verified badge)
   */
  async updateBranding(
    linkId: string,
    branding: {
      photo?: string;
      title?: string;
      subtitle?: string;
      verified_badge?: boolean;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("smart_links")
      .update(branding)
      .eq("id", linkId);

    if (error) {
      throw new Error(`Error updating branding: ${error.message}`);
    }
  },

  /**
   * Delete image from storage
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage.from("link-assets").remove([path]);

    if (error) {
      throw new Error(`Error deleting image: ${error.message}`);
    }
  },
};
