import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlanoContasComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tipoMovimentacao?: "Pagamentos" | "Recebimentos";
}

export function PlanoContasCombobox({ value, onChange, placeholder = "Digite para buscar", tipoMovimentacao }: PlanoContasComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: contas = [] } = useQuery({
    queryKey: ["plano_contas_ativos", tipoMovimentacao],
    queryFn: async () => {
      let query = supabase
        .from("plano_contas")
        .select("id, classificacao, nome, nivel, tipo_movimentacao")
        .eq("ativo", true)
        .order("classificacao");
      if (tipoMovimentacao) {
        query = query.eq("tipo_movimentacao", tipoMovimentacao);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Only show level 3 accounts (not groups)
  const contasNivel3 = contas.filter((c) => c.nivel === 3);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar plano de contas..." />
          <CommandList>
            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
            <CommandGroup>
              {contasNivel3.map((conta) => (
                <CommandItem
                  key={conta.id}
                  value={`${conta.classificacao} ${conta.nome}`}
                  onSelect={() => {
                    onChange(conta.nome);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === conta.nome ? "opacity-100" : "opacity-0")}
                  />
                  <span className="font-mono text-xs text-muted-foreground mr-2">{conta.classificacao}</span>
                  {conta.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
