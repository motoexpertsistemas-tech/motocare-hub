import { useState, useEffect } from "react";
import { BRLInput } from "@/components/BRLInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabaseFetchAll";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CloneProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    nome: string;
    codigo_cpl: string;
    marca: string | null;
    localizacao: string | null;
    preco_custo: number | null;
    custo_final: number | null;
    precos_venda: any;
    imagem_url: string | null;
    categoria: string | null;
    cor: string | null;
    aplicacoes: string[] | null;
    descricao: string | null;
    ncm: string | null;
    cest: string | null;
    ean: string | null;
    unidade: string | null;
    peso: number | null;
    fornecedor: string | null;
    estoque_minimo: number | null;
    estoque_quantidade: number | null;
    despesas_acessorias: number | null;
    outras_despesas: number | null;
    observacoes: string | null;
  };
}

export function CloneProductDialog({ open, onOpenChange, product }: CloneProductDialogProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState(product.nome);
  const [marca, setMarca] = useState(product.marca || "");
  const locParts = (product.localizacao || "").split("-");
  const [locRua, setLocRua] = useState(locParts[0] || "");
  const [locPrat, setLocPrat] = useState(locParts[1] || "");
  const [locCol, setLocCol] = useState(locParts[2] || "");
  const [locCaixa, setLocCaixa] = useState(locParts[3] || "");
  const [precoCusto, setPrecoCusto] = useState(product.preco_custo ? Number(product.preco_custo).toFixed(2) : "0.00");
  const [custoFinal, setCustoFinal] = useState(product.custo_final ? Number(product.custo_final).toFixed(2) : "0.00");
  const [cor, setCor] = useState(product.cor || "");
  const [fornecedor, setFornecedor] = useState(product.fornecedor || "");
  const [quantidade, setQuantidade] = useState(product.estoque_quantidade?.toString() || "0");
  const [margem, setMargem] = useState(() => {
    const custo = product.preco_custo || 0;
    const final_ = product.custo_final || 0;
    if (custo > 0 && final_ >= custo) return (((final_ - custo) / custo) * 100).toFixed(0);
    if (custo > 0 && final_ > 0) return (((final_ - custo) / custo) * 100).toFixed(0);
    return "0";
  });
  const [aplicacoes, setAplicacoes] = useState(product.aplicacoes?.join(", ") || "");
  const [generatedCode, setGeneratedCode] = useState("Gerando...");

  useEffect(() => {
    const generateCode = async () => {
      const existing = await fetchAllRows("produtos_catalogo", "codigo_cpl");
      const existingCodes = new Set(existing.map((p: any) => p.codigo_cpl));
      const prefix = product.id ? "CLN" : "CPL";
      let newCode: string;
      do {
        newCode = prefix + Math.floor(10000 + Math.random() * 90000).toString();
      } while (existingCodes.has(newCode));
      setGeneratedCode(newCode);
    };
    generateCode();
  }, []);

  const handleClone = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("produtos_catalogo").insert({
        codigo_cpl: generatedCode,
        nome,
        marca: marca || null,
        localizacao: [locRua, locPrat, locCol, locCaixa].some(Boolean) ? `${locRua}-${locPrat}-${locCol}-${locCaixa}` : null,
        preco_custo: parseFloat(precoCusto) || 0,
        custo_final: parseFloat(custoFinal) || 0,
        estoque_quantidade: parseInt(quantidade) || 0,
        precos_venda: product.precos_venda,
        imagem_url: product.imagem_url,
        categoria: product.categoria,
        cor: cor || null,
        aplicacoes: aplicacoes.trim() ? aplicacoes.split(",").map((a) => a.trim()).filter(Boolean) : null,
        descricao: product.descricao,
        ncm: product.ncm,
        cest: product.cest,
        ean: product.ean,
        unidade: product.unidade,
        peso: product.peso,
        fornecedor: fornecedor || null,
        estoque_minimo: product.estoque_minimo,
        despesas_acessorias: product.despesas_acessorias,
        outras_despesas: product.outras_despesas,
        observacoes: product.observacoes,
      });

      if (error) throw error;

      toast.success(`Produto ${product.id ? "clonado" : "criado"} com sucesso! Código: ${generatedCode}`);
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao clonar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{product.id ? "Clonar Produto" : "Novo Produto"}</span>
            <Badge variant="outline" className="font-mono text-sm">{generatedCode}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value.toUpperCase())} className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Marca <span className="text-destructive">*</span></Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value.toUpperCase())} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value.toUpperCase())} className="uppercase" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Localização</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">R (Rua)</p>
                <Input value={locRua} onChange={(e) => setLocRua(e.target.value)} placeholder="00" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">P (Prateleira)</p>
                <Input value={locPrat} onChange={(e) => setLocPrat(e.target.value)} placeholder="00" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">C (Coluna)</p>
                <Input value={locCol} onChange={(e) => setLocCol(e.target.value)} placeholder="00" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">CX (Caixa)</p>
                <Input value={locCaixa} onChange={(e) => setLocCaixa(e.target.value)} placeholder="00" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Aplicações (separar por vírgula) <span className="text-destructive">*</span></Label>
            <Input value={aplicacoes} onChange={(e) => setAplicacoes(e.target.value.toUpperCase())} placeholder="Ex: CG 150, TITAN 160, FAN 125" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Preço Custo</Label>
              <BRLInput value={precoCusto} onChange={(val) => {
                setPrecoCusto(val);
                const custo = parseFloat(val) || 0;
                const m = parseFloat(margem) || 0;
                setCustoFinal((custo * (1 + m / 100)).toFixed(2));
              }} />
            </div>
            <div className="space-y-2">
              <Label>Margem %</Label>
              <Input type="number" step="1" value={margem} onChange={(e) => {
                const val = e.target.value;
                setMargem(val);
                const custo = parseFloat(precoCusto) || 0;
                const m = parseFloat(val) || 0;
                setCustoFinal((custo * (1 + m / 100)).toFixed(2));
              }} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda</Label>
              <BRLInput value={custoFinal} onChange={(val) => {
                setCustoFinal(val);
                const custo = parseFloat(precoCusto) || 0;
                const final_ = parseFloat(val) || 0;
                if (custo > 0) {
                  setMargem((((final_ - custo) / custo) * 100).toFixed(0));
                }
              }} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleClone} disabled={saving || !nome.trim() || !marca.trim() || !aplicacoes.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {product.id ? "Clonar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
