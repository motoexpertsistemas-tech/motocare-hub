import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useEmpresa } from "@/contexts/EmpresaContext";

interface Produto {
  id: string; nome: string; codigo_cpl: string | null;
  imagem_url: string | null; precos_venda: any; descricao: string | null;
  preco_custo: number | null;
}

function extrairPreco(p: Produto): number {
  const pv = p.precos_venda;
  if (pv && typeof pv === "object" && !Array.isArray(pv)) {
    return Number(pv.varejo || pv.preco1 || 0);
  }
  if (Array.isArray(pv) && pv.length > 0) {
    const v = pv.find((x: any) => x.nome === "Varejo" || x.tipo === "VAREJO") || pv[0];
    return Number(v?.valor || v?.valor_venda_utilizado || 0);
  }
  return Number(p.preco_custo || 0) * 1.8;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conversaId: string;
  onEnviado?: () => void;
}

export default function CatalogoDialog({ open, onOpenChange, conversaId, onEnviado }: Props) {
  const { empresaId } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !empresaId) return;
    setLoading(true);
    supabase.from("produtos_catalogo")
      .select("id,nome,codigo_cpl,imagem_url,precos_venda,descricao,preco_custo")
      .eq("empresa_id", empresaId)
      .order("nome")
      .limit(100)
      .then(({ data }) => { setProdutos((data as any) || []); setLoading(false); });
  }, [open, empresaId]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter(p =>
      p.nome?.toLowerCase().includes(q) ||
      p.codigo_cpl?.toLowerCase().includes(q) ||
      p.descricao?.toLowerCase().includes(q)
    );
  }, [produtos, busca]);

  const enviarProduto = async (p: Produto) => {
    if (!empresaId) { toast.error("Empresa não identificada"); return; }
    setEnviandoId(p.id);
    const preco = extrairPreco(p);
    const conteudo = `*${p.nome}*\nR$ ${preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n${p.descricao || ""}`.trim();
    const { error } = await supabase.from("mensagens").insert({
      conversa_id: conversaId,
      empresa_id: empresaId,
      tipo_remetente: "atendente",
      usuario_nome: "Atendente",
      tipo_mensagem: p.imagem_url ? "imagem" : "texto",
      conteudo,
      midia_url: p.imagem_url,
      status_envio: "enviado",
      metadata: { tipo: "produto", produto_id: p.id, preco, codigo: p.codigo_cpl },
    });
    setEnviandoId(null);
    if (error) {
      console.error("Erro ao enviar produto:", error);
      toast.error("Erro ao enviar: " + error.message);
      return;
    }
    toast.success("Produto enviado!");
    onEnviado?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Catálogo de produtos
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, código ou descrição..." className="pl-10" />
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
          {!loading && filtrados.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto encontrado</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrados.map(p => {
              const preco = extrairPreco(p);
              return (
                <div key={p.id} className="border border-border rounded-lg p-3 flex gap-3 hover:border-primary/50 transition-colors">
                  <div className="w-16 h-16 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                    {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                      : <Package className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                    <p className="text-base font-bold text-green-600 dark:text-green-400">
                      R$ {preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    {p.descricao && <p className="text-[11px] text-muted-foreground line-clamp-1 uppercase">{p.descricao}</p>}
                    <div className="flex gap-1.5 mt-1.5">
                      <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                        disabled={enviandoId === p.id}
                        onClick={() => enviarProduto(p)}>
                        <Send className="h-3 w-3" /> Enviar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Detalhes">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
