import { supabase } from "./supabase.service";
import crypto from "crypto";

export type OTPUsage = "register" | "login" | "reset" | "device";

export interface OTPRecord {
  id: string;
  email: string;
  code: string;
  usage: OTPUsage;
  expires_at: string;
  created_at: string;
  attempts: number;
  locked_until?: string;
}

/**
 * Generates a random 6-digit code
 */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generates a secure random device token
 */
export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Stores a new OTP code in the database (1-minute expiry)
 */
export async function createOTP(
  email: string,
  usage: OTPUsage,
): Promise<string | null> {
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000).toISOString(); // 1 minute

  // Delete any existing codes for this email and usage to keep it clean
  await supabase.from("temp_otps").delete().match({ email, usage });

  const { error } = await supabase.from("temp_otps").insert({
    email,
    code,
    usage,
    expires_at: expiresAt,
    attempts: 0,
  });

  if (error) {
    console.error("❌ Error creating OTP:", error);
    return null;
  }

  return code;
}

/**
 * Checks if an email is currently locked due to too many failed attempts
 */
export async function isEmailLocked(
  email: string,
  usage: OTPUsage,
): Promise<{ locked: boolean; lockedUntil?: string }> {
  const { data } = await supabase
    .from("temp_otps")
    .select("locked_until")
    .match({ email, usage })
    .single();

  if (data?.locked_until) {
    const lockedUntil = new Date(data.locked_until);
    if (lockedUntil > new Date()) {
      return { locked: true, lockedUntil: data.locked_until };
    }
  }

  return { locked: false };
}

/**
 * Verifies if an OTP code is valid and handles failed attempt counting
 * Returns: { valid, locked, attemptsLeft, lockedUntil }
 */
export async function verifyOTP(
  email: string,
  code: string,
  usage: OTPUsage,
): Promise<{
  valid: boolean;
  locked?: boolean;
  attemptsLeft?: number;
  lockedUntil?: string;
}> {
  // Check if record exists (even expired)
  const { data: record } = await supabase
    .from("temp_otps")
    .select("*")
    .match({ email, usage })
    .single();

  if (!record) {
    return { valid: false };
  }

  // Check if locked
  if (record.locked_until && new Date(record.locked_until) > new Date()) {
    return { valid: false, locked: true, lockedUntil: record.locked_until };
  }

  // Check if expired
  if (new Date(record.expires_at) < new Date()) {
    await supabase.from("temp_otps").delete().match({ id: record.id });
    return { valid: false };
  }

  // Check if code matches
  if (record.code !== code) {
    const newAttempts = (record.attempts || 0) + 1;

    if (newAttempts >= 3) {
      // Lock for 10 minutes
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase
        .from("temp_otps")
        .update({ attempts: newAttempts, locked_until: lockedUntil })
        .match({ id: record.id });
      return { valid: false, locked: true, lockedUntil };
    } else {
      await supabase
        .from("temp_otps")
        .update({ attempts: newAttempts })
        .match({ id: record.id });
      return { valid: false, attemptsLeft: 3 - newAttempts };
    }
  }

  // Code is correct — delete it (one-time use)
  await supabase.from("temp_otps").delete().match({ id: record.id });

  return { valid: true };
}

/**
 * Store a verified device token in the database
 */
export async function storeDeviceToken(
  userId: string,
  deviceToken: string,
  userAgent: string,
  ip: string,
): Promise<boolean> {
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString(); // 30 days

  const { error } = await supabase.from("device_tokens").insert({
    user_id: userId,
    token: deviceToken,
    user_agent: userAgent,
    ip_address: ip,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("❌ Error storing device token:", error);
    return false;
  }

  return true;
}

/**
 * Validate a device token
 */
export async function validateDeviceToken(
  userId: string,
  deviceToken: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("device_tokens")
    .select("id, expires_at")
    .match({ user_id: userId, token: deviceToken })
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

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
