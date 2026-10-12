import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, data: { full_name: string; phone: string; role: UserRole }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      return;
    }

    // OAuth users may already exist in auth.users while their profile row is
    // missing (for example, if the signup trigger was not installed). Create
    // only that missing row and keep existing roles/profile data untouched.
    const metadata = user.user_metadata ?? {};
    const fullName = metadata.full_name ?? metadata.name ?? null;
    const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;
    const { data: createdProfile } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: typeof fullName === "string" ? fullName : null,
        avatar_url: typeof avatarUrl === "string" ? avatarUrl : null,
        role: "renter",
      }, { onConflict: "id", ignoreDuplicates: true })
      .select("*")
      .maybeSingle();

    if (createdProfile) {
      setProfile(createdProfile as Profile);
      return;
    }

    // ignoreDuplicates may return no row when another request or the database
    // trigger created it concurrently. Read the canonical row in that case.
    const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((existingProfile as Profile | null) ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, data: { full_name: string; phone: string; role: UserRole }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data },
    });

    if (!error && authData.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).upsert({
        id: authData.user.id,
        email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
      });
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role: profile?.role ?? null, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
