import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";

export interface Branch {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string | null;
}

interface BranchContextType {
  activeBranch: Branch | null;
  branches: Branch[];
  setActiveBranch: (branch: Branch) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextType>({
  activeBranch: null,
  branches: [],
  setActiveBranch: () => {},
  loading: true,
});

export const useBranch = () => useContext(BranchContext);

const STORAGE_KEY = "activeBranch";

export function BranchProvider({ children }: { children: ReactNode }) {
  const { empresaId } = useEmpresa();
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branch));
  };

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, nome, tipo, cnpj")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading branches:", error);
        setLoading(false);
        return;
      }

      const list: Branch[] = data || [];
      setBranches(list);

      // Try to restore from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Branch;
          // Validate it still exists in current tenant branches
          if (list.some((b) => b.id === parsed.id)) {
            setActiveBranchState(parsed);
            setLoading(false);
            return;
          }
        } catch {}
      }

      // Default to matriz
      const matriz = list.find((b) => b.tipo === "matriz");
      if (matriz) {
        setActiveBranch(matriz);
      } else if (list.length > 0) {
        setActiveBranch(list[0]);
      }
      setLoading(false);
    };

    load();
  }, [empresaId]);

  return (
    <BranchContext.Provider value={{ activeBranch, branches, setActiveBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
}
