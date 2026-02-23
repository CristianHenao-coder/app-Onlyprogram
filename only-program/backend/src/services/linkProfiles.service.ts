import { supabase } from "./supabase.service";

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
  id?: string;
  smart_link_id?: string;
  title: string;
  subtitle?: string;
  url: string;
  type: string;
  color: string;
  text_color: string;
  font?: string;
  border_radius?: number;
  opacity?: number;
  is_active: boolean;
  order: number;
  rotator_active?: boolean;
  rotator_links?: string[];
  // Legacy camelCase fields for backward compatibility
  textColor?: string;
  borderRadius?: number;
  isActive?: boolean;
  rotatorActive?: boolean;
  rotatorLinks?: string[];
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
    let query = supabase
      .from("smart_links")
      .select(
        `
        *,
        smart_link_buttons (*)
      `,
      )
      .eq("user_id", userId);

    if (linkId) {
      query = query.eq("id", linkId);
    } else {
      query = query.limit(1);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching smart link: ${error.message}`);
    }

    if (data && data.smart_link_buttons) {
      // Map smart_link_buttons to buttons field for backward compatibility if needed,
      // or just ensure the frontend is updated.
      // For now, let's keep the nested array but also update the 'buttons' field
      // so the existing logic doesnt break immediately.
      data.buttons = data.smart_link_buttons.sort(
        (a: any, b: any) => a.order - b.order,
      );
    }

    return data;
  },

  /**
   * Update smart link buttons
   */
  async updateButtons(linkId: string, buttons: LinkButton[]): Promise<void> {
    // 1. Filter buttons to ensure only one of each social type exists
    // Social types that should be unique: instagram, tiktok, telegram, onlyfans
    const socialTypes = ["instagram", "tiktok", "telegram", "onlyfans"];
    const seenSocialTypes = new Set<string>();

    const deduplicatedButtons = buttons.filter((btn) => {
      if (socialTypes.includes(btn.type)) {
        if (seenSocialTypes.has(btn.type)) {
          console.warn(
            `Duplicated button type ${btn.type} found for link ${linkId}. Skipping.`,
          );
          return false;
        }
        seenSocialTypes.add(btn.type);
      }
      return true;
    });

    // 2. Delete existing buttons
    const { error: deleteError } = await supabase
      .from("smart_link_buttons")
      .delete()
      .eq("smart_link_id", linkId);

    if (deleteError) {
      throw new Error(`Error deleting old buttons: ${deleteError.message}`);
    }

    // 3. Insert new buttons
    if (deduplicatedButtons.length > 0) {
      const buttonsToInsert = deduplicatedButtons.map((btn, index) => ({
        smart_link_id: linkId,
        type: btn.type,
        title: btn.title,
        subtitle: btn.subtitle,
        url: btn.url,
        color: btn.color,
        text_color: btn.text_color || btn.textColor,
        font: btn.font,
        border_radius: btn.border_radius || btn.borderRadius,
        opacity: btn.opacity,
        is_active: btn.is_active ?? btn.isActive ?? true,
        order: btn.order ?? index,
        rotator_active: btn.rotator_active ?? btn.rotatorActive ?? false,
        rotator_links: btn.rotator_links || btn.rotatorLinks || [],
      }));

      const { error: insertError } = await supabase
        .from("smart_link_buttons")
        .insert(buttonsToInsert);

      if (insertError) {
        throw new Error(`Error inserting buttons: ${insertError.message}`);
      }
    }

    // 4. Update the JSONB buttons field in smart_links for safety/legacy
    await supabase
      .from("smart_links")
      .update({ buttons: deduplicatedButtons })
      .eq("id", linkId);
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
