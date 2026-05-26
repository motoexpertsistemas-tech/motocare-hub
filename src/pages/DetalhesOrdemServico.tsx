import { useState, useEffect, useRef } from "react";
import { AjudanteOnline } from "@/components/AjudanteOnline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BRLInput } from "@/components/BRLInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, User, Car, Wrench, Package, DollarSign, Save,
  Phone, MessageCircle, Clock, Edit2, CheckCircle, CreditCard,
  Home, ChevronRight, Camera, Smartphone, Sparkles, Scan, CheckCircle2, Award, Zap,
  Plus, Trash2, Gauge, Droplets, Fuel, ChevronDown, ChevronUp, Search, Loader2, X, Upload, UserPlus,
  AlertTriangle, Eye, Printer,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ProductCombobox } from "@/components/ProductCombobox";
import { ServiceCombobox, type ServiceOption } from "@/components/ServiceCombobox";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { type ChecklistCategory, type ChecklistItem, CHECKLIST_INICIAL } from "@/components/CheckinStep";
import { printChecklist } from "@/lib/printChecklist";
import { useEmpresa } from "@/contexts/EmpresaContext";

interface OSData {
  id: string;
  numero_os: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  placa: string | null;
  veiculo_marca: string | null;
  veiculo_modelo: string | null;
  veiculo_ano: string | null;
  veiculo_cor: string | null;
  veiculo_chassi: string | null;
  km_entrada: number | null;
  km_ultima_revisao: number | null;
  nivel_combustivel: string | null;
  oleo_recomendado: string | null;
  ultima_troca_oleo: string | null;
  defeito_relatado: string | null;
  criado_por: string | null;
  status: string;
  prioridade: string;
  data_entrada: string;
  data_prevista_conclusao: string | null;
  data_conclusao: string | null;
  valor_total_pecas: number | null;
  valor_total_servicos: number | null;
  valor_frete: number | null;
  valor_desconto: number | null;
  valor_outros: number | null;
  valor_total: number | null;
  observacoes: string | null;
  observacoes_internas: string | null;
  created_at: string;
  condicoes: string | null;
  acessorios: string | null;
  solucao: string | null;
  canal_venda: string | null;
  centro_custo: string | null;
  vendedor: string | null;
  tecnico_responsavel: string | null;
}

interface OSItem {
  id: string;
  tipo: string;
  codigo: string | null;
  descricao: string;
  detalhes: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
  subtotal: number;
  status: string;
  tecnico: string | null;
}

const statusLabels: Record<string, string> = {
  atendimento: "Atendimento",
  em_execucao: "Em Execução",
  aguardando: "Aguardando Peças",
  aguardando_pecas: "Aguardando Peças",
  aguardando_pagamento: "Aguardando Pagamento",
  pronta: "Pronta",
  entregue: "Entregue",
  concretizada: "Concretizada",
  cancelada: "Cancelada",
  agendada: "Agendada",
  agendamento: "Agendamento",
  AGENDAMENTO: "Agendamento",
  revisao: "Revisão",
  expresso: "Expresso",
};

const statusStyles: Record<string, string> = {
  atendimento: "bg-info/15 text-info border-info/30",
  em_execucao: "bg-red-500/15 text-red-600 border-red-500/30",
  aguardando: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  aguardando_pecas: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  aguardando_pagamento: "bg-warning/15 text-warning border-warning/30",
  pronta: "bg-green-500/15 text-green-600 border-green-500/30",
  entregue: "bg-muted text-muted-foreground border-border",
  concretizada: "bg-success/15 text-success border-success/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
  agendada: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  agendamento: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  AGENDAMENTO: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  revisao: "bg-info/15 text-info border-info/30",
  expresso: "bg-primary/15 text-primary border-primary/30",
};

