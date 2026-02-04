import { supabase } from "./supabase";
import { retryWithBackoff } from "../utils/retryHelper";

export interface SiteConfig {
  key: string;
  value: any;
}

export const cmsService = {
  /**
   * Retrieves a configuration by its key.
   */
  async getConfig(key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from("site_configs")
        .select("value")
        .eq("key", key)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      return data.value;
    } catch (err) {
      console.error(`Error fetching config ${key}:`, err);
      return null;
    }
  },

  /**
   * Saves or updates a configuration.
   */
  async saveConfig(key: string, value: any) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user)
      throw new Error("Authenticated user required to save config");

    const { error } = await retryWithBackoff(async () => {
      const result = await supabase.from("site_configs").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userData.user.id,
      });
      if (result.error) throw result.error;
      return result;
    });

    if (error) throw error;
  },

  /**
   * Specifically for coupons (management)
   */
  async getCoupons() {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async saveCoupon(coupon: any) {
    const { error } = await supabase.from("coupons").upsert(coupon);

    if (error) throw error;
  },

  async deleteCoupon(id: string) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) throw error;
  },
};
