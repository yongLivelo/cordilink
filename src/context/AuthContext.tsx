import { supabase } from "@/lib/supabaseClient";
import type { Role } from "@/types/role";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
interface AuthContextType {
  refreshSession: () => void;
  session: Session | null;
  loading: boolean;
  role: Role;
}
const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactElement;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<Role | null>(null);
  const fetchRole = async (session: Session | null) => {
    if (session?.user) {
      const { data, error } = await supabase
        .from("profile")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        console.error("Failed to get role: ", error);
      }

      setRole(data?.role ?? null);
      setLoading(false);
    } else {
      setRole(null);
      setLoading(false);
    }
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchRole(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    const {
      data: { session: updatedSession },
    } = await supabase.auth.getSession();
    setSession(updatedSession);
    await fetchRole(updatedSession);
  };

  return (
    <AuthContext.Provider value={{ session, loading, role, refreshSession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