function fmt(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============== EDIT MODE ITEM INTERFACE ==============
interface EditProdutoItem {
  id: number;
  db_id?: string; // existing DB id
  produto_id: string;
  detalhes: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
  _nome?: string;
  tecnico: string;
  status: string;
}

interface EditServicoItem {
  id: number;
  db_id?: string;
  servico_id: string;
  detalhes: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  subtotal: number;
  tecnico: string;
  status: string;
}

export default function DetalhesOrdemServico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { empresaId } = useEmpresa();

  const [os, setOs] = useState<OSData | null>(null);
  const [itens, setItens] = useState<OSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(false);
  const [saving, setSaving] = useState(false);

  // ========== VIEW MODE STATES ==========
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [showVeiculoDados, setShowVeiculoDados] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ========== EDIT MODE STATES ==========
  const [editStatus, setEditStatus] = useState("");
  const [editPrioridade, setEditPrioridade] = useState("normal");
  const [editDataEntrada, setEditDataEntrada] = useState("");
  const [editHoraEntrada, setEditHoraEntrada] = useState("");
  const [editDataSaida, setEditDataSaida] = useState("");
  const [editHoraSaida, setEditHoraSaida] = useState("");
  const [editCanalVenda, setEditCanalVenda] = useState("VENDA ORDEM DE SERVIÇO");
  const [editCentroCusto, setEditCentroCusto] = useState("");
  const [editVendedor, setEditVendedor] = useState("");
  const [editTecnico, setEditTecnico] = useState("");
  const [editPlaca, setEditPlaca] = useState("");
  const [editEquipamento, setEditEquipamento] = useState({ equipamento: "", marca: "", modelo: "", ano: "", cor: "", serie: "", condicoes: "", defeitos: "", acessorios: "", solucao: "" });
  const [editKmEntrada, setEditKmEntrada] = useState("");
  const [editKmUltimaRevisao, setEditKmUltimaRevisao] = useState("");
  const [editNivelCombustivel, setEditNivelCombustivel] = useState("1/2");
  const [editOleoRecomendado, setEditOleoRecomendado] = useState("");
  const [editUltimaTrocaOleo, setEditUltimaTrocaOleo] = useState("");
  const [editFrete, setEditFrete] = useState("");
  const [editDesconto, setEditDesconto] = useState("");
  const [editOutros, setEditOutros] = useState("");
  const [editObs, setEditObs] = useState("");
  const [editObsInternas, setEditObsInternas] = useState("");

  // Edit mode: inline products/services
  const [editProdutos, setEditProdutos] = useState<EditProdutoItem[]>([]);
  const [editServicos, setEditServicos] = useState<EditServicoItem[]>([]);

  // Checklist do veículo
  const [editChecklist, setEditChecklist] = useState<ChecklistCategory[] | null>(null);
  const [editObsCheckin, setEditObsCheckin] = useState("");
  const [checkVeiculoOpen, setCheckVeiculoOpen] = useState(false);

  // Cliente edit
  const [editCliente, setEditCliente] = useState<any>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteResults, setClienteResults] = useState<any[]>([]);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Funcionarios
  const [funcionarios, setFuncionarios] = useState<{ id: string; nome: string }[]>([]);
  const [tecnicoOpen, setTecnicoOpen] = useState(false);

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

  // Buscar clientes
  useEffect(() => {
    if (!editingPayment || !clienteSearch || clienteSearch.length < 2) {
      setClienteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoCliente(true);
      try {
        const terms = clienteSearch.toUpperCase().split(/\s+/).filter(Boolean);
        let query = supabase.from("clientes").select("id, nome_completo, nome_fantasia, razao_social, telefone, cpf, cnpj, tipo_pessoa, placas").limit(20);
        for (const term of terms) {
          query = query.or(`nome_completo.ilike.%${term}%,nome_fantasia.ilike.%${term}%,razao_social.ilike.%${term}%,telefone.ilike.%${term}%,cpf.ilike.%${term}%,cnpj.ilike.%${term}%`);
        }
        const { data } = await query;
        setClienteResults(data || []);
      } catch (e) { console.error(e); }
      finally { setBuscandoCliente(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [clienteSearch, editingPayment]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      toast.error("Não foi possível acessar a câmera.");
    }
  };
  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };
  useEffect(() => { if (!showDiagnostico) stopCamera(); }, [showDiagnostico]);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (id) loadOS();
    supabase.from("funcionarios").select("id, nome").eq("situacao", "Ativo").order("nome").then(({ data }) => {
      if (data) setFuncionarios(data as any);
    });
  }, [id]);

  // Auto-enter edit mode if ?editar=true
  useEffect(() => {
    if (os && !loading && searchParams.get("editar") === "true" && !editingPayment) {
      enterEditMode();
    }
  }, [os, loading, searchParams]);

  const loadOS = async () => {
    setLoading(true);
    try {
      const { data: osData, error: osError } = await supabase.from("ordem_servico").select("*").eq("id", id).maybeSingle();
      if (osError) throw osError;
      if (!osData) { toast.error("OS não encontrada"); navigate("/os"); return; }
      const osTyped = osData as unknown as OSData;
      setOs(osTyped);

      const { data: itensData, error: itensError } = await supabase.from("os_itens").select("*").eq("os_id", id).order("created_at");
      if (itensError) throw itensError;
      setItens((itensData || []) as unknown as OSItem[]);
    } catch (err: any) {
      toast.error("Erro ao carregar OS: " + err.message);
    } finally { setLoading(false); }
  };

  // Populate edit fields from OS data
  const enterEditMode = () => {
    if (!os) return;
    setEditStatus(os.status);
    setEditPrioridade(os.prioridade || "normal");
    const de = os.data_entrada ? new Date(os.data_entrada) : new Date();
    setEditDataEntrada(de.toISOString().split("T")[0]);
    setEditHoraEntrada(de.toTimeString().slice(0, 5));
    if (os.data_prevista_conclusao) {
      const ds = new Date(os.data_prevista_conclusao);
      setEditDataSaida(ds.toISOString().split("T")[0]);
      setEditHoraSaida(ds.toTimeString().slice(0, 5));
    } else { setEditDataSaida(""); setEditHoraSaida(""); }
    setEditCanalVenda((os as any).canal_venda || "VENDA ORDEM DE SERVIÇO");
    setEditCentroCusto((os as any).centro_custo || "");
    // Auto-fill vendedor: use saved value, or fall back to logged-in user
    const savedVendedor = (os as any).vendedor || "";
    if (savedVendedor) {
      setEditVendedor(savedVendedor);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const nome = user.user_metadata?.nome || user.user_metadata?.full_name || user.email || "";
          setEditVendedor(nome);
        }
      });
    }
    setEditTecnico((os as any).tecnico_responsavel || "");
    setEditPlaca(os.placa || "");
    setEditEquipamento({
      equipamento: [os.veiculo_marca, os.veiculo_modelo, os.veiculo_cor, os.placa].filter(Boolean).join(" "),
      marca: os.veiculo_marca || "",
      modelo: os.veiculo_modelo || "",
      ano: os.veiculo_ano || "",
      cor: os.veiculo_cor || "",
      serie: os.veiculo_chassi || "",
      condicoes: (os as any).condicoes || "",
      defeitos: os.defeito_relatado || "",
      acessorios: (os as any).acessorios || "",
      solucao: (os as any).solucao || "",
    });
    setEditKmEntrada(String(os.km_entrada || ""));
    setEditKmUltimaRevisao(String(os.km_ultima_revisao || ""));
    setEditNivelCombustivel(os.nivel_combustivel || "1/2");
    setEditOleoRecomendado(os.oleo_recomendado || "");
    setEditUltimaTrocaOleo(os.ultima_troca_oleo || "");
    setEditFrete(String(os.valor_frete || 0));
    setEditDesconto(String(os.valor_desconto || 0));
    setEditOutros(String(os.valor_outros || 0));
    setEditObs(os.observacoes || "");
    setEditObsInternas(os.observacoes_internas || "");
    // Load checklist
    try {
      const cl = (os as any).checklist_revisao;
      if (cl) setEditChecklist(JSON.parse(cl));
      else setEditChecklist(JSON.parse(JSON.stringify(CHECKLIST_INICIAL)));
    } catch { setEditChecklist(JSON.parse(JSON.stringify(CHECKLIST_INICIAL))); }
    setEditObsCheckin((os as any).observacoes_checkin || "");
    setEditCliente(os.cliente_nome ? { nome_completo: os.cliente_nome, telefone: os.cliente_telefone } : null);

    // Build edit products/services from existing items
    const pecas = itens.filter(i => i.tipo === "peca");
    const servs = itens.filter(i => i.tipo === "servico");
    setEditProdutos(pecas.map((p, idx) => ({
      id: Date.now() + idx,
      db_id: p.id,
      produto_id: "",
      detalhes: p.detalhes || "",
      quantidade: p.quantidade,
      valor_unitario: p.valor_unitario,
      desconto: p.desconto || 0,
      subtotal: p.subtotal,
      _nome: p.descricao,
      tecnico: p.tecnico || "",
      status: p.status || "pendente",
    })));
    setEditServicos(servs.map((s, idx) => ({
      id: Date.now() + 1000 + idx,
      db_id: s.id,
      servico_id: "",
      detalhes: s.descricao,
      quantidade: s.quantidade,
      valor_unitario: s.valor_unitario,
      desconto: s.desconto || 0,
      subtotal: s.subtotal,
      tecnico: s.tecnico || "",
      status: s.status || "pendente",
    })));

    setEditingPayment(true);
  };

  // Edit mode: product CRUD
  const adicionarEditProduto = () => {
    setEditProdutos(prev => [...prev, { id: Date.now(), produto_id: "", detalhes: "", quantidade: 1, valor_unitario: 0, desconto: 0, subtotal: 0, tecnico: editTecnico, status: "pendente" }]);
  };
  const removerEditProduto = (id: number) => setEditProdutos(prev => prev.filter(p => p.id !== id));
  const atualizarEditProduto = (id: number, campo: string, valor: any, product?: any) => {
    setEditProdutos(prev => prev.map(item => {
      if (item.id !== id) return item;
      const atualizado = { ...item, [campo]: valor };
      if (campo === "produto_id" && product) {
        atualizado.valor_unitario = product.preco_custo || 0;
        atualizado._nome = product.nome;
      }
      atualizado.subtotal = atualizado.quantidade * atualizado.valor_unitario - atualizado.desconto;
      return atualizado;
    }));
  };

  // Edit mode: service CRUD
  const adicionarEditServico = () => {
    setEditServicos(prev => [...prev, { id: Date.now(), servico_id: "", detalhes: "", quantidade: 1, valor_unitario: 0, desconto: 0, subtotal: 0, tecnico: editTecnico, status: "pendente" }]);
  };
  const removerEditServico = (id: number) => setEditServicos(prev => prev.filter(s => s.id !== id));
  const atualizarEditServico = (id: number, campo: string, valor: any, service?: ServiceOption) => {
    setEditServicos(prev => prev.map(item => {
      if (item.id !== id) return item;
      const atualizado = { ...item, [campo]: valor };
      if (campo === "servico_id" && service) {
        atualizado.valor_unitario = service.valor_venda || 0;
        atualizado.detalhes = service.nome;
      }
      atualizado.subtotal = atualizado.quantidade * atualizado.valor_unitario - atualizado.desconto;
      return atualizado;
    }));
  };

  // Computed totals for edit mode
  const editTotalPecas = editProdutos.reduce((s, p) => s + p.subtotal, 0);
  const editTotalServicos = editServicos.reduce((s, s2) => s + s2.subtotal, 0);
  const editTotalGeral = editTotalPecas + editTotalServicos + (Number(editFrete) || 0) + (Number(editOutros) || 0) - (Number(editDesconto) || 0);

  // View mode computations
  const pecas = itens.filter((i) => i.tipo === "peca");
  const servicos = itens.filter((i) => i.tipo === "servico");
  const totalPecasCalc = pecas.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalServicosCalc = servicos.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalItens = itens.length;
  const itensConcluidos = itens.filter((i) => i.status === "concluido").length;
  const progressPercent = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

  const toggleItemStatus = async (item: OSItem) => {
    const newStatus = item.status === "concluido" ? "pendente" : "concluido";
    try {
      const { error } = await supabase.from("os_itens").update({ status: newStatus } as any).eq("id", item.id);
      if (error) throw error;
      setItens(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  // SAVE EDIT
  const salvarEdicao = async () => {
    if (!os) return;
    setSaving(true);
    try {
      const frete = Number(editFrete) || 0;
      const desconto = Number(editDesconto) || 0;
      const outros = Number(editOutros) || 0;

      const { error } = await supabase.from("ordem_servico").update({
        status: editStatus,
        prioridade: editPrioridade,
        data_entrada: new Date(`${editDataEntrada}T${editHoraEntrada}`).toISOString(),
        data_prevista_conclusao: editDataSaida ? new Date(`${editDataSaida}T${editHoraSaida || "18:00"}`).toISOString() : null,
        canal_venda: editCanalVenda,
        centro_custo: editCentroCusto || null,
        vendedor: editVendedor || null,
        tecnico_responsavel: editTecnico || null,
        cliente_nome: editCliente?.nome_completo || "",
        cliente_telefone: editCliente?.telefone || "",
        placa: editPlaca.trim(),
        veiculo_marca: editEquipamento.marca,
        veiculo_modelo: editEquipamento.modelo,
        veiculo_ano: editEquipamento.ano || null,
        veiculo_cor: editEquipamento.cor || null,
        veiculo_chassi: editEquipamento.serie || null,
        km_entrada: parseInt(editKmEntrada) || 0,
        km_ultima_revisao: parseInt(editKmUltimaRevisao) || 0,
        nivel_combustivel: editNivelCombustivel,
        oleo_recomendado: editOleoRecomendado || null,
        ultima_troca_oleo: editUltimaTrocaOleo || null,
        defeito_relatado: editEquipamento.defeitos || null,
        condicoes: editEquipamento.condicoes || null,
        acessorios: editEquipamento.acessorios || null,
        solucao: editEquipamento.solucao || null,
        valor_frete: frete,
        valor_desconto: desconto,
        valor_outros: outros,
        valor_total_pecas: editTotalPecas,
        valor_total_servicos: editTotalServicos,
        valor_total: editTotalGeral,
        observacoes: editObs || null,
        observacoes_internas: editObsInternas || null,
        checklist_revisao: editChecklist ? JSON.stringify(editChecklist) : null,
        observacoes_checkin: editObsCheckin || null,
      } as any).eq("id", os.id);

      if (error) throw error;

      // Delete all existing items and re-insert
      const { error: deleteError } = await supabase.from("os_itens").delete().eq("os_id", os.id);
      if (deleteError) {
        console.error("Erro ao deletar itens antigos:", deleteError);
      }

      const allItens = [
        ...editProdutos.filter(p => p._nome || p.produto_id || p.detalhes).map(p => ({
          os_id: os.id,
          tipo: "peca",
          descricao: p._nome || p.detalhes || "Peça",
          detalhes: p.detalhes,
          quantidade: p.quantidade,
          valor_unitario: p.valor_unitario,
          desconto: p.desconto,
          subtotal: p.subtotal,
          tecnico: p.tecnico || "",
          status: p.status || "pendente",
          empresa_id: empresaId,
        })),
        ...editServicos.filter(s => s.detalhes || s.servico_id).map(s => ({
          os_id: os.id,
          tipo: "servico",
          descricao: s.detalhes || "Serviço",
          detalhes: s.detalhes,
          quantidade: s.quantidade,
          valor_unitario: s.valor_unitario,
          desconto: s.desconto,
          subtotal: s.subtotal,
          tecnico: s.tecnico || "",
          status: s.status || "pendente",
          empresa_id: empresaId,
        })),
      ];

      if (allItens.length > 0) {
        const { error: insertError } = await supabase.from("os_itens").insert(allItens as any);
        if (insertError) {
          console.error("Erro ao inserir itens:", insertError);
          toast.error("Erro ao salvar peças/serviços: " + insertError.message);
        }
      }

      toast.success("OS atualizada com sucesso!");
      const backTo = searchParams.get("from") === "quiosque" ? "/quiosque" : "/os";
      navigate(backTo);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;
  }
  if (!os) return null;

  // ==================== EDIT MODE - Same layout as NovaOrdemServico ====================
  if (editingPayment) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setEditingPayment(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Editar Ordem de Serviço</h1>
                <Badge variant="outline" className={`${statusStyles[editStatus] || "bg-muted text-muted-foreground"} text-xs uppercase font-bold tracking-wider`}>
                  {statusLabels[editStatus] || editStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-primary font-bold">{os.numero_os}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ==================== DADOS GERAIS ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">📋 Dados gerais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Label>Número</Label>
                <Input value={os.numero_os} readOnly className="bg-secondary/50 border-border" />
              </div>
              <div className="md:col-span-1">
                <Label>Cliente *</Label>
                <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-secondary/50 border-border font-normal h-10">
                      {editCliente?.nome_completo || editCliente?.razao_social || "Selecione o cliente"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Buscar por nome, telefone, CPF/CNPJ..." value={clienteSearch} onValueChange={setClienteSearch} />
                      <CommandList>
                        {buscandoCliente && <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                        {!buscandoCliente && clienteSearch.length >= 2 && clienteResults.length === 0 && <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>}
                        {!buscandoCliente && clienteSearch.length < 2 && <CommandEmpty>Digite pelo menos 2 caracteres</CommandEmpty>}
                        <CommandGroup>
                          <CommandItem value="__novo_cliente__" onSelect={() => { setClienteOpen(false); window.open("/clientes/novo", "_blank"); }} className="text-primary font-medium">
                            <UserPlus className="h-4 w-4 mr-2" /> + Adicionar novo cliente
                          </CommandItem>
                          {clienteResults.map((c) => (
                            <CommandItem key={c.id} value={c.id} onSelect={() => { setEditCliente(c); setClienteOpen(false); setClienteSearch(""); }}>
                              <div className="flex flex-col">
                                <span className="font-medium">{c.nome_completo || c.razao_social}</span>
                                <span className="text-xs text-foreground/80 font-medium">{formatPhone(c.telefone)}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {editCliente && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-foreground/80">{formatPhone(editCliente.telefone || "")}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => setEditCliente(null)}><X className="h-3 w-3" /></Button>
                  </div>
                )}
              </div>
              <div>
                <Label>Situação *</Label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground">
                  <option value="revisao">REVISÃO</option>
                  <option value="atendimento">ATENDIMENTO</option>
                  <option value="em_execucao">EM EXECUÇÃO</option>
                  <option value="aguardando">AGUARDANDO PEÇAS</option>
                  <option value="aguardando_pagamento">AGUARDANDO PAGAMENTO</option>
                  <option value="concretizada">CONCRETIZADA</option>
                  <option value="agendamento">AGENDAMENTO</option>
                  <option value="pronta">PRONTA</option>
                  <option value="entregue">ENTREGUE</option>
                  <option value="cancelada">CANCELADA</option>
                  <option value="expresso">EXPRESSO</option>
                </select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <select value={editPrioridade} onChange={(e) => setEditPrioridade(e.target.value)} className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <Label>Entrada *</Label>
                <div className="flex gap-2">
                  <Input type="date" value={editDataEntrada} onChange={(e) => setEditDataEntrada(e.target.value)} className="bg-secondary/50 border-border" />
                  <Input type="time" value={editHoraEntrada} onChange={(e) => setEditHoraEntrada(e.target.value)} className="bg-secondary/50 border-border w-32" />
                </div>
              </div>
              <div>
                <Label>Saída</Label>
                <div className="flex gap-2">
                  <Input type="date" value={editDataSaida} onChange={(e) => setEditDataSaida(e.target.value)} className="bg-secondary/50 border-border" />
                  <Input type="time" value={editHoraSaida} onChange={(e) => setEditHoraSaida(e.target.value)} className="bg-secondary/50 border-border w-32" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Canal de venda *</Label>
                <select value={editCanalVenda} onChange={(e) => setEditCanalVenda(e.target.value)} className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground">
                  <option value="VENDA ORDEM DE SERVIÇO">VENDA ORDEM DE SERVIÇO</option>
                  <option value="VENDA BALCÃO">VENDA BALCÃO</option>
                  <option value="VENDA ATACADO">VENDA ATACADO</option>
                  <option value="VENDA E-COMMERCE">VENDA E-COMMERCE</option>
                  <option value="VENDA MARKETPLACES">VENDA MARKETPLACES</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== RESPONSÁVEIS ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">👥 Responsáveis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Vendedor / Responsável</Label>
                <div className="flex items-center gap-2">
                  <Input value={editVendedor} onChange={(e) => setEditVendedor(e.target.value)} placeholder="Nome do responsável" className="bg-secondary/50 border-border" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditVendedor("")} disabled={!editVendedor}><Trash2 size={16} /></Button>
                </div>
              </div>
              <div>
                <Label>Técnico</Label>
                <div className="flex items-center gap-2">
                  <Popover open={tecnicoOpen} onOpenChange={setTecnicoOpen}>
                    <PopoverTrigger asChild>
                      <Input value={editTecnico} onChange={(e) => setEditTecnico(e.target.value)} placeholder="Nome do técnico" className="bg-secondary/50 border-border cursor-pointer" onClick={() => setTecnicoOpen(true)} />
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar funcionário..." />
                        <CommandList>
                          <CommandEmpty>Nenhum funcionário encontrado</CommandEmpty>
                          <CommandGroup>
                            {funcionarios.filter(f => f.nome.toLowerCase().includes(editTecnico.toLowerCase()) || !editTecnico).map(f => (
                              <CommandItem key={f.id} onSelect={() => { setEditTecnico(f.nome); setTecnicoOpen(false); }}>{f.nome}</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditTecnico("")} disabled={!editTecnico}><Trash2 size={16} /></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== EQUIPAMENTOS ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">🔧 Equipamentos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary/50 border border-border rounded-lg">
              <Label className="text-base font-bold">🔍 Buscar por Placa</Label>
              <p className="text-xs text-muted-foreground mb-2">Insira a placa para preencher os dados automaticamente</p>
              <div className="flex items-center gap-2">
                <Input value={editPlaca} onChange={(e) => setEditPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234 ou ABC1D23" className="bg-secondary/50 border-border text-lg font-mono uppercase tracking-wider max-w-xs" maxLength={8} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><Label>Equipamento *</Label><Input value={editEquipamento.equipamento} onChange={(e) => setEditEquipamento({ ...editEquipamento, equipamento: e.target.value })} className="bg-secondary/50 border-border" placeholder="Ex: FAN 125 09 PRETA 6281" /></div>
              <div><Label>Marca</Label><Input value={editEquipamento.marca} onChange={(e) => setEditEquipamento({ ...editEquipamento, marca: e.target.value })} className="bg-secondary/50 border-border" /></div>
              <div><Label>Modelo</Label><Input value={editEquipamento.modelo} onChange={(e) => setEditEquipamento({ ...editEquipamento, modelo: e.target.value })} className="bg-secondary/50 border-border" /></div>
              <div><Label>Ano</Label><Input value={editEquipamento.ano} onChange={(e) => setEditEquipamento({ ...editEquipamento, ano: e.target.value })} className="bg-secondary/50 border-border" placeholder="2020" /></div>
              <div><Label>Cor</Label><Input value={editEquipamento.cor} onChange={(e) => setEditEquipamento({ ...editEquipamento, cor: e.target.value })} className="bg-secondary/50 border-border" /></div>
              <div><Label>Chassi</Label><Input value={editEquipamento.serie} onChange={(e) => setEditEquipamento({ ...editEquipamento, serie: e.target.value })} className="bg-secondary/50 border-border" placeholder="Chassi" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Condições</Label><Textarea value={editEquipamento.condicoes} onChange={(e) => setEditEquipamento({ ...editEquipamento, condicoes: e.target.value })} className="bg-secondary/50 border-border min-h-[100px]" placeholder="Condições do equipamento..." /></div>
              <div><Label>Defeitos</Label><Textarea value={editEquipamento.defeitos} onChange={(e) => setEditEquipamento({ ...editEquipamento, defeitos: e.target.value })} className="bg-secondary/50 border-border min-h-[100px]" placeholder="Defeitos relatados..." /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Observações</Label><Textarea value={editEquipamento.acessorios} onChange={(e) => setEditEquipamento({ ...editEquipamento, acessorios: e.target.value })} className="bg-secondary/50 border-border min-h-[100px]" placeholder="Observações..." /></div>
              <div><Label>Solução</Label><Textarea value={editEquipamento.solucao} onChange={(e) => setEditEquipamento({ ...editEquipamento, solucao: e.target.value })} className="bg-secondary/50 border-border min-h-[100px]" placeholder="Solução aplicada..." /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>KM Atual *</Label><Input type="number" value={editKmEntrada} onChange={(e) => setEditKmEntrada(e.target.value)} className="bg-secondary/50 border-border" placeholder="15240" /></div>
              <div><Label>KM Última Revisão</Label><Input type="number" value={editKmUltimaRevisao} onChange={(e) => setEditKmUltimaRevisao(e.target.value)} className="bg-secondary/50 border-border" placeholder="14200" /></div>
              <div>
                <Label>Nível Combustível</Label>
                <select value={editNivelCombustivel} onChange={(e) => setEditNivelCombustivel(e.target.value)} className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-foreground">
                  <option value="Vazio">Vazio</option><option value="1/4">1/4</option><option value="1/2">1/2</option><option value="3/4">3/4</option><option value="Cheio">Cheio</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Óleo Recomendado</Label><Input value={editOleoRecomendado} onChange={(e) => setEditOleoRecomendado(e.target.value)} className="bg-secondary/50 border-border" placeholder="Ex: Motul 3000 10W40" /></div>
              <div><Label>Última Troca de Óleo</Label><Input type="date" value={editUltimaTrocaOleo} onChange={(e) => setEditUltimaTrocaOleo(e.target.value)} className="bg-secondary/50 border-border" /></div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== PRODUTOS/PEÇAS ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">📦 Produtos/Peças</CardTitle></CardHeader>
          <CardContent>
            <div>
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-sm text-muted-foreground w-[28%]">Produto*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[15%]">Detalhes</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Qtd*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Valor*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Desconto</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Subtotal</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Ação</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[12%]">Técnico</th>
                  </tr>
                </thead>
                <tbody>
                  {editProdutos.map((produto) => (
                    <tr key={produto.id} className="border-b border-border">
                      <td className="p-2">
                        {produto._nome ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">{produto._nome}</span>
                            <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => atualizarEditProduto(produto.id, "_nome", "")}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <ProductCombobox value={produto.produto_id} onChange={(val, prod) => atualizarEditProduto(produto.id, "produto_id", val, prod)} onAddNew={() => window.open("/estoque/novo", "_blank")} />
                        )}
                      </td>
                      <td className="p-2"><Input value={produto.detalhes} onChange={(e) => atualizarEditProduto(produto.id, "detalhes", e.target.value)} placeholder="Det..." className="bg-secondary/50 border-border text-xs" /></td>
                      <td className="p-2"><Input type="number" min="1" value={produto.quantidade} onChange={(e) => atualizarEditProduto(produto.id, "quantidade", parseFloat(e.target.value))} className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={produto.valor_unitario} onChange={(val) => atualizarEditProduto(produto.id, "valor_unitario", parseFloat(val))} prefix="R$" className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={produto.desconto} onChange={(val) => atualizarEditProduto(produto.id, "desconto", parseFloat(val))} prefix="R$" className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={produto.subtotal} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border text-sm font-semibold" /></td>

                      <td className="p-2"><Button type="button" variant="outline" size="sm" onClick={() => removerEditProduto(produto.id)} className="text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button></td>
                      <td className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Input value={produto.tecnico ? produto.tecnico.split(' ')[0] : ''} onChange={(e) => atualizarEditProduto(produto.id, "tecnico", e.target.value)} placeholder="Téc." className="bg-secondary/50 border-border text-xs cursor-pointer truncate" />
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[250px]" align="start">
                            <Command><CommandInput placeholder="Buscar..." /><CommandList><CommandEmpty>Nenhum</CommandEmpty><CommandGroup>
                              {funcionarios.map(f => (<CommandItem key={f.id} onSelect={() => atualizarEditProduto(produto.id, "tecnico", f.nome)}>{f.nome}</CommandItem>))}
                            </CommandGroup></CommandList></Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button type="button" onClick={adicionarEditProduto} variant="outline"><Plus size={16} className="mr-2" /> Adicionar produto</Button>
              <p className="text-sm font-bold">Total Peças: <span className="font-mono text-primary">R$ {fmt(editTotalPecas)}</span></p>
            </div>
          </CardContent>
        </Card>

        {/* ==================== SERVIÇOS ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">🔧 Serviços/Mão de obra</CardTitle></CardHeader>
          <CardContent>
            <div>
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-sm text-muted-foreground w-[28%]">Serviço*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[15%]">Detalhes</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Qtd*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Valor*</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Desconto</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[11%]">Subtotal</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[6%]">Ação</th>
                    <th className="text-left p-2 text-sm text-muted-foreground w-[12%]">Técnico</th>
                  </tr>
                </thead>
                <tbody>
                  {editServicos.map((servico) => (
                    <tr key={servico.id} className="border-b border-border">
                      <td className="p-2">
                        {servico.detalhes ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">{servico.detalhes}</span>
                            <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => atualizarEditServico(servico.id, "detalhes", "")}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <ServiceCombobox value={servico.servico_id} onChange={(val, svc) => atualizarEditServico(servico.id, "servico_id", val, svc)} onAddNew={() => window.open("/servicos/novo", "_blank")} />
                        )}
                      </td>
                      <td className="p-2"><Input value={servico.detalhes} onChange={(e) => atualizarEditServico(servico.id, "detalhes", e.target.value)} placeholder="Det..." className="bg-secondary/50 border-border text-xs" /></td>
                      <td className="p-2"><Input type="number" min="1" value={servico.quantidade} onChange={(e) => atualizarEditServico(servico.id, "quantidade", parseFloat(e.target.value))} className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={servico.valor_unitario} onChange={(val) => atualizarEditServico(servico.id, "valor_unitario", parseFloat(val))} prefix="R$" className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={servico.desconto} onChange={(val) => atualizarEditServico(servico.id, "desconto", parseFloat(val))} prefix="R$" className="bg-secondary/50 border-border text-sm" /></td>
                      <td className="p-2"><BRLInput value={servico.subtotal} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border text-sm font-semibold" /></td>

                      <td className="p-2"><Button type="button" variant="outline" size="sm" onClick={() => removerEditServico(servico.id)} className="text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button></td>
                      <td className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Input value={servico.tecnico ? servico.tecnico.split(' ')[0] : ''} onChange={(e) => atualizarEditServico(servico.id, "tecnico", e.target.value)} placeholder="Téc." className="bg-secondary/50 border-border text-xs cursor-pointer truncate" />
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[250px]" align="start">
                            <Command><CommandInput placeholder="Buscar..." /><CommandList><CommandEmpty>Nenhum</CommandEmpty><CommandGroup>
                              {funcionarios.map(f => (<CommandItem key={f.id} onSelect={() => atualizarEditServico(servico.id, "tecnico", f.nome)}>{f.nome}</CommandItem>))}
                            </CommandGroup></CommandList></Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button type="button" onClick={adicionarEditServico} variant="outline"><Plus size={16} className="mr-2" /> Adicionar serviço</Button>
              <p className="text-sm font-bold">Total Serviços: <span className="font-mono text-primary">R$ {fmt(editTotalServicos)}</span></p>
            </div>
          </CardContent>
        </Card>

        {/* ==================== TOTAL ==================== */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2">💰 Total</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div><Label>Mão de obra</Label><BRLInput value={editTotalServicos} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border font-semibold text-right" /></div>
              <div><Label>Peças</Label><BRLInput value={editTotalPecas} onChange={() => {}} readOnly prefix="R$" className="bg-secondary/50 border-border font-semibold text-right" /></div>
              <div><Label>Frete</Label><BRLInput value={editFrete} onChange={(val) => setEditFrete(val)} prefix="R$" className="bg-secondary/50 border-border text-right" /></div>
              <div><Label>Outros</Label><BRLInput value={editOutros} onChange={(val) => setEditOutros(val)} prefix="R$" className="bg-secondary/50 border-border text-right" /></div>
              <div><Label>Desconto</Label><BRLInput value={editDesconto} onChange={(val) => setEditDesconto(val)} prefix="R$" className="bg-secondary/50 border-border text-right" /></div>
              <div><Label>Valor total</Label><BRLInput value={editTotalGeral} onChange={() => {}} readOnly prefix="R$" className="bg-primary border-primary font-bold text-right text-primary-foreground text-lg" /></div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== CHECK DO VEÍCULO ==================== */}
        <Collapsible open={checkVeiculoOpen} onOpenChange={setCheckVeiculoOpen}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench size={18} className="text-primary" />
                Check do Veículo
              </CardTitle>
              <div className="flex items-center gap-3">
                {checkVeiculoOpen && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-muted border" /> N/V</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Bom</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Substituir</span>
                  </div>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    {checkVeiculoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {checkVeiculoOpen ? "Ocultar" : "Exibir"}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            {checkVeiculoOpen && (editPlaca || editCliente?.nome_completo) && (
              <p className="text-sm text-muted-foreground">
                {editPlaca && <span className="font-semibold">{editPlaca}</span>}
                {editPlaca && editCliente?.nome_completo && " • "}
                {editCliente?.nome_completo}
              </p>
            )}
          </CardHeader>
          <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Observações */}
              <div className="space-y-3">
                <div className="border rounded-lg p-3 space-y-2">
                  <span className="text-xs font-bold tracking-wide">OBSERVAÇÕES DO CHECK-IN</span>
                  <Textarea
                    value={editObsCheckin}
                    onChange={(e) => setEditObsCheckin(e.target.value)}
                    placeholder="Observações do check-in (opcional)..."
                    rows={5}
                    className="bg-secondary/50 border-border"
                  />
                </div>
              </div>

              {/* RIGHT: Checklist */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {editChecklist && editChecklist.length > 0 ? (
                  editChecklist.map((cat, catIdx) => (
                    <div key={cat.categoria} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5">
                        <span className="text-xs font-bold tracking-wide">{cat.categoria}</span>
                      </div>
                      <div className="px-3 py-2">
                        <div className="grid grid-cols-2 gap-1">
                          {cat.itens.map((item, itemIdx) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setEditChecklist(prev => {
                                  if (!prev) return prev;
                                  const copy = JSON.parse(JSON.stringify(prev));
                                  const current = copy[catIdx].itens[itemIdx].estado;
                                  copy[catIdx].itens[itemIdx].estado = current === "" ? "bom" : current === "bom" ? "substituir" : "";
                                  return copy;
                                });
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors border ${
                                item.estado === "bom"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                  : item.estado === "substituir"
                                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                                  : "bg-muted/50 border-transparent hover:bg-muted"
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              {item.estado === "bom" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1" />}
                              {item.estado === "substituir" && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 ml-1" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-6">
                    Nenhum checklist preenchido para esta OS.
                  </p>
                )}
              </div>
            </div>

            {/* Summary + Print */}
            {editChecklist && (
              <div className="flex items-center justify-between text-sm pt-3 mt-3 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 font-medium">
                    ✓ Bom: {editChecklist.reduce((s, c) => s + c.itens.filter(i => i.estado === "bom").length, 0)}
                  </span>
                  <span className="text-destructive font-medium">
                    ⚠ Substituir: {editChecklist.reduce((s, c) => s + c.itens.filter(i => i.estado === "substituir").length, 0)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => printChecklist({
                    checklist: editChecklist,
                    observacoes: editObsCheckin,
                    placa: editPlaca,
                    clienteNome: editCliente?.nome_completo,
                    numeroOS: os?.numero_os,
                  })}
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>
            )}
          </CardContent>
          </CollapsibleContent>
        </Card>
        </Collapsible>

        {/* ==================== OBSERVAÇÕES ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2">📝 Observações</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Esta observação será impressa no pedido</p>
              <Textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} className="bg-secondary/50 border-border min-h-[150px]" placeholder="Observações para o cliente..." />
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2">🔒 Observações internas</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Esta observação é de uso interno, portanto não será impressa no pedido.</p>
              <Textarea value={editObsInternas} onChange={(e) => setEditObsInternas(e.target.value)} className="bg-secondary/50 border-border min-h-[150px]" placeholder="Observações internas (não será impressa)..." />
            </CardContent>
          </Card>
        </div>

        {/* ==================== BOTÕES FINAIS ==================== */}
        <div className="flex items-center justify-between sticky bottom-0 bg-background p-4 border-t border-border rounded-lg">
          <Button type="button" variant="outline" onClick={() => setEditingPayment(false)} className="border-destructive text-destructive hover:bg-destructive/10">
            <X size={16} className="mr-2" /> Cancelar
          </Button>
          <Button onClick={salvarEdicao} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar OS"}
          </Button>
        </div>
      </div>
    );
  }

  // ==================== VIEW MODE (original layout) ====================
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors"><Home className="h-4 w-4" /> Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/os" className="hover:text-foreground transition-colors">Ordens de Serviço</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{os.numero_os}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(searchParams.get("from") === "quiosque" ? "/quiosque" : "/os")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-primary">{os.numero_os}</h1>
              <Badge variant="outline" className={`${statusStyles[os.status] || "bg-muted text-muted-foreground"} text-xs uppercase font-bold tracking-wider`}>
                {statusLabels[os.status] || os.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Criado em {new Date(os.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={enterEditMode}>
          <Edit2 className="h-4 w-4 mr-1" /> Editar OS
        </Button>
      </div>

      {/* Cliente + Veículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-base font-bold">{os.cliente_nome || "—"}</p>
            <p className="text-sm text-muted-foreground">{os.cliente_telefone || "—"}</p>
            {os.cliente_telefone && (
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => window.open(`tel:${os.cliente_telefone}`)}><Phone className="h-3 w-3" /> Ligar</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10" onClick={() => window.open(`https://wa.me/55${os.cliente_telefone?.replace(/\D/g, "")}`)}><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4 text-info" /> Veículo</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-bold">{[os.veiculo_marca, os.veiculo_modelo].filter(Boolean).join(" ") || "—"}{os.veiculo_cor ? ` · ${os.veiculo_cor}` : ""}</p>
            <p className="text-sm text-muted-foreground">{os.placa || "—"} {os.veiculo_ano ? `· ${os.veiculo_ano}` : ""}</p>
            {os.km_entrada ? <p className="text-xs text-muted-foreground">KM: {os.km_entrada.toLocaleString("pt-BR")}</p> : null}
            {os.defeito_relatado && (<div className="pt-2"><p className="text-xs text-muted-foreground">Defeito relatado:</p><p className="text-sm">{os.defeito_relatado}</p></div>)}
          </CardContent>
        </Card>
      </div>

      {/* Dados do Veículo - Collapsible */}
      <Collapsible open={showVeiculoDados} onOpenChange={setShowVeiculoDados}>
        <Card className="glass-panel">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-primary"><Car className="h-4 w-4" /> Dados do Veículo</div>
                {showVeiculoDados ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">KM Atual</p>
                  <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /><span className="text-base font-bold">{os.km_entrada ? os.km_entrada.toLocaleString("pt-BR") : "—"} <span className="text-xs font-normal text-muted-foreground">km</span></span></div>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">KM Última Revisão</p>
                  <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground" /><div><span className="text-base font-bold">{os.km_ultima_revisao ? os.km_ultima_revisao.toLocaleString("pt-BR") : "—"} <span className="text-xs font-normal text-muted-foreground">km</span></span>{os.km_entrada && os.km_ultima_revisao && (<p className="text-[10px] text-muted-foreground">({(os.km_entrada - os.km_ultima_revisao).toLocaleString("pt-BR")} km atrás)</p>)}</div></div>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Combustível</p>
                  <div className="flex items-center gap-2"><Fuel className="h-4 w-4 text-primary" /><span className="text-base font-bold">{os.nivel_combustivel || "—"}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Óleo Recomendado</p>
                  <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" /><span className="text-base font-bold">{os.oleo_recomendado || "—"}</span></div>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Última Troca de Óleo</p>
                  <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-muted-foreground" /><div><span className="text-base font-bold">{os.ultima_troca_oleo ? new Date(os.ultima_troca_oleo + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</span>{os.ultima_troca_oleo && (<span className="text-[10px] text-muted-foreground ml-1.5">(há {Math.round((Date.now() - new Date(os.ultima_troca_oleo + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))} dias)</span>)}</div></div>
                </div>
              </div>
              {os.veiculo_chassi && (<div className="text-xs text-muted-foreground"><span className="font-semibold">Chassi:</span> {os.veiculo_chassi}</div>)}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {totalItens > 0 && (
        <Card className="glass-panel">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso: {itensConcluidos}/{totalItens} serviços/peças</span>
              <span className={`text-sm font-bold ${progressPercent === 100 ? "text-green-600" : "text-primary"}`}>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {itens.map((item) => (
                <Badge key={item.id} variant={item.status === "concluido" ? "default" : "outline"} className={`text-[10px] ${item.status === "concluido" ? "bg-green-600 text-white line-through" : ""}`}>
                  {item.status === "concluido" && <CheckCircle2 className="h-3 w-3 mr-1" />}{item.descricao}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peças */}
      <Card className="glass-panel">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Peças ({pecas.length})</CardTitle></CardHeader>
        <CardContent>
          {pecas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma peça lançada nesta OS</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Detalhes</TableHead>
                  <TableHead className="text-center">Qtd</TableHead><TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Desconto</TableHead><TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-center w-16">Status</TableHead><TableHead className="w-36">Mecânico</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pecas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">{item.codigo || "—"}</TableCell>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.detalhes || "—"}</TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-right font-mono text-sm">R$ {fmt(item.valor_unitario)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{item.desconto ? `R$ ${fmt(item.desconto)}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">R$ {fmt(item.subtotal)}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.status === "concluido" ? "text-green-600" : "text-red-500"}>
                          {item.status === "concluido" ? <CheckCircle2 className="h-5 w-5 mx-auto" /> : <Wrench className="h-4 w-4 mx-auto" />}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{item.tecnico || "—"}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end mt-3">
            <p className="text-sm font-bold">Total Peças: <span className="font-mono text-primary">R$ {fmt(totalPecasCalc)}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card className="glass-panel">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Serviços / Mão de Obra ({servicos.length})</CardTitle></CardHeader>
        <CardContent>
          {servicos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço lançado nesta OS</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Detalhes</TableHead>
                  <TableHead className="text-center">Qtd</TableHead><TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Desconto</TableHead><TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-center w-16">Status</TableHead><TableHead className="w-36">Mecânico</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {servicos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">{item.codigo || "—"}</TableCell>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.detalhes || "—"}</TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-right font-mono text-sm">R$ {fmt(item.valor_unitario)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{item.desconto ? `R$ ${fmt(item.desconto)}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">R$ {fmt(item.subtotal)}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.status === "concluido" ? "text-green-600" : "text-red-500"}>
                          {item.status === "concluido" ? <CheckCircle2 className="h-5 w-5 mx-auto" /> : <Wrench className="h-4 w-4 mx-auto" />}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{item.tecnico || "—"}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end mt-3">
            <p className="text-sm font-bold">Total Serviços: <span className="font-mono text-primary">R$ {fmt(totalServicosCalc)}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico AR */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Diagnóstico por Realidade Aumentada</CardTitle>
            <Button variant={showDiagnostico ? "default" : "outline"} size="sm" className={`h-7 text-xs gap-1.5 ${showDiagnostico ? "gradient-primary text-primary-foreground" : ""}`} onClick={() => setShowDiagnostico(!showDiagnostico)}>
              {showDiagnostico ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </CardHeader>
        {showDiagnostico && (
          <CardContent>
            <div className="relative rounded-xl border border-border/50 bg-secondary/30 p-6 mb-4 text-center">
              {cameraActive ? (
                <div className="flex flex-col items-center gap-2">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-lg" />
                  <Button size="sm" variant="destructive" className="mt-2" onClick={stopCamera}><Camera className="h-4 w-4 mr-1" /> Parar Câmera</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Smartphone className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-semibold">Aponte a câmera para a moto</h3>
                  <p className="text-xs text-muted-foreground max-w-md">A IA identificará componentes visíveis e exibirá diagnóstico em tempo real</p>
                  <Button size="sm" className="mt-1" onClick={startCamera}><Camera className="h-4 w-4 mr-1" /> Iniciar Escaneamento</Button>
                </div>
              )}
              <div className="absolute top-2 right-2"><Badge className="bg-primary/15 text-primary border-0 text-[10px]"><Sparkles className="h-3 w-3 mr-1" /> IA Vision</Badge></div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Resumo Financeiro */}
      <Card className="glass-panel">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Resumo Financeiro</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Peças</span><span className="font-mono">R$ {fmt(totalPecasCalc)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Serviços</span><span className="font-mono">R$ {fmt(totalServicosCalc)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="font-mono">R$ {fmt(os.valor_frete)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Outros</span><span className="font-mono">R$ {fmt(os.valor_outros)}</span></div>
            {(os.valor_desconto || 0) > 0 && (<div className="flex justify-between text-destructive"><span>Desconto</span><span className="font-mono">- R$ {fmt(os.valor_desconto)}</span></div>)}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="font-mono text-primary">R$ {fmt(os.valor_total)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {(os.observacoes || os.observacoes_internas) && (
        <Card className="glass-panel">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {os.observacoes && (<div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Observações</p><p className="text-sm">{os.observacoes}</p></div>)}
            {os.observacoes_internas && (<div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Observações Internas</p><p className="text-sm">{os.observacoes_internas}</p></div>)}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4 pb-2">
        <p>Criado em {new Date(os.created_at).toLocaleDateString("pt-BR")}{os.criado_por ? ` · por ${os.criado_por}` : ""}</p>
      </div>

      <AjudanteOnline />
    </div>
  );
}
