import { API_URL } from './apiConfig';
import { supabase } from './supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No hay sesión activa');
  return { Authorization: `Bearer ${token}` };
}

// ─── Types ───────────────────────────────────────────────────
export interface AnalyticsOverview {
  totalClicks: number;
  totalUnique: number;
  botsBlocked: number;
  conversionRate: number;
  countries: { code: string; name: string; count: number; pct: number }[];
  sources: { name: string; count: number; pct: number }[];
  byMonth: { label: string; value: number }[];
  byButton: { type: string; count: number; pct: number }[];
  links: {
    id: string;
    title: string;
    slug: string;
    photo?: string;
    is_active: boolean;
    clicks: number;
    unique_clicks: number;
  }[];
}

// ─── Track a click event (fire-and-forget, public endpoint) ──
export async function trackEvent(opts: {
  linkId: string;
  buttonId?: string;
  buttonType: string;
  referrer?: string;
}): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link_id: opts.linkId,
        button_id: opts.buttonId ?? null,
        button_type: opts.buttonType,
        referrer: opts.referrer ?? document.referrer ?? null,
      }),
    });
  } catch {
    // fire-and-forget: never block navigation on analytics errors
  }
}

// ─── Get aggregated overview (authenticated) ─────────────────
export async function getAnalyticsOverview(days = 30): Promise<AnalyticsOverview> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/analytics/overview?days=${days}`, { headers });
  if (!res.ok) throw new Error('Error obteniendo analíticas');
  return res.json();
}

// ─── Get raw events list (authenticated) ─────────────────────
export async function getAnalyticsEvents(opts: { linkId?: string; days?: number } = {}): Promise<any[]> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (opts.days) params.set('days', String(opts.days));
  if (opts.linkId) params.set('link_id', opts.linkId);
  const res = await fetch(`${API_URL}/analytics/events?${params}`, { headers });
  if (!res.ok) throw new Error('Error obteniendo eventos');
  const json = await res.json();
  return json.events ?? [];
}
