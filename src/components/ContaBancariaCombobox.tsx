import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContaBancariaComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ContaBancariaCombobox({ value, onChange, placeholder = "Digite para buscar" }: ContaBancariaComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: contas = [] } = useQuery({
    queryKey: ["contas_bancarias_combobox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_bancarias")
        .select("id, nome, banco, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

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
          <CommandInput placeholder="Buscar conta bancária..." />
          <CommandList>
            <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
            <CommandGroup>
              {contas.map((conta) => (
                <CommandItem
                  key={conta.id}
                  value={`${conta.nome} ${conta.banco || ""}`}
                  onSelect={() => {
                    onChange(conta.nome);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === conta.nome ? "opacity-100" : "opacity-0")}
                  />
                  <span>{conta.nome}</span>
                  {conta.banco && <span className="ml-2 text-xs text-muted-foreground">({conta.banco})</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
