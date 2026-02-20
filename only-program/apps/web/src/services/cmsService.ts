import { supabase } from "./supabase";

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
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data?.value || null;
    } catch (err) {
      console.error(`Error fetching config ${key}:`, err);
      return null;
    }
  },

  /**
   * Saves or updates a configuration via backend (bypasses RLS using service role).
   */
  async saveConfig(key: string, value: any) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Authenticated user required to save config");

    const apiUrl =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:4005";

    const response = await fetch(`${apiUrl}/api/admin/site-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(err?.error || "Error al guardar la configuración");
    }

    return response.json();
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
