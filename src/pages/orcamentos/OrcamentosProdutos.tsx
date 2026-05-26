import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Plus, Search, Edit, X, Trash2, MoreHorizontal,
  Printer, Mail, Share2, RefreshCw, Copy, ShoppingCart,
  Wrench, FileSignature, Download, Users, Eye, Grid3X3,
  List, ChevronDown, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const situacaoMap: Record<string, { label: string; color: string }> = {
  em_aberto: { label: "Em aberto", color: "bg-amber-100 text-amber-800" },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800" },
  reprovado: { label: "Reprovado", color: "bg-red-100 text-red-800" },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-600" },
  convertido: { label: "Convertido", color: "bg-blue-100 text-blue-800" },
};

export default function OrcamentosProdutos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openCliente, setOpenCliente] = useState(false);

  // Form state
  const [form, setForm] = useState({
    cliente_id: "" as string,
    cliente_nome: "",
    validade: "",
    observacoes: "",
    vendedor_id: "" as string,
    vendedor_nome: "",
  });

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_orc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_completo, nome_fantasia, telefone")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_orc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = orcamentos.filter((o: any) => {
    if (!busca) return true;
    const s = busca.toLowerCase();
    return (
      (o.cliente_nome || "").toLowerCase().includes(s) ||
      String(o.numero || "").includes(s)
    );
  });

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((o: any) => o.id));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setForm({ cliente_id: "", cliente_nome: "", validade: "", observacoes: "", vendedor_id: "", vendedor_nome: "" });
    setEditingId(null);
  };

  const openNew = () => navigate("/orcamentos/produtos/adicionar");

  const openEdit = (orc: any) => {
    navigate(`/orcamentos/produtos/editar/${orc.id}`);
  };

  const salvar = async () => {
    if (!form.cliente_nome) { toast.error("Selecione um cliente"); return; }
    const payload = {
      cliente_id: form.cliente_id || null,
      cliente_nome: form.cliente_nome,
      validade: form.validade || null,
      observacoes: form.observacoes || null,
      vendedor_id: form.vendedor_id || null,
      vendedor_nome: form.vendedor_nome || null,
    };
    if (editingId) {
      const { error } = await supabase.from("orcamentos").update(payload).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
      toast.success("Orçamento atualizado!");
    } else {
      const { error } = await supabase.from("orcamentos").insert(payload);
      if (error) { toast.error("Erro ao criar: " + error.message); return; }
      toast.success("Orçamento criado!");
    }
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
    setDialogOpen(false);
    resetForm();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este orçamento?")) return;
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Orçamento excluído");
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const excluirSelecionados = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Excluir ${selected.length} orçamentos?`)) return;
    const { error } = await supabase.from("orcamentos").delete().in("id", selected);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success(`${selected.length} orçamentos excluídos`);
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const alterarSituacao = async (id: string, novaSituacao: string) => {
    const { error } = await supabase.from("orcamentos").update({ situacao: novaSituacao }).eq("id", id);
    if (error) { toast.error("Erro ao alterar situação"); return; }
    toast.success("Situação atualizada!");
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const gerarCopia = async (orc: any) => {
    const { error } = await supabase.from("orcamentos").insert({
      cliente_id: orc.cliente_id,
      cliente_nome: orc.cliente_nome,
      validade: orc.validade,
      observacoes: `(Cópia) ${orc.observacoes || ""}`,
      vendedor_id: orc.vendedor_id,
      vendedor_nome: orc.vendedor_nome,
      valor_total: orc.valor_total,
      desconto: orc.desconto,
    });
    if (error) { toast.error("Erro ao gerar cópia"); return; }
    toast.success("Cópia do orçamento criada!");
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const imprimirA4 = async (orc: any) => {
    // Fetch store config, items and client data
    const [lojaRes, itensRes, clienteRes] = await Promise.all([
      supabase.from("configuracoes_loja").select("*").limit(1).single(),
      supabase.from("orcamentos_itens").select("*").eq("orcamento_id", orc.id).order("produto_nome"),
      orc.cliente_id ? supabase.from("clientes").select("*").eq("id", orc.cliente_id).single() : Promise.resolve({ data: null }),
    ]);
    const loja = lojaRes.data;
    const itens = itensRes.data || [];
    const cliente = clienteRes.data;

    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups"); return; }

    const dataOrc = new Date(orc.data_orcamento).toLocaleDateString("pt-BR");
    const previsao = orc.prazo_entrega ? new Date(orc.prazo_entrega).toLocaleDateString("pt-BR") : dataOrc;
    const numOrc = String(orc.numero).padStart(4, "0");
    const fmtV = (v: number) => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const enderLoja = loja ? [loja.logradouro, loja.numero, loja.bairro, loja.cidade, loja.estado].filter(Boolean).join(", ") : "";
    const cepLoja = loja?.cep || "";
    const endCliente = cliente ? [cliente.logradouro, cliente.numero, cliente.bairro].filter(Boolean).join(", ") : "";

    let itensHTML = "";
    let totalQtd = 0;
    let totalValor = 0;
    itens.forEach((it: any, i: number) => {
      const qty = it.quantidade || 0;
      const unit = it.valor_unitario || 0;
      const sub = it.valor_total || (qty * unit);
      totalQtd += qty;
      totalValor += sub;
      itensHTML += `<tr>
        <td style="text-align:center;padding:4px;border:1px solid #000">${i + 1}</td>
        <td style="padding:4px;border:1px solid #000">${it.produto_nome || ""}</td>
        <td style="text-align:center;padding:4px;border:1px solid #000">UN</td>
        <td style="text-align:center;padding:4px;border:1px solid #000">${fmtV(qty)}</td>
        <td style="text-align:right;padding:4px;border:1px solid #000">${fmtV(unit)}</td>
        <td style="text-align:right;padding:4px;border:1px solid #000">${fmtV(sub)}</td>
      </tr>`;
    });

    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orçamento Nº ${numOrc}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;padding:20px;color:#000;font-size:11px}
      table{border-collapse:collapse;width:100%}
      .header-table td{padding:4px;vertical-align:top}
      .section-title{background:#f57c00;color:#fff;font-weight:bold;padding:4px 6px;border:1px solid #e65100;font-size:11px}
      .info-table td{padding:3px 6px;border:1px solid #000;font-size:11px}
      .items-table th{background:#f57c00;color:#fff;padding:4px 6px;border:1px solid #e65100;font-size:10px;font-weight:bold;text-align:center}
      .items-table td{font-size:10px}
      .total-row td{font-weight:bold;padding:4px;border:1px solid #000;font-size:11px}
      @media print{body{padding:10px}}
    </style></head><body>

    <!-- TÍTULO LARANJA -->
    <div style="text-align:center;margin-bottom:4px">
      <div style="font-size:18px;font-weight:bold;color:#f57c00">ORÇAMENTO Nº ${String(orc.numero).padStart(5, "0")}</div>
      <div style="font-size:11px;color:#555">Emitido em: ${dataOrc}</div>
    </div>
    <hr style="border:none;border-top:3px solid #f57c00;margin-bottom:12px">

    <!-- CABEÇALHO DA EMPRESA -->
    <table class="header-table" style="border:1px solid #000;margin-bottom:8px">
      <tr>
        <td style="width:70%;padding:8px">
          <div style="font-size:16px;font-weight:bold">${loja?.nome_fantasia || loja?.razao_social || "EMPRESA"}</div>
          <div style="font-size:10px;color:#333">CNPJ: ${loja?.cnpj || ""}</div>
          <div style="font-size:10px;color:#333">${enderLoja}</div>
          <div style="font-size:10px;color:#333">${cepLoja ? "CEP: " + cepLoja : ""}</div>
        </td>
        <td style="width:30%;text-align:right;padding:8px;font-size:10px">
          <div>${loja?.telefone || ""} ${loja?.telefone2 ? " - " + loja.telefone2 : ""}</div>
          <div>${loja?.email || ""}</div>
          <div>${loja?.website || ""}</div>
          <div style="margin-top:4px">Vendedor: <b>${orc.vendedor_nome || "-"}</b></div>
        </td>
      </tr>
    </table>

    <!-- PREVISÃO DE ENTREGA -->
    <table style="margin-bottom:8px">
      <tr><td class="section-title">PREVISÃO DE ENTREGA ${previsao}</td></tr>
    </table>

    <!-- DADOS DO CLIENTE -->
    <table style="margin-bottom:8px">
      <tr><td class="section-title" colspan="4">DADOS DO CLIENTE</td></tr>
    </table>
    <table class="info-table" style="margin-bottom:8px">
      <tr>
        <td style="width:15%;font-weight:bold">Cliente:</td>
        <td style="width:50%">${orc.cliente_nome || "-"}</td>
        <td style="width:15%;font-weight:bold">CNPJ/CPF:</td>
        <td style="width:20%">${cliente?.cnpj || cliente?.cpf || ""}</td>
      </tr>
      <tr>
        <td style="font-weight:bold">Endereço:</td>
        <td>${endCliente}</td>
        <td style="font-weight:bold">CEP:</td>
        <td>${cliente?.cep || ""}</td>
      </tr>
      <tr>
        <td style="font-weight:bold">Cidade:</td>
        <td>${cliente?.cidade || ""}</td>
        <td style="font-weight:bold">Estado:</td>
        <td>${cliente?.estado || ""}</td>
      </tr>
      <tr>
        <td style="font-weight:bold">Telefone:</td>
        <td>${cliente?.telefone || ""}</td>
        <td style="font-weight:bold">E-mail:</td>
        <td>${cliente?.email || ""}</td>
      </tr>
    </table>

    <!-- PRODUTOS -->
    <table style="margin-bottom:2px">
      <tr><td class="section-title">PRODUTOS</td></tr>
    </table>
    <table class="items-table" style="margin-bottom:8px">
      <thead>
        <tr>
          <th style="width:40px">ITEM</th>
          <th>NOME</th>
          <th style="width:50px">UND.</th>
          <th style="width:60px">QTD.</th>
          <th style="width:80px">VR. UNIT.</th>
          <th style="width:80px">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itensHTML}
        <tr class="total-row">
          <td colspan="3" style="text-align:right">TOTAL</td>
          <td style="text-align:center">${fmtV(totalQtd)}</td>
          <td></td>
          <td style="text-align:right">${fmtV(totalValor)}</td>
        </tr>
      </tbody>
    </table>

    <!-- TOTAIS -->
    <table style="margin-bottom:8px;font-size:11px">
      <tr>
        <td style="text-align:right;padding:2px"><b>PRODUTOS: ${fmtV(orc.valor_produtos || totalValor)}</b></td>
      </tr>
      ${(orc.valor_servicos || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>SERVIÇOS: ${fmtV(orc.valor_servicos)}</b></td></tr>` : ""}
      ${(orc.desconto || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>DESCONTO: -${fmtV(orc.desconto)}</b></td></tr>` : ""}
      ${(orc.valor_frete || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>FRETE: ${fmtV(orc.valor_frete)}</b></td></tr>` : ""}
      <tr><td style="text-align:right;padding:2px;font-size:13px"><b>TOTAL: R$ ${fmtV(orc.valor_total || totalValor)}</b></td></tr>
    </table>

    <!-- DADOS DO PAGAMENTO -->
    <table style="margin-bottom:2px">
      <tr><td class="section-title">DADOS DO PAGAMENTO</td></tr>
    </table>
    <table class="info-table" style="margin-bottom:20px">
      <tr>
        <th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">VENCIMENTO</th>
        <th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">VALOR</th>
        <th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">FORMA DE PAGAMENTO</th>
        <th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">OBSERVAÇÃO</th>
      </tr>
      <tr>
        <td style="text-align:center">${dataOrc}</td>
        <td style="text-align:center">${fmtV(orc.valor_total || totalValor)}</td>
        <td style="text-align:center">${orc.forma_pagamento ? orc.forma_pagamento.toUpperCase().replace(/_/g, " ") : "A COMBINAR"}</td>
        <td>${orc.observacoes_padrao || ""}</td>
      </tr>
    </table>

    ${orc.observacoes_internas ? "" : ""}

    <script>setTimeout(()=>window.print(),400)</script></body></html>`);
    w.document.close();
  };

  const imprimirCupom = (orc: any) => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups"); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cupom #${orc.numero}</title>
    <style>*{margin:0;padding:0}body{font-family:monospace;width:280px;padding:10px;font-size:11px}
    .center{text-align:center}.sep{border-top:1px dashed #000;margin:6px 0}.bold{font-weight:bold}
    @media print{body{width:100%}}</style></head><body>
    <div class="center bold">ORÇAMENTO Nº ${String(orc.numero).padStart(5, "0")}</div>
    <div class="sep"></div>
    <div>Cliente: ${orc.cliente_nome || "-"}</div>
    <div>Data: ${new Date(orc.data_orcamento).toLocaleDateString("pt-BR")}</div>
    <div>Vendedor: ${orc.vendedor_nome || "-"}</div>
    <div class="sep"></div>
    <div class="bold">TOTAL: R$ ${(orc.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
    <div class="sep"></div>
    <div class="center" style="font-size:9px">Obrigado pela preferência!</div>
    <script>setTimeout(()=>window.print(),300)</script></body></html>`);
    w.document.close();
  };

  const compartilharWhatsApp = async (orc: any) => {
    try {
      toast.info("Gerando orçamento para envio...");
      const [lojaRes, itensRes, clienteRes] = await Promise.all([
        supabase.from("configuracoes_loja").select("*").limit(1).single(),
        supabase.from("orcamentos_itens").select("*").eq("orcamento_id", orc.id).order("produto_nome"),
        orc.cliente_id ? supabase.from("clientes").select("*").eq("id", orc.cliente_id).single() : Promise.resolve({ data: null }),
      ]);
      const loja = lojaRes.data;
      const itens = itensRes.data || [];
      const cliente = clienteRes.data;
      const dataOrc = new Date(orc.data_orcamento).toLocaleDateString("pt-BR");
      const previsao = orc.prazo_entrega ? new Date(orc.prazo_entrega).toLocaleDateString("pt-BR") : dataOrc;
      const numOrc = String(orc.numero).padStart(5, "0");
      const fmtV = (v: number) => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const enderLoja = loja ? [loja.logradouro, loja.numero, loja.bairro, loja.cidade, loja.estado].filter(Boolean).join(", ") : "";
      const cepLoja = loja?.cep || "";
      const endCliente = cliente ? [cliente.logradouro, cliente.numero, cliente.bairro].filter(Boolean).join(", ") : "";
      let itensHTML = "";
      let totalQtd = 0;
      let totalValor = 0;
      itens.forEach((it: any, i: number) => {
        const qty = it.quantidade || 0;
        const unit = it.valor_unitario || 0;
        const sub = it.valor_total || (qty * unit);
        totalQtd += qty;
        totalValor += sub;
        itensHTML += `<tr><td style="text-align:center;padding:4px;border:1px solid #000">${i + 1}</td><td style="padding:4px;border:1px solid #000">${it.produto_nome || ""}</td><td style="text-align:center;padding:4px;border:1px solid #000">UN</td><td style="text-align:center;padding:4px;border:1px solid #000">${fmtV(qty)}</td><td style="text-align:right;padding:4px;border:1px solid #000">${fmtV(unit)}</td><td style="text-align:right;padding:4px;border:1px solid #000">${fmtV(sub)}</td></tr>`;
      });

      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orçamento Nº ${numOrc}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;color:#000;font-size:11px}table{border-collapse:collapse;width:100%}.header-table td{padding:4px;vertical-align:top}.section-title{background:#f57c00;color:#fff;font-weight:bold;padding:4px 6px;border:1px solid #e65100;font-size:11px}.info-table td{padding:3px 6px;border:1px solid #000;font-size:11px}.items-table th{background:#f57c00;color:#fff;padding:4px 6px;border:1px solid #e65100;font-size:10px;font-weight:bold;text-align:center}.items-table td{font-size:10px}.total-row td{font-weight:bold;padding:4px;border:1px solid #000;font-size:11px}</style></head><body>
      <div style="text-align:center;margin-bottom:4px"><div style="font-size:18px;font-weight:bold;color:#f57c00">ORÇAMENTO Nº ${numOrc}</div><div style="font-size:11px;color:#555">Emitido em: ${dataOrc}</div></div>
      <hr style="border:none;border-top:3px solid #f57c00;margin-bottom:12px">
      <table class="header-table" style="border:1px solid #000;margin-bottom:8px"><tr><td style="width:70%;padding:8px"><div style="font-size:16px;font-weight:bold">${loja?.nome_fantasia || loja?.razao_social || "EMPRESA"}</div><div style="font-size:10px;color:#333">CNPJ: ${loja?.cnpj || ""}</div><div style="font-size:10px;color:#333">${enderLoja}</div><div style="font-size:10px;color:#333">${cepLoja ? "CEP: " + cepLoja : ""}</div></td><td style="width:30%;text-align:right;padding:8px;font-size:10px"><div>${loja?.telefone || ""} ${loja?.telefone2 ? " - " + loja.telefone2 : ""}</div><div>${loja?.email || ""}</div><div>${loja?.website || ""}</div><div style="margin-top:4px">Vendedor: <b>${orc.vendedor_nome || "-"}</b></div></td></tr></table>
      <table style="margin-bottom:8px"><tr><td class="section-title">PREVISÃO DE ENTREGA ${previsao}</td></tr></table>
      <table style="margin-bottom:8px"><tr><td class="section-title" colspan="4">DADOS DO CLIENTE</td></tr></table>
      <table class="info-table" style="margin-bottom:8px"><tr><td style="width:15%;font-weight:bold">Cliente:</td><td style="width:50%">${orc.cliente_nome || "-"}</td><td style="width:15%;font-weight:bold">CNPJ/CPF:</td><td style="width:20%">${cliente?.cnpj || cliente?.cpf || ""}</td></tr><tr><td style="font-weight:bold">Endereço:</td><td>${endCliente}</td><td style="font-weight:bold">CEP:</td><td>${cliente?.cep || ""}</td></tr><tr><td style="font-weight:bold">Cidade:</td><td>${cliente?.cidade || ""}</td><td style="font-weight:bold">Estado:</td><td>${cliente?.estado || ""}</td></tr><tr><td style="font-weight:bold">Telefone:</td><td>${cliente?.telefone || ""}</td><td style="font-weight:bold">E-mail:</td><td>${cliente?.email || ""}</td></tr></table>
      <table style="margin-bottom:2px"><tr><td class="section-title">PRODUTOS</td></tr></table>
      <table class="items-table" style="margin-bottom:8px"><thead><tr><th style="width:40px">ITEM</th><th>NOME</th><th style="width:50px">UND.</th><th style="width:60px">QTD.</th><th style="width:80px">VR. UNIT.</th><th style="width:80px">SUBTOTAL</th></tr></thead><tbody>${itensHTML}<tr class="total-row"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:center">${fmtV(totalQtd)}</td><td></td><td style="text-align:right">${fmtV(totalValor)}</td></tr></tbody></table>
      <table style="margin-bottom:8px;font-size:11px"><tr><td style="text-align:right;padding:2px"><b>PRODUTOS: ${fmtV(orc.valor_produtos || totalValor)}</b></td></tr>${(orc.valor_servicos || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>SERVIÇOS: ${fmtV(orc.valor_servicos)}</b></td></tr>` : ""}${(orc.desconto || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>DESCONTO: -${fmtV(orc.desconto)}</b></td></tr>` : ""}${(orc.valor_frete || 0) > 0 ? `<tr><td style="text-align:right;padding:2px"><b>FRETE: ${fmtV(orc.valor_frete)}</b></td></tr>` : ""}<tr><td style="text-align:right;padding:2px;font-size:13px"><b>TOTAL: R$ ${fmtV(orc.valor_total || totalValor)}</b></td></tr></table>
      <table style="margin-bottom:2px"><tr><td class="section-title">DADOS DO PAGAMENTO</td></tr></table>
      <table class="info-table" style="margin-bottom:20px"><tr><th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">VENCIMENTO</th><th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">VALOR</th><th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">FORMA DE PAGAMENTO</th><th style="background:#d0d0d0;padding:4px;border:1px solid #000;font-size:10px">OBSERVAÇÃO</th></tr><tr><td style="text-align:center">${dataOrc}</td><td style="text-align:center">${fmtV(orc.valor_total || totalValor)}</td><td style="text-align:center">${orc.forma_pagamento ? orc.forma_pagamento.toUpperCase().replace(/_/g, " ") : "A COMBINAR"}</td><td>${orc.observacoes_padrao || ""}</td></tr></table>
      </body></html>`;

      const blob = new Blob([htmlContent], { type: "application/pdf" });
      const fileName = `Orcamento_${numOrc}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      const message = `📋 *Orçamento Nº ${numOrc}*\nCliente: ${orc.cliente_nome || "-"}\nValor: R$ ${fmtV(orc.valor_total || totalValor)}\nData: ${dataOrc}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: message, files: [file] });
        return;
      }

      // Fallback: text only
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error(err);
        toast.error("Erro ao compartilhar via WhatsApp");
      }
    }
  };

  const compartilharEmail = (orc: any) => {
    const subject = encodeURIComponent(`Orçamento Nº ${String(orc.numero).padStart(5, "0")}`);
    const body = encodeURIComponent(`Orçamento Nº ${String(orc.numero).padStart(5, "0")}\nCliente: ${orc.cliente_nome || "-"}\nValor: R$ ${(orc.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nData: ${new Date(orc.data_orcamento).toLocaleDateString("pt-BR")}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const exportarCSV = () => {
    const rows = filtered.map((o: any) => [
      o.numero, o.cliente_nome, new Date(o.data_orcamento).toLocaleDateString("pt-BR"),
      (situacaoMap[o.situacao]?.label || o.situacao), o.valor_total
    ]);
    let csv = "\uFEFF" + '"Nº";"Cliente";"Data";"Situação";"Valor"\n';
    rows.forEach((r) => { csv += r.map((c: any) => `"${c}"`).join(";") + "\n"; });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orcamentos.csv";
    a.click();
  };

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Orçamentos de produtos</h1>
            <p className="text-xs text-muted-foreground">Início &gt; Orçamentos de produtos &gt; Listar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-60"
          />
          <Button variant="outline" size="icon" className={viewMode === "list" ? "bg-muted" : ""} onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className={viewMode === "grid" ? "bg-muted" : ""} onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button className="bg-green-600 hover:bg-green-700 gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1">
              <MoreHorizontal className="h-4 w-4" /> Mais ações <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportarCSV}><Download className="h-4 w-4 mr-2" /> Exportar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Agrupamento em desenvolvimento")}><Users className="h-4 w-4 mr-2" /> Agrupar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Envio de e-mails em desenvolvimento")}><Mail className="h-4 w-4 mr-2" /> Enviar e-mail's</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("e-Assinaturas em desenvolvimento")}><FileSignature className="h-4 w-4 mr-2" /> Gerar e-Assinaturas</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={excluirSelecionados} disabled={selected.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir ({selected.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-32">Data</TableHead>
                <TableHead className="w-28">Situação</TableHead>
                <TableHead className="w-28 text-right">Valor</TableHead>
                <TableHead className="w-40 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado</TableCell></TableRow>
              ) : (
                filtered.map((orc: any) => {
                  const sit = situacaoMap[orc.situacao] || { label: orc.situacao, color: "bg-gray-100 text-gray-600" };
                  return (
                    <TableRow key={orc.id} className="hover:bg-muted/30">
                      <TableCell><Checkbox checked={selected.includes(orc.id)} onCheckedChange={() => toggleOne(orc.id)} /></TableCell>
                      <TableCell className="font-medium">{orc.numero}</TableCell>
                      <TableCell className="font-medium">{orc.cliente_nome || "-"}</TableCell>
                      <TableCell>{new Date(orc.data_orcamento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="cursor-pointer">
                              <Badge className={`${sit.color} border-0 hover:opacity-80 transition-opacity cursor-pointer`}>{sit.label}</Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="start">
                            {Object.entries(situacaoMap).map(([key, val]) => (
                              <button
                                key={key}
                                className={cn("w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2", orc.situacao === key && "font-bold")}
                                onClick={() => alterarSituacao(orc.id, key)}
                              >
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${val.color.split(" ")[0]}`} />
                                {val.label}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(orc.valor_total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 bg-teal-500 hover:bg-teal-600 text-white rounded" title="Ver proposta" onClick={() => imprimirA4(orc)}>
                            <Search className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 bg-green-500 hover:bg-green-600 text-white rounded" title="Editar" onClick={() => openEdit(orc)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded" title="Excluir" onClick={() => excluir(orc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded" title="Mais ações">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => imprimirA4(orc)}><Eye className="h-4 w-4 mr-2" /> Ver proposta</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger><Printer className="h-4 w-4 mr-2" /> Imprimir</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => imprimirA4(orc)}>Formato A4</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => imprimirCupom(orc)}>Cupom</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger><Share2 className="h-4 w-4 mr-2" /> Compartilhar</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => compartilharEmail(orc)}><Mail className="h-4 w-4 mr-2" /> Via E-mail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => compartilharWhatsApp(orc)}><MessageCircle className="h-4 w-4 mr-2" /> Via WhatsApp</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger><RefreshCw className="h-4 w-4 mr-2" /> Alterar situação</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {Object.entries(situacaoMap).map(([key, val]) => (
                                    <DropdownMenuItem key={key} onClick={() => alterarSituacao(orc.id, key)}>{val.label}</DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger><FileText className="h-4 w-4 mr-2" /> Gerar</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem onClick={() => gerarCopia(orc)}><Copy className="h-4 w-4 mr-2" /> Cópia</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { alterarSituacao(orc.id, "convertido"); toast.success("Convertido em venda!"); }}><ShoppingCart className="h-4 w-4 mr-2" /> Venda</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.info("Gerar OS em desenvolvimento")}><Wrench className="h-4 w-4 mr-2" /> OS</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.info("Contrato em desenvolvimento")}><FileText className="h-4 w-4 mr-2" /> Contrato</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-10">
                    <span className="truncate">{form.cliente_nome || "Selecionar cliente..."}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((c) => {
                          const nome = c.nome_completo || c.nome_fantasia || c.telefone || "";
                          return (
                            <CommandItem key={c.id} value={nome} onSelect={() => {
                              setForm({ ...form, cliente_id: c.id, cliente_nome: nome });
                              setOpenCliente(false);
                            }}>
                              {nome}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vendedor</Label>
                <Select value={form.vendedor_id} onValueChange={(v) => {
                  const f = funcionarios.find((x) => x.id === v);
                  setForm({ ...form, vendedor_id: v, vendedor_nome: f?.nome || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="bg-green-600 hover:bg-green-700" onClick={salvar}>
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
              <Button variant="destructive" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
