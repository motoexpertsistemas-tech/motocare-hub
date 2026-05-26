import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { usePlano } from "@/contexts/PlanoContext";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search, RefreshCw, FileText, Printer, Truck, Download, ChevronLeft, ChevronRight,
  Package, MoreHorizontal, Calendar, AlertTriangle, CheckCircle2, Clock, XCircle,
  ArrowRight, Loader2, ClipboardList, MapPin
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { printEtiquetaEnvio } from "@/lib/printEtiquetaEnvio";

import { printNFeMarketplace } from "@/lib/printNFeMarketplace";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// ── Sub-stages configuration per main stage ──────────────────────────

type SubStageConfig = {
  key: string;
  label: string;
  icon: "clock" | "loader" | "check" | "error";
};

type StageConfig = {
  label: string;
  color: string;
  subStages: SubStageConfig[];
  errorSubStage: SubStageConfig;
};

const PIPELINE_STAGES: Record<string, StageConfig> = {
  para_emitir: {
    label: "Para Emitir",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    subStages: [
      { key: "aguardando", label: "Aguardando", icon: "clock" },
      { key: "validando_dados", label: "Validando Dados", icon: "loader" },
      { key: "gerando_nfe", label: "Gerando NF-e", icon: "loader" },
      { key: "nfe_emitida", label: "NF-e Emitida", icon: "check" },
    ],
    errorSubStage: { key: "erro_emissao", label: "Erro na Emissão", icon: "error" },
  },
  para_enviar: {
    label: "Para Enviar",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300",
    subStages: [
      { key: "para_programar", label: "Para Programar", icon: "clock" },
      { key: "programando", label: "Programando", icon: "loader" },
      { key: "falha_programacao", label: "Falha na Programação", icon: "error" },
      { key: "obtendo_rastreio", label: "Obtendo Nº de Rastreio", icon: "loader" },
      { key: "erro_rastreio", label: "Erro ao Obter Nº de Rastreio", icon: "error" },
    ],
    errorSubStage: { key: "erro_envio", label: "Erro no Envio", icon: "error" },
  },
  para_imprimir: {
    label: "Para Imprimir",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    subStages: [
      { key: "gerando_etiqueta", label: "Gerando etiqueta", icon: "loader" },
      { key: "impresso", label: "Etiqueta para Impressão", icon: "check" },
    ],
    errorSubStage: { key: "erro_impressao", label: "Etiqueta Falhada", icon: "error" },
  },
  enviado: {
    label: "Enviado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    subStages: [
      { key: "aguardando", label: "Em Trânsito", icon: "clock" },
      { key: "em_transito", label: "Em Trânsito", icon: "loader" },
      { key: "saiu_para_entrega", label: "Saiu p/ Entrega", icon: "check" },
    ],
    errorSubStage: { key: "erro_entrega", label: "Erro na Entrega", icon: "error" },
  },
  entregue: {
    label: "Entregue",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    subStages: [
      { key: "entregue_confirmado", label: "Entregue", icon: "check" },
    ],
    errorSubStage: { key: "erro_confirmacao", label: "Erro na Confirmação", icon: "error" },
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800 border-green-300" },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800 border-blue-300" },
  entregue: { label: "Entregue", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300" },
  devolvido: { label: "Devolvido", color: "bg-orange-100 text-orange-800 border-orange-300" },
  nao_pago: { label: "Não Pago", color: "bg-gray-100 text-gray-800 border-gray-300" },
  para_reservar: { label: "Para Reservar", color: "bg-purple-100 text-purple-800 border-purple-300" },
  para_emitir: { label: "Para Emitir", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  para_enviar: { label: "Para Enviar", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  para_imprimir: { label: "Para Imprimir", color: "bg-teal-100 text-teal-800 border-teal-300" },
};

const SUB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: "clock" | "loader" | "check" | "error" }> = {
  aguardando: { label: "Aguardando", color: "bg-gray-100 text-gray-700", icon: "clock" },
  validando_dados: { label: "Validando Dados", color: "bg-blue-50 text-blue-700", icon: "loader" },
  gerando_nfe: { label: "Gerando NF-e", color: "bg-indigo-50 text-indigo-700", icon: "loader" },
  nfe_emitida: { label: "NF-e Emitida", color: "bg-green-50 text-green-700", icon: "check" },
  erro_emissao: { label: "Erro na Emissão", color: "bg-red-50 text-red-700", icon: "error" },
  preparando_envio: { label: "Preparando Envio", color: "bg-cyan-50 text-cyan-700", icon: "loader" },
  aguardando_coleta: { label: "Aguardando Coleta", color: "bg-amber-50 text-amber-700", icon: "loader" },
  coletado: { label: "Coletado", color: "bg-green-50 text-green-700", icon: "check" },
  erro_envio: { label: "Erro no Envio", color: "bg-red-50 text-red-700", icon: "error" },
  gerando_etiqueta: { label: "Gerando etiqueta", color: "bg-teal-50 text-teal-700", icon: "loader" },
  imprimindo: { label: "Etiqueta para Impressão", color: "bg-teal-50 text-teal-700", icon: "loader" },
  impresso: { label: "Etiqueta para Impressão", color: "bg-green-50 text-green-700", icon: "check" },
  erro_impressao: { label: "Etiqueta Falhada", color: "bg-red-50 text-red-700", icon: "error" },
  em_transito: { label: "Em Trânsito", color: "bg-blue-50 text-blue-700", icon: "loader" },
  saiu_para_entrega: { label: "Saiu p/ Entrega", color: "bg-green-50 text-green-700", icon: "check" },
  erro_entrega: { label: "Erro na Entrega", color: "bg-red-50 text-red-700", icon: "error" },
  entregue_confirmado: { label: "Entregue", color: "bg-emerald-50 text-emerald-700", icon: "check" },
  erro_confirmacao: { label: "Erro Confirmação", color: "bg-red-50 text-red-700", icon: "error" },
};

const STATUS_TABS = [
  { value: "todos", label: "Todos" },
  { value: "nao_pago", label: "Não Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "para_reservar", label: "Para Reservar" },
  { value: "para_emitir", label: "Para Emitir" },
  { value: "para_enviar", label: "Para Enviar" },
  { value: "para_imprimir", label: "Para Imprimir" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

const SIDEBAR_ITEMS = [
  { label: "Total Pedidos", key: "total", children: [
    { label: "Pedidos Recentes", key: "recentes" },
    { label: "Pedidos Históricos", key: "historicos" },
  ]},
  { label: "Processando Pedidos", key: "processando", children: [
    { label: "Para Reservar", key: "para_reservar" },
    { label: "Para Emitir", key: "para_emitir" },
    { label: "Para Enviar", key: "para_enviar" },
    { label: "Para Imprimir", key: "para_imprimir" },
    { label: "Para Retirada", key: "para_retirada" },
  ]},
  { label: "Com Erros", key: "erros", children: [
    { label: "Erro Emissão", key: "erro_emissao" },
    { label: "Erro Envio", key: "erro_envio" },
    { label: "Etiqueta Falhada", key: "erro_impressao" },
    { label: "Erro Entrega", key: "erro_entrega" },
  ]},
];

const MARKETPLACE_ICONS: Record<string, string> = {
  mercado_livre: "🛒",
  shopee: "🛍️",
  magalu: "🏪",
  amazon: "📦",
  shein: "👗",
  tiktok_shop: "🎵",
  kwai: "📹",
};

const POR_PAGINA_OPTIONS = [20, 50, 100];

const SOLUCOES_ERROS: Record<string, { titulo: string; passos: string[] }> = {
  "Dados do cliente ou valor total ausentes": {
    titulo: "Dados incompletos no pedido",
    passos: [
      "Verifique se o nome do cliente está preenchido no marketplace.",
      "Confirme se o valor total do pedido foi sincronizado corretamente.",
      "Acesse o pedido no marketplace e atualize os dados do comprador.",
      "Após corrigir, clique em 'Retentar' para reprocessar.",
    ],
  },
  "Pedido sem itens para gerar NF-e": {
    titulo: "Pedido sem itens cadastrados",
    passos: [
      "O pedido não possui itens vinculados, impossibilitando a emissão da NF-e.",
      "Verifique no marketplace se os itens do pedido foram sincronizados.",
      "Caso o problema persista, exclua e reimporte o pedido.",
      "Após corrigir os itens, clique em 'Retentar'.",
    ],
  },
  "Endereço de entrega incompleto": {
    titulo: "Endereço de entrega faltando",
    passos: [
      "O CEP ou cidade do destinatário está ausente.",
      "Acesse o pedido no marketplace e verifique o endereço de entrega.",
      "Atualize os dados de envio e sincronize novamente.",
      "Clique em 'Retentar' para continuar o processamento.",
    ],
  },
  "Não foi possível gerar etiqueta sem código de rastreio": {
    titulo: "Código de rastreio ausente",
    passos: [
      "A etiqueta de envio não pode ser gerada sem um código de rastreio.",
      "Verifique se a transportadora já gerou o código de rastreio.",
      "Insira o código de rastreio manualmente ou aguarde a sincronização.",
      "Após obter o código, clique em 'Retentar'.",
    ],
  },
};

const FLUXO_ETAPAS = ["para_reservar", "para_emitir", "para_enviar", "para_imprimir", "enviado", "entregue"];

const MOTIVOS_CANCELAMENTO = [
  { value: "sem_estoque", label: "Produto sem estoque" },
  { value: "erro_preco", label: "Erro no preço anunciado" },
  { value: "produto_danificado", label: "Produto danificado no estoque" },
  { value: "pedido_duplicado", label: "Pedido duplicado" },
  { value: "cliente_solicitou", label: "Cliente solicitou cancelamento" },
  { value: "endereco_invalido", label: "Endereço de entrega inválido" },
  { value: "fraude_suspeita", label: "Suspeita de fraude" },
  { value: "pagamento_nao_confirmado", label: "Pagamento não confirmado" },
  { value: "outro", label: "Outro motivo" },
];

const getDefaultSubStatus = (status: string) => {
  if (status === "para_enviar") return "para_programar";
  if (status === "para_imprimir") return "gerando_etiqueta";
  return "aguardando";
};

function getSubStageIcon(iconType: "clock" | "loader" | "check" | "error") {
  switch (iconType) {
    case "clock": return <Clock className="h-3 w-3" />;
    case "loader": return <Loader2 className="h-3 w-3 animate-spin" />;
    case "check": return <CheckCircle2 className="h-3 w-3" />;
    case "error": return <XCircle className="h-3 w-3" />;
  }
}

function getSubStageProgress(status: string, subStatus: string): number {
  const stage = PIPELINE_STAGES[status];
  if (!stage) return 0;
  if (stage.errorSubStage.key === subStatus) return -1; // error
  const idx = stage.subStages.findIndex(s => s.key === subStatus);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / stage.subStages.length) * 100);
}

function isErrorSubStatus(subStatus: string): boolean {
  return subStatus?.startsWith("erro_") || false;
}

export default function PedidosMarketplace() {
  const role = useRole();
  const plano = usePlano();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusTab, setStatusTab] = useState("todos");
  const [marketplace, setMarketplace] = useState("todos");
  const [sidebarSection, setSidebarSection] = useState("recentes");
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(50);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [contadores, setContadores] = useState<Record<string, number>>({});
  const [subContadores, setSubContadores] = useState<Record<string, number>>({});
  const [subStatusFilter, setSubStatusFilter] = useState<string>("todos");
  const [processando, setProcessando] = useState<string[]>([]);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; pedido: any | null }>({ open: false, pedido: null });
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [observacaoCancelamento, setObservacaoCancelamento] = useState("");
  const [nfeDetailDialog, setNfeDetailDialog] = useState<{ open: boolean; pedido: any | null }>({ open: false, pedido: null });
  const [erroSolucaoDialog, setErroSolucaoDialog] = useState<{ open: boolean; erro: string }>({ open: false, erro: "" });
  const [cancelNfeDialog, setCancelNfeDialog] = useState<{ open: boolean; pedido: any | null }>({ open: false, pedido: null });
  const [motivoCancelNfe, setMotivoCancelNfe] = useState("");
  const [separacaoDialog, setSeparacaoDialog] = useState(false);
  const [separacaoItens, setSeparacaoItens] = useState<any[]>([]);
  const [separacaoLoading, setSeparacaoLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));

  const carregarPedidos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("marketplace_pedidos")
        .select("*", { count: "exact" })
        .gte("data_pedido", dataInicio)
        .lte("data_pedido", dataFim + "T23:59:59")
        .order("data_pedido", { ascending: false });

      if (statusTab !== "todos") {
        // Check if filtering by error sub-status
        if (statusTab.startsWith("erro_")) {
          query = query.eq("sub_status", statusTab);
        } else {
          query = query.eq("status", statusTab);
        }
      }
      // Apply sub-status filter
      if (subStatusFilter !== "todos") {
        query = query.eq("sub_status", subStatusFilter);
      }
      if (marketplace !== "todos") {
        query = query.eq("marketplace", marketplace);
      }
      if (busca.trim()) {
        query = query.or(`numero_pedido.ilike.%${busca}%,cliente_nome.ilike.%${busca}%`);
      }

      query = query.range(pagina * porPagina, (pagina + 1) * porPagina - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      setPedidos(data || []);
      setTotalPedidos(count || 0);
    } catch (err) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, statusTab, marketplace, busca, pagina, porPagina, subStatusFilter]);

  const carregarContadores = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_pedidos")
      .select("status, sub_status")
      .gte("data_pedido", dataInicio)
      .lte("data_pedido", dataFim + "T23:59:59");

    if (data) {
      const counts: Record<string, number> = {};
      const subCounts: Record<string, number> = {};
      data.forEach((p: any) => {
        counts[p.status] = (counts[p.status] || 0) + 1;
        if (p.sub_status && isErrorSubStatus(p.sub_status)) {
          counts[p.sub_status] = (counts[p.sub_status] || 0) + 1;
        }
        // Count sub-statuses per main status
        const normalizedSubStatus = p.sub_status || getDefaultSubStatus(p.status);
        const subKey = `${p.status}__${normalizedSubStatus}`;
        subCounts[subKey] = (subCounts[subKey] || 0) + 1;
      });
      counts["total"] = data.length;
      setContadores(counts);
      setSubContadores(subCounts);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (role === "ADMIN" || role === "GERENTE") {
      carregarPedidos();
      carregarContadores();
    }
  }, [carregarPedidos, carregarContadores, role]);

  if (role !== "ADMIN" && role !== "GERENTE") return <Navigate to="/" replace />;
  if (plano !== "platina") return <Navigate to="/" replace />;

  const totalPaginas = Math.ceil(totalPedidos / porPagina);

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (selecionados.length === pedidos.length) {
      setSelecionados([]);
    } else {
      setSelecionados(pedidos.map((p) => p.id));
    }
  };

  const formatBRL = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const proximaEtapa = (status: string): string | null => {
    const idx = FLUXO_ETAPAS.indexOf(status);
    if (idx >= 0 && idx < FLUXO_ETAPAS.length - 1) return FLUXO_ETAPAS[idx + 1];
    return null;
  };

  // ── Automatic sub-stage progression ──────────────────────────
  const processarPedidoAutomatico = async (pedido: any) => {
    const stage = PIPELINE_STAGES[pedido.status];
    if (!stage) return;

    const currentSubStatus = pedido.sub_status || getDefaultSubStatus(pedido.status);

    // If in error, don't auto-progress
    if (isErrorSubStatus(currentSubStatus)) return;

    setProcessando(prev => [...prev, pedido.id]);

    try {
      // If already at nfe_emitida, advance directly to next main stage
      if (pedido.status === "para_emitir" && currentSubStatus === "nfe_emitida") {
        const nextMainStage = proximaEtapa(pedido.status);
        if (nextMainStage) {
          // NF-e print removed — user can print manually via button
          await supabase
            .from("marketplace_pedidos")
            .update({ status: nextMainStage, sub_status: getDefaultSubStatus(nextMainStage), erro_detalhe: null })
            .eq("id", pedido.id);
          toast.success(`Pedido ${pedido.numero_pedido} avançou para: ${PIPELINE_STAGES[nextMainStage]?.label || nextMainStage}`);
        }
        return;
      }

      const subStages = stage.subStages;
      const currentIdx = subStages.findIndex(s => s.key === currentSubStatus);

      // Progress through remaining sub-stages
      for (let i = currentIdx + 1; i < subStages.length; i++) {
        const nextSub = subStages[i];

        // Simulate processing with validation
        const { success, error: processError } = await simulateSubStageProcess(pedido, pedido.status, nextSub.key);

        if (!success) {
          // Error occurred — stay in error sub-stage
          await supabase
            .from("marketplace_pedidos")
            .update({ sub_status: stage.errorSubStage.key, erro_detalhe: processError })
            .eq("id", pedido.id);

          toast.error(`Pedido ${pedido.numero_pedido}: ${processError}`);
          break;
        }

        // Update to next sub-stage
        await supabase
          .from("marketplace_pedidos")
          .update({ sub_status: nextSub.key, erro_detalhe: null })
          .eq("id", pedido.id);

        // If last sub-stage completed OR nfe_emitida reached, advance to next main stage
        if (i === subStages.length - 1 || (pedido.status === "para_emitir" && nextSub.key === "nfe_emitida")) {
          const nextMainStage = proximaEtapa(pedido.status);
          if (nextMainStage) {
            // Trigger automatic actions
            // NF-e print removed — user can print manually via button
            if (nextMainStage === "para_imprimir") printEtiquetaEnvio([pedido]);

            await supabase
              .from("marketplace_pedidos")
              .update({ status: nextMainStage, sub_status: getDefaultSubStatus(nextMainStage), erro_detalhe: null })
              .eq("id", pedido.id);

            toast.success(`Pedido ${pedido.numero_pedido} avançou para: ${PIPELINE_STAGES[nextMainStage]?.label || nextMainStage}`);
            break; // Stop processing further sub-stages since we advanced
          }
        }
      }
    } catch (err) {
      toast.error(`Erro ao processar pedido ${pedido.numero_pedido}`);
    } finally {
      setProcessando(prev => prev.filter(id => id !== pedido.id));
      carregarPedidos();
      carregarContadores();
    }
  };

  // Simulate sub-stage validation (in production, this would call real APIs)
  const simulateSubStageProcess = async (
    pedido: any,
    status: string,
    subStage: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Add a small delay to simulate processing
    await new Promise(r => setTimeout(r, 500));

    // Validate based on stage + sub-stage
    if (status === "para_enviar") {
      if (subStage === "preparando_envio") {
        if (!pedido.cep && !pedido.cidade) {
          return { success: false, error: "Endereço de entrega incompleto" };
        }
      }
    }

    if (status === "para_imprimir") {
      if (subStage === "gerando_etiqueta") {
        if (!pedido.codigo_rastreio) {
          return { success: false, error: "Não foi possível gerar etiqueta sem código de rastreio" };
        }
      }
    }

    return { success: true };
  };

  const retentarPedido = async (pedido: any) => {
    // Reset to aguardando and re-process
    await supabase
      .from("marketplace_pedidos")
      .update({ sub_status: getDefaultSubStatus(pedido.status), erro_detalhe: null })
      .eq("id", pedido.id);

    toast.info(`Retentando pedido ${pedido.numero_pedido}...`);
    const updatedPedido = { ...pedido, sub_status: getDefaultSubStatus(pedido.status), erro_detalhe: null };
    await processarPedidoAutomatico(updatedPedido);
  };

  const avancarEtapaManual = async (pedido: any) => {
    const prox = proximaEtapa(pedido.status);
    if (!prox) return;
    const { error } = await supabase
      .from("marketplace_pedidos")
      .update({ status: prox, sub_status: getDefaultSubStatus(prox), erro_detalhe: null })
      .eq("id", pedido.id);
    if (error) { toast.error("Erro ao avançar etapa"); return; }

    toast.success(`Pedido avançou para: ${STATUS_CONFIG[prox]?.label || prox}`);
    carregarPedidos();
    carregarContadores();
  };

  const processarEnvio = async (pedido: any) => {
    setProcessando(prev => [...prev, pedido.id]);
    try {
      // Update to "programando"
      await supabase.from("marketplace_pedidos").update({ sub_status: "programando" }).eq("id", pedido.id);
      await new Promise(r => setTimeout(r, 500));

      // Update to "obtendo_rastreio"
      await supabase.from("marketplace_pedidos").update({ sub_status: "obtendo_rastreio" }).eq("id", pedido.id);
      await new Promise(r => setTimeout(r, 1000));

      const codigoRastreio = `BR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { error } = await supabase
        .from("marketplace_pedidos")
        .update({
          codigo_rastreio: codigoRastreio,
          status: "para_imprimir",
          sub_status: "gerando_etiqueta",
          transportadora: pedido.transportadora || "Correios",
        })
        .eq("id", pedido.id);

      if (error) throw error;
      toast.success(`Rastreio gerado: ${codigoRastreio} — Pedido movido para "Para Imprimir"`);
      carregarPedidos();
      carregarContadores();
    } catch {
      await supabase.from("marketplace_pedidos").update({ sub_status: "erro_rastreio", erro_detalhe: "Falha ao obter número de rastreio" }).eq("id", pedido.id);
      toast.error("Erro ao processar envio");
      carregarPedidos();
      carregarContadores();
    } finally {
      setProcessando(prev => prev.filter(id => id !== pedido.id));
    }
  };

  const emitirNFeLote = async () => {
    const selecionadosPedidos = pedidos.filter((p) => selecionados.includes(p.id));
    if (selecionadosPedidos.length === 0) {
      toast.error("Selecione pelo menos um pedido");
      return;
    }
    selecionadosPedidos.forEach((p) => printNFeMarketplace(p));
    toast.success(`NF-e gerada para ${selecionadosPedidos.length} pedido(s)`);
  };

  const imprimirEtiquetaLote = () => {
    const selecionadosPedidos = pedidos.filter((p) => selecionados.includes(p.id));
    if (selecionadosPedidos.length === 0) {
      toast.error("Selecione pelo menos um pedido");
      return;
    }
    printEtiquetaEnvio(selecionadosPedidos);
    toast.success(`Etiqueta(s) gerada(s) para ${selecionadosPedidos.length} pedido(s)`);
  };

  const processarLote = async () => {
    const sels = pedidos.filter(p => selecionados.includes(p.id) && PIPELINE_STAGES[p.status] && !isErrorSubStatus(p.sub_status));
    if (sels.length === 0) { toast.error("Nenhum pedido selecionado pode ser processado"); return; }
    for (const p of sels) await processarPedidoAutomatico(p);
    setSelecionados([]);
  };

  const avancarLoteManual = async () => {
    const sels = pedidos.filter(p => selecionados.includes(p.id) && proximaEtapa(p.status));
    if (sels.length === 0) { toast.error("Nenhum pedido selecionado pode avançar"); return; }
    for (const p of sels) await avancarEtapaManual(p);
    setSelecionados([]);
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.label}</Badge>;
  };

  const getSubStatusBadge = (subStatus: string, erroDetalhe?: string) => {
    const cfg = SUB_STATUS_CONFIG[subStatus] || { label: subStatus || "—", color: "bg-muted text-muted-foreground", icon: "clock" as const };
    const isError = isErrorSubStatus(subStatus);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 gap-1 ${cfg.color} ${isError ? "border-red-300 animate-pulse" : ""}`}>
              {getSubStageIcon(cfg.icon)}
              {cfg.label}
            </Badge>
          </TooltipTrigger>
          {isError && erroDetalhe && (
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs font-medium text-destructive">{erroDetalhe}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderSubStageProgress = (pedido: any) => {
    const stage = PIPELINE_STAGES[pedido.status];
    if (!stage) return null;

    const subStatus = pedido.sub_status || getDefaultSubStatus(pedido.status);
    const isError = isErrorSubStatus(subStatus);
    const progress = getSubStageProgress(pedido.status, subStatus);

    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <Progress
          value={isError ? 100 : progress}
          className={`h-1 w-16 ${isError ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
        />
        <span className="text-[9px] text-muted-foreground">
          {isError ? "Erro" : `${progress}%`}
        </span>
      </div>
    );
  };

  const gerarListaSeparacao = async () => {
    const sels = pedidos.filter(p => selecionados.includes(p.id));
    if (sels.length === 0) { toast.error("Selecione pedidos para gerar a lista"); return; }
    setSeparacaoLoading(true);
    setSeparacaoDialog(true);

    // Aggregate items across selected orders
    const itemMap: Record<string, { nome: string; sku: string; quantidade: number; pedidos: string[] }> = {};
    sels.forEach(pedido => {
      const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
      itens.forEach((item: any) => {
        const key = item.sku || item.codigo || item.nome || "sem-sku";
        if (!itemMap[key]) {
          itemMap[key] = { nome: item.nome || key, sku: item.sku || item.codigo || "", quantidade: 0, pedidos: [] };
        }
        itemMap[key].quantidade += (item.quantidade || 1);
        itemMap[key].pedidos.push(pedido.numero_pedido);
      });
    });

    const aggregated = Object.values(itemMap);

    // Fetch locations from produtos_catalogo
    const skus = aggregated.map(i => i.sku).filter(Boolean);
    let locationMap: Record<string, string> = {};
    if (skus.length > 0) {
      const { data: produtos } = await supabase
        .from("produtos_catalogo")
        .select("codigo_fornecedor, localizacao")
        .in("codigo_fornecedor", skus);
      if (produtos) {
        produtos.forEach((p: any) => {
          if (p.codigo_fornecedor && p.localizacao) {
            locationMap[p.codigo_fornecedor] = p.localizacao;
          }
        });
      }
    }

    // Also try matching by name for items without SKU
    const namesWithoutSku = aggregated.filter(i => !i.sku).map(i => i.nome);
    if (namesWithoutSku.length > 0) {
      const { data: produtosByName } = await supabase
        .from("produtos_catalogo")
        .select("nome, localizacao, codigo_fornecedor")
        .in("nome", namesWithoutSku);
      if (produtosByName) {
        produtosByName.forEach((p: any) => {
          if (p.nome && p.localizacao) {
            locationMap[p.nome] = p.localizacao;
          }
        });
      }
    }

    // Merge location and sort by location
    const result = aggregated.map(item => ({
      ...item,
      localizacao: locationMap[item.sku] || locationMap[item.nome] || "Sem localização",
    })).sort((a, b) => a.localizacao.localeCompare(b.localizacao));

    setSeparacaoItens(result);
    setSeparacaoLoading(false);
  };

  const imprimirListaSeparacao = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = separacaoItens.map((item, i) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px">${i + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600">${item.localizacao}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${item.sku || "—"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${item.nome}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;font-weight:700">${item.quantidade}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280">${item.pedidos.join(", ")}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;width:50px">☐</td>
      </tr>
    `).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Lista de Separação</title></head><body style="font-family:Arial,sans-serif;padding:20px">
      <h2 style="margin-bottom:4px">Lista de Separação</h2>
      <p style="color:#6b7280;font-size:13px;margin-bottom:16px">${new Date().toLocaleDateString("pt-BR")} — ${selecionados.length} pedido(s) — ${separacaoItens.reduce((s, i) => s + i.quantidade, 0)} item(ns)</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:8px 10px;text-align:center;font-size:12px;border-bottom:2px solid #d1d5db">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #d1d5db">📍 Localização</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #d1d5db">SKU</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #d1d5db">Produto</th>
          <th style="padding:8px 10px;text-align:center;font-size:12px;border-bottom:2px solid #d1d5db">Qtd</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #d1d5db">Pedidos</th>
          <th style="padding:8px 10px;text-align:center;font-size:12px;border-bottom:2px solid #d1d5db">✓</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };


  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-card overflow-y-auto hidden lg:block">
        <div className="p-3">
          <h2 className="font-bold text-sm mb-3 uppercase">PEDIDOS</h2>
          {SIDEBAR_ITEMS.map((group) => (
            <div key={group.key} className="mb-3">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1 uppercase">
                {group.key === "erros" && <AlertTriangle className="h-3 w-3 text-destructive" />}
                {group.label}
              </p>
              {group.children.map((item) => {
                const count = contadores[item.key] ?? 0;
                const isErrorItem = item.key.startsWith("erro_");
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSidebarSection(item.key);
                      if (isErrorItem) {
                        setStatusTab(item.key);
                      } else if (["para_reservar", "para_emitir", "para_enviar", "para_imprimir", "para_retirada"].includes(item.key)) {
                        setStatusTab(item.key);
                      } else if (item.key === "recentes") {
                        setStatusTab("todos");
                      } else if (item.key === "historicos") {
                        setStatusTab("todos");
                      }
                      setPagina(0);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded flex justify-between items-center uppercase ${
                      sidebarSection === item.key
                        ? "bg-primary/10 text-primary font-medium"
                        : isErrorItem && count > 0
                          ? "text-destructive hover:bg-destructive/10"
                          : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isErrorItem && <XCircle className="h-3 w-3" />}
                      {item.label}
                    </span>
                    <span className={`text-[10px] ${isErrorItem && count > 0 ? "bg-destructive text-destructive-foreground px-1.5 rounded-full font-bold" : ""}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters bar */}
        <div className="border-b bg-card p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Nº DO PEDIDO OU NOME DO CLIENTE..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value.toUpperCase()); setPagina(0); }}
                className="pl-8 h-8 text-xs uppercase"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPagina(0); }} className="h-8 text-xs w-[160px]" />
              <span className="text-xs text-muted-foreground shrink-0 uppercase">ATÉ</span>
              <Input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPagina(0); }} className="h-8 text-xs w-[160px]" />
            </div>
            <Select value={marketplace} onValueChange={(v) => { setMarketplace(v); setPagina(0); }}>
              <SelectTrigger className="h-8 text-xs w-36 uppercase">
                <SelectValue placeholder="PLATAFORMAS" />
              </SelectTrigger>
              <SelectContent className="uppercase">
                <SelectItem value="todos">TODAS PLATAFORMAS</SelectItem>
                <SelectItem value="shopee">SHOPEE</SelectItem>
                <SelectItem value="mercado_livre">MERCADO LIVRE</SelectItem>
                <SelectItem value="amazon">AMAZON</SelectItem>
                <SelectItem value="magalu">MAGALU</SelectItem>
                <SelectItem value="shein">SHEIN</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 uppercase" onClick={() => { carregarPedidos(); carregarContadores(); }}>
              <RefreshCw className="h-3 w-3" /> ATUALIZAR
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 uppercase">
              <Download className="h-3 w-3" /> EXPORTAR
            </Button>
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusTab(tab.value); setSubStatusFilter("todos"); setPagina(0); }}
                className={`whitespace-nowrap px-3 py-1 text-xs rounded-full border transition-colors uppercase ${
                  statusTab === tab.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {tab.label}
                {contadores[tab.value] ? ` (${contadores[tab.value]})` : ""}
              </button>
            ))}
          </div>

          {/* Sub-stages bar — visible when a pipeline stage is selected */}
          {PIPELINE_STAGES[statusTab] && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <span className="text-[10px] font-semibold text-muted-foreground shrink-0 mr-1">Sub-etapas:</span>
              {statusTab !== "para_enviar" && (
              <button
                onClick={() => { setSubStatusFilter("todos"); setPagina(0); }}
                className={`whitespace-nowrap px-2.5 py-0.5 text-[10px] rounded-full border transition-colors ${
                  subStatusFilter === "todos"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                Todas ({contadores[statusTab] || 0})
              </button>
              )}
              {PIPELINE_STAGES[statusTab].subStages.map((sub) => {
                const count = subContadores[`${statusTab}__${sub.key}`] || 0;
                return (
                  <button
                    key={sub.key}
                    onClick={() => { setSubStatusFilter(sub.key); setPagina(0); }}
                    className={`whitespace-nowrap px-2.5 py-0.5 text-[10px] rounded-full border transition-colors flex items-center gap-1 ${
                      subStatusFilter === sub.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {getSubStageIcon(sub.icon)}
                    {sub.label} ({count})
                  </button>
                );
              })}
              {/* Error sub-stage */}
              {(() => {
                const errSub = PIPELINE_STAGES[statusTab].errorSubStage;
                const errCount = subContadores[`${statusTab}__${errSub.key}`] || 0;
                return (
                  <button
                    onClick={() => { setSubStatusFilter(errSub.key); setPagina(0); }}
                    className={`whitespace-nowrap px-2.5 py-0.5 text-[10px] rounded-full border transition-colors flex items-center gap-1 ${
                      subStatusFilter === errSub.key
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : errCount > 0
                          ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <XCircle className="h-3 w-3" />
                    {errSub.label} ({errCount})
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="border-b bg-card px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Selecionado {selecionados.length}</span>
            {selecionados.length > 0 && statusTab !== "para_reservar" && (
              <>
                <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={processarLote}>
                  <ArrowRight className="h-3 w-3" /> Processar Automático
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={avancarLoteManual}>
                  <ChevronRight className="h-3 w-3" /> Avançar Etapa
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={emitirNFeLote}>
                  <FileText className="h-3 w-3" /> Emitir NF-e
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={imprimirEtiquetaLote}>
                  <Truck className="h-3 w-3" /> Etiqueta Envio
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                  const sels = pedidos.filter(p => selecionados.includes(p.id));
                  sels.forEach(p => printNFeMarketplace(p));
                }}>
                  <Printer className="h-3 w-3" /> Imprimir
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={gerarListaSeparacao}>
                  <ClipboardList className="h-3 w-3" /> Lista de Separação
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Total {totalPedidos}</span>
            <span className="text-muted-foreground">{pagina + 1}/{totalPaginas || 1}</span>
            <Select value={String(porPagina)} onValueChange={(v) => { setPorPagina(Number(v)); setPagina(0); }}>
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POR_PAGINA_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}/página</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="w-8">
                    <Checkbox checked={selecionados.length === pedidos.length && pedidos.length > 0} onCheckedChange={toggleTodos} />
                  </TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Sub-Etapa</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((pedido) => {
                  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
                  const primeiroItem = itens[0] as any;
                  const isProcessing = processando.includes(pedido.id);
                  const subStatus = pedido.sub_status || getDefaultSubStatus(pedido.status);
                  const hasError = isErrorSubStatus(subStatus);

                  return (
                    <TableRow key={pedido.id} className={`text-xs ${hasError ? "bg-destructive/5" : ""} ${isProcessing ? "opacity-60" : ""}`}>
                      <TableCell>
                        <Checkbox
                          checked={selecionados.includes(pedido.id)}
                          onCheckedChange={() => toggleSelecionado(pedido.id)}
                          disabled={isProcessing}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded bg-muted flex items-center justify-center text-lg shrink-0">
                            {MARKETPLACE_ICONS[pedido.marketplace] || "📦"}
                          </div>
                          <div>
                            <p className="font-medium text-xs line-clamp-1">
                              {primeiroItem?.nome || pedido.numero_pedido}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {itens.length > 1 ? `+${itens.length - 1} item(ns)` : ""}
                              {primeiroItem?.quantidade ? ` × ${primeiroItem.quantidade}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatBRL(pedido.valor_total)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="line-clamp-1">{pedido.cliente_nome}</p>
                          <p className="text-[10px] text-muted-foreground">{pedido.cidade}, {pedido.estado}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-[10px]">{pedido.pedido_externo_id?.slice(0, 16) || pedido.numero_pedido}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(pedido.data_pedido).toLocaleDateString("pt-BR")}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {getSubStatusBadge(subStatus, pedido.erro_detalhe)}
                          {hasError && pedido.erro_detalhe && (
                            <p className="text-[9px] text-destructive line-clamp-1 max-w-[120px]">{pedido.erro_detalhe}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderSubStageProgress(pedido)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {pedido.marketplace?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {/* PARA RESERVAR: only Processar and Cancelar */}
                            {pedido.status === "para_reservar" && (
                              <>
                                <DropdownMenuItem onClick={() => avancarEtapaManual(pedido)} className="gap-2 font-medium text-primary">
                                  <ArrowRight className="h-3 w-3" /> Processar Pedido
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCancelDialog({ open: true, pedido });
                                    setMotivoCancelamento("");
                                    setObservacaoCancelamento("");
                                  }}
                                  className="gap-2 font-medium text-destructive"
                                >
                                  <XCircle className="h-3 w-3" /> Cancelar Pedido
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Error details + Retry */}
                            {pedido.status !== "para_reservar" && hasError && (
                              <>
                                {pedido.erro_detalhe && (
                                  <div
                                    className="px-2 py-1.5 text-[11px] text-destructive bg-destructive/10 rounded-sm mx-1 mb-1 font-medium cursor-pointer hover:bg-destructive/20 transition-colors flex items-center gap-1"
                                    onClick={() => setErroSolucaoDialog({ open: true, erro: pedido.erro_detalhe })}
                                  >
                                    ⚠ {pedido.erro_detalhe}
                                    <ArrowRight className="h-2.5 w-2.5 ml-auto shrink-0" />
                                  </div>
                                )}
                                <DropdownMenuItem onClick={() => retentarPedido(pedido)} className="gap-2 font-medium text-amber-600">
                                  <RefreshCw className="h-3 w-3" /> Retentar
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Cancelar NF-e (separado) */}
                            {pedido.status !== "para_reservar" && hasError && (
                              <DropdownMenuItem
                                onClick={() => { setCancelNfeDialog({ open: true, pedido }); setMotivoCancelNfe(""); }}
                                className="gap-2 font-medium text-destructive"
                              >
                                <XCircle className="h-3 w-3" /> Cancelar NF-e
                              </DropdownMenuItem>
                            )}

                            {/* PARA EMITIR: Emitir NF-e ou Detalhes NF-e conforme sub-etapa */}
                            {pedido.status === "para_emitir" && !hasError && pedido.sub_status !== "nfe_emitida" && (
                              <DropdownMenuItem onClick={() => processarPedidoAutomatico(pedido)} className="gap-2 font-medium text-primary">
                                <FileText className="h-3 w-3" /> Emitir NF-e
                              </DropdownMenuItem>
                            )}
                            {pedido.status === "para_emitir" && !hasError && pedido.sub_status === "nfe_emitida" && (
                              <>
                                <DropdownMenuItem onClick={() => setNfeDetailDialog({ open: true, pedido })} className="gap-2 font-medium text-primary">
                                  <FileText className="h-3 w-3" /> Detalhes da NF-e
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setCancelNfeDialog({ open: true, pedido }); setMotivoCancelNfe(""); }}
                                  className="gap-2 font-medium text-destructive"
                                >
                                  <XCircle className="h-3 w-3" /> Cancelar NF-e
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* PARA ENVIAR */}
                            {pedido.status === "para_enviar" && !hasError && (
                              <>
                                {(pedido.sub_status === "para_programar" || pedido.sub_status === "aguardando" || !pedido.sub_status) && (
                                  <DropdownMenuItem onClick={() => processarEnvio(pedido)} className="gap-2 font-medium text-primary">
                                    <Truck className="h-3 w-3" /> Programar Envio
                                  </DropdownMenuItem>
                                )}
                                {pedido.codigo_rastreio && (
                                  <>
                                    <DropdownMenuItem onClick={() => printEtiquetaEnvio([pedido])} className="gap-2">
                                      <Truck className="h-3 w-3" /> Imprimir Etiqueta de Envio
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => avancarEtapaManual(pedido)} className="gap-2">
                                      <ChevronRight className="h-3 w-3" /> Avançar → {STATUS_CONFIG[proximaEtapa(pedido.status)!]?.label}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}

                            {/* PARA IMPRIMIR */}
                            {pedido.status === "para_imprimir" && !hasError && (
                              <>
                                <DropdownMenuItem onClick={() => printEtiquetaEnvio([pedido])} className="gap-2 font-medium text-primary">
                                  <Printer className="h-3 w-3" /> Imprimir Etiqueta
                                </DropdownMenuItem>
                                {proximaEtapa(pedido.status) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => avancarEtapaManual(pedido)} className="gap-2">
                                      <ChevronRight className="h-3 w-3" /> Avançar → {STATUS_CONFIG[proximaEtapa(pedido.status)!]?.label}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}

                            {/* ENVIADO */}
                            {pedido.status === "enviado" && !hasError && (
                              <DropdownMenuItem onClick={() => avancarEtapaManual(pedido)} className="gap-2 font-medium text-primary">
                                <CheckCircle2 className="h-3 w-3" /> Confirmar Entrega
                              </DropdownMenuItem>
                            )}

                            {/* Detalhes NF-e disponível em todas etapas após emissão */}
                            {["para_enviar", "para_imprimir", "enviado", "entregue"].includes(pedido.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setNfeDetailDialog({ open: true, pedido })} className="gap-2">
                                  <FileText className="h-3 w-3" /> Detalhes da NF-e
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setCancelNfeDialog({ open: true, pedido }); setMotivoCancelNfe(""); }}
                                  className="gap-2 text-destructive"
                                >
                                  <XCircle className="h-3 w-3" /> Cancelar NF-e
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* ENTREGUE — no actions needed */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => { if (!open) setCancelDialog({ open: false, pedido: null }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Pedido: <span className="font-mono font-medium">{cancelDialog.pedido?.numero_pedido}</span> — {cancelDialog.pedido?.cliente_nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Motivo do cancelamento *</Label>
              <RadioGroup value={motivoCancelamento} onValueChange={setMotivoCancelamento} className="space-y-2">
                {MOTIVOS_CANCELAMENTO.map((m) => (
                  <div key={m.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={m.value} id={`motivo-${m.value}`} />
                    <Label htmlFor={`motivo-${m.value}`} className="text-sm font-normal cursor-pointer">{m.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {motivoCancelamento === "outro" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Descreva o motivo *</Label>
                <Textarea
                  placeholder="Informe o motivo do cancelamento..."
                  value={observacaoCancelamento}
                  onChange={(e) => setObservacaoCancelamento(e.target.value)}
                  className="text-sm"
                  maxLength={500}
                />
              </div>
            )}
            {motivoCancelamento && motivoCancelamento !== "outro" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Observações adicionais (opcional)</Label>
                <Textarea
                  placeholder="Alguma informação extra..."
                  value={observacaoCancelamento}
                  onChange={(e) => setObservacaoCancelamento(e.target.value)}
                  className="text-sm"
                  maxLength={500}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, pedido: null })}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={!motivoCancelamento || (motivoCancelamento === "outro" && !observacaoCancelamento.trim())}
              onClick={async () => {
                const motivo = motivoCancelamento === "outro"
                  ? observacaoCancelamento.trim()
                  : MOTIVOS_CANCELAMENTO.find(m => m.value === motivoCancelamento)?.label || motivoCancelamento;
                const obs = motivoCancelamento !== "outro" && observacaoCancelamento.trim()
                  ? ` — ${observacaoCancelamento.trim()}`
                  : "";
                const { error } = await supabase
                  .from("marketplace_pedidos")
                  .update({ status: "cancelado", erro_detalhe: `${motivo}${obs}` })
                  .eq("id", cancelDialog.pedido?.id);
                if (error) { toast.error("Erro ao cancelar pedido"); return; }
                toast.success(`Pedido ${cancelDialog.pedido?.numero_pedido} cancelado: ${motivo}`);
                setCancelDialog({ open: false, pedido: null });
                carregarPedidos();
                carregarContadores();
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* NF-e Details Dialog */}
      <Dialog open={nfeDetailDialog.open} onOpenChange={(open) => { if (!open) setNfeDetailDialog({ open: false, pedido: null }); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e</DialogTitle>
            <DialogDescription>
              Informações da Nota Fiscal do pedido {nfeDetailDialog.pedido?.numero_pedido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Pedido</Label>
              <p className="font-medium">{nfeDetailDialog.pedido?.numero_pedido}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <p className="font-medium">{nfeDetailDialog.pedido?.cliente_nome}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Chave de Acesso</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted p-2 rounded break-all flex-1 select-all">
                  {nfeDetailDialog.pedido?.nfe_chave || "Chave não disponível"}
                </code>
                {nfeDetailDialog.pedido?.nfe_chave && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(nfeDetailDialog.pedido?.nfe_chave || "");
                      toast.success("Chave copiada!");
                    }}
                  >
                    Copiar
                  </Button>
                )}
              </div>
            </div>
            {nfeDetailDialog.pedido?.nfe_url && (
              <div>
                <Label className="text-xs text-muted-foreground">URL da NF-e</Label>
                <div className="mt-1">
                  <a
                    href={nfeDetailDialog.pedido.nfe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline break-all"
                  >
                    {nfeDetailDialog.pedido.nfe_url}
                  </a>
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Valor Total</Label>
              <p className="font-medium">R$ {nfeDetailDialog.pedido?.valor_total?.toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNfeDetailDialog({ open: false, pedido: null })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Error Solution Dialog */}
      <Dialog open={erroSolucaoDialog.open} onOpenChange={(open) => { if (!open) setErroSolucaoDialog({ open: false, erro: "" }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {SOLUCOES_ERROS[erroSolucaoDialog.erro]?.titulo || "Erro no processamento"}
            </DialogTitle>
            <DialogDescription>
              Veja abaixo como resolver este problema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-destructive/10 rounded-md p-3 text-sm text-destructive font-medium">
              {erroSolucaoDialog.erro}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Como resolver:</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                {(SOLUCOES_ERROS[erroSolucaoDialog.erro]?.passos || [
                  "Verifique os dados do pedido no marketplace.",
                  "Corrija as informações necessárias.",
                  "Clique em 'Retentar' para reprocessar o pedido.",
                ]).map((passo, i) => (
                  <li key={i}>{passo}</li>
                ))}
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErroSolucaoDialog({ open: false, erro: "" })}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Cancel NF-e Dialog */}
      <Dialog open={cancelNfeDialog.open} onOpenChange={(open) => { if (!open) { setCancelNfeDialog({ open: false, pedido: null }); setMotivoCancelNfe(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cancelar NF-e
            </DialogTitle>
            <DialogDescription>
              Cancelamento da NF-e do pedido {cancelNfeDialog.pedido?.numero_pedido}. Informe o motivo com no mínimo 15 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="motivo-cancel-nfe">Motivo do cancelamento *</Label>
              <Textarea
                id="motivo-cancel-nfe"
                placeholder="Descreva o motivo do cancelamento da NF-e (mínimo 15 caracteres)..."
                value={motivoCancelNfe}
                onChange={(e) => setMotivoCancelNfe(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
              <p className={`text-xs mt-1 ${motivoCancelNfe.length >= 15 ? "text-muted-foreground" : "text-destructive"}`}>
                {motivoCancelNfe.length}/15 caracteres mínimos
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCancelNfeDialog({ open: false, pedido: null }); setMotivoCancelNfe(""); }}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={motivoCancelNfe.trim().length < 15}
              onClick={async () => {
                const pedido = cancelNfeDialog.pedido;
                if (!pedido) return;
                // Update pedido: clear NF-e data and move back to para_emitir
                const { error } = await supabase
                  .from("marketplace_pedidos")
                  .update({
                    status: "para_emitir",
                    sub_status: "aguardando",
                    nfe_chave: null,
                    nfe_url: null,
                    erro_detalhe: `NF-e cancelada: ${motivoCancelNfe.trim()}`,
                  } as any)
                  .eq("id", pedido.id);
                if (error) {
                  toast.error("Erro ao cancelar NF-e");
                  return;
                }
                toast.success(`NF-e do pedido ${pedido.numero_pedido} cancelada com sucesso`);
                setCancelNfeDialog({ open: false, pedido: null });
                setMotivoCancelNfe("");
                carregarPedidos();
                carregarContadores();
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Lista de Separação Dialog */}
      <Dialog open={separacaoDialog} onOpenChange={setSeparacaoDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Lista de Separação
            </DialogTitle>
            <DialogDescription>
              {selecionados.length} pedido(s) — {separacaoItens.reduce((s, i) => s + i.quantidade, 0)} item(ns) agrupados por localização no estoque
            </DialogDescription>
          </DialogHeader>
          {separacaoLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="max-h-[55vh]">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px]">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Localização</span>
                    </TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {separacaoItens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum item encontrado nos pedidos selecionados
                      </TableCell>
                    </TableRow>
                  ) : separacaoItens.map((item, i) => (
                    <TableRow key={i} className="text-xs">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${item.localizacao === "Sem localização" ? "text-muted-foreground" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                          <MapPin className="h-2.5 w-2.5" />
                          {item.localizacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[10px]">{item.sku || "—"}</TableCell>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-center font-bold text-sm">{item.quantidade}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.pedidos.map((p: string, j: number) => (
                            <Badge key={j} variant="secondary" className="text-[9px] px-1.5">{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSeparacaoDialog(false)}>Fechar</Button>
            <Button className="gap-1" onClick={imprimirListaSeparacao} disabled={separacaoItens.length === 0}>
              <Printer className="h-4 w-4" /> Imprimir Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
