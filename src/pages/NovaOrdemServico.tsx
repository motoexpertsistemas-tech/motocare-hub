import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { ProductCombobox } from "@/components/ProductCombobox";
import { Button } from "@/components/ui/button";
import { BRLInput } from "@/components/BRLInput";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { ServiceCombobox, type ServiceOption } from "@/components/ServiceCombobox";
import { PlacaLookupScreen } from "@/components/PlacaLookupScreen";
import { CheckinStep, type CheckinData, type ChecklistCategory } from "@/components/CheckinStep";
import {
  Search,
  Loader2,
  Plus,
  Trash2,
  Save,
  X,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  Upload,
  UserPlus,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProdutoItem {
  id: number;
  produto_id: string;
  detalhes: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
  _nome?: string;
  vendedor: string;
  tecnico: string;
}

interface ServicoItem {
  id: number;
  servico_id: string;
  detalhes: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
  tecnico: string;
}

interface Parcela {
  vencimento: string;
  valor: number;
  forma_pagamento: string;
  plano_contas: string;
  observacao: string;
}

export default function NovaOrdemServico() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { empresaId } = useEmpresa();
  const initialStatus = searchParams.get("status")?.toUpperCase() || "ATENDIMENTO";
  const [step, setStep] = useState<"lookup" | "checkin" | "form">("lookup");
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [saving, setSaving] = useState(false);

  const formatPhone = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `${n.slice(0, 2)}-${n.slice(2)}`;
    return `${n.slice(0, 2)}-${n.slice(2, 7)}-${n.slice(7)}`;
  };
  const formatCPF = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };
  const formatCNPJ = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 14);
    return n.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  };

  // Número OS
  const [numeroOS, setNumeroOS] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    situacao: initialStatus,
    data_entrada: new Date().toISOString().split("T")[0],
    hora_entrada: new Date().toTimeString().slice(0, 5),
    data_saida: "",
    hora_saida: "",
    canal_venda: "VENDA ORDEM DE SERVIÇO",
    centro_custo: "",
    prioridade: "normal",
    km_entrada: "",
    km_ultima_revisao: "",
    nivel_combustivel: "1/2",
    oleo_recomendado: "",
    ultima_troca_oleo: "",
  });

  // Cliente
  const [cliente, setCliente] = useState<any>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteResults, setClienteResults] = useState<any[]>([]);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

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

  // Responsáveis
  const [vendedorNome, setVendedorNome] = useState("");
  const [tecnicoNome, setTecnicoNome] = useState("");
  const [funcionariosLista, setFuncionariosLista] = useState<{ id: string; nome: string }[]>([]);
  const [tecnicoOpen, setTecnicoOpen] = useState(false);

  // Placa e Veículo
  const [placa, setPlaca] = useState("");
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [dadosVeiculo, setDadosVeiculo] = useState<any>(null);
  const [equipamento, setEquipamento] = useState({
    equipamento: "",
    marca: "",
    modelo: "",
    serie: "",
    ano: "",
    cor: "",
    condicoes: "",
    defeitos: "",
    acessorios: "",
    solucao: "",
  });

  // Produtos
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  

  // Serviços
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [servicosDisponiveis] = useState<any[]>([]);

  // Totais
  const [totais, setTotais] = useState({
    mao_obra: 0,
    pecas: 0,
    frete: 0,
    outros: 0,
    desconto: 0,
    total: 0,
  });

  // Pagamento
  const [pagamento, setPagamento] = useState({
    gerar_condicoes: false,
    tipo: "a_vista",
    forma_pagamento: "",
    intervalo: 30,
    qtd_parcelas: "1",
    data_primeira: new Date().toISOString().split("T")[0],
    parcelas: [] as Parcela[],
  });

  // Formas de pagamento do banco
  const { data: formasPagamentoDB = [] } = useQuery({
    queryKey: ["formas_pagamento_os"],
    queryFn: async () => {
      const { data } = await supabase.from("formas_pagamento").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const gerarParcelasLote = () => {
    const totalOS = totais.total;
    const qtd = parseInt(pagamento.qtd_parcelas) || 1;
    if (totalOS <= 0 || qtd <= 0) {
      toast({ title: "Informe o valor total da OS e a quantidade de parcelas válidas.", variant: "destructive" });
      return;
    }
    
    const novasParcelas: Parcela[] = [];
    const base = pagamento.data_primeira || new Date().toISOString().split("T")[0];
    const inter = pagamento.tipo === "a_vista" ? 0 : (pagamento.intervalo || 30);
    
    // Cálculo de cada parcela tratando divisões com centavos
    const valorParcelaBase = Math.floor((totalOS / qtd) * 100) / 100;
    const valorUltimaParcela = Math.round((totalOS - (valorParcelaBase * (qtd - 1))) * 100) / 100;
    
    for (let i = 0; i < qtd; i++) {
      const baseDate = new Date(base + "T12:00:00");
      const dt = new Date(baseDate);
      dt.setDate(baseDate.getDate() + (inter * i));
      
      novasParcelas.push({
        vencimento: dt.toISOString().split("T")[0],
        valor: i === qtd - 1 ? valorUltimaParcela : valorParcelaBase,
        forma_pagamento: pagamento.forma_pagamento || "",
        plano_contas: "Prestações de serviços",
        observacao: "",
      });
    }
    
    setPagamento({
      ...pagamento,
      parcelas: novasParcelas,
    });
    toast({ title: `✅ ${qtd} parcela(s) gerada(s) com sucesso!` });
  };

  // Anexos
  const [fotosCheckin, setFotosCheckin] = useState<File[]>([]);

  // Observações
  const [observacoes, setObservacoes] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");

  useEffect(() => {
    gerarNumeroOS();
    // Auto-fill vendedor with logged-in user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const nome = user.user_metadata?.nome || user.user_metadata?.full_name || user.email || "";
        if (nome) setVendedorNome(nome);
      }
    });
    // Load operador padrão for técnico
    supabase.from("configuracoes_loja").select("operador_padrao").limit(1).maybeSingle().then(({ data }) => {
      if (data?.operador_padrao) {
        setTecnicoNome(data.operador_padrao);
      }
    });
    // Load funcionários
    supabase.from("funcionarios" as any).select("id, nome").eq("ativo", true).order("nome").then(({ data }) => {
      if (data) setFuncionariosLista(data as any[]);
    });
  }, []);

  // Recalcular totais
  useEffect(() => {
    const mao_obra = servicos.reduce((sum, s) => sum + s.subtotal, 0);
    const pecas = produtos.reduce((sum, p) => sum + p.subtotal, 0);
    setTotais((prev) => ({
      ...prev,
      mao_obra,
      pecas,
      total: mao_obra + pecas + prev.frete + prev.outros - prev.desconto,
    }));
  }, [servicos, produtos]);

  // Recalcular total quando frete/outros/desconto mudam
  useEffect(() => {
    setTotais((prev) => ({
      ...prev,
      total: prev.mao_obra + prev.pecas + prev.frete + prev.outros - prev.desconto,
    }));
  }, [totais.frete, totais.outros, totais.desconto]);

  const gerarNumeroOS = async () => {
    const { count } = await supabase
      .from("ordem_servico")
      .select("*", { count: "exact", head: true });
    const proximo = (count || 0) + 1;
    setNumeroOS(`OS-${new Date().getFullYear()}-${String(proximo).padStart(4, "0")}`);
  };

  // Gera variantes da placa para tolerar confusões comuns (0/O, 1/I, 8/B, 5/S, 2/Z)
  const gerarVariantesPlaca = (placa: string): string[] => {
    const swaps: Record<string, string[]> = {
      "0": ["0", "O", "Q", "D"],
      "O": ["O", "0", "Q", "D"],
      "1": ["1", "I", "L"],
      "I": ["I", "1", "L"],
      "L": ["L", "1", "I"],
      "8": ["8", "B"],
      "B": ["B", "8"],
      "5": ["5", "S"],
      "S": ["S", "5"],
      "2": ["2", "Z"],
      "Z": ["Z", "2"],
      "6": ["6", "G"],
      "G": ["G", "6"],
    };
    let variantes: string[] = [""];
    for (const ch of placa.toUpperCase()) {
      const opts = swaps[ch] || [ch];
      const novas: string[] = [];
      for (const v of variantes) for (const o of opts) novas.push(v + o);
      variantes = novas;
      if (variantes.length > 256) break; // limite de segurança
    }
    return Array.from(new Set(variantes));
  };

  // Buscar cliente vinculado à placa: cadastro > histórico OS (com tolerância a confusões)
  const buscarClientePorPlaca = async (placaBusca: string) => {
    const placaUpper = placaBusca.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const variantes = gerarVariantesPlaca(placaUpper);

    // 1) Buscar no cadastro de clientes — testa todas as variantes via overlaps (&&)
    const { data: clientesCadastro } = await supabase
      .from("clientes")
      .select("id, nome_completo, nome_fantasia, telefone, cpf, cnpj, tipo_pessoa, placas")
      .overlaps("placas", variantes)
      .limit(1);
    if (clientesCadastro && clientesCadastro.length > 0) return clientesCadastro[0];

    // 2) Buscar no histórico de OS — tenta cada variante até achar
    for (const v of variantes) {
      const { data: osAnterior } = await supabase
        .from("ordem_servico")
        .select("cliente_nome, cliente_telefone")
        .ilike("placa", v)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (osAnterior?.cliente_nome) {
        return { nome_completo: osAnterior.cliente_nome, telefone: osAnterior.cliente_telefone };
      }
    }
    return null;
  };

  // Helper: preencher campos do veículo a partir de dados
  const preencherVeiculo = (v: any) => {
    setDadosVeiculo(v);
    setEquipamento((prev) => ({
      ...prev,
      equipamento: `${v.modelo || ""} ${v.cor || ""} ${placa}`.trim(),
      marca: v.marca || "",
      modelo: v.modelo || "",
      serie: v.chassi || "",
      ano: v.ano || "",
      cor: v.cor || "",
    }));
  };

  // Salvar no cache de veículos
  const salvarCacheVeiculo = async (placaLimpa: string, v: any, fonte: string) => {
    try {
      await supabase.from("veiculos_cache" as any).upsert({
        placa: placaLimpa,
        marca: v.marca || v.MARCA || "",
        modelo: v.modelo || v.MODELO || "",
        ano: v.ano || v.anoModelo || "",
        cor: v.cor || "",
        chassi: v.chassi || "",
        combustivel: v.combustivel || "",
        tipo_veiculo: v.tipo_veiculo || "",
        municipio: v.municipio || "",
        uf: v.uf || "",
        fonte,
        dados_completos: v,
        updated_at: new Date().toISOString(),
        empresa_id: empresaId,
      } as any, { onConflict: "placa" });
    } catch (e) {
      console.error("Erro ao salvar cache veículo:", e);
    }
  };

  // Buscar placa: cache > API externa > OS anteriores
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
    try {
      // 0) Verificar cache local
      const { data: cached } = await supabase
        .from("veiculos_cache" as any)
        .select("*")
        .eq("placa", placaLimpa)
        .maybeSingle();

      if (cached && (cached as any).marca) {
        const c = cached as any;
        preencherVeiculo({ marca: c.marca, modelo: c.modelo, ano: c.ano, cor: c.cor, chassi: c.chassi, combustivel: c.combustivel });
        toast({ title: `✅ Veículo encontrado (cache): ${c.marca} ${c.modelo} ${c.ano}` });
        const clienteEncontrado = await buscarClientePorPlaca(placaLimpa);
        if (clienteEncontrado) {
          setCliente(clienteEncontrado);
          toast({ title: `👤 Cliente vinculado: ${clienteEncontrado.nome_completo || ''}` });
        }
        return;
      }

      // 1) Tentar API externa via Edge Function
      const { data: apiResult, error: apiError } = await supabase.functions.invoke("consultar-placa", {
        body: { placa: placaLimpa },
      });

      if (!apiError && apiResult?.success && apiResult?.veiculo) {
        const v = apiResult.veiculo;
        preencherVeiculo(v);
        toast({ title: `✅ Veículo encontrado (API): ${v.marca} ${v.modelo} ${v.ano}` });

        // Salvar no cache para futuras consultas
        await salvarCacheVeiculo(placaLimpa, v, apiResult.source || "api");

        const clienteEncontrado = await buscarClientePorPlaca(placaLimpa);
        if (clienteEncontrado) {
          setCliente(clienteEncontrado);
          toast({ title: `👤 Cliente vinculado: ${clienteEncontrado.nome_completo || ''}` });
        }
        return;
      }

      // 2) Fallback: buscar em OS anteriores
      const { data: osAnterior } = await supabase
        .from("ordem_servico")
        .select("*")
        .ilike("placa", placaLimpa)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (osAnterior) {
        const osData = {
          marca: osAnterior.veiculo_marca || "",
          modelo: osAnterior.veiculo_modelo || "",
          ano: osAnterior.veiculo_ano || "",
          cor: osAnterior.veiculo_cor || "",
          chassi: osAnterior.veiculo_chassi || "",
        };
        preencherVeiculo(osData);

        // Salvar no cache para futuras consultas
        await salvarCacheVeiculo(placaLimpa, osData, "historico_os");

        const clienteEncontrado = await buscarClientePorPlaca(placaLimpa);
        if (clienteEncontrado) {
          setCliente(clienteEncontrado);
          toast({ title: `👤 Cliente vinculado: ${clienteEncontrado.nome_completo || ''}` });
        } else if (osAnterior.cliente_nome) {
          setCliente({ nome_completo: osAnterior.cliente_nome, telefone: osAnterior.cliente_telefone });
        }
        toast({ title: `✅ Veículo encontrado (histórico): ${osData.marca} ${osData.modelo}` });
      } else {
        setDadosVeiculo(null);
        toast({ title: "Placa não encontrada. Preencha os dados manualmente.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao buscar placa", description: err.message, variant: "destructive" });
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Produtos CRUD
  const adicionarProduto = () => {
    setProdutos((prev) => [
      ...prev,
      { id: Date.now(), produto_id: "", detalhes: "", quantidade: 1, valor_unitario: 0, desconto: 0, subtotal: 0, vendedor: vendedorNome || "", tecnico: tecnicoNome || "" },
    ]);
  };

  const removerProduto = (id: number) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  const atualizarProduto = (id: number, campo: string, valor: any, product?: any) => {
    setProdutos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const atualizado = { ...item, [campo]: valor };
        if (campo === "produto_id" && product) {
          atualizado.valor_unitario = product.preco_custo || 0;
          atualizado._nome = product.nome;
        }
        atualizado.subtotal = atualizado.quantidade * atualizado.valor_unitario - atualizado.desconto;
        return atualizado;
      })
    );
  };

  // Serviços CRUD
  const adicionarServico = () => {
    setServicos((prev) => [
      ...prev,
      { id: Date.now(), servico_id: "", detalhes: "", quantidade: 1, valor_unitario: 0, desconto: 0, subtotal: 0, tecnico: tecnicoNome },
    ]);
  };

  const removerServico = (id: number) => {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  };

  const atualizarServico = (id: number, campo: string, valor: any, service?: ServiceOption) => {
    setServicos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const atualizado = { ...item, [campo]: valor };
        if (campo === "servico_id" && service) {
          atualizado.valor_unitario = service.valor_venda || 0;
          atualizado.detalhes = service.nome;
        }
        atualizado.subtotal = atualizado.quantidade * atualizado.valor_unitario - atualizado.desconto;
        return atualizado;
      })
    );
  };

  // Fotos
  const handleFotosCheckin = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotosCheckin((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removerFoto = (index: number) => {
    setFotosCheckin((prev) => prev.filter((_, i) => i !== index));
  };

  // Salvar OS
  const salvarOS = async () => {
    if (!cliente && !equipamento.equipamento.trim()) {
      toast({ title: "Preencha o equipamento ou selecione um cliente", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: novaOS, error } = await supabase
        .from("ordem_servico")
        .insert({
          numero_os: numeroOS,
          cliente_nome: cliente?.nome_completo || "",
          cliente_telefone: cliente?.telefone || "",
          placa: placa.trim(),
          veiculo_marca: equipamento.marca,
          veiculo_modelo: equipamento.modelo,
          veiculo_ano: equipamento.ano || null,
          veiculo_cor: equipamento.cor || null,
          veiculo_chassi: equipamento.serie,
          km_entrada: parseInt(formData.km_entrada) || 0,
          km_ultima_revisao: parseInt(formData.km_ultima_revisao) || 0,
          nivel_combustivel: formData.nivel_combustivel,
          oleo_recomendado: formData.oleo_recomendado || null,
          ultima_troca_oleo: formData.ultima_troca_oleo || null,
          defeito_relatado: equipamento.defeitos,
          solucao: equipamento.solucao,
          condicoes: equipamento.condicoes,
          acessorios: equipamento.acessorios,
          status: formData.situacao.toLowerCase().replace(/ /g, "_"),
          prioridade: formData.prioridade,
          data_entrada: new Date(`${formData.data_entrada}T${formData.hora_entrada}`).toISOString(),
          data_prevista_conclusao: formData.data_saida
            ? new Date(`${formData.data_saida}T${formData.hora_saida || "18:00"}`).toISOString()
            : null,
          valor_total_pecas: totais.pecas,
          valor_total_servicos: totais.mao_obra,
          valor_frete: totais.frete,
          valor_outros: totais.outros,
          valor_desconto: totais.desconto,
          valor_total: totais.total,
          observacoes,
          observacoes_internas: observacoesInternas,
          checklist_revisao: checkinData?.checklist ? JSON.stringify(checkinData.checklist) : null,
          observacoes_checkin: checkinData?.observacoes_checkin || null,
          empresa_id: empresaId,
          condicoes_pagamento: pagamento.gerar_condicoes ? pagamento.parcelas : [],
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Inserir itens de peças
      const allItens = [
      ...produtos.map((p) => ({
          os_id: (novaOS as any).id,
          tipo: "peca",
          descricao: p._nome || p.detalhes || "Peça",
          detalhes: p.detalhes,
          quantidade: p.quantidade,
          valor_unitario: p.valor_unitario,
          desconto: p.desconto,
          subtotal: p.subtotal,
          tecnico: `${p.vendedor || ""} / ${p.tecnico || ""}`,
          empresa_id: empresaId,
        })),
        ...servicos.map((s) => ({
          os_id: (novaOS as any).id,
          tipo: "servico",
          descricao: s.detalhes || "Serviço",
          detalhes: s.detalhes,
          quantidade: s.quantidade,
          valor_unitario: s.valor_unitario,
          desconto: s.desconto,
          subtotal: s.subtotal,
          tecnico: s.tecnico || "",
          empresa_id: empresaId,
        })),
      ];

      if (allItens.length > 0) {
        const { error: itensError } = await supabase.from("os_itens").insert(allItens as any);
        if (itensError) {
          console.error("Erro ao inserir itens:", itensError);
          toast.error("OS criada, mas houve erro ao salvar peças/serviços: " + itensError.message);
        }
      }

      // Vincular placa ao cliente para futuras consultas
      if (cliente?.id && placa.trim()) {
        const placaUpper = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const placasAtuais: string[] = cliente.placas || [];
        if (!placasAtuais.includes(placaUpper)) {
          await supabase
            .from("clientes")
            .update({ placas: [...placasAtuais, placaUpper] })
            .eq("id", cliente.id);
        }
      }

      toast({ title: `✅ ${numeroOS} criada com sucesso!` });
      const backTo = searchParams.get("from") === "quiosque" ? "/quiosque" : "/os";
      navigate(backTo);
    } catch (error: any) {
      console.error("Erro ao salvar OS:", error);
      toast({ title: "Erro ao salvar OS", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Handler do PlacaLookupScreen
  const handleLookupContinue = async (result: { cliente: any; veiculo: any; placa: string }) => {
    if (result.placa) setPlaca(result.placa);
    if (result.cliente) {
      setCliente(result.cliente);
      // Auto-vincular a placa pesquisada ao cadastro do cliente (se ainda não estiver)
      if (result.cliente.id && result.placa) {
        const placaUpper = result.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const placasAtuais: string[] = result.cliente.placas || [];
        if (!placasAtuais.includes(placaUpper)) {
          const novasPlacas = [...placasAtuais, placaUpper];
          await supabase.from("clientes").update({ placas: novasPlacas }).eq("id", result.cliente.id);
        }
      }
    }
    if (result.veiculo) {
      const v = result.veiculo;
      setDadosVeiculo(v);
      setEquipamento((prev) => ({
        ...prev,
        equipamento: `${v.modelo || ""} ${v.cor || ""} ${result.placa}`.trim(),
        marca: v.marca || "",
        modelo: v.modelo || "",
        serie: v.chassi || "",
        ano: v.ano || "",
        cor: v.cor || "",
      }));
    }
    setStep("checkin");
  };

  const handleCheckinContinue = (data: CheckinData) => {
    setCheckinData(data);
    setFotosCheckin(data.fotos);
    setStep("form");
  };

  if (step === "lookup") {
    return (
      <PlacaLookupScreen
        onContinue={handleLookupContinue}
        onBack={() => navigate(searchParams.get("from") === "quiosque" ? "/quiosque" : "/os")}
        backLabel="Voltar às OS"
      />
    );
  }

  if (step === "checkin") {
    return (
      <CheckinStep
        onContinue={handleCheckinContinue}
        onBack={() => setStep("lookup")}
        clienteNome={cliente?.nome_completo}
        placa={placa}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(searchParams.get("from") === "quiosque" ? "/quiosque" : "/os")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Ordem de Serviço</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-primary font-bold">{numeroOS}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ==================== DADOS GERAIS ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📋 Dados gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Label>Número</Label>
              <Input value={numeroOS} readOnly className="bg-secondary/50 border-border" />
            </div>

            <div className="md:col-span-1">
              <Label>Cliente *</Label>
              <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-secondary/50 border-border font-normal h-10"
                  >
                    {cliente?.nome_completo || cliente?.razao_social || "Selecione o cliente"}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
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
                        <CommandItem
                          value="__novo_cliente__"
                          onSelect={() => {
                            setClienteOpen(false);
                            window.open("/clientes/novo", "_blank");
                          }}
                          className="text-primary font-medium"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          + Adicionar novo cliente
                        </CommandItem>
                        {clienteResults.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setCliente(c);
                              setClienteOpen(false);
                              setClienteSearch("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{c.nome_completo || c.razao_social}</span>
                              {(c.nome_fantasia) && (
                                <span className="text-xs text-foreground/70">{c.nome_fantasia}</span>
                              )}
                              <span className="text-xs text-foreground/80 font-medium">
                                {formatPhone(c.telefone)} {c.cpf ? `• CPF: ${formatCPF(c.cpf)}` : ""}{c.cnpj ? `• CNPJ: ${formatCNPJ(c.cnpj)}` : ""}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {cliente && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-2xl text-foreground font-bold">
                    {formatPhone(cliente.telefone)}
                    {cliente.cpf ? ` • CPF: ${formatCPF(cliente.cpf)}` : ""}
                    {cliente.cnpj ? ` • CNPJ: ${formatCNPJ(cliente.cnpj)}` : ""}
                  </span>
                  {cliente.nome_fantasia && (
                    <span className="text-xs text-foreground/70">• {cliente.nome_fantasia}</span>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => setCliente(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Situação *</Label>
              <select
                value={formData.situacao}
                onChange={(e) => setFormData({ ...formData, situacao: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground"
              >
                <option value="REVISAO">REVISÃO</option>
                <option value="ATENDIMENTO">ATENDIMENTO</option>
                <option value="AGUARDANDO">AGUARDANDO</option>
                <option value="AGUARDANDO PAGAMENTO">AGUARDANDO PAGAMENTO</option>
                <option value="CONCRETIZADA">CONCRETIZADA</option>
                <option value="AGENDAMENTO">AGENDAMENTO</option>
                <option value="CANCELADA">CANCELADA</option>
                <option value="EXPRESSO">EXPRESSO</option>
              </select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <Label>Entrada *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.data_entrada}
                  onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
                <Input
                  type="time"
                  value={formData.hora_entrada}
                  onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                  className="bg-secondary/50 border-border w-32"
                />
              </div>
            </div>

            <div>
              <Label>Saída</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.data_saida}
                  onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
                  className="bg-secondary/50 border-border"
                />
                <Input
                  type="time"
                  value={formData.hora_saida}
                  onChange={(e) => setFormData({ ...formData, hora_saida: e.target.value })}
                  className="bg-secondary/50 border-border w-32"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Canal de venda *</Label>
              <input
                type="text"
                value={formData.canal_venda}
                readOnly
                disabled
                className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== RESPONSÁVEIS ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">👥 Responsáveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Vendedor / Responsável</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={vendedorNome}
                  onChange={(e) => setVendedorNome(e.target.value)}
                  placeholder="Nome do responsável"
                  className="bg-secondary/50 border-border"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setVendedorNome("")} disabled={!vendedorNome}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div>
              <Label>Técnico</Label>
              <div className="flex items-center gap-2">
                <Popover open={tecnicoOpen} onOpenChange={setTecnicoOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      value={tecnicoNome}
                      onChange={(e) => setTecnicoNome(e.target.value)}
                      placeholder="Nome do técnico"
                      className="bg-secondary/50 border-border cursor-pointer"
                      onClick={() => setTecnicoOpen(true)}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar funcionário..." />
                      <CommandList>
                        <CommandEmpty>Nenhum funcionário encontrado</CommandEmpty>
                        <CommandGroup>
                          {funcionariosLista
                            .filter((f) => f.nome.toLowerCase().includes(tecnicoNome.toLowerCase()) || !tecnicoNome)
                            .map((f) => (
                              <CommandItem
                                key={f.id}
                                onSelect={() => {
                                  setTecnicoNome(f.nome);
                                  setTecnicoOpen(false);
                                }}
                              >
                                {f.nome}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="sm" onClick={() => setTecnicoNome("")} disabled={!tecnicoNome}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== EQUIPAMENTOS ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Equipamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PLACA - Campo principal */}
          <div className="p-4 bg-secondary/50 border border-border rounded-lg">
            <Label className="text-base font-bold">🔍 Buscar por Placa</Label>
            <p className="text-xs text-muted-foreground mb-2">Insira a placa para preencher os dados automaticamente</p>
            <div className="flex items-center gap-2">
              <Input
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1234 ou ABC1D23"
                className="bg-secondary/50 border-border text-lg font-mono uppercase tracking-wider max-w-xs"
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && buscarPlaca()}
              />
              <Button
                type="button"
                onClick={buscarPlaca}
                disabled={buscandoPlaca}
                className="bg-primary text-primary-foreground"
              >
                {buscandoPlaca ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
            {dadosVeiculo && (
              <p className="text-sm text-green-500 mt-2">
                ✅ Dados carregados: {dadosVeiculo.veiculo_marca} {dadosVeiculo.veiculo_modelo} - Cliente: {dadosVeiculo.cliente_nome}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Equipamento *</Label>
              <Input
                value={equipamento.equipamento}
                onChange={(e) => setEquipamento({ ...equipamento, equipamento: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="Ex: FAN 125 09 PRETA 6281"
              />
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                value={equipamento.marca}
                onChange={(e) => setEquipamento({ ...equipamento, marca: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input
                value={equipamento.modelo}
                onChange={(e) => setEquipamento({ ...equipamento, modelo: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label>Ano</Label>
              <Input
                value={equipamento.ano}
                onChange={(e) => setEquipamento({ ...equipamento, ano: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="2020"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <Input
                value={equipamento.cor}
                onChange={(e) => setEquipamento({ ...equipamento, cor: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div>
              <Label>Chassi</Label>
              <Input
                value={equipamento.serie}
                onChange={(e) => setEquipamento({ ...equipamento, serie: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="Chassi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Condições</Label>
              <Textarea
                value={equipamento.condicoes}
                onChange={(e) => setEquipamento({ ...equipamento, condicoes: e.target.value })}
                className="bg-secondary/50 border-border min-h-[100px]"
                placeholder="Descreva as condições do equipamento..."
              />
            </div>
            <div>
              <Label>Defeitos</Label>
              <Textarea
                value={equipamento.defeitos}
                onChange={(e) => setEquipamento({ ...equipamento, defeitos: e.target.value })}
                className="bg-secondary/50 border-border min-h-[100px]"
                placeholder="moto sem pegar"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <Label>Acessórios</Label>
               <Textarea
                 value={equipamento.acessorios}
                 onChange={(e) => setEquipamento({ ...equipamento, acessorios: e.target.value })}
                 className="bg-secondary/50 border-border min-h-[100px]"
                 placeholder="Acessórios do veículo..."
               />
            </div>
            <div>
              <Label>Solução</Label>
              <Textarea
                value={equipamento.solucao}
                onChange={(e) => setEquipamento({ ...equipamento, solucao: e.target.value })}
                className="bg-secondary/50 border-border min-h-[100px]"
                placeholder="Descrição da solução aplicada..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>KM Atual *</Label>
              <Input
                type="number"
                value={formData.km_entrada}
                onChange={(e) => setFormData({ ...formData, km_entrada: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="15240"
              />
            </div>
            <div>
              <Label>KM Última Revisão</Label>
              <Input
                type="number"
                value={formData.km_ultima_revisao}
                onChange={(e) => setFormData({ ...formData, km_ultima_revisao: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="14200"
              />
            </div>
            <div>
              <Label>Nível Combustível</Label>
              <select
                value={formData.nivel_combustivel}
                onChange={(e) => setFormData({ ...formData, nivel_combustivel: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground"
              >
                <option value="Vazio">Vazio</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Cheio">Cheio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Óleo Recomendado</Label>
              <Input
                value={formData.oleo_recomendado}
                onChange={(e) => setFormData({ ...formData, oleo_recomendado: e.target.value })}
                className="bg-secondary/50 border-border"
                placeholder="Ex: Motul 3000 10W40"
              />
            </div>
            <div>
              <Label>Última Troca de Óleo</Label>
              <Input
                type="date"
                value={formData.ultima_troca_oleo}
                onChange={(e) => setFormData({ ...formData, ultima_troca_oleo: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== PRODUTOS/PEÇAS ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📦 Produtos/Peças</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm text-muted-foreground w-[25%]">Produto*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[13%]">Detalhes</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Qtd*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Valor*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Desconto</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Subtotal</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Ação</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Vendedor</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Mecânico</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b border-border">
                    <td className="p-2">
                      <ProductCombobox
                        value={produto.produto_id}
                        onChange={(val, prod) => atualizarProduto(produto.id, "produto_id", val, prod)}
                        onAddNew={() => window.open("/estoque/novo", "_blank")}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={produto.detalhes}
                        onChange={(e) => atualizarProduto(produto.id, "detalhes", e.target.value)}
                        placeholder="Det..."
                        className="bg-secondary/50 border-border text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="1"
                        value={produto.quantidade}
                        onChange={(e) => atualizarProduto(produto.id, "quantidade", parseFloat(e.target.value))}
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={produto.valor_unitario}
                        onChange={(val) => atualizarProduto(produto.id, "valor_unitario", parseFloat(val))}
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={produto.desconto}
                        onChange={(val) => atualizarProduto(produto.id, "desconto", parseFloat(val))}
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={produto.subtotal}
                        onChange={() => {}}
                        readOnly
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removerProduto(produto.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                    <td className="p-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Input
                            value={produto.vendedor ? produto.vendedor.split(' ')[0] : ''}
                            onChange={(e) => atualizarProduto(produto.id, "vendedor", e.target.value)}
                            placeholder="Vend."
                            className="bg-secondary/50 border-border text-xs cursor-pointer truncate font-medium text-foreground"
                            onClick={(e) => e.currentTarget.focus()}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[250px]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar..." />
                            <CommandList>
                              <CommandEmpty>Nenhum</CommandEmpty>
                              <CommandGroup>
                                {funcionariosLista.map((f) => (
                                  <CommandItem
                                    key={f.id}
                                    onSelect={() => atualizarProduto(produto.id, "vendedor", f.nome)}
                                  >
                                    {f.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="p-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Input
                            value={produto.tecnico ? produto.tecnico.split(' ')[0] : ''}
                            onChange={(e) => atualizarProduto(produto.id, "tecnico", e.target.value)}
                            placeholder="Téc."
                            className="bg-secondary/50 border-border text-xs cursor-pointer truncate font-medium text-foreground"
                            onClick={(e) => e.currentTarget.focus()}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[250px]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar..." />
                            <CommandList>
                              <CommandEmpty>Nenhum</CommandEmpty>
                              <CommandGroup>
                                {funcionariosLista.map((f) => (
                                  <CommandItem
                                    key={f.id}
                                    onSelect={() => atualizarProduto(produto.id, "tecnico", f.nome)}
                                  >
                                    {f.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" onClick={adicionarProduto} variant="outline" className="mt-4">
            <Plus size={16} className="mr-2" />
            Adicionar produto
          </Button>
        </CardContent>
      </Card>

      {/* ==================== SERVIÇOS/MÃO DE OBRA ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🔧 Serviços/Mão de obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm text-muted-foreground w-[28%]">Serviço*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[15%]">Detalhes</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[7%]">Qtd*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[12%]">Valor*</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Desconto</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Subtotal</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Ação</th>
                  <th className="text-left p-2 text-sm text-muted-foreground w-[10%]">Técnico</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((servico) => (
                  <tr key={servico.id} className="border-b border-border">
                    <td className="p-2">
                      <ServiceCombobox
                        value={servico.servico_id}
                        onChange={(val, svc) => atualizarServico(servico.id, "servico_id", val, svc)}
                        onAddNew={() => window.open("/servicos/novo", "_blank")}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={servico.detalhes}
                        onChange={(e) => atualizarServico(servico.id, "detalhes", e.target.value)}
                        placeholder="Det..."
                        className="bg-secondary/50 border-border text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="1"
                        value={servico.quantidade}
                        onChange={(e) => atualizarServico(servico.id, "quantidade", parseFloat(e.target.value))}
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={servico.valor_unitario}
                        onChange={(val) => atualizarServico(servico.id, "valor_unitario", parseFloat(val))}
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={servico.desconto}
                        onChange={(val) => atualizarServico(servico.id, "desconto", parseFloat(val))}
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <BRLInput
                        value={servico.subtotal}
                        onChange={() => {}}
                        readOnly
                        prefix="R$"
                        className="bg-secondary/50 border-border text-sm font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removerServico(servico.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                    <td className="p-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Input
                            value={servico.tecnico ? servico.tecnico.split(' ')[0] : ''}
                            onChange={(e) => atualizarServico(servico.id, "tecnico", e.target.value)}
                            placeholder="Téc."
                            className="bg-secondary/50 border-border text-xs cursor-pointer truncate"
                            onClick={(e) => e.currentTarget.focus()}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[250px]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar..." />
                            <CommandList>
                              <CommandEmpty>Nenhum</CommandEmpty>
                              <CommandGroup>
                                {funcionariosLista.map((f) => (
                                  <CommandItem
                                    key={f.id}
                                    onSelect={() => atualizarServico(servico.id, "tecnico", f.nome)}
                                  >
                                    {f.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" onClick={adicionarServico} variant="outline" className="mt-4">
            <Plus size={16} className="mr-2" />
            Adicionar serviço
          </Button>
        </CardContent>
      </Card>

      {/* ==================== ENDEREÇO DE ENTREGA ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📍 Endereço de entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Informar endereço de entrega</span>
          </label>
        </CardContent>
      </Card>

      {/* ==================== TOTAL ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">💰 Total</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Exibir valor total na impressão</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <Label>Mão de obra</Label>
              <BRLInput value={totais.mao_obra} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border font-semibold text-right" />
            </div>
            <div>
              <Label>Peças</Label>
              <BRLInput value={totais.pecas} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border font-semibold text-right" />
            </div>
            <div>
              <Label>Frete</Label>
              <BRLInput
                value={totais.frete}
                onChange={(val) => setTotais({ ...totais, frete: parseFloat(val) || 0 })}
                prefix="R$"
                className="bg-secondary/50 border-border text-right"
              />
            </div>
            <div>
              <Label>Outros</Label>
              <BRLInput
                value={totais.outros}
                onChange={(val) => setTotais({ ...totais, outros: parseFloat(val) || 0 })}
                prefix="R$"
                className="bg-secondary/50 border-border text-right"
              />
            </div>
            <div>
              <Label>Desconto</Label>
              <BRLInput
                value={totais.desconto}
                onChange={(val) => setTotais({ ...totais, desconto: parseFloat(val) || 0 })}
                prefix="R$"
                className="bg-secondary/50 border-border text-right"
              />
            </div>
            <div>
              <Label>Valor total</Label>
              <BRLInput
                value={totais.total}
                onChange={() => {}}
                readOnly
                prefix="R$"
                className="bg-primary border-primary font-bold text-right text-primary-foreground text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== PAGAMENTO ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">💳 Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pagamento.gerar_condicoes}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked && pagamento.parcelas.length === 0) {
                  setPagamento({
                    ...pagamento,
                    gerar_condicoes: true,
                    parcelas: [{
                      vencimento: new Date().toISOString().split("T")[0],
                      valor: totais.total,
                      forma_pagamento: "",
                      plano_contas: "Prestações de serviços",
                      observacao: "",
                    }],
                  });
                } else {
                  setPagamento({ ...pagamento, gerar_condicoes: checked });
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm">Gerar condições de pagamento</span>
          </label>

          {pagamento.gerar_condicoes && (
            <>
              <div className="flex flex-col gap-4 border p-4 rounded-lg bg-accent/10">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_pagamento"
                      value="a_vista"
                      checked={pagamento.tipo === "a_vista"}
                      onChange={(e) => setPagamento({ ...pagamento, tipo: e.target.value, qtd_parcelas: "1" })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">À vista *</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_pagamento"
                      value="parcelado"
                      checked={pagamento.tipo === "parcelado"}
                      onChange={(e) => setPagamento({ ...pagamento, tipo: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Parcelado *</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Forma de pagamento</Label>
                    <Select
                      value={pagamento.forma_pagamento}
                      onValueChange={(val) => {
                        const fp = formasPagamentoDB.find((f: any) => f.nome === val);
                        if (fp) {
                          const diasPrimeira = fp.primeira_parcela_dias || 0;
                          const dt1 = new Date();
                          dt1.setDate(dt1.getDate() + diasPrimeira);
                          const data1Formated = dt1.toISOString().split("T")[0];
                          const maxParc = fp.max_parcelas || 1;

                          setPagamento({
                            ...pagamento,
                            forma_pagamento: val,
                            intervalo: fp.intervalo_parcelas_dias || 30,
                            qtd_parcelas: String(maxParc),
                            data_primeira: data1Formated,
                            tipo: maxParc > 1 ? "parcelado" : "a_vista",
                          });
                        } else {
                          setPagamento({ ...pagamento, forma_pagamento: val });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-xs h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        {formasPagamentoDB.map((f) => (
                          <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {pagamento.tipo === "parcelado" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Intervalo parcelas (dias)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pagamento.intervalo}
                          onChange={(e) => setPagamento({ ...pagamento, intervalo: parseInt(e.target.value) || 30 })}
                          className="bg-background border-border text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd. parcelas *</Label>
                        <Select
                          value={pagamento.qtd_parcelas}
                          onValueChange={(val) => setPagamento({ ...pagamento, qtd_parcelas: val })}
                        >
                          <SelectTrigger className="bg-background border-border text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border z-50">
                            {(() => {
                              const fp = formasPagamentoDB.find((f: any) => f.nome === pagamento.forma_pagamento);
                              const maxParc = fp ? (fp.max_parcelas || 1) : 12;
                              const opcoes = [];
                              for (let n = 1; n <= maxParc; n++) {
                                opcoes.push(n);
                              }
                              const listaOpcoes = opcoes.length > 0 ? opcoes : [1];
                              return listaOpcoes.map((n) => (
                                <SelectItem key={n} value={String(n)}>{n} vezes</SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-1 col-span-1">
                    <Label className="text-xs">Data 1ª parcela *</Label>
                    <Input
                      type="date"
                      value={pagamento.data_primeira}
                      onChange={(e) => setPagamento({ ...pagamento, data_primeira: e.target.value })}
                      className="bg-background border-border text-xs h-9"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={gerarParcelasLote}
                    variant="outline"
                    className="bg-foreground text-background hover:bg-foreground/90 h-9 font-semibold text-xs gap-1.5"
                  >
                    🔄 Gerar
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-sm text-muted-foreground">Vencimento*</th>
                      <th className="text-left p-2 text-sm text-muted-foreground">Valor*</th>
                      <th className="text-left p-2 text-sm text-muted-foreground">Forma de pagamento *</th>
                      <th className="text-left p-2 text-sm text-muted-foreground">Plano de contas</th>
                      <th className="text-left p-2 text-sm text-muted-foreground">Observação</th>
                      <th className="text-left p-2 text-sm text-muted-foreground w-20">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamento.parcelas.map((parcela, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="p-2">
                          <Input
                            type="date"
                            value={parcela.vencimento}
                            onChange={(e) => {
                              const novasParcelas = [...pagamento.parcelas];
                              novasParcelas[index].vencimento = e.target.value;
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                            className="bg-secondary/50 border-border text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <BRLInput
                            value={parcela.valor}
                            onChange={(val) => {
                              const novasParcelas = [...pagamento.parcelas];
                              novasParcelas[index].valor = parseFloat(val);
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                            prefix="R$"
                            className="bg-secondary/50 border-border text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={parcela.forma_pagamento}
                            onValueChange={(val) => {
                              const novasParcelas = [...pagamento.parcelas];
                              novasParcelas[index].forma_pagamento = val;
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                          >
                            <SelectTrigger className="bg-secondary/50 border-border text-sm">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              {formasPagamentoDB.map((f) => (
                                <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Select
                            value={parcela.plano_contas}
                            onValueChange={(val) => {
                              const novasParcelas = [...pagamento.parcelas];
                              novasParcelas[index].plano_contas = val;
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                          >
                            <SelectTrigger className="bg-secondary/50 border-border text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              <SelectItem value="Prestações de serviços">Prestações de serviços</SelectItem>
                              <SelectItem value="Vendas">Vendas</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            value={parcela.observacao}
                            onChange={(e) => {
                              const novasParcelas = [...pagamento.parcelas];
                              novasParcelas[index].observacao = e.target.value;
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                            placeholder="Obs..."
                            className="bg-secondary/50 border-border text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const novasParcelas = pagamento.parcelas.filter((_, i) => i !== index);
                              setPagamento({ ...pagamento, parcelas: novasParcelas });
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(() => {
                const somaParcelas = pagamento.parcelas.reduce((s, p) => s + (p.valor || 0), 0);
                const diferenca = Math.abs(somaParcelas - totais.total);
                const hasDiferenca = diferenca > 0.01;
                return (
                  <div className="flex justify-between items-center bg-secondary/35 p-3 rounded-lg border border-border mt-3 text-xs select-none">
                    <div className="flex gap-2">
                      <span className="font-semibold">Soma das Parcelas:</span>
                      <span className="font-mono text-primary font-bold">R$ {somaParcelas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-semibold">Total OS:</span>
                      <span className="font-mono font-bold">R$ {totais.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {hasDiferenca && (
                      <span className="text-destructive font-bold animate-pulse flex items-center gap-1">
                        ⚠️ Diferença: R$ {diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                );
              })()}

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setPagamento({
                    ...pagamento,
                    parcelas: [...pagamento.parcelas, {
                      vencimento: new Date().toISOString().split("T")[0],
                      valor: 0,
                      forma_pagamento: "",
                      plano_contas: "Prestações de serviços",
                      observacao: "",
                    }],
                  });
                }}
              >
                <Plus size={16} className="mr-2" />
                Adicionar parcela
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ==================== ANEXOS ==================== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📎 Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-accent/20 border border-accent/30 rounded-lg mb-4">
            <p className="text-sm text-accent-foreground">
              Utilize este espaço para anexar comprovantes e documentos. Tamanho máximo 5Mb.
            </p>
          </div>

          <input type="file" multiple accept="image/*,.pdf" onChange={handleFotosCheckin} className="hidden" id="upload-anexos" />
          <label htmlFor="upload-anexos">
            <Button type="button" asChild variant="outline">
              <span>
                <Upload size={16} className="mr-2" />
                Selecionar arquivo
              </span>
            </Button>
          </label>

          {fotosCheckin.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
              {fotosCheckin.map((foto, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                    <img src={URL.createObjectURL(foto)} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removerFoto(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== BOTÃO CHECKLIST ==================== */}
      {checkinData?.checklist && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <CheckCircle2 size={18} />
              Check do Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench size={18} className="text-primary" />
                Check do Veículo
              </DialogTitle>
              {(placa || cliente?.nome_completo) && (
                <p className="text-sm text-muted-foreground">
                  {placa && <span className="font-semibold">{placa}</span>}
                  {placa && cliente?.nome_completo && " • "}
                  {cliente?.nome_completo}
                </p>
              )}
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {checkinData.checklist.map((cat) => {
                const preenchidos = cat.itens.filter((i) => i.estado !== "");
                if (preenchidos.length === 0) return null;
                return (
                  <div key={cat.categoria} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5">
                      <span className="text-xs font-bold tracking-wide">{cat.categoria}</span>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {preenchidos.map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span>{item.label}</span>
                          {item.estado === "bom" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Bom
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" /> Substituir
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {checkinData.checklist.every((cat) => cat.itens.every((i) => i.estado === "")) && (
                <p className="text-center text-muted-foreground text-sm py-6">Nenhum item foi preenchido.</p>
              )}
              {checkinData.observacoes_checkin && (
                <div className="border rounded-lg p-3">
                  <span className="text-xs font-bold tracking-wide">OBSERVAÇÕES DO CHECK-IN</span>
                  <p className="text-sm mt-1 text-muted-foreground">{checkinData.observacoes_checkin}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================== OBSERVAÇÕES ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📝 Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Esta observação será impressa no pedido</p>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="bg-secondary/50 border-border min-h-[150px]"
              placeholder="Observações para o cliente..."
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🔒 Observações internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Esta observação é de uso interno, portanto não será impressa no pedido.</p>
            <Textarea
              value={observacoesInternas}
              onChange={(e) => setObservacoesInternas(e.target.value)}
              className="bg-secondary/50 border-border min-h-[150px]"
              placeholder="Observações internas (não será impressa)..."
            />
          </CardContent>
        </Card>
      </div>

      {/* ==================== BOTÕES FINAIS ==================== */}
      <div className="flex items-center justify-between sticky bottom-0 bg-background p-4 border-t border-border rounded-lg">
        <Button type="button" variant="outline" onClick={() => navigate(searchParams.get("from") === "quiosque" ? "/quiosque" : "/os")} className="border-destructive text-destructive hover:bg-destructive/10">
          <X size={20} className="mr-2" />
          Cancelar
        </Button>

        <Button onClick={salvarOS} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-8">
          {saving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <CheckCircle size={20} className="mr-2" />}
          Salvar OS
        </Button>
      </div>
    </div>
  );
}
