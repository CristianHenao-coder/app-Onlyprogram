import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    captchaToken?: string,
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });
    return { data, error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: {
      full_name?: string;
      phone?: string;
      country?: string;
    },
    captchaToken?: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.full_name,
          phone: metadata?.phone,
          country: metadata?.country,
        },
        captchaToken,
      },
    });

    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4005/api";

  const requestOTP = async (
    email: string,
    usage: "register" | "login" | "reset",
    lang: string = "es",
  ) => {
    try {
      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usage, lang }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error requesting OTP");
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const verifyOTP = async (params: {
    email: string;
    code: string;
    usage: "register" | "login" | "reset";
    password?: string;
    name?: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error verifying OTP");

      // If it returns a user/session (like in register), we might need to set it
      // However, usually register with admin.createUser doesn't log the user in automatically
      // We might need to call signInWithPassword immediately after if verified

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    profile,
    isAdmin: profile?.role === "admin",
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    requestOTP,
    verifyOTP,
  };
}
