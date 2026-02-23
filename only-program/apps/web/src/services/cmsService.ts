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

    const apiUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4005"}/api`;

    const response = await fetch(`${apiUrl}/admin/site-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorMessage = "Error al guardar la configuración";
      if (contentType && contentType.includes("application/json")) {
        const err = await response.json().catch(() => ({}));
        errorMessage = err?.error || response.statusText;
      } else {
        const text = await response.text().catch(() => "");
        errorMessage = `Error ${response.status}: ${text || response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      const text = await response.text();
      console.warn("Expected JSON but received:", text);
      if (text.includes("API MATCH OK")) {
        return {
          success: true,
          message: "Parsed as success despite non-JSON response",
        };
      }
      return { success: true, text };
    }
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
