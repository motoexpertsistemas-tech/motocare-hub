import { useState } from "react";
import { useEcommerceAuth } from "@/contexts/EcommerceAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, MapPin, LogOut, ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

export default function MinhaConta() {
  const { cliente, isLoggedIn, logout } = useEcommerceAuth();

  if (!isLoggedIn || !cliente) {
    return <Navigate to="/ecommerce/login" replace />;
  }

  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ["ecommerce_pedidos", cliente.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecommerce_pedidos" as any)
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enderecos = [] } = useQuery({
    queryKey: ["ecommerce_enderecos", cliente.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecommerce_enderecos" as any)
        .select("*")
        .eq("cliente_id", cliente.id);
      if (error) throw error;
      return data || [];
    },
  });

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    confirmado: "bg-blue-100 text-blue-800",
    enviado: "bg-purple-100 text-purple-800",
    entregue: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/ecommerce">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar à Loja</Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">👤 Minha Conta</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); toast.success("Logout realizado!"); }}>
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </Button>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados" className="gap-1"><User className="h-3.5 w-3.5" /> Meus Dados</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-1"><Package className="h-3.5 w-3.5" /> Pedidos</TabsTrigger>
          <TabsTrigger value="enderecos" className="gap-1"><MapPin className="h-3.5 w-3.5" /> Endereços</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="text-lg">Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium text-foreground">{cliente.nome}</span></div>
                <div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium text-foreground">{cliente.email}</span></div>
                {cliente.telefone && <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium text-foreground">{cliente.telefone}</span></div>}
                {cliente.cpf && <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium text-foreground">{cliente.cpf}</span></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos">
          <Card>
            <CardHeader><CardTitle className="text-lg">Meus Pedidos</CardTitle></CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (pedidos as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              ) : (
                <div className="space-y-3">
                  {(pedidos as any[]).map((p: any) => (
                    <div key={p.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">Pedido #{p.numero_pedido}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</p>
                        <p className="text-sm font-bold text-primary mt-1">{fmt(p.total)}</p>
                      </div>
                      <Badge className={statusColors[p.status] || "bg-muted text-muted-foreground"}>
                        {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enderecos">
          <Card>
            <CardHeader><CardTitle className="text-lg">Endereços de Entrega</CardTitle></CardHeader>
            <CardContent>
              {(enderecos as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {(enderecos as any[]).map((e: any) => (
                    <div key={e.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">{e.apelido}</p>
                        {e.principal && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {e.logradouro}, {e.numero}{e.complemento ? ` - ${e.complemento}` : ""} • {e.bairro} • {e.cidade}/{e.estado} • CEP: {e.cep}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
