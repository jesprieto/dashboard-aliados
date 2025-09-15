import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  ready: boolean; // Supabase configured
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function init() {
      if (!hasSupabaseConfig) {
        setLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, s) => {
          setSession(s);
        },
      );
      unsub = listener.subscription.unsubscribe.bind(listener.subscription);
    }
    init();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      ready: hasSupabaseConfig,
      async signIn(email: string, password: string) {
        if (!hasSupabaseConfig)
          return { error: "Supabase no está configurado" };
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message };
      },
      async signOut() {
        if (!hasSupabaseConfig) return;
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
