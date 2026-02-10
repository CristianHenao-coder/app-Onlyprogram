import { supabase } from "./supabase.service";
import crypto from "crypto";

export type OTPUsage = "register" | "login" | "reset";

export interface OTPRecord {
  id: string;
  email: string;
  code: string;
  usage: OTPUsage;
  expires_at: string;
  created_at: string;
}

/**
 * Generates a random 6-digit code
 */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Stores a new OTP code in the database
 */
export async function createOTP(
  email: string,
  usage: OTPUsage,
): Promise<string | null> {
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

  // Delete any existing codes for this email and usage to keep it clean
  await supabase.from("temp_otps").delete().match({ email, usage });

  const { error } = await supabase.from("temp_otps").insert({
    email,
    code,
    usage,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("❌ Error creating OTP:", error);
    return null;
  }

  return code;
}

/**
 * Verifies if an OTP code is valid and not expired
 */
export async function verifyOTP(
  email: string,
  code: string,
  usage: OTPUsage,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("temp_otps")
    .select("*")
    .match({ email, code, usage })
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  // Delete the code after successful verification (one-time use)
  await supabase.from("temp_otps").delete().match({ id: data.id });

  return true;
}

/**
 * Clean up expired OTPs (can be called by a cron job)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  const { error } = await supabase
    .from("temp_otps")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) {
    console.error("❌ Error cleaning up OTPs:", error);
  }
}
