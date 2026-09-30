import { supabase } from "@/lib/supabaseClient";
import type { Role } from "@/types/role";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
interface AuthContextType {
  session: Session | null;
  loading: boolean;
  role: Role | null;
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
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (error) throw error;
        setRole(data.role);
      } catch (err) {
        console.error("Failed to get role: ", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
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
      console.log(session);
      fetchRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, role }}>
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
