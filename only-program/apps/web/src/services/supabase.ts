import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  created_at?: string;
  role: "user" | "admin";
  plan_type?: string;
  is_suspended: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  max_links?: number;
  is_bulk: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface SmartLink {
  id: string;
  user_id: string;
  slug: string;
  title?: string;
  subtitle?: string;
  mode: "landing" | "redirect";
  photo?: string;
  config: Record<string, any>;
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  created_at?: string;
  suspended_at?: string;
  suspended_reason?: string;
  subscription_id?: string;
  expires_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired";
  started_at?: string;
  current_period_start: string;
  current_period_end: string;
  last_payment_at?: string;
  next_payment_at: string;
  cancelled_at?: string;
  total_links: number;
  discount_percent: number;
  total_amount: number;
}
