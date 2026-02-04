import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { User, Session, AuthError } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  /* 
    Enhanced signUp to handle profile creation 
  */
  const signUpWithEmail = async (
    email: string, 
    password: string, 
    metadata?: { 
      full_name?: string; 
      phone?: string; 
      country?: string; 
    }
  ) => {
    // 1. SignUp with Supabase Auth
    // We pass metadata so it's stored in user_metadata as well (useful for quick access)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.full_name,
          phone: metadata?.phone,
          country: metadata?.country,
        },
      },
    });

    if (error) return { data, error };

    // 2. Insert into public.profiles is now handled by a Database Trigger.
    // We do NOT manually insert here to avoid RLS issues (since user has no session yet).

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

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
}
