import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Loader2,
  ArrowLeft,
  UserPlus,
  Bike,
  User,
  ArrowRight,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PlacaLookupResult {
  cliente: any | null;
  veiculo: any | null;
  placa: string;
}

interface PlacaLookupScreenProps {
  onContinue: (result: PlacaLookupResult) => void;
  onBack: () => void;
  backLabel?: string;
}

export function PlacaLookupScreen({ onContinue, onBack, backLabel = "Voltar" }: PlacaLookupScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"placa" | "cliente">("placa");

  // Placa state
  const [placa, setPlaca] = useState("");
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState<any>(null);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  // Cliente search state
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteResults, setClienteResults] = useState<any[]>([]);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  const formatPhone = (v: string) => {
    if (!v) return "";
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `${n.slice(0, 2)}-${n.slice(2)}`;
    return `${n.slice(0, 2)}-${n.slice(2, 7)}-${n.slice(7)}`;
  };

  // Buscar cliente por placa
  const buscarClientePorPlaca = async (placaBusca: string) => {
    const placaUpper = placaBusca.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const { data: clienteCadastro } = await supabase
      .from("clientes")
      .select("id, nome_completo, nome_fantasia, telefone, cpf, cnpj, tipo_pessoa, placas")
      .contains("placas", [placaUpper])
      .limit(1)
      .maybeSingle();
    if (clienteCadastro) return clienteCadastro;

    const { data: osAnterior } = await supabase
      .from("ordem_servico")
      .select("cliente_nome, cliente_telefone")
      .ilike("placa", placaBusca)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (osAnterior?.cliente_nome) {
      return { nome_completo: osAnterior.cliente_nome, telefone: osAnterior.cliente_telefone };
    }
    return null;
  };

  // Buscar placa
  const buscarPlaca = async () => {
    const placaLimpa = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!placaLimpa) {
      toast({ title: "Digite uma placa para buscar", variant: "destructive" });
      return;
    }
    const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!placaRegex.test(placaLimpa)) {
      toast({ title: "Formato de placa inválido", description: "Use o formato ABC1234 ou ABC1D23.", variant: "destructive" });
      return;
    }
    setBuscandoPlaca(true);
    setBuscaRealizada(false);
    setVeiculoEncontrado(null);
    setClienteEncontrado(null);

    try {
      // 1) Buscar cliente local primeiro (economiza token da API)
      const clienteLocal = await buscarClientePorPlaca(placaLimpa);

      // 2) Buscar veículo no histórico de OS
      const { data: osAnterior } = await supabase
        .from("ordem_servico")
        .select("*")
        .ilike("placa", placaLimpa)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Vincula cliente local (se houver)
      if (clienteLocal) {
        setClienteEncontrado(clienteLocal);
      } else if (osAnterior?.cliente_nome) {
        setClienteEncontrado({ nome_completo: osAnterior.cliente_nome, telefone: osAnterior.cliente_telefone });
      }

      // Se houver veículo no histórico de OS, usa-o (economiza API)
      let veiculoLocal: any = null;
      if (osAnterior && (osAnterior.veiculo_marca || osAnterior.veiculo_modelo)) {
        veiculoLocal = {
          marca: osAnterior.veiculo_marca || "",
          modelo: osAnterior.veiculo_modelo || "",
          ano: osAnterior.veiculo_ano || "",
          cor: osAnterior.veiculo_cor || "",
          chassi: osAnterior.veiculo_chassi || "",
        };
        setVeiculoEncontrado(veiculoLocal);
      }

      // 3) Se NÃO há dados de veículo locais, chamar API externa (mesmo se já achou cliente)
      if (!veiculoLocal) {
        const { data: apiResult, error: apiError } = await supabase.functions.invoke("consultar-placa", {
          body: { placa: placaLimpa },
        });

        if (!apiError && apiResult?.success && apiResult?.veiculo) {
          setVeiculoEncontrado(apiResult.veiculo);
        }
      }

      setBuscaRealizada(true);
    } catch (err: any) {
      toast({ title: "Erro ao buscar placa", description: err.message, variant: "destructive" });
      setBuscaRealizada(true);
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Buscar clientes no banco
  useEffect(() => {
    if (!clienteSearch || clienteSearch.length < 2) {
      setClienteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const terms = clienteSearch.toUpperCase().split(/\s+/).filter(Boolean);
        let query = supabase
          .from("clientes")
          .select("id, nome_completo, nome_fantasia, razao_social, telefone, cpf, cnpj, tipo_pessoa, placas")
          .limit(20);
        for (const term of terms) {
          query = query.or(
            `nome_completo.ilike.%${term}%,nome_fantasia.ilike.%${term}%,razao_social.ilike.%${term}%,telefone.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`
          );
        }
        const { data } = await query;
        setClienteResults(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setBuscandoCliente(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clienteSearch]);

  const handleContinueWithPlaca = () => {
    onContinue({
      cliente: clienteEncontrado,
      veiculo: veiculoEncontrado,
      placa: placa.trim().toUpperCase(),
    });
  };

  const handleContinueWithCliente = () => {
    onContinue({
      cliente: clienteSelecionado,
      veiculo: null,
      placa: "",
    });
  };

  const handleContinueSemPlaca = () => {
    onContinue({
      cliente: null,
      veiculo: null,
      placa: "",
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <Bike className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">Identifique o veículo ou cliente para começar</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setMode("placa")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              mode === "placa" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bike className="h-4 w-4" />
            Buscar por Placa
          </button>
          <button
            onClick={() => setMode("cliente")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
              mode === "cliente" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Buscar por Cliente
          </button>
        </div>

        {/* Placa mode */}
        {mode === "placa" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">🔍 Buscar por Placa</p>
                <p className="text-xs text-muted-foreground mb-3">Insira a placa para preencher os dados automaticamente</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={placa}
                    onChange={(e) => {
                      setPlaca(e.target.value.toUpperCase());
                      setBuscaRealizada(false);
                    }}
                    placeholder="ABC-1234 OU ABC1D23"
                    className="bg-background border-border text-lg font-mono uppercase tracking-wider"
                    maxLength={8}
                    onKeyDown={(e) => e.key === "Enter" && buscarPlaca()}
                    autoFocus
                  />
                  <Button onClick={buscarPlaca} disabled={buscandoPlaca} className="bg-primary text-primary-foreground px-6">
                    {buscandoPlaca ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Buscar</span>
                  </Button>
                </div>
              </div>

              {/* Resultado */}
              {buscaRealizada && (
                <div className="space-y-3 animate-in fade-in-50">
                  {veiculoEncontrado ? (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
                      <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                        ✅ Veículo encontrado
                      </p>
                      <p className="text-sm">
                        {veiculoEncontrado.marca} {veiculoEncontrado.modelo}
                        {veiculoEncontrado.ano ? ` - ${veiculoEncontrado.ano}` : ""}
                        {veiculoEncontrado.cor ? ` · ${veiculoEncontrado.cor}` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-600">⚠️ Veículo não encontrado. Os dados poderão ser preenchidos manualmente.</p>
                    </div>
                  )}

                  {clienteEncontrado ? (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                        👤 Cliente vinculado
                      </p>
                      <p className="text-sm">
                        {clienteEncontrado.nome_completo || clienteEncontrado.nome_fantasia}
                        {clienteEncontrado.telefone ? ` · ${formatPhone(clienteEncontrado.telefone)}` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-2">
                      <p className="text-sm text-muted-foreground">Nenhum cliente vinculado a esta placa</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full"
                        onClick={() => navigate(`/clientes/novo?placa=${placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")}&returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Cadastrar novo cliente
                      </Button>
                    </div>
                  )}

                  <Button onClick={handleContinueWithPlaca} className="w-full h-12 text-base gap-2">
                    <ArrowRight className="h-5 w-5" />
                    {clienteEncontrado ? "Continuar com este cliente" : "Continuar e adicionar cliente"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cliente mode */}
        {mode === "cliente" && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">👤 Buscar Cliente</p>
                <p className="text-xs text-muted-foreground mb-3">Busque por nome, telefone, CPF ou CNPJ</p>

                <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background border-border font-normal h-12 text-base"
                    >
                      {clienteSelecionado
                        ? clienteSelecionado.nome_completo || clienteSelecionado.razao_social
                        : "Selecione o cliente..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nome, telefone, CPF/CNPJ..."
                        value={clienteSearch}
                        onValueChange={setClienteSearch}
                      />
                      <CommandList>
                        {buscandoCliente && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {!buscandoCliente && clienteSearch.length >= 2 && clienteResults.length === 0 && (
                          <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
                        )}
                        {!buscandoCliente && clienteSearch.length < 2 && (
                          <CommandEmpty>Digite pelo menos 2 caracteres</CommandEmpty>
                        )}
                        <CommandGroup>
                          {clienteResults.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                              onSelect={() => {
                                setClienteSelecionado(c);
                                setClienteOpen(false);
                                setClienteSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-inherit">{c.nome_completo || c.razao_social}</span>
                                {c.nome_fantasia && (
                                  <span className="text-xs text-inherit opacity-80">{c.nome_fantasia}</span>
                                )}
                                <span className="text-xs text-inherit opacity-80">
                                  {formatPhone(c.telefone)}
                                  {c.cpf ? ` • CPF: ${c.cpf}` : ""}
                                  {c.cnpj ? ` • CNPJ: ${c.cnpj}` : ""}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {clienteSelecionado && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{clienteSelecionado.nome_completo || clienteSelecionado.razao_social}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(clienteSelecionado.telefone)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setClienteSelecionado(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {clienteSelecionado && (
                <Button onClick={handleContinueWithCliente} className="w-full h-12 text-base gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Continuar com este cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações de rodapé */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>

          <Button variant="link" onClick={handleContinueSemPlaca} className="text-muted-foreground">
            Pular e preencher manualmente
          </Button>
        </div>
      </div>
    </div>
  );
}
