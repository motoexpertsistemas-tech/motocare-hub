import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Package, FileText, Users, CalendarDays, RefreshCw, ArrowLeft, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Fornecedor {
  nome: string;
  email: string;
}

interface ProdutoItem {
  produto_id: string | null;
  nome: string;
  detalhes: string;
  quantidade: number;
  unidade: string;
}

interface ProdutoCatalogo {
  id: string;
  nome: string;
  codigo_cpl: string;
  unidade: string | null;
  fornecedor: string | null;
}

function ProductSearchInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: ProdutoCatalogo) => void;
}) {
  const [results, setResults] = useState<ProdutoCatalogo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, unidade, fornecedor")
      .or(`nome.ilike.%${term}%,codigo_cpl.ilike.%${term}%`)
      .limit(10);
    setResults((data as ProdutoCatalogo[]) || []);
    setSearching(false);
    setShowDropdown(true);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Digite para buscar"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => {
                onSelect(p);
                setShowDropdown(false);
              }}
            >
              <span className="font-medium">{p.nome}</span>
              <span className="text-muted-foreground ml-2 text-xs">({p.codigo_cpl})</span>
            </button>
          ))}
        </div>
      )}
      {showDropdown && searching && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
          Buscando...
        </div>
      )}
    </div>
  );
}

