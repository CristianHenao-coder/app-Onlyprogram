import { supabase } from "./supabase";

const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:4005") + "/api";

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("No hay sesión activa");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const linksService = {
  async updateButtons(linkId: string, buttons: any[]) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/link-profiles/buttons/${linkId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ buttons }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Error updating buttons");
    }
    return response.json();
  },
};
