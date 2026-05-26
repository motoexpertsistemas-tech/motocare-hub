import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AdminGuard({ children }: { children: ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      // Resolve auth_user_id → usuarios.id → user_roles.user_id
      const { data: usuario } = await supabase
        .from("usuarios" as any)
        .select("id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!usuario) {
        navigate("/", { replace: true });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (usuario as any).id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/", { replace: true });
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
