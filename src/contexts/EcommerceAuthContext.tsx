import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EcommerceCliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  loja_id?: string;
  cliente_id?: string;
}

interface EcommerceAuthContextType {
  cliente: EcommerceCliente | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { nome: string; email: string; telefone?: string; cpf?: string; senha: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const EcommerceAuthContext = createContext<EcommerceAuthContextType>({
  cliente: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

export function useEcommerceAuth() {
  return useContext(EcommerceAuthContext);
}

export function EcommerceAuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<EcommerceCliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ecommerce_cliente");
    if (stored) {
      try {
        setCliente(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      // Use secure RPC that never exposes senha_hash to the client
      const { data, error } = await supabase
        .rpc("login_ecommerce" as any, {
          p_email: email.toLowerCase().trim(),
          p_senha: senha,
        });

      if (error) return { success: false, error: "Erro ao fazer login" };
      if (!data) return { success: false, error: "E-mail ou senha incorretos" };

      const clienteData: EcommerceCliente = {
        id: (data as any).id,
        nome: (data as any).nome,
        email: (data as any).email,
        telefone: (data as any).telefone,
        cpf: (data as any).cpf,
        loja_id: (data as any).loja_id,
        cliente_id: (data as any).cliente_id,
      };

      setCliente(clienteData);
      localStorage.setItem("ecommerce_cliente", JSON.stringify(clienteData));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro inesperado" };
    }
  }, []);

  const register = useCallback(async (data: { nome: string; email: string; telefone?: string; cpf?: string; senha: string }) => {
    try {
      // Get default loja or first one
      const { data: lojas } = await supabase
        .from("ecommerce_lojas" as any)
        .select("id")
        .eq("ativa", true)
        .limit(1);

      let lojaId: string | null = null;
      if (lojas && (lojas as any[]).length > 0) {
        lojaId = (lojas as any[])[0].id;
      } else {
        // Get first empresa to link the loja
        const { data: empresas } = await supabase
          .from("empresas")
          .select("id")
          .limit(1);

        if (!empresas || empresas.length === 0) {
          return { success: false, error: "Nenhuma empresa configurada. Contate o administrador." };
        }

        const { data: newLoja, error: lojaErr } = await supabase
          .from("ecommerce_lojas" as any)
          .insert({ nome_loja: "Loja Principal", empresa_id: empresas[0].id } as any)
          .select("id")
          .single();
        if (lojaErr) return { success: false, error: "Erro ao criar loja: " + lojaErr.message };
        lojaId = (newLoja as any).id;
      }

      const { data: result, error } = await supabase.rpc("criar_cliente_ecommerce" as any, {
        p_loja_id: lojaId,
        p_nome: data.nome,
        p_email: data.email.toLowerCase().trim(),
        p_telefone: data.telefone || null,
        p_cpf: data.cpf || null,
        p_senha: data.senha,
      });

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          return { success: false, error: "Este e-mail já está cadastrado" };
        }
        return { success: false, error: error.message };
      }

      // Auto-login after register
      return await login(data.email, data.senha);
    } catch (err: any) {
      return { success: false, error: err?.message || "Erro inesperado" };
    }
  }, [login]);

  const logout = useCallback(() => {
    setCliente(null);
    localStorage.removeItem("ecommerce_cliente");
  }, []);

  return (
    <EcommerceAuthContext.Provider value={{ cliente, isLoading, isLoggedIn: !!cliente, login, register, logout }}>
      {children}
    </EcommerceAuthContext.Provider>
  );
}
