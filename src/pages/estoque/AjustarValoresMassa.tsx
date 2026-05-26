import { useState, useMemo } from "react";
import { toBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Users, Search, X, ArrowLeft, Plus, Minus, Pencil, RefreshCw, Save } from "lucide-react";
import AjusteValorDialog from "@/components/AjusteValorDialog";
import { BRLInput } from "@/components/BRLInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { registrarHistoricoPrecoLote, type HistoricoPrecoEntry } from "@/lib/produtoHistorico";

const CATEGORIAS = [
  "TODAS",
  "ACESSÓRIOS", "CABOS", "CARB-INJEÇÃO", "CAREN-PLÁSTICO",
  "CHASSI", "ELÉTRICA", "FERRA - EQUIP", "FIXAÇÃO",
  "MOTOR", "PNEU", "RODA", "SUSPENSÃO", "TRANSMISSÃO",
];

interface ValorVenda {
  id: string;
  nome: string;
  media_lucro: number;
}

export default function AjustarValoresMassa() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [grupo, setGrupo] = useState("TODAS");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ativo, setAtivo] = useState("Todos");
  const [situacao, setSituacao] = useState("Independe");
  const [numCompra, setNumCompra] = useState("");
  const [rua, setRua] = useState("");
  const [prateleira, setPrateleira] = useState("");
  const [coluna, setColuna] = useState("");
  const [caixa, setCaixa] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, { lucro: number; valor: number }>>>({});
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false);
  const [ajusteDirection, setAjusteDirection] = useState<"up" | "down">("up");
  const [page, setPage] = useState(0);
  const [motivo, setMotivo] = useState("");
  const PAGE_SIZE = 100;

  // Fetch valores_venda types
  const { data: tiposVenda = [] } = useQuery({
    queryKey: ["valores_venda_tipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valores_venda" as any)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as ValorVenda[];
    },
  });

  const { data: allProdutos = [], isLoading, refetch } = useQuery({
    queryKey: ["ajuste_massa", grupo, nome, codigo, situacao, rua, prateleira, coluna, caixa, searched],
    queryFn: async () => {
      const PAGE = 1000;
      const all: any[] = [];
      let from = 0;
      while (true) {
        let query = supabase.from("produtos_catalogo").select("*").order("nome", { ascending: true }).range(from, from + PAGE - 1);
        if (grupo !== "TODAS") query = query.eq("categoria", grupo);
        if (nome) query = query.ilike("nome", `%${nome}%`);
        if (codigo) query = query.ilike("codigo_cpl", `%${codigo}%`);
        if (situacao === "Com estoque") query = query.gt("estoque_quantidade", 0);
        if (situacao === "Sem estoque") query = query.or("estoque_quantidade.is.null,estoque_quantidade.eq.0");
        if (rua) query = query.ilike("localizacao", `%R${rua}%`);
        if (prateleira) query = query.ilike("localizacao", `%P${prateleira}%`);
        if (coluna) query = query.ilike("localizacao", `%C${coluna}%`);
        if (caixa) query = query.ilike("localizacao", `%CX${caixa}%`);
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    },
    enabled: searched,
  });

  const totalPages = Math.max(1, Math.ceil(allProdutos.length / PAGE_SIZE));
  const produtos = useMemo(() => allProdutos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [allProdutos, page]);

  const handleBuscar = () => {
    setPage(0);
    setSearched(true);
    setTimeout(() => refetch(), 100);
  };

  const handleLimpar = () => {
    setGrupo("TODAS");
    setNome("");
    setCodigo("");
    setAtivo("Todos");
    setSituacao("Independe");
    setNumCompra("");
    setRua("");
    setPrateleira("");
    setColuna("");
    setCaixa("");
    setSearched(false);
    setSelected(new Set());
    setEditedValues({});
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === produtos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(produtos.map((p: any) => p.id)));
    }
  };

  const getProductValue = (product: any, tipoNome: string, field: "lucro" | "valor"): number => {
    // Check edited values first
    if (editedValues[product.id]?.[tipoNome]) {
      return editedValues[product.id][tipoNome][field];
    }
    // Then check saved precos_venda
    const precos = product.precos_venda as any[];
    if (precos && Array.isArray(precos)) {
      const found = precos.find((pv: any) => pv.tipo?.toLowerCase() === tipoNome.toLowerCase());
      if (found) {
        return field === "lucro" ? (found.lucro_utilizado || 0) : (found.valor_venda_utilizado || 0);
      }
    }
    return 0;
  };

  const updateValue = (productId: string, tipoNome: string, field: "lucro" | "valor", value: number) => {
    const p = allProdutos.find((pr: any) => pr.id === productId);
    const cf = p ? getCustoFinal(p) : 0;

    setEditedValues((prev) => {
      // Get current values: from editedValues first, then from saved product data
      const savedLucro = (() => {
        const precos = p?.precos_venda as any[];
        if (precos && Array.isArray(precos)) {
          const found = precos.find((pv: any) => pv.tipo?.toLowerCase() === tipoNome.toLowerCase());
          if (found) return found.lucro_utilizado || 0;
        }
        return 0;
      })();
      const savedValor = (() => {
        const precos = p?.precos_venda as any[];
        if (precos && Array.isArray(precos)) {
          const found = precos.find((pv: any) => pv.tipo?.toLowerCase() === tipoNome.toLowerCase());
          if (found) return found.valor_venda_utilizado || 0;
        }
        return 0;
      })();
      const currentLucro = prev[productId]?.[tipoNome]?.lucro ?? savedLucro;
      const currentValor = prev[productId]?.[tipoNome]?.valor ?? savedValor;

      let newLucro = currentLucro;
      let newValor = currentValor;

      if (field === "lucro") {
        newLucro = value;
        // Recalculate valor from new lucro
        newValor = cf > 0 ? parseFloat((cf + (cf * value / 100)).toFixed(2)) : 0;
      } else {
        newValor = value;
        // Recalculate lucro from new valor
        newLucro = cf > 0 ? parseFloat((((value - cf) / cf) * 100).toFixed(2)) : 0;
      }

      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          [tipoNome]: { lucro: newLucro, valor: newValor },
        },
      };
    });
  };

  const applyPercentageToAll = (tipoNome: string, mediaLucro: number) => {
    const updates: Record<string, Record<string, { lucro: number; valor: number }>> = { ...editedValues };
    for (const p of allProdutos) {
      const cf = getCustoFinal(p);
      const valor = parseFloat((cf * (1 + mediaLucro / 100)).toFixed(2));
      updates[p.id] = {
        ...updates[p.id],
        [tipoNome]: { lucro: mediaLucro, valor },
      };
    }
    setEditedValues(updates);
    toast.success(`Lucro ${toBRL(mediaLucro)}% aplicado a ${allProdutos.length} produtos em "${tipoNome}"`);
  };

  const [saving, setSaving] = useState(false);

  const openAjusteDialog = (direction: "up" | "down") => {
    setAjusteDirection(direction);
    setAjusteDialogOpen(true);
  };

  const handleSaveAll = async () => {
    const productIds = Object.keys(editedValues);
    if (productIds.length === 0) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 50;

    // Build all update payloads first
    const updates: { id: string; precos_venda: any[]; nome: string; codigo: string; changes: any; historicoEntries: HistoricoPrecoEntry[] }[] = [];
    for (const pid of productIds) {
      const p = allProdutos.find((pr: any) => pr.id === pid);
      if (!p) continue;
      const existingPrecos = Array.isArray(p.precos_venda) ? [...(p.precos_venda as any[])] : [];
      const changes = editedValues[pid];
      const historicoEntries: HistoricoPrecoEntry[] = [];
      for (const [tipoNome, vals] of Object.entries(changes)) {
        const idx = existingPrecos.findIndex((pv: any) => pv.tipo?.toLowerCase() === tipoNome.toLowerCase());
        const valorAnterior = idx >= 0
          ? Number(existingPrecos[idx]?.valor_venda_utilizado ?? existingPrecos[idx]?.valor ?? 0)
          : 0;
        const entry = {
          tipo: tipoNome,
          lucro_utilizado: vals.lucro,
          valor_venda_utilizado: vals.valor,
        };
        if (idx >= 0) {
          existingPrecos[idx] = { ...existingPrecos[idx], ...entry };
        } else {
          existingPrecos.push(entry);
        }
        if (Number(vals.valor) !== valorAnterior) {
          historicoEntries.push({
            produtoId: pid,
            produtoNome: p.nome,
            tipo: "venda",
            tabelaPreco: tipoNome,
            valorAnterior,
            valorNovo: Number(vals.valor),
            motivo,
          });
        }
      }
      updates.push({ id: pid, precos_venda: existingPrecos, nome: p.nome, codigo: p.codigo_cpl, changes, historicoEntries });
    }

    // Process in batches
    const allHistorico: HistoricoPrecoEntry[] = [];
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const { error } = await supabase
            .from("produtos_catalogo")
            .update({ precos_venda: item.precos_venda } as any)
            .eq("id", item.id);
          if (error) {
            console.error(`Erro ao salvar produto ${item.id}:`, error.message);
            throw error;
          }
          // Audit log (fire and forget)
          supabase.from("log_auditoria" as any).insert({
            acao: "atualizar_preco",
            entidade: "produtos_catalogo",
            entidade_id: item.id,
            detalhes: {
              produto_nome: item.nome,
              codigo: item.codigo,
              alteracoes: item.changes,
              motivo: motivo || null,
            },
          } as any).then(() => {});
          allHistorico.push(...item.historicoEntries);
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") successCount++;
        else errorCount++;
      }
      // Yield to UI
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Registra histórico granular em lotes
    if (allHistorico.length > 0) {
      try {
        for (let i = 0; i < allHistorico.length; i += 200) {
          await registrarHistoricoPrecoLote(allHistorico.slice(i, i + 200));
        }
      } catch (e) {
        console.error("Erro ao registrar histórico de preços:", e);
      }
    }

    setSaving(false);
    setEditedValues({});
    await queryClient.invalidateQueries({ queryKey: ["ajuste_massa"] });
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
    queryClient.invalidateQueries({ queryKey: ["produto"] });
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    queryClient.invalidateQueries({ queryKey: ["produto-historico"] });
    if (errorCount > 0) {
      toast.error(`${errorCount} produto(s) com erro ao salvar. ${successCount} salvo(s) com sucesso.`);
    } else {
      toast.success(`Preços atualizados em ${successCount} produto(s)`);
    }
  };

  const applyAjuste = (selectedTipos: string[], pct: number, tipo: "lucro" | "valor") => {
    const targetIds = selected.size > 0 ? Array.from(selected) : allProdutos.map((p: any) => p.id);
    if (targetIds.length === 0) {
      toast.error("Nenhum produto encontrado");
      return;
    }
    const factor = ajusteDirection === "up" ? (1 + pct / 100) : (1 - pct / 100);
    const updates = { ...editedValues };
    for (const pid of targetIds) {
      const p = allProdutos.find((pr: any) => pr.id === pid);
      if (!p) continue;
      const cf = getCustoFinal(p);
      for (const tv of tiposVenda) {
        if (!selectedTipos.includes(tv.nome)) continue;
        if (tipo === "valor") {
          // Ajuste sobre o valor de venda
          let currentValor = getProductValue(p, tv.nome, "valor");
          // Se ainda não há preço cadastrado, usar o custo como base
          if (!currentValor || currentValor <= 0) currentValor = cf;
          const newValor = parseFloat((currentValor * factor).toFixed(2));
          const newLucro = cf > 0 ? parseFloat((((newValor - cf) / cf) * 100).toFixed(2)) : 0;
          updates[pid] = {
            ...updates[pid],
            [tv.nome]: { lucro: newLucro, valor: newValor },
          };
        } else {
          // Ajuste sobre o lucro (markup) - soma/subtrai pontos percentuais
          const currentLucro = getProductValue(p, tv.nome, "lucro");
          const newLucro = parseFloat((ajusteDirection === "up" ? currentLucro + pct : currentLucro - pct).toFixed(2));
          const newValor = cf > 0 ? parseFloat((cf + (cf * newLucro / 100)).toFixed(2)) : 0;
          updates[pid] = {
            ...updates[pid],
            [tv.nome]: { lucro: newLucro, valor: newValor },
          };
        }
      }
    }
    setEditedValues(updates);
    toast.success(`${ajusteDirection === "up" ? "Aumento" : "Redução"} de ${pct}% aplicado a ${targetIds.length} produto(s)`);
  };

  const getCustoFinal = (p: any) => {
    return Number(p.custo_final || p.preco_custo || 0);
  };

  const colCount = 4 + tiposVenda.length * 2 + 1; // checkbox + code + name + custo + (lucro+valor per tipo) + action

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/estoque/valores-venda")} className="gap-1.5 text-foreground border-border hover:bg-secondary/60">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Ajustar valores em massa
            </h1>
            <p className="text-sm text-muted-foreground">Filtre os produtos e aplique ajustes de preço em lote</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-panel">
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Loja</Label>
              <Select defaultValue="Todas">
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="Todas">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grupo</Label>
              <Select value={grupo} onValueChange={setGrupo}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c === "TODAS" ? "Todos" : c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-secondary/50" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ativo</Label>
              <Select value={ativo} onValueChange={setAtivo}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Situação</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="Independe">Independe</SelectItem>
                  <SelectItem value="Com estoque">Com estoque</SelectItem>
                  <SelectItem value="Sem estoque">Sem estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nº da compra</Label>
              <Input
                value={numCompra}
                onChange={(e) => {
                  setNumCompra(e.target.value);
                  if (e.target.value.trim().length >= 1) {
                    setSearched(true);
                    setTimeout(() => refetch(), 150);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBuscar();
                  }
                }}
                className="bg-secondary/50"
                placeholder="Digite o nº e pressione Enter"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleBuscar} className="gap-1.5">
              <Search className="h-4 w-4" /> Buscar
            </Button>
            <Button variant="outline" onClick={handleLimpar} className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10">
              <X className="h-4 w-4" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              📦 Produtos
            </h2>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => openAjusteDialog("up")} className="gap-1.5 bg-primary hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Aumentar
              </Button>
              <Button size="sm" variant="outline" onClick={() => openAjusteDialog("down")} className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10">
                <Minus className="h-3.5 w-3.5" /> Diminuir
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving || Object.keys(editedValues).length === 0} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Atualizar preços"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Motivo do ajuste (opcional, será registrado no histórico)</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 200))}
              placeholder="Ex: Reajuste de fornecedor, promoção sazonal, alinhamento de margem..."
              className="bg-secondary/50 text-sm min-h-[50px]"
            />
          </div>

          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-2 py-2 text-center w-10">
                    <input type="checkbox" className="rounded" checked={selected.size === produtos.length && produtos.length > 0} onChange={toggleAll} />
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">Código</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">Nome</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">Vr. custo</th>
                  {tiposVenda.map((tv) => (
                    <th key={tv.id} colSpan={2} className="px-2 py-2 text-center font-medium text-xs border-l border-border">
                      <span className="text-primary">Vr. {tv.nome}</span>
                      <span className="text-muted-foreground ml-1">({toBRL(tv.media_lucro)})</span>
                      <button
                        onClick={() => applyPercentageToAll(tv.nome, tv.media_lucro)}
                        className="ml-1 text-primary hover:text-primary/70 transition-colors"
                        title={`Aplicar ${toBRL(tv.media_lucro)}% a todos os produtos`}
                      >
                        <RefreshCw className="h-3.5 w-3.5 inline" />
                      </button>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground text-xs">Ação</th>
                </tr>
                <tr className="border-b border-border bg-secondary/20">
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  {tiposVenda.map((tv) => (
                    <th key={tv.id + "_sub"} colSpan={1} className="px-2 py-1.5 text-center text-[10px] text-muted-foreground border-l border-border" style={{ width: "auto" }}>
                      {/* Split into two sub-columns */}
                    </th>
                  ))}
                  {tiposVenda.length > 0 && <th colSpan={tiposVenda.length}></th>}
                  <th></th>
                </tr>
              </thead>
              <thead>
                <tr className="border-b border-border/50 bg-secondary/10">
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  {tiposVenda.map((tv) => (
                    <>
                      <th key={tv.id + "_lh"} className="px-1 py-1 text-center text-[10px] text-muted-foreground font-normal border-l border-border">Lucro utilizado</th>
                      <th key={tv.id + "_vh"} className="px-1 py-1 text-center text-[10px] text-muted-foreground font-normal">Valor utilizado</th>
                    </>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Buscando produtos...</td></tr>
                ) : produtos.length === 0 ? (
                  <tr><td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
                ) : (
                  produtos.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" className="rounded" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                      <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{p.codigo_cpl}</td>
                      <td className="px-2 py-2 text-foreground text-xs max-w-[250px]">
                        <div className="truncate font-medium">{p.nome}</div>
                        {(p.cor || p.marca || (p.aplicacoes && p.aplicacoes.length > 0)) && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.cor && <span className="text-[9px] bg-secondary/60 text-muted-foreground px-1 rounded">{p.cor}</span>}
                            {p.marca && <span className="text-[9px] bg-secondary/60 text-muted-foreground px-1 rounded">{p.marca}</span>}
                            {p.aplicacoes && p.aplicacoes.length > 0 && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1 rounded truncate max-w-[150px]">
                                {p.aplicacoes.slice(0, 2).join(", ")}
                                {p.aplicacoes.length > 2 && ` +${p.aplicacoes.length - 2}`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-foreground">
                        {toBRL(getCustoFinal(p))}
                        <br />
                        <span className="text-[9px] text-muted-foreground">{p.unidade || "UN"}</span>
                      </td>
                      {tiposVenda.map((tv) => {
                        const lucro = getProductValue(p, tv.nome, "lucro");
                        const valor = getProductValue(p, tv.nome, "valor");
                        return (
                          <>
                            <td key={tv.id + "_l"} className="px-1 py-1.5 border-l border-border">
                              <Input
                                type="number"
                                step="0.01"
                                value={lucro}
                                onChange={(e) => updateValue(p.id, tv.nome, "lucro", parseFloat(e.target.value) || 0)}
                                className="bg-secondary/50 h-7 text-xs text-right w-20 mx-auto"
                              />
                            </td>
                            <td key={tv.id + "_v"} className="px-1 py-1.5">
                              <BRLInput
                                value={valor}
                                onChange={(v) => updateValue(p.id, tv.nome, "valor", parseFloat(v) || 0)}
                                className="bg-secondary/50 h-7 text-xs text-right w-20 mx-auto"
                              />
                              <div className="text-[9px] text-muted-foreground text-center mt-0.5">{p.unidade || "UN"}</div>
                            </td>
                          </>
                        );
                      })}
                      <td className="px-2 py-2 text-center">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {allProdutos.length > 0 && (
              <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/20 flex items-center justify-between">
                <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allProdutos.length)} de {allProdutos.length} produto(s)</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                    <span className="text-xs">Página {page + 1} de {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <AjusteValorDialog
        open={ajusteDialogOpen}
        onOpenChange={setAjusteDialogOpen}
        direction={ajusteDirection}
        tiposVenda={tiposVenda}
        onApply={applyAjuste}
      />
    </div>
  );
}
