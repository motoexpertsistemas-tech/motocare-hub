import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Wrench, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceOption {
  id: string;
  nome: string;
  codigo_interno: string;
  valor_venda: number;
  valor_custo: number;
  tempo_estimado_min: number | null;
}

interface ServiceComboboxProps {
  value: string;
  onChange: (value: string, service?: ServiceOption) => void;
  onAddNew?: () => void;
}

export function ServiceCombobox({ value, onChange, onAddNew }: ServiceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<ServiceOption[]>([]);
  const [selected, setSelected] = useState<ServiceOption | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      let query = supabase
        .from("servicos")
        .select("id, nome, codigo_interno, valor_venda, valor_custo, tempo_estimado_min")
        .eq("ativo", true);

      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(`nome.ilike.${term},codigo_interno.ilike.${term}`);
      }

      const { data } = await query.order("nome").limit(50);
      setResults(
        (data || []).map((s) => ({
          id: s.id,
          nome: s.nome,
          codigo_interno: s.codigo_interno,
          valor_venda: s.valor_venda ?? 0,
          valor_custo: s.valor_custo ?? 0,
          tempo_estimado_min: s.tempo_estimado_min,
        }))
      );
      setLoading(false);
    };
    fetchServices();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!value) { setSelected(null); return; }
    const found = results.find((s) => s.id === value);
    if (found) { setSelected(found); return; }
    supabase
      .from("servicos")
      .select("id, nome, codigo_interno, valor_venda, valor_custo, tempo_estimado_min")
      .eq("id", value)
      .single()
      .then(({ data }) => {
        if (data) setSelected({
          id: data.id,
          nome: data.nome,
          codigo_interno: data.codigo_interno,
          valor_venda: data.valor_venda ?? 0,
          valor_custo: data.valor_custo ?? 0,
          tempo_estimado_min: data.tempo_estimado_min,
        });
      });
  }, [value, results]);

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
            {selected ? selected.nome : "Selecione um serviço..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[460px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar serviço por nome ou código..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
            ) : (
              <>
                <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                <CommandGroup className="max-h-[300px]">
                  {results.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={() => {
                        onChange(s.id, s);
                        setSelected(s);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className={cn("h-4 w-4 shrink-0", value === s.id ? "opacity-100" : "opacity-0")} />
                        <div className="min-w-0">
                          <span className="truncate text-sm block">{s.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{s.codigo_interno}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.tempo_estimado_min && (
                          <span className="text-[10px] text-muted-foreground">{s.tempo_estimado_min}min</span>
                        )}
                        <span className="text-xs font-semibold text-primary">
                          R$ {s.valor_venda.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {onAddNew && (
                  <div className="border-t p-1">
                    <button
                      type="button"
                      onClick={() => { setOpen(false); onAddNew(); }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar novo serviço
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