export default function AdicionarCotacao() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);
  const [prazoRecebimento, setPrazoRecebimento] = useState("");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([{ nome: "", email: "" }]);
  const [produtos, setProdutos] = useState<ProdutoItem[]>([{ produto_id: null, nome: "", detalhes: "", quantidade: 1, unidade: "UN" }]);
  const [observacoes, setObservacoes] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [saving, setSaving] = useState(false);

  const addFornecedor = () => setFornecedores([...fornecedores, { nome: "", email: "" }]);
  const removeFornecedor = (i: number) => setFornecedores(fornecedores.filter((_, idx) => idx !== i));
  const updateFornecedor = (i: number, field: keyof Fornecedor, value: string) => {
    const updated = [...fornecedores];
    updated[i] = { ...updated[i], [field]: value };
    setFornecedores(updated);
  };

  const addProduto = () => setProdutos([...produtos, { produto_id: null, nome: "", detalhes: "", quantidade: 1, unidade: "UN" }]);
  const removeProduto = (i: number) => setProdutos(produtos.filter((_, idx) => idx !== i));
  const updateProduto = (i: number, field: keyof ProdutoItem, value: string | number | null) => {
    const updated = [...produtos];
    updated[i] = { ...updated[i], [field]: value } as ProdutoItem;
    setProdutos(updated);
  };

  const selectProduto = (i: number, p: ProdutoCatalogo) => {
    const updated = [...produtos];
    updated[i] = {
      ...updated[i],
      produto_id: p.id,
      nome: p.nome,
      detalhes: p.codigo_cpl,
      unidade: p.unidade || "UN",
    };
    setProdutos(updated);
  };

  const handleCarregarProdutos = async (fornecedorNome: string) => {
    if (!fornecedorNome.trim()) {
      toast.error("Informe o nome do fornecedor primeiro");
      return;
    }
    const { data, error } = await supabase
      .from("produtos_catalogo")
      .select("id, nome, codigo_cpl, unidade, fornecedor")
      .ilike("fornecedor", `%${fornecedorNome.trim()}%`)
      .limit(50);
    if (error) {
      toast.error("Erro ao buscar produtos do fornecedor");
      return;
    }
    const prods = (data as ProdutoCatalogo[]) || [];
    if (prods.length === 0) {
      toast.info("Nenhum produto encontrado para este fornecedor");
      return;
    }
    const newItems: ProdutoItem[] = prods.map(p => ({
      produto_id: p.id,
      nome: p.nome,
      detalhes: p.codigo_cpl,
      quantidade: 1,
      unidade: p.unidade || "UN",
    }));
    setProdutos(prev => {
      const existing = prev.filter(p => p.nome.trim());
      return [...existing, ...newItems];
    });
    toast.success(`${prods.length} produto(s) carregado(s)`);
  };

  const handleSave = async () => {
    const validFornecedores = fornecedores.filter(f => f.nome.trim());
    if (validFornecedores.length === 0) {
      toast.error("Adicione pelo menos um fornecedor");
      return;
    }
    const validProdutos = produtos.filter(p => p.nome.trim());
    if (validProdutos.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    setSaving(true);

    for (const forn of validFornecedores) {
      const { data: cotacao, error } = await supabase
        .from("cotacoes" as any)
        .insert({
          titulo: `Cotação - ${forn.nome}`,
          fornecedor: forn.nome,
          observacoes: [observacoes, observacoesInternas ? `[INTERNO] ${observacoesInternas}` : ""].filter(Boolean).join("\n") || null,
          data_envio: data || null,
        } as any)
        .select("id")
        .single();

      if (error) {
        toast.error("Erro ao criar cotação: " + error.message);
        setSaving(false);
        return;
      }

      const items = validProdutos.map(p => ({
        cotacao_id: (cotacao as any).id,
        produto_id: p.produto_id || null,
        produto_nome: p.nome,
        quantidade: p.quantidade,
        unidade: p.unidade,
      }));

      const { error: itemError } = await supabase.from("cotacoes_itens" as any).insert(items as any);
      if (itemError) {
        toast.error("Erro ao adicionar itens: " + itemError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success(`${validFornecedores.length} cotação(ões) criada(s) com sucesso!`);
    navigate("/estoque/cotacoes");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/estoque/cotacoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Adicionar cotação</h1>
        </div>
      </div>

      {/* Dados gerais */}
      <Card>
        <CardHeader className="py-3 px-4 bg-muted/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Dados gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prazo recebimento</Label>
              <Input type="date" value={prazoRecebimento} onChange={(e) => setPrazoRecebimento(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fornecedor */}
      <Card>
        <CardHeader className="py-3 px-4 bg-muted/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {fornecedores.map((f, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Fornecedor *</Label>
                <Input placeholder="Digite para buscar" value={f.nome} onChange={(e) => updateFornecedor(i, "nome", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input placeholder="email@fornecedor.com" value={f.email} onChange={(e) => updateFornecedor(i, "email", e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleCarregarProdutos(f.nome)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Carregar produtos
                </Button>
                {fornecedores.length > 1 && (
                  <Button variant="destructive" size="sm" className="gap-1" onClick={() => removeFornecedor(i)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={addFornecedor}>
            <Plus className="h-4 w-4" /> Adicionar outro fornecedor
          </Button>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card className="overflow-visible">
        <CardHeader className="py-3 px-4 bg-muted/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 overflow-visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto *</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Quantidade *</TableHead>
                <TableHead>Unidade *</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ProductSearchInput
                      value={p.nome}
                      onChange={(v) => updateProduto(i, "nome", v)}
                      onSelect={(prod) => selectProduto(i, prod)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input value={p.detalhes} onChange={(e) => updateProduto(i, "detalhes", e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" min={1} value={p.quantidade} onChange={(e) => updateProduto(i, "quantidade", Number(e.target.value))} />
                  </TableCell>
                  <TableCell>
                    <Input value={p.unidade} onChange={(e) => updateProduto(i, "unidade", e.target.value)} />
                  </TableCell>
                  <TableCell>
                    {produtos.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeProduto(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={addProduto}>
            <Plus className="h-4 w-4" /> Adicionar produto
          </Button>
        </CardContent>
      </Card>

      {/* Observações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4 bg-muted/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Esta observação será visível para o fornecedor.</p>
            <Textarea rows={5} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4 bg-muted/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Observações internas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Esta observação é de uso interno, não será visível para o fornecedor.</p>
            <Textarea rows={5} value={observacoesInternas} onChange={(e) => setObservacoesInternas(e.target.value)} />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pb-6">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Cadastrar"}
        </Button>
        <Button variant="destructive" onClick={() => navigate("/estoque/cotacoes")} className="gap-1.5">
          <X className="h-4 w-4" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
