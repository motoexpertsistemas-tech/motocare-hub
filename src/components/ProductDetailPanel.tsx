import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save, Image as ImageIcon, Pencil, MapPin } from "lucide-react";
import { CostHistoryWidget } from "@/components/CostHistoryWidget";
import { ProductHistoryWidget } from "@/components/ProductHistoryWidget";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CATEGORIAS = [
  "ACESSÓRIOS", "CABOS", "CARBURADOR/INJEÇÃO", "CARENAGEM/PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRAMENTA/EQUIPAMENTOS", "FIXAÇÃO",
  "MOTOR", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

interface Product {
  id: string;
  nome: string;
  codigo_cpl: string;
  marca: string | null;
  categoria: string | null;
  imagem_url: string | null;
  aplicacoes: string[] | null;
  importado_em: string;
  atualizado_em: string;
  preco_custo?: number | null;
  custo_final?: number | null;
  precos_venda?: any;
  localizacao?: string | null;
}

interface ProductDetailPanelProps {
  product: Product | null;
}

export function ProductDetailPanel({ product }: ProductDetailPanelProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [nome, setNome] = useState("");
  const [codigoCpl, setCodigoCpl] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [aplicacoes, setAplicacoes] = useState<string[]>([]);
  const [novaAplicacao, setNovaAplicacao] = useState("");

  const startEditing = () => {
    if (!product) return;
    setNome(product.nome);
    setCodigoCpl(product.codigo_cpl);
    setMarca(product.marca || "");
    setCategoria(product.categoria || "");
    setImagemUrl(product.imagem_url || "");
    setAplicacoes(product.aplicacoes || []);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const addAplicacao = () => {
    const trimmed = novaAplicacao.trim().toUpperCase();
    if (trimmed && !aplicacoes.includes(trimmed)) {
      setAplicacoes([...aplicacoes, trimmed]);
      setNovaAplicacao("");
    }
  };

  const removeAplicacao = (index: number) => {
    setAplicacoes(aplicacoes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!product || !nome.trim() || !codigoCpl.trim()) {
      toast.error("Nome e Código CPL são obrigatórios");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("produtos_catalogo")
      .update({
        nome: nome.trim(),
        codigo_cpl: codigoCpl.trim(),
        marca: marca.trim() || null,
        categoria: categoria || null,
        imagem_url: imagemUrl.trim() || null,
        aplicacoes: aplicacoes.length > 0 ? aplicacoes : null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", product.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Produto atualizado!");
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
      setEditing(false);
    }
  };

  if (!product) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Selecione um produto para ver os detalhes
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">📝 Editando Produto</h3>
          </div>

          {/* Foto */}
          <div className="flex items-center gap-3">
            {imagemUrl ? (
              <img src={imagemUrl} alt={nome} className="h-16 w-16 rounded-lg object-cover border border-border bg-secondary/30" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-secondary/50 flex items-center justify-center border border-border/50">
                <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <Label className="text-muted-foreground text-[10px]">URL da Imagem</Label>
              <Input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." className="bg-secondary/50 h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-[10px]">Nome do Produto *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-secondary/50 h-8 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px]">Código CPL *</Label>
              <Input value={codigoCpl} onChange={(e) => setCodigoCpl(e.target.value)} className="bg-secondary/50 h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-[10px]">Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} className="bg-secondary/50 h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-[10px]">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="bg-secondary/50 h-8 text-xs">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aplicações */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-[10px]">🏍️ Aplicações</Label>
            <div className="flex gap-1.5">
              <Input
                value={novaAplicacao}
                onChange={(e) => setNovaAplicacao(e.target.value)}
                placeholder="Ex: CG 150 TITAN"
                className="bg-secondary/50 h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAplicacao())}
              />
              <Button type="button" size="sm" variant="outline" onClick={addAplicacao} className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {aplicacoes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {aplicacoes.map((app, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] gap-0.5 pr-0.5">
                    {app}
                    <button onClick={() => removeAplicacao(i)} className="hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={cancelEditing} className="flex-1 h-8 text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 h-8 text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <Card className="glass-panel">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-foreground text-sm">Detalhes do Produto</h3>
          <Button variant="outline" size="sm" onClick={startEditing} className="h-7 px-2 text-xs gap-1">
            <Pencil className="h-3 w-3" /> Editar
          </Button>
        </div>

        <div className="relative group">
          {product.imagem_url ? (
            <img
              src={product.imagem_url}
              alt={product.nome}
              className="w-full h-48 object-contain rounded-lg border border-border bg-secondary/20"
            />
          ) : (
            <div className="w-full h-32 rounded-lg bg-secondary/30 flex items-center justify-center border border-border/50">
              <ImageUploadButton productId={product.id} variant="area" className="w-full h-32" />
            </div>
          )}
          {product.imagem_url && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageUploadButton productId={product.id} variant="icon" />
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-foreground text-base">
            {product.nome}
            {product.aplicacoes && product.aplicacoes.length > 0 ? ` ${product.aplicacoes[0]}` : ""}
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-1">Código: {product.codigo_cpl}</p>
        </div>

        {/* Valores de Venda */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">💰 Tabelas de Preço</p>
          {(() => {
            const precos = product.precos_venda as any[];
            if (Array.isArray(precos) && precos.length > 0) {
              return (
                <div className="grid grid-cols-2 gap-1.5">
                  {precos.map((p: any, i: number) => {
                    const valor = p?.valor_venda_utilizado ?? p?.valor ?? null;
                    const nome = p?.tipo || p?.nome || p?.tabela || `Tabela ${i + 1}`;
                    const margem = p?.margem_lucro ?? p?.percentual_lucro ?? null;
                    return (
                      <div key={i} className="rounded-lg border border-border bg-secondary/20 p-2">
                        <p className="text-[10px] text-muted-foreground uppercase truncate">{nome}</p>
                        <p className="font-mono font-medium text-foreground text-sm">
                          {valor != null && Number(valor) > 0
                            ? `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </p>
                        {margem != null && (
                          <p className="text-[10px] text-muted-foreground">
                            Margem: {Number(margem).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }
            return (
              <p className="text-xs text-muted-foreground italic">Nenhuma tabela de preço vinculada</p>
            );
          })()}
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Localização</p>
            <p className="font-mono font-medium text-foreground">
              {product.localizacao ? (() => {
                const pts = product.localizacao.split("-");
                return `R${pts[0] || "00"} P${pts[1] || "00"} C${pts[2] || "00"} CX${pts[3] || "00"}`;
              })() : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase">Categoria</p>
            <p className="font-medium text-foreground">{product.categoria || "—"}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase">Marca</p>
            <p className="font-medium text-foreground">{product.marca || "—"}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase">Custo</p>
            <p className="font-mono font-medium text-foreground">
              {product.preco_custo != null && product.preco_custo > 0
                ? `R$ ${Number(product.preco_custo).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </p>
          </div>
        </div>

        <CostHistoryWidget
          precoCusto={product.preco_custo ?? null}
          custoFinal={product.custo_final ?? null}
        />

        {product.aplicacoes && product.aplicacoes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">🏍️ Aplicações</p>
            <div className="flex flex-wrap gap-1">
              {product.aplicacoes.map((app, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {app}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ProductHistoryWidget productId={product.id} />

        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <p>Registrado em: {new Date(product.importado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <p>Última atualização: {new Date(product.atualizado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </CardContent>
    </Card>
  );
}