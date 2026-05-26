import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FormaPagamentoComboboxProps {
  value: string;
  onChange: (value: string, contaBancaria?: string | null) => void;
  placeholder?: string;
}

export function FormaPagamentoCombobox({ value, onChange, placeholder = "Digite para buscar" }: FormaPagamentoComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: formas = [] } = useQuery({
    queryKey: ["formas_pagamento_combobox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("id, nome, conta_bancaria")
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
          <CommandInput placeholder="Buscar forma de pagamento..." />
          <CommandList>
            <CommandEmpty>Nenhuma forma encontrada.</CommandEmpty>
            <CommandGroup>
              {formas.map((forma) => (
                <CommandItem
                  key={forma.id}
                  value={forma.nome}
                  onSelect={() => {
                    onChange(forma.nome, forma.conta_bancaria);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === forma.nome ? "opacity-100" : "opacity-0")}
                  />
                  {forma.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
