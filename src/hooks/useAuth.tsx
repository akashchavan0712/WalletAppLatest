import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error) {
      // Seed default categories for new user
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await seedDefaultCategories(newUser.id);
      }
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function seedDefaultCategories(userId: string) {
  const defaults = [
    { name: "Food & Dining", icon: "🍕", color: "#F97316", budget: 8000 },
    { name: "Shopping", icon: "🛍️", color: "#EC4899", budget: 5000 },
    { name: "Housing & Rent", icon: "🏠", color: "#8B5CF6", budget: 25000 },
    { name: "Transport", icon: "🚗", color: "#3B82F6", budget: 3000 },
    { name: "Travel", icon: "✈️", color: "#06B6D4", budget: 5000 },
    { name: "Healthcare", icon: "💊", color: "#10B981", budget: 3000 },
    { name: "Investments", icon: "📈", color: "#6366F1", budget: 15000 },
    { name: "Education", icon: "📚", color: "#F59E0B", budget: 2000 },
    { name: "Entertainment", icon: "🎬", color: "#EF4444", budget: 3000 },
    { name: "Personal Care", icon: "💅", color: "#D946EF", budget: 2000 },
    { name: "Family & Kids", icon: "👨‍👩‍👧", color: "#14B8A6", budget: 5000 },
    { name: "Bills & Utilities", icon: "💡", color: "#F97316", budget: 5000 },
    { name: "Miscellaneous", icon: "📦", color: "#6B7280", budget: 2000 },
  ];

  await supabase.from("categories").insert(
    defaults.map((c) => ({ ...c, user_id: userId }))
  );
}
