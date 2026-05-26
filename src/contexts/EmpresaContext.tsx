import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EmpresaContextType {
  empresaId: string | null;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType>({ empresaId: null, loading: true });

export const useEmpresa = () => useContext(EmpresaContext);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        setEmpresaId(data?.empresa_id ?? null);
        setLoading(false);
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setEmpresaId(null);
        setLoading(false);
        return;
      }
      supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setEmpresaId(data?.empresa_id ?? null);
          setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <EmpresaContext.Provider value={{ empresaId, loading }}>
      {children}
    </EmpresaContext.Provider>
  );
}
