import { useState } from "react";
import { BRLInput } from "@/components/BRLInput";
import { toBRL } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Minus, Search, Loader2, Trash2, FileText, Package, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface ItemAjuste {
  produto_id: string;
  nome: string;
  codigo_cpl: string;
  aplicacoes: string[];
  quantidade: string;
  unidade: string;
  valor_custo: string;
  valor_total: string;
}

export default function Ajustes() {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [valorFrete, setValorFrete] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  // Product search
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<ItemAjuste[]>([]);

  const { data: resultados, isFetching: buscando } = useQuery({
    queryKey: ["busca_produtos_ajuste", busca],
    queryFn: async () => {
      if (busca.length < 2) return [];
      const searchTerm = busca.trim();
      const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
      
      // Build OR filters for each word across nome, codigo_cpl and cor
      const orFilters = words.map(w => `nome.ilike.%${w}%,codigo_cpl.ilike.%${w}%,cor.ilike.%${w}%`).join(",");
      
      const { data, error } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl, preco_custo, unidade, aplicacoes, cor")
        .or(orFilters)
        .limit(100);
      if (error) { console.error("Erro busca:", error); return []; }
      
      // Score results by relevance across nome + aplicacoes + cor
      const scored = (data || []).map(p => {
        let score = 0;
        const nomeLower = (p.nome || "").toLowerCase();
        const corLower = (p.cor || "").toLowerCase();
        const apps = (p.aplicacoes || []).map((a: string) => a.toLowerCase());
        const allText = nomeLower + " " + corLower + " " + apps.join(" ");
        const termLower = searchTerm.toLowerCase();
        
        // Exact full match bonus
        if (nomeLower.includes(termLower)) score += 20;
        if (apps.some((a: string) => a.includes(termLower))) score += 15;
        
        // Per-word scoring
        let matchedWords = 0;
        words.forEach(w => {
          const wl = w.toLowerCase();
          if (allText.includes(wl)) {
            matchedWords++;
            if (nomeLower.includes(wl)) score += 3;
            if (apps.some((a: string) => a.includes(wl))) score += 5;
          }
        });
        
        // Bonus for matching ALL words
        if (matchedWords === words.length) score += 10;
        
        return { ...p, score };
      });
      
      return scored.filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 15);
    },
    enabled: busca.length >= 2,
  });

  const addProduto = (p: any) => {
    if (itens.find((i) => i.produto_id === p.id)) {
      toast.info("Produto já adicionado.");
      return;
    }
    setItens([
      ...itens,
      {
        produto_id: p.id,
        nome: p.nome,
        codigo_cpl: p.codigo_cpl,
        aplicacoes: p.aplicacoes || [],
        quantidade: "",
        unidade: p.unidade || "UN",
        valor_custo: toBRL(p.preco_custo || 0),
        valor_total: "0,00",
      },
    ]);
    setBusca("");
  };

  const updateItem = (idx: number, field: keyof ItemAjuste, value: string) => {
    const updated = [...itens];
    updated[idx] = { ...updated[idx], [field]: value };
    // Recalculate valor_total when quantity or custo changes
    if (field === "quantidade" || field === "valor_custo") {
      const qtd = parseFloat(updated[idx].quantidade) || 0;
      const custo = parseFloat(updated[idx].valor_custo) || 0;
      updated[idx].valor_total = toBRL(qtd * custo);
    }
    setItens(updated);
  };

  const removeItem = (idx: number) => {
    setItens(itens.filter((_, i) => i !== idx));
  };

  const valorTotalGeral = itens.reduce((s, i) => s + (parseFloat(i.valor_total) || 0), 0) + (parseFloat(valorFrete) || 0);

  // Fetch history
  const { data: historico, isLoading: carregandoHistorico } = useQuery({
    queryKey: ["ajustes_estoque"],
    queryFn: async () => {
      const { data: ajustes, error: errAj } = await supabase
        .from("ajustes_estoque" as any)
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(30);
      if (errAj) { console.error("Erro ajustes:", errAj); return []; }
      if (!ajustes || ajustes.length === 0) return [];

      const ajusteIds = (ajustes as any[]).map((a) => a.id);
      const { data: itensData } = await supabase
        .from("ajustes_estoque_itens" as any)
        .select("*")
        .in("ajuste_id", ajusteIds);

      const prodIds = [...new Set((itensData as any[] || []).map((i) => i.produto_id))];
      const { data: prods } = await supabase
        .from("produtos_catalogo")
        .select("id, nome, codigo_cpl")
        .in("id", prodIds.length > 0 ? prodIds : ["none"]);

      const prodMap = new Map((prods || []).map((p: any) => [p.id, p]));
      const itensMap = new Map<string, any[]>();
      (itensData as any[] || []).forEach((i) => {
        const list = itensMap.get(i.ajuste_id) || [];
        list.push({ ...i, produto: prodMap.get(i.produto_id) });
        itensMap.set(i.ajuste_id, list);
      });

      return (ajustes as any[]).map((a) => ({ ...a, itens: itensMap.get(a.id) || [] }));
    },
  });

  const handleSalvar = async () => {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um produto.");
      return;
    }
    const invalidItems = itens.filter((i) => !i.quantidade || parseInt(i.quantidade) <= 0);
    if (invalidItems.length > 0) {
      toast.error("Informe a quantidade de todos os produtos.");
      return;
    }

    setSaving(true);
    try {
      // Create ajuste
      const { data: ajuste, error: errAjuste } = await supabase
        .from("ajustes_estoque" as any)
        .insert({
          tipo,
          valor_frete: parseFloat(valorFrete) || 0,
          valor_total: valorTotalGeral,
          observacoes: observacoes || null,
        } as any)
        .select("id")
        .single();
      if (errAjuste) throw errAjuste;

      // Insert items
      const itensInsert = itens.map((i) => ({
        ajuste_id: (ajuste as any).id,
        produto_id: i.produto_id,
        quantidade: parseInt(i.quantidade),
        unidade: i.unidade,
        valor_custo: parseFloat(i.valor_custo) || 0,
        valor_total: parseFloat(i.valor_total) || 0,
      }));
      const { error: errItens } = await supabase.from("ajustes_estoque_itens" as any).insert(itensInsert as any);
      if (errItens) throw errItens;

      // Update stock for each product
      for (const item of itens) {
        const qtd = parseInt(item.quantidade);
        const { data: prod } = await supabase
          .from("produtos_catalogo")
          .select("estoque_quantidade")
          .eq("id", item.produto_id)
          .maybeSingle();

        const estoqueAtual = prod?.estoque_quantidade || 0;
        const novoEstoque = tipo === "entrada" ? estoqueAtual + qtd : estoqueAtual - qtd;

        if (tipo === "saida" && novoEstoque < 0) {
          toast.error(`Estoque insuficiente para ${item.nome}`);
          continue;
        }

        await supabase
          .from("produtos_catalogo")
          .update({ estoque_quantidade: novoEstoque })
          .eq("id", item.produto_id);
      }

      toast.success(`Ajuste de ${tipo} registrado com ${itens.length} produto(s)!`);
      queryClient.invalidateQueries({ queryKey: ["ajustes_estoque"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });

      // Reset form
      setItens([]);
      setValorFrete("0");
      setObservacoes("");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adicionar Ajuste</h1>
        <p className="text-sm text-muted-foreground">Registre entradas e saídas manuais no estoque</p>
      </div>

      {/* Dados Gerais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Dados gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Movimentação <span className="text-destructive">*</span></Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "saida")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor frete</Label>
              <BRLInput value={valorFrete} onChange={setValorFrete} />
            </div>
            <div className="space-y-2">
              <Label>Valor total</Label>
              <Input value={toBRL(valorTotalGeral)} readOnly className="bg-muted/30 font-medium" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" /> Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Produto <span className="text-destructive">*</span></TableHead>
                   <TableHead>Aplicações</TableHead>
                  <TableHead className="w-24">Quant. <span className="text-destructive">*</span></TableHead>
                  <TableHead className="w-24">Unidade</TableHead>
                  <TableHead className="w-28">Vr. custo</TableHead>
                  <TableHead className="w-28">Vr. total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, idx) => (
                  <TableRow key={item.produto_id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm truncate max-w-[200px]">{item.nome}</span>
                        <span className="text-xs text-muted-foreground">({item.codigo_cpl})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                        {item.aplicacoes.length > 0 ? item.aplicacoes.slice(0, 2).join(", ") + (item.aplicacoes.length > 2 ? "…" : "") : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => updateItem(idx, "quantidade", e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={item.unidade} onValueChange={(v) => updateItem(idx, "unidade", v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UN">UN</SelectItem>
                          <SelectItem value="PAR">PAR</SelectItem>
                          <SelectItem value="JG">JG</SelectItem>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="CX">CX</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.valor_custo}
                        onChange={(e) => updateItem(idx, "valor_custo", e.target.value)}
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.valor_total} readOnly className="h-8 text-right bg-muted/30" />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {itens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-6">
                      Nenhum produto adicionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add product search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-9"
            />
            {buscando && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            {resultados && resultados.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                {resultados.map((p: any) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors"
                    onClick={() => addProduto(p)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.nome}</span>
                      <span className="text-muted-foreground text-xs">({p.codigo_cpl})</span>
                      {p.cor && <span className="text-xs text-primary">— {p.cor}</span>}
                    </div>
                    {p.aplicacoes && p.aplicacoes.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.aplicacoes.slice(0, 3).join(", ")}{p.aplicacoes.length > 3 ? "…" : ""}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>('[placeholder*="Buscar produto"]')?.focus()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar produto
          </Button>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações sobre este ajuste..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSalvar} disabled={saving || itens.length === 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Salvar Ajuste
        </Button>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico de Ajustes</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoHistorico ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !historico || historico.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum ajuste registrado.</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead className="text-right">Frete</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(a.criado_em), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.tipo === "entrada" ? "default" : "destructive"} className="text-xs">
                          {a.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.itens?.map((i: any) => (
                          <div key={i.id}>{i.produto?.nome || "—"} x{i.quantidade}</div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right text-sm">{toBRL(a.valor_frete || 0)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{toBRL(a.valor_total || 0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{a.observacoes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
