import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface ProductOption {
  id: string;
  nome: string;
  codigo_cpl?: string;
  quantidade_estoque: number;
  aplicacoes?: string[];
  marca?: string;
  descricao?: string;
  preco_custo?: number;
  localizacao?: string;
}

interface ProductComboboxProps {
  value: string;
  onChange: (value: string, product?: ProductOption) => void;
  /** @deprecated Use server-side search instead */
  products?: ProductOption[];
  onAddNew?: () => void;
}

export function ProductCombobox({ value, onChange, products: externalProducts, onAddNew }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [selected, setSelected] = useState<ProductOption | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch products from DB on search change
  useEffect(() => {
    if (externalProducts) return; // skip if using legacy prop
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from("produtos_catalogo")
        .select("id, nome, preco_custo, codigo_cpl, estoque_quantidade, aplicacoes, marca, descricao, localizacao");

      if (debouncedSearch.trim()) {
        const words = debouncedSearch.trim().split(/\s+/).filter(Boolean);
        for (const word of words) {
          const term = `%${word}%`;
          query = query.or(`nome.ilike.${term},codigo_cpl.ilike.${term},marca.ilike.${term},descricao.ilike.${term},aplicacoes.cs.{"${word}"}`);
        }
      }

      const { data } = await query.order("nome").limit(50);
      setResults(
        (data || []).map((p) => ({
          id: p.id,
          nome: p.nome,
          codigo_cpl: p.codigo_cpl,
          quantidade_estoque: p.estoque_quantidade ?? 0,
          aplicacoes: p.aplicacoes || undefined,
          marca: p.marca || undefined,
          descricao: p.descricao || undefined,
          preco_custo: p.preco_custo ?? 0,
          localizacao: (p as any).localizacao || undefined,
        }))
      );
      setLoading(false);
    };
    fetchProducts();
  }, [debouncedSearch, externalProducts]);

  // Load selected product name if value is set but not in results
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    // If already selected with same ID, keep it
    if (selected && selected.id === value) return;
    const found = results.find((p) => p.id === value) || externalProducts?.find((p) => p.id === value);
    if (found) { setSelected(found); return; }
    // Fetch single product by ID
    supabase
      .from("produtos_catalogo")
      .select("id, nome, preco_custo, codigo_cpl, estoque_quantidade")
      .eq("id", value)
      .single()
      .then(({ data }) => {
        if (data) setSelected({ id: data.id, nome: data.nome, codigo_cpl: data.codigo_cpl, quantidade_estoque: data.estoque_quantidade ?? 0, preco_custo: data.preco_custo ?? 0 });
      });
  }, [value, externalProducts]);

  // Use external products if provided (legacy support), otherwise use server results
  const displayProducts = externalProducts || results;

  // For legacy external products, apply client-side filtering
  const filtered = externalProducts
    ? (() => {
        if (!search.trim()) return externalProducts;
        const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return externalProducts.filter((p) => {
          const searchable = [p.nome, p.codigo_cpl, p.marca, p.descricao, ...(p.aplicacoes || [])].filter(Boolean).join(" ").toLowerCase();
          return words.every((w) => searchable.includes(w));
        });
      })()
    : results;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 bg-secondary/50 border-border text-sm font-normal"
        >
          <span className="truncate flex-1 text-left">
            {selected ? selected.nome : "Selecione um produto..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[460px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar produto por nome, código, aplicação..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
            ) : (
              <>
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup className="max-h-[300px]">
                  {filtered.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onChange(p.id, p);
                        setSelected(p);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-start justify-between gap-2 py-2 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            value === p.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="min-w-0">
                          <span className="truncate text-sm block font-medium">{p.nome}</span>
                          {p.codigo_cpl && (
                            <span className="text-[10px] text-muted-foreground font-mono">{p.codigo_cpl}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-mono tabular-nums border",
                            p.quantidade_estoque > 0
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          )}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          {p.quantidade_estoque}
                        </Badge>
                        {p.localizacao && (
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]" title={p.localizacao}>
                            📍 {p.localizacao}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onAddNew && (
                  <div className="border-t p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onAddNew();
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar novo
                    </button>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
