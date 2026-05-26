import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FornecedorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FornecedorCombobox({ value, onChange, placeholder = "Digite para buscar" }: FornecedorComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores_combobox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome_completo, nome_fantasia")
        .eq("ativo", true)
        .order("nome_completo");
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
          <CommandInput placeholder="Buscar fornecedor..." />
          <CommandList>
            <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
            <CommandGroup>
              {fornecedores.map((f) => {
                const nome = f.nome_completo || "";
                const display = f.nome_fantasia ? `${nome} (${f.nome_fantasia})` : nome;
                return (
                  <CommandItem
                    key={f.id}
                    value={`${nome} ${f.nome_fantasia || ""}`}
                    onSelect={() => {
                      onChange(display);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === display ? "opacity-100" : "opacity-0")}
                    />
                    {display}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
